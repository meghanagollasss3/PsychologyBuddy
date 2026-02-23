import prisma from '@/src/prisma';
import { CreateAdminData, UpdateAdminData } from './admin.validators';

export const AdminRepository = {
  // Create admin with profile
  createAdmin: async (data: CreateAdminData & { roleId: string }) => {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        roleId: data.roleId,
        ...(data.schoolId && { schoolId: data.schoolId }),
        emailVerified: true,
        adminProfile: {
          create: {
            department: data.department || 'General Administration',
          },
        },
      },
      include: {
        role: true,
        adminProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  // Get all admins (SuperAdmin only)
  getAllAdmins: async () => {
    return prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ['ADMIN', 'SUPERADMIN'],
          },
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        adminProfile: {
          include: {
            adminPermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        school: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Get admin by ID
  getAdminById: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        adminProfile: {
          include: {
            adminPermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  // Update admin
  updateAdmin: async (id: string, data: UpdateAdminData) => {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone && { phone: data.phone }),
        ...(data.schoolId && { schoolId: data.schoolId }),
        adminProfile: {
          upsert: {
            create: {
              ...(data.department && { department: data.department }),
              ...(data.profileImage && { profileImage: data.profileImage }),
            },
            update: {
              ...(data.department && { department: data.department }),
              ...(data.profileImage && { profileImage: data.profileImage }),
            },
          },
        },
      },
      include: {
        role: true,
        adminProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  // Update admin password
  updateAdminPassword: async (id: string, hashedPassword: string) => {
    return prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
      },
    });
  },

  // Update admin status (deactivate/suspend)
  updateAdminStatus: async (id: string, status: string) => {
    return prisma.user.update({
      where: { id },
      data: {
        status: status,
      },
      include: {
        role: true,
        adminProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  // Delete admin (soft delete by setting status to INACTIVE)
  deleteAdmin: async (id: string) => {
    return prisma.user.update({
      where: { id },
      data: {
        status: 'INACTIVE',
      },
      include: {
        role: true,
        adminProfile: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  // Check if admin email exists
  findAdminByEmail: async (email: string) => {
    return prisma.user.findFirst({
      where: {
        email,
        role: {
          name: {
            in: ['ADMIN', 'SUPERADMIN'],
          },
        },
      },
      include: {
        role: true,
        adminProfile: true,
      },
    });
  },

  // Update admin permissions
  updateAdminPermissions: async (id: string, permissions: string[]) => {
    // First, get the admin with their profile to get the correct adminProfileId
    const admin = await prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: true
      }
    });

    if (!admin || !admin.adminProfile) {
      throw new Error('Admin profile not found');
    }

    // Get permission IDs from permission names
    const permissionRecords = await prisma.permission.findMany({
      where: {
        name: {
          in: permissions
        }
      }
    });

    // Delete existing admin permissions
    await prisma.adminPermission.deleteMany({
      where: {
        adminProfileId: admin.adminProfile.id
      }
    });

    // Create new admin permissions
    const newPermissions = permissionRecords.map(permission => ({
      adminProfileId: admin.adminProfile!.id,
      permissionId: permission.id
    }));

    if (newPermissions.length > 0) {
      await prisma.adminPermission.createMany({
        data: newPermissions
      });
    }

    // Return updated admin with permissions
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        adminProfile: {
          include: {
            adminPermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  // Check if school already has an admin
  findAdminBySchoolId: async (schoolId: string) => {
    return prisma.user.findFirst({
      where: {
        schoolId,
        role: {
          name: 'ADMIN',
        },
      },
      include: {
        role: true,
        adminProfile: true,
      },
    });
  },
};
