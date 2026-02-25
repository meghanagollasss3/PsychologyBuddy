import prisma from '@/src/prisma';
import { PasswordUtil } from '@/src/utils/password.util';
import { CreateStudentData, UpdateStudentData } from './student.validators';

export const StudentRepository = {
  // Create student with profile
  createStudent: async (data: CreateStudentData & { roleId: string; schoolId: string; studentId: string }) => {
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
        emailVerified: true,
        studentProfile: {
          create: {
            status: 'ACTIVE',
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

  // Get students by school (Admin only - school-scoped)
  getStudentsBySchool: async (schoolId?: string, filters?: { search?: string; status?: string; classId?: string }) => {
    const whereCondition: any = {
      role: {
        name: 'STUDENT',
      },
      status: 'ACTIVE' // Only include active users
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

      // Filter by status - this applies to studentProfile status, not user status
      if (filters.status && filters.status !== 'all') {
        whereCondition.studentProfile = {
          ...whereCondition.studentProfile,
          status: filters.status,
        };
      }

      // Filter by class
      if (filters.classId && filters.classId !== 'all') {
        whereCondition.classId = filters.classId;
      }
    }

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
    return students;
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
  updateStudent: async (id: string, data: UpdateStudentData) => {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.classId && { classId: data.classId }),
        studentProfile: {
          update: {
            ...(data.status && { status: data.status }),
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
            status: status as any,
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

  // Delete student (soft delete by setting status to INACTIVE)
  deleteStudent: async (id: string) => {
    return prisma.user.update({
      where: { id },
      data: {
        studentProfile: {
          update: {
            status: 'INACTIVE',
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

  // Check if student ID exists
  findStudentByStudentId: async (studentId: string) => {
    return prisma.user.findFirst({
      where: {
        studentId,
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

  // Generate unique student ID
  generateUniqueStudentId: async (schoolId: string, classId: string) => {
    let studentId: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      // Generate student ID format: STU + random 6 digits
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      studentId = `STU${randomNum}`;
      attempts++;

      if (attempts > maxAttempts) {
        throw new Error('Unable to generate unique student ID');
      }
    } while (await StudentRepository.findStudentByStudentId(studentId));

    return studentId;
  },

  // Auto-generate student email
  generateStudentEmail: async (studentId: string, schoolDomain: string) => {
    return `${studentId.toLowerCase()}@${schoolDomain}`;
  },
};
