// src/auth/auth.repository.ts

import prisma from "../../prisma";



export const AuthRepository = {

  // Student login uses studentId (from User table)

  findStudentByStudentId: (studentId: string) =>

    prisma.user.findFirst({

      where: { 

        studentId: studentId,

        role: { name: 'STUDENT' }

      },

      include: { 

        role: true, 

        studentProfile: true,

        school: true,

        classRef: true

      },

    }),



  // Admin / Superadmin login uses email

  findUserByEmail: (email: string) =>

    prisma.user.findUnique({

      where: { email },

      include: { 

        role: true, 

        adminProfile: {

          include: {

            adminPermissions: {

              include: {

                permission: true,

              },

            },

          },

        },

        school: true

      },

    }),



  // Create session

  createSession: (sessionId: string, userId: string, roleId: string, expiresAt: Date) =>

    prisma.session.create({

      data: {

        sessionId,

        userId,

        roleId,

        expiresAt,

      },

    }),



  // Find session by sessionId

  findSessionBySessionId: (sessionId: string) =>

    prisma.session.findUnique({

      where: { sessionId },

      include: {

        user: {

          include: {

            role: true,

            studentProfile: true,

            adminProfile: {

              include: {

                adminPermissions: {

                  include: {

                    permission: true,

                  },

                },

              },

            },

            school: true,

            classRef: true,

          },

        },

      },

    }),



  // Delete session (logout)

  deleteSession: (sessionId: string) =>

    prisma.session.delete({

      where: { sessionId },

    }),



  // Clean expired sessions

  deleteExpiredSessions: () =>

    prisma.session.deleteMany({

      where: {

        expiresAt: {

          lt: new Date(),

        },

      },

    }),



  // Update user's last active timestamp

  updateLastActive: (userId: string) =>

    prisma.user.update({

      where: { id: userId },

      data: { lastActive: new Date() },

    }),



  // Find user by ID

  findUserById: (userId: string) =>

    prisma.user.findUnique({

      where: { id: userId },

      include: {

        role: true,

        school: true,

        studentProfile: true,

        adminProfile: true,

        classRef: true,

      },

    }),



  // Find admin user by phone number (excluding SUPERADMIN)

  findAdminByPhone: (phone: string) =>
    prisma.user.findFirst({
      where: { 
        phone: phone,
        role: { 
          name: { 
            in: ['ADMIN', 'SCHOOL_SUPERADMIN', 'COUNSELOR', 'TEACHER'] 
          } 
        },
        status: 'ACTIVE'
      },
      include: { 
        role: true, 
        adminProfile: {
          include: {
            adminPermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        school: true
      },
    }),



  // Check if user has specific permission

  userHasPermission: async (userId: string, permissionName: string) => {

    const user = await prisma.user.findUnique({

      where: { id: userId },

      include: {

        role: {

          include: {

            rolePermissions: {

              include: {

                permission: true,

              },

            },

          },

        },

        adminProfile: {

          include: {

            adminPermissions: {

              include: {

                permission: true,

              },

            },

          },

        },

      },

    });



    if (!user) return false;



    // Check role permissions

    const hasRolePermission = user.role.rolePermissions.some(

      (rp) => rp.permission.name === permissionName

    );



    // Check admin-specific permissions (if admin)

    const hasAdminPermission = user.adminProfile?.adminPermissions.some(

      (ap) => ap.permission.name === permissionName

    ) || false;



    return hasRolePermission || hasAdminPermission;

  },

};

