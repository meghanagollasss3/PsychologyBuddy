import prisma from '@/src/prisma';
import { PasswordUtil } from '@/src/utils/password.util';
import { CreateStudentData, UpdateStudentData } from './student.validators';

export type ExtendedUpdateStudentData = UpdateStudentData & {
  schoolId?: string;
  dateOfBirth?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
};

export const StudentRepository = {
  // Create student with profile
  createStudent: async (data: CreateStudentData & { roleId: string; schoolId: string; studentId: string; locationId: string }) => {
    return prisma.user.create({
      data: {
        studentId: data.studentId,
        email: data.email || `${data.studentId.toLowerCase()}@school.local`,
        password: data.password || `Student@${Date.now()}`,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        roleId: data.roleId,
        schoolId: data.schoolId,
        classId: data.classId,
        locationId: data.locationId,
        emailVerified: true,
        studentProfile: {
          create: {
            status: data.status || 'ACTIVE',
            dateOfBirth: new Date(data.dateOfBirth).toISOString(),
            emergencyContact: data.emergencyContact,
          },
        },
      },
      include: {
        role: true,
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        classRef: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  // Get students by school (Admin only - school-scoped)
  getStudentsBySchool: async (schoolId?: string, filters?: { search?: string; status?: string; classId?: string; locationId?: string; page?: number; limit?: number }) => {
    const whereCondition: any = {
      role: {
        name: 'STUDENT',
      },
    };

    // Only apply schoolId filter if it's provided
    if (schoolId) {
      whereCondition.schoolId = schoolId;
    }

    // Add filters if provided
    if (filters) {
      // Search by name, email, or studentId
      if (filters.search) {
        whereCondition.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { studentId: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Filter by status - use studentProfile.status
      if (filters.status && filters.status !== 'all') {
        whereCondition.studentProfile = {
          status: filters.status
        };
      }

      // Filter by class
      if (filters.classId && filters.classId !== 'all') {
        whereCondition.classId = filters.classId;
      }

      // Filter by location
      if (filters.locationId && filters.locationId !== 'all') {
        whereCondition.locationId = filters.locationId;
      }
    } else {
      // By default, only show active students when no filters are provided
      whereCondition.studentProfile = {
        status: 'ACTIVE'
      };
    }

    // Get pagination parameters
    const page = filters?.page || 1;
    const limit = filters?.limit || 5;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.user.count({
      where: whereCondition,
    });

    const students = await prisma.user.findMany({
      where: whereCondition,
      include: {
        role: true,
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        classRef: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
        _count: {
          select: {
            chatSessions: true,
            moodCheckins: true,
            escalationAlerts: {
              where: {
                status: 'resolved'
              }
            }
          },
        },
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
      skip,
      take: limit,
    });

    console.log('Query executed, found students:', students.length);
    console.log('Sample student data:', students.slice(0, 2));

    console.log('Student repository raw results:', students.length);
    console.log('Student details:', students.map(s => ({
      id: s.id,
      studentId: s.studentId,
      name: `${s.firstName} ${s.lastName}`,
      schoolId: s.schoolId,
      hasProfile: !!s.studentProfile,
      profileStatus: s.studentProfile?.status,
      userStatus: s.status
    })));

    console.log('Student repository result:', students.length, 'students found');
    
    return {
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Get student by ID
  getStudentById: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        classRef: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
      },
    });
  },

  // Update student
  updateStudent: async (id: string, data: ExtendedUpdateStudentData) => {
    // Handle schoolId - if it's not a UUID, try to find by custom ID first, then by name
    let schoolIdToUpdate = data.schoolId;
    if (data.schoolId && !data.schoolId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // First try to find school by custom ID
      const school = await prisma.school.findFirst({
        where: { id: data.schoolId },
        select: { id: true }
      });
      if (school) {
        schoolIdToUpdate = school.id;
      } else {
        // If not found by ID, try by name
        const schoolByName = await prisma.school.findFirst({
          where: { name: data.schoolId },
          select: { id: true }
        });
        if (schoolByName) {
          schoolIdToUpdate = schoolByName.id;
        } else {
          throw new Error(`School with ID or name "${data.schoolId}" not found`);
        }
      }
    }

    // Handle classId - if it's not a UUID, try to find by custom ID first, then by name
    let classIdToUpdate = data.classId;
    if (data.classId && !data.classId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // First try to find class by custom ID
      const classRecord = await prisma.class.findFirst({
        where: { id: data.classId },
        select: { id: true }
      });
      if (classRecord) {
        classIdToUpdate = classRecord.id;
      } else {
        // If not found by ID, try by name
        const classByName = await prisma.class.findFirst({
          where: { name: data.classId },
          select: { id: true }
        });
        if (classByName) {
          classIdToUpdate = classByName.id;
        } else {
          throw new Error(`Class with ID or name "${data.classId}" not found`);
        }
      }
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(classIdToUpdate && { classId: classIdToUpdate }),
        ...(schoolIdToUpdate && { schoolId: schoolIdToUpdate }),
        studentProfile: {
          update: {
            ...(data.status && { status: data.status }),
            ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
            ...(data.emergencyContact && { emergencyContact: data.emergencyContact }),
          },
        },
      },
      include: {
        role: true,
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        classRef: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
      },
    });
  },

  // Student self-update (limited fields)
  studentSelfUpdate: async (id: string, data: { profileImage?: string }) => {
    return prisma.user.update({
      where: { id },
      data: {
        studentProfile: {
          update: {
            ...(data.profileImage && { profileImage: data.profileImage }),
          },
        },
      },
      include: {
        role: true,
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        classRef: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
      },
    });
  },

  // Update student password
  updateStudentPassword: async (id: string, hashedPassword: string) => {
    return prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        studentId: true,
        email: true,
      },
    });
  },

  // Update student status
  updateStudentStatus: async (id: string, status: string) => {
    return prisma.user.update({
      where: { id },
      data: {
        studentProfile: {
          update: {
            status: status,
          },
        },
      },
      include: {
        role: true,
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        classRef: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  // Delete student (hard delete - completely remove from database)
  deleteStudent: async (id: string) => {
    // First get the student data to return before deletion
    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        classRef: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Delete related records in order to respect foreign key constraints
    // Delete streak record (no cascade delete)
    await prisma.streak.delete({
      where: { userId: id },
    }).catch(() => {
      // Ignore if streak doesn't exist
    });

    // Delete resource access records (no cascade delete)
    await prisma.resourceAccess.deleteMany({
      where: { userId: id },
    });

    // Delete writing journals (no cascade delete)
    await prisma.writingJournal.deleteMany({
      where: { userId: id },
    });

    // Delete audio journals (no cascade delete)
    await prisma.audioJournal.deleteMany({
      where: { userId: id },
    });

    // Delete art journals (no cascade delete)
    await prisma.artJournal.deleteMany({
      where: { userId: id },
    });

    // Delete high risk alerts (no cascade delete)
    await prisma.highRiskAlert.deleteMany({
      where: { userId: id },
    });

    // Perform hard delete of user (cascade will handle most other relations)
    await prisma.user.delete({
      where: { id },
    });

    return student;
  },

  // Check if student ID exists with thorough validation
  findStudentByStudentId: async (studentId: string) => {
    // Case-sensitive exact match
    const exactMatch = await prisma.user.findFirst({
      where: {
        studentId: studentId, // Prisma default is case-sensitive
        role: {
          name: 'STUDENT',
        },
      },
      include: {
        role: true,
        studentProfile: true,
        school: true,
      },
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Additional thorough check: search for similar IDs with case variations
    // This handles any potential database collation issues
    const allStudents = await prisma.user.findMany({
      where: {
        role: {
          name: 'STUDENT',
        },
        studentId: {
          not: null,
        },
      },
      select: {
        studentId: true,
        id: true,
      },
    });

    // Character-by-character comparison with exact case sensitivity
    const caseSensitiveMatch = allStudents.find(student => 
      student.studentId === studentId // Strict equality with case sensitivity
    );

    if (caseSensitiveMatch) {
      // If found through this method, return full student data
      return prisma.user.findFirst({
        where: {
          id: caseSensitiveMatch.id,
        },
        include: {
          role: true,
          studentProfile: true,
          school: true,
        },
      });
    }

    return null;
  },

  // Check if student email exists
  findStudentByEmail: async (email: string) => {
    return prisma.user.findFirst({
      where: {
        email,
        role: {
          name: 'STUDENT',
        },
      },
      include: {
        role: true,
        studentProfile: true,
      },
    });
  },

  // Generate unique student ID with thorough validation
  generateUniqueStudentId: async (schoolId: string, classId: string) => {
    let studentId: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      // Generate student ID format: STU + random 6 digits
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      studentId = `STU${randomNum}`;
      attempts++;

      // Validate generated ID format
      if (!/^[A-Z]{3}\d{6}$/.test(studentId)) {
        console.warn(`Invalid student ID format generated: ${studentId}`);
        continue;
      }

      // Thorough uniqueness check
      const existingStudent = await StudentRepository.findStudentByStudentId(studentId);
      
      if (existingStudent) {
        console.log(`Student ID collision detected: ${studentId}, attempt ${attempts}`);
        continue;
      }

      // Additional character-by-character validation
      // Ensure no similar IDs exist with case variations
      const allStudentIds = await prisma.user.findMany({
        where: {
          role: {
            name: 'STUDENT',
          },
          studentId: {
            not: null,
          },
        },
        select: {
          studentId: true,
        },
      });

      // Exact character-by-character comparison
      const hasExactMatch = allStudentIds.some(student => 
        student.studentId === studentId // Strict equality with case sensitivity
      );

      if (hasExactMatch) {
        console.log(`Exact character match found for student ID: ${studentId}`);
        continue;
      }

      // If we reach here, the ID is truly unique
      console.log(`Generated unique student ID: ${studentId} after ${attempts} attempts`);
      break;

    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error(`Unable to generate unique student ID after ${maxAttempts} attempts. Possible ID space exhaustion.`);
    }

    return studentId;
  },

  // Auto-generate student email
  generateStudentEmail: async (studentId: string, schoolDomain: string) => {
    return `${studentId.toLowerCase()}@${schoolDomain}`;
  },
};
