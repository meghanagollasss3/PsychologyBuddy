import prisma from '@/src/prisma';
import { PasswordUtil } from '@/src/utils/password.util';
import { ApiResponse } from '@/src/utils/api-response';
import { AuthError } from '@/src/utils/errors';
import crypto from 'crypto';

export class UserService {
  // ============================================
  // USER IDENTITY APIS
  // ============================================

  // Get current user profile
  static async getCurrentUser(userId: string, userRole: string) {
    try {
      let user;

      if (userRole === 'STUDENT') {
        user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            role: true,
            studentProfile: true,
            school: { select: { name: true } },
            classRef: { select: { name: true, grade: true, section: true } },
          },
        });
      } else if (userRole === 'ADMIN') {
        user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            role: true,
            adminProfile: true,
            school: true,
          },
        });
      } else {
        user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            role: true,
          },
        });
      }

      if (!user) {
        throw AuthError.notFound('User not found');
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return ApiResponse.success(userWithoutPassword, 'User profile retrieved');
    } catch (error) {
      throw error;
    }
  }

  // Update user profile (limited fields)
  static async updateProfile(userId: string, userRole: string, data: any) {
    try {
      const allowedFields = {
        STUDENT: ['firstName', 'lastName', 'phone'],
        ADMIN: ['firstName', 'lastName', 'phone', 'department'],
        SUPERADMIN: ['firstName', 'lastName', 'phone'],
      };

      const fieldsToUpdate = allowedFields[userRole as keyof typeof allowedFields] || [];
      const updateData: any = {};

      fieldsToUpdate.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      });

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          role: true,
          studentProfile: true,
          adminProfile: true,
        },
      });

      const { password, ...userWithoutPassword } = updatedUser;

      return ApiResponse.success(userWithoutPassword, 'Profile updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // SUPERADMIN: SCHOOL MANAGEMENT
  // ============================================

  // Create school
  static async createSchool(data: {
    name: string;
    phone?: string;
    email?: string;
    primaryAdminId?: string;
  }) {
    try {
      // Check if school with same email already exists
      if (data.email) {
        const existingSchool = await prisma.school.findFirst({
          where: { email: data.email.toLowerCase().trim() },
        });

        if (existingSchool) {
          throw new AuthError('School with this email already exists', 409);
        }
      }

      // Generate user-friendly school ID based on name
      const schoolName = data.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const nameAbbreviation = schoolName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 3);
      const timestamp = Date.now().toString().slice(-6);
      const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      const userFriendlyId = `SCH-${nameAbbreviation}-${timestamp}-${randomSuffix}`;

      const school = await prisma.school.create({
        data: {
          id: userFriendlyId,
          name: data.name,
          phone: data.phone,
          email: data.email?.toLowerCase().trim(), // Store email in lowercase
          primaryAdminId: data.primaryAdminId,
        },
        include: {
          primaryAdmin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        },
      });

      return ApiResponse.success(school, 'School created successfully');
    } catch (error) {
      throw error;
    }
  }

  // Update school
  static async updateSchool(schoolId: string, data: {
    name?: string;
    phone?: string;
    email?: string;
  }) {
    try {
      const school = await prisma.school.update({
        where: { id: schoolId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return ApiResponse.success(school, 'School updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get all schools
  static async getAllSchools() {
    try {
      const schools = await prisma.school.findMany({
        include: {
          _count: {
            select: {
              users: {
                where: {
                  role: {
                    name: 'STUDENT'
                  }
                }
              },
              classes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return ApiResponse.success(schools, 'Schools retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get schools with metrics (alerts and check-ins per school)
  static async getSchoolsWithMetrics() {
    try {
      const schools = await prisma.school.findMany({
        include: {
          locations: {
            select: { id: true }
          },
          _count: {
            select: {
              users: {
                where: {
                  role: {
                    name: 'STUDENT'
                  }
                }
              },
              classes: true,
              locations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get alerts and check-ins per school
      const schoolsWithMetrics = await Promise.all(
        schools.map(async (school) => {
          const [alertCount, checkInsToday] = await Promise.all([
            // Count CRITICAL unresolved alerts for students in this school
            prisma.escalationAlert.count({
              where: {
                studentId: {
                  in: (
                    await prisma.user.findMany({
                      where: {
                        schoolId: school.id,
                        role: {
                          name: 'STUDENT'
                        }
                      },
                      select: { id: true }
                    })
                  ).map(user => user.id)
                },
                status: 'open',
                OR: [
                  { priority: 'critical' },
                  { priority: 'high' },
                  { requiresImmediateAction: true }
                ]
              }
            }),
            // Count check-ins today for students in this school
            prisma.moodCheckin.count({
              where: {
                user: {
                  schoolId: school.id,
                  role: {
                    name: 'STUDENT'
                  }
                },
                createdAt: {
                  gte: today,
                  lt: tomorrow
                }
              }
            })
          ]);

          return {
            ...school,
            studentCount: school._count.users,
            locationsCount: school._count.locations,
            alertCount,
            checkInsToday
          };
        })
      );

      return ApiResponse.success(schoolsWithMetrics, 'Schools with metrics retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get school by ID
  static async getSchoolById(schoolId: string) {
    try {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        include: {
          _count: {
            select: {
              users: {
                where: {
                  role: {
                    name: 'STUDENT'
                  }
                }
              },
              classes: true,
            },
          },
        },
      });

      if (!school) {
        throw AuthError.notFound('School not found');
      }

      return ApiResponse.success(school, 'School retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Soft delete school
  static async disableSchool(schoolId: string) {
    try {
      // Mark all users in school as inactive
      await prisma.user.updateMany({
        where: { schoolId },
        data: { emailVerified: false },
      });

      return ApiResponse.success(null, 'School disabled successfully');
    } catch (error) {
      throw error;
    }
  }

  // Delete school (hard delete)
  static async deleteSchool(schoolId: string) {
    try {
      // Check if school exists
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        include: {
          _count: {
            select: {
              users: true,
              classes: true,
            },
          },
        },
      });

      if (!school) {
        throw AuthError.notFound('School not found');
      }

      // Check if school has users or classes
      if (school._count.users > 0 || school._count.classes > 0) {
        throw new AuthError('Cannot delete school with existing users or classes. Please remove all users and classes first.', 400);
      }

      // Delete the school
      await prisma.school.delete({
        where: { id: schoolId },
      });

      return ApiResponse.success(null, 'School deleted successfully');
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // LOCATION ADMIN MANAGEMENT
  // ============================================

  // Assign admin to location
  static async assignAdminToLocation(data: {
    locationId: string;
    adminId: string;
    assignedBy: string;
  }) {
    try {
      // Check if assignment already exists
      const existingAssignment = await prisma.locationAdminAssignment.findUnique({
        where: {
          locationId_adminId: {
            locationId: data.locationId,
            adminId: data.adminId,
          }
        }
      });

      if (existingAssignment) {
        throw new AuthError('Admin is already assigned to this location', 409);
      }

      // Verify location exists
      const location = await prisma.schoolLocation.findUnique({
        where: { id: data.locationId },
        include: { school: true }
      });

      if (!location) {
        throw AuthError.notFound('Location not found');
      }

      // Verify admin exists and is an ADMIN role
      const admin = await prisma.user.findUnique({
        where: { id: data.adminId },
        include: { role: true }
      });

      if (!admin || admin.role.name !== 'ADMIN') {
        throw AuthError.notFound('Admin not found or invalid role');
      }

      // Create assignment
      const assignment = await prisma.locationAdminAssignment.create({
        data: {
          locationId: data.locationId,
          adminId: data.adminId,
          assignedBy: data.assignedBy,
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
              school: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      });

      return ApiResponse.success(assignment, 'Admin assigned to location successfully');
    } catch (error) {
      throw error;
    }
  }

  // Remove admin from location
  static async removeAdminFromLocation(locationId: string, adminId: string) {
    try {
      const assignment = await prisma.locationAdminAssignment.findUnique({
        where: {
          locationId_adminId: {
            locationId,
            adminId,
          }
        }
      });

      if (!assignment) {
        throw AuthError.notFound('Admin assignment not found');
      }

      await prisma.locationAdminAssignment.delete({
        where: {
          locationId_adminId: {
            locationId,
            adminId,
          }
        }
      });

      return ApiResponse.success(null, 'Admin removed from location successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get admins assigned to a location
  static async getLocationAdmins(locationId: string) {
    try {
      const assignments = await prisma.locationAdminAssignment.findMany({
        where: { locationId },
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              createdAt: true,
            }
          },
          assigner: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      });

      return ApiResponse.success(assignments, 'Location admins retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get locations assigned to an admin
  static async getAdminLocations(adminId: string) {
    try {
      const assignments = await prisma.locationAdminAssignment.findMany({
        where: { adminId },
        include: {
          location: {
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          assigner: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      });

      return ApiResponse.success(assignments, 'Admin locations retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // SUPERADMIN: ADMIN MANAGEMENT
  // ============================================

  // Create admin
  static async createAdmin(data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    schoolId?: string;
    department?: string;
    isPrimaryAdmin?: boolean;
    locationId?: string;
    role?: string;
  }) {
    try {
      // Check if admin with this email already exists
      const existingAdmin = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingAdmin) {
        throw AuthError.conflict('Admin with this email already exists');
      }

      // Get admin role - support for multiple admin roles
      let adminRole;
      if (data.role === 'SCHOOL_SUPERADMIN') {
        adminRole = await prisma.role.findUnique({
          where: { name: 'SCHOOL_SUPERADMIN' },
        });
      } else {
        // Default to ADMIN role for location-specific admins
        adminRole = await prisma.role.findUnique({
          where: { name: 'ADMIN' },
        });
      }

      if (!adminRole) {
        throw new Error('Admin role not found');
      }

      // Hash password - generate random password if not provided
      const password = data.password || crypto.randomBytes(6).toString('hex');
      const hashedPassword = await PasswordUtil.hash(password);

      // Create user
      const admin = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          roleId: adminRole.id,
          schoolId: data.schoolId,
          emailVerified: true,
        },
        include: {
          role: true,
          adminProfile: true,
          school: true,
        },
      });

      // Create admin profile
      await prisma.adminProfile.create({
        data: {
          userId: admin.id,
          department: data.department || 'Student Wellness',
        },
      });

      const { password: _, ...adminWithoutPassword } = admin;

      return ApiResponse.success(adminWithoutPassword, 'Admin created successfully');
    } catch (error) {
      throw error;
    }
  }

  // Update admin
  static async updateAdmin(adminId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
    emailVerified?: boolean;
  }) {
    try {
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: adminId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          role: true,
          adminProfile: true,
          school: true,
        },
      });

      // Update admin profile if department provided
      if (data.department) {
        await prisma.adminProfile.updateMany({
          where: { userId: adminId },
          data: { department: data.department },
        });
      }

      const { password, ...userWithoutPassword } = updatedUser;

      return ApiResponse.success(userWithoutPassword, 'Admin updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get all admins
  static async getAllAdmins() {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { name: 'ADMIN' },
        },
        include: {
          role: true,
          adminProfile: true,
          school: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const adminsWithoutPasswords = admins.map(admin => {
        const { password, ...adminWithoutPassword } = admin;
        return adminWithoutPassword;
      });

      return ApiResponse.success(adminsWithoutPasswords, 'Admins retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // ADMIN: STUDENT MANAGEMENT
  // ============================================

  // Create student
  static async createStudent(data: {
    studentId: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    schoolId: string;
    classId?: string;
  }) {
    try {
      // Get student role
      const studentRole = await prisma.role.findUnique({
        where: { name: 'STUDENT' },
      });

      if (!studentRole) {
        throw new Error('Student role not found');
      }

      // Check if student with this studentId already exists
      const existingStudent = await prisma.user.findUnique({
        where: { studentId: data.studentId },
      });

      if (existingStudent) {
        throw AuthError.conflict('Student with this ID already exists');
      }

      // Check if email already exists (if provided)
      if (data.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingEmail) {
          throw AuthError.conflict('Student with this email already exists');
        }
      }

      // Hash password
      const hashedPassword = await PasswordUtil.hash(data.password);

      // Create user
      const student = await prisma.user.create({
        data: {
          studentId: data.studentId,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || `${data.studentId}@student.local`, // Generate default email if not provided
          phone: data.phone,
          roleId: studentRole.id,
          schoolId: data.schoolId,
          classId: data.classId,
          emailVerified: true,
        },
        include: {
          role: true,
          studentProfile: true,
          school: true,
          classRef: true,
        },
      });

      // Create student profile
      await prisma.studentProfile.create({
        data: {
          userId: student.id,
          status: 'ACTIVE',
        },
      });

      const { password: _, ...studentWithoutPassword } = student;

      return ApiResponse.success(studentWithoutPassword, 'Student created successfully');
    } catch (error) {
      throw error;
    }
  }

  // Update student
  static async updateStudent(studentId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    classId?: string;
    status?: string;
  }, adminSchoolId: string) {
    try {
      // First get the student to verify school access
      const existingStudent = await prisma.user.findUnique({
        where: { id: studentId },
        include: { school: true },
      });

      if (!existingStudent) {
        throw AuthError.notFound('Student not found');
      }

      // Verify admin can only update students from their school
      if (existingStudent.schoolId !== adminSchoolId) {
        throw AuthError.forbidden('Cannot update student from another school');
      }

      // Update student
      const updatedStudent = await prisma.user.update({
        where: { id: studentId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          role: true,
          studentProfile: true,
          school: true,
          classRef: true,
        },
      });

      // Update student profile if status provided
      if (data.status) {
        await prisma.studentProfile.updateMany({
          where: { userId: studentId },
          data: { status: data.status },
        });
      }

      const { password, ...studentWithoutPassword } = updatedStudent;

      return ApiResponse.success(studentWithoutPassword, 'Student updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get students (admin view - their school only)
  static async getStudents(adminSchoolId: string, filters?: {
    classId?: string;
    status?: string;
    search?: string;
  }) {
    try {
      const whereClause: any = {
        schoolId: adminSchoolId,
        role: { name: 'STUDENT' },
      };

      // Apply filters
      if (filters?.classId) {
        whereClause.classId = filters.classId;
      }

      if (filters?.search) {
        whereClause.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { studentId: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const students = await prisma.user.findMany({
        where: whereClause,
        include: {
          role: true,
          studentProfile: { select: { status: true } },
          classRef: { select: { name: true, grade: true, section: true } },
          school: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const studentsWithoutPasswords = students.map(student => {
        const { password, ...studentWithoutPassword } = student;
        return studentWithoutPassword;
      });

      return ApiResponse.success(studentsWithoutPasswords, 'Students retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get student by ID (admin view)
  static async getStudentById(studentId: string, adminSchoolId: string) {
    try {
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
          role: true,
          studentProfile: true,
          school: true,
          classRef: true,
        },
      });

      if (!student) {
        throw AuthError.notFound('Student not found');
      }

      // Verify admin can only view students from their school
      if (student.schoolId !== adminSchoolId) {
        throw AuthError.forbidden('Cannot view student from another school');
      }

      const { password, ...studentWithoutPassword } = student;

      return ApiResponse.success(studentWithoutPassword, 'Student retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // ADMIN: CLASSES MANAGEMENT
  // ============================================

  // Create class
  static async createClass(data: {
    name: string;
    grade: number;
    section?: string;
    schoolId: string;
  }) {
    try {
      const newClass = await prisma.class.create({
        data: {
          name: data.name,
          grade: data.grade,
          section: data.section,
          schoolId: data.schoolId,
        },
        include: {
          school: { select: { name: true } },
          _count: {
            select: { users: true },
          },
        },
      });

      return ApiResponse.success(newClass, 'Class created successfully');
    } catch (error) {
      throw error;
    }
  }

  // Update class
  static async updateClass(classId: string, data: {
    name?: string;
    grade?: number;
    section?: string;
  }, adminSchoolId: string) {
    try {
      // First get the class to verify school access
      const existingClass = await prisma.class.findUnique({
        where: { id: classId },
        include: { school: true },
      });

      if (!existingClass) {
        throw AuthError.notFound('Class not found');
      }

      // Verify admin can only update classes from their school
      if (existingClass.schoolId !== adminSchoolId) {
        throw AuthError.forbidden('Cannot update class from another school');
      }

      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          school: { select: { name: true } },
          _count: {
            select: { users: true },
          },
        },
      });

      return ApiResponse.success(updatedClass, 'Class updated successfully');
    } catch (error: any) {
      throw error;
    }
  }

  // Get classes (admin view - their school only)
  static async getClasses(adminSchoolId?: string, filters?: {
    grade?: number;
    section?: string;
    search?: string;
  }) {
    try {
      const whereClause: any = {};

      // Only apply schoolId filter if it's provided (not undefined)
      if (adminSchoolId) {
        whereClause.schoolId = adminSchoolId;
      }

      // Apply filters
      if (filters?.grade) {
        whereClause.grade = filters.grade;
      }

      if (filters?.section) {
        whereClause.section = { contains: filters.section, mode: 'insensitive' };
      }

      if (filters?.search) {
        whereClause.name = { contains: filters.search, mode: 'insensitive' };
      }

      const classes = await prisma.class.findMany({
        where: whereClause,
        include: {
          school: { select: { name: true } },
          _count: {
            select: { users: true },
          },
        },
        orderBy: [
          { grade: 'asc' },
          { section: 'asc' },
        ],
      });

      return ApiResponse.success(classes, 'Classes retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // STUDENT: PROFILE APIS
  // ============================================

  // Get student profile (student can only see their own)
  static async getStudentProfile(studentUserId: string, currentUserId: string) {
    try {
      // Verify student can only access their own profile
      if (studentUserId !== currentUserId) {
        throw AuthError.forbidden('Cannot access other student profiles');
      }

      const student = await prisma.user.findUnique({
        where: { id: studentUserId },
        include: {
          role: true,
          studentProfile: true,
          school: { select: { name: true } },
          classRef: { select: { name: true, grade: true, section: true } },
        },
      });

      if (!student) {
        throw AuthError.notFound('Student profile not found');
      }

      const { password, ...studentWithoutPassword } = student;

      return ApiResponse.success(studentWithoutPassword, 'Student profile retrieved');
    } catch (error) {
      throw error;
    }
  }

  // Update student profile (limited fields for students)
  static async updateStudentProfile(
    studentUserId: string,
    currentUserId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      profileImage?: string;
    }
  ) {
    try {
      // Verify student can only update their own profile
      if (studentUserId !== currentUserId) {
        throw AuthError.forbidden('Cannot update other student profiles');
      }

      // Students can only update limited fields
      const allowedFields = ['firstName', 'lastName', 'phone'];
      const updateData: any = {};

      allowedFields.forEach(field => {
        if (data[field as keyof typeof data] !== undefined) {
          updateData[field] = data[field as keyof typeof data];
        }
      });

      // Handle profile image separately
      if (data.profileImage) {
        await prisma.studentProfile.updateMany({
          where: { userId: studentUserId },
          data: { profileImage: data.profileImage },
        });
      }

      const updatedStudent = await prisma.user.update({
        where: { id: studentUserId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        include: {
          role: true,
          studentProfile: true,
          school: { select: { name: true } },
          classRef: { select: { name: true, grade: true, section: true } },
        },
      });

      const { password, ...studentWithoutPassword } = updatedStudent;

      return ApiResponse.success(studentWithoutPassword, 'Student profile updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // SCHOOL SECTIONS APIS
  // ============================================

  // Get sections for a specific school
  static async getSchoolSections(schoolId: string) {
    try {
      // Fetch unique sections from existing classes for this school
      const classes = await prisma.class.findMany({
        where: { 
          schoolId: schoolId,
          section: { not: null }
        },
        select: {
          section: true
        },
        distinct: ['section'],
        orderBy: { section: 'asc' }
      });

      // Extract unique section names
      const sections = classes
        .map(cls => cls.section)
        .filter(section => section && section.trim() !== '');

      return ApiResponse.success(sections, 'School sections fetched successfully');
    } catch (error) {
      console.error('Get school sections error:', error);
      return ApiResponse.error('Failed to fetch school sections');
    }
  }

  // Create a new section for a school
  static async createSchoolSection(schoolId: string, name: string) {
    try {
      // Check if section already exists for this school
      const existingClass = await prisma.class.findFirst({
        where: {
          schoolId: schoolId,
          section: name,
        }
      });

      if (existingClass) {
        return ApiResponse.error('Section already exists for this school');
      }

      // Create a sample class with the new section to establish it
      // This creates a placeholder class that can be updated later
      const newClass = await prisma.class.create({
        data: {
          name: `Class Placeholder - ${name}`,
          grade: 10, // Default grade
          section: name,
          schoolId: schoolId,
        },
        select: {
          id: true,
          name: true,
          grade: true,
          section: true,
          schoolId: true,
          createdAt: true,
        }
      });

      return ApiResponse.success(newClass, 'School section created successfully');
    } catch (error) {
      console.error('Create school section error:', error);
      return ApiResponse.error('Failed to create school section');
    }
  }
}
