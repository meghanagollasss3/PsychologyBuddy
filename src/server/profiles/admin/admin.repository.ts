import prisma from '@/src/prisma';
import { CreateAdminData, UpdateAdminData } from './admin.validators';

export const AdminRepository = {
  // Create admin with profile
  createAdmin: async (data: CreateAdminData & { roleId: string }) => {
    // Debug: Check what models are available in prisma client
    console.log('Available prisma models:', Object.keys(prisma).filter(key => !key.startsWith('_')));
    
    // Debug: Log the incoming data
    console.log('Admin creation data received:', {
      role: data.role,
      schoolId: data.schoolId,
      locationId: data.locationId,
      hasLocationId: !!data.locationId,
      locationIdLength: data.locationId?.length
    });
    
    const result = await prisma.user.create({
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

    // If this is an ADMIN role with locationId, create location assignment
    if (data.role === 'ADMIN' && data.locationId) {
      console.log('ADMIN role with locationId detected, proceeding with assignment creation');
      try {
        console.log('Creating location assignment for admin:', {
          adminId: result.id,
          locationId: data.locationId,
          assignedBy: data.createdBy || 'system'
        });
        
        // Check if locationAdminAssignment model exists
        if (!prisma.locationAdminAssignment) {
          console.log('locationAdminAssignment model not found, trying raw query for assignment creation');
          
          // Try raw query as fallback
          try {
            // Use the newly created admin's ID as the assignedBy value (self-assignment)
            await prisma.$queryRaw`
              INSERT INTO "LocationAdminAssignments" (id, "locationId", "adminId", "assignedBy", "assignedAt")
              VALUES (gen_random_uuid(), ${data.locationId}, ${result.id}, ${result.id}, NOW())
            `;
            console.log('Raw query assignment created successfully');
          } catch (rawError) {
            console.error('Raw query assignment creation failed:', rawError);
          }
        } else {
          const assignment = await prisma.locationAdminAssignment.create({
            data: {
              locationId: data.locationId,
              adminId: result.id,
              assignedBy: result.id, // Self-assignment
            },
          });
          
          console.log('Location assignment created successfully:', assignment);
        }
      } catch (error) {
        console.error('Error creating location assignment:', error);
        console.error('Assignment data:', {
          locationId: data.locationId,
          adminId: result.id,
          assignedBy: data.createdBy || 'system'
        });
        // Don't fail the admin creation if location assignment fails
      }
    } else {
      console.log('No location assignment created. Role:', data.role, 'LocationId:', data.locationId);
    }

    // Assign default permissions to all admins (except SUPERADMIN who has all permissions)
    if (data.role !== 'SUPERADMIN') {
      try {
        console.log('Assigning default permissions to admin:', result.id);
        
        // Default permission names for all admins
        const defaultPermissionNames = [
          'dashboard.view',
          'activity.view', 
          'escalations.view',
          'settings.view'
        ];
        
        // Get permission IDs from permission names
        const permissionRecords = await prisma.permission.findMany({
          where: {
            name: {
              in: defaultPermissionNames
            }
          }
        });

        // Create admin permissions
        if (permissionRecords.length > 0 && result.adminProfile?.id) {
          const newPermissions = permissionRecords.map(permission => ({
            adminProfileId: result.adminProfile!.id,
            permissionId: permission.id
          }));

          await prisma.adminPermission.createMany({
            data: newPermissions
          });
          
          console.log(`Assigned ${newPermissions.length} default permissions to admin ${result.id}`);
        }
      } catch (error) {
        console.error('Error assigning default permissions:', error);
        // Don't fail the admin creation if default permission assignment fails
      }
    }

    return result;
  },

  // Get all admins (SuperAdmin only)
  getAllAdmins: async (schoolId?: string, locationId?: string) => {
    // Debug: Check LocationAdminAssignments table count at the start
    try {
      const tableCheck = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM "LocationAdminAssignments"
      `;
      console.log('LocationAdminAssignments table total count at start:', tableCheck[0]?.count || 0);
    } catch (error) {
      console.log('LocationAdminAssignments table does not exist or error:', error instanceof Error ? error.message : String(error));
    }
    
    const whereClause: any = {
      role: {
        name: {
          in: ['ADMIN', 'SCHOOL_SUPERADMIN', 'SUPERADMIN'],
        },
      },
    };

    // Add school filter if provided
    if (schoolId && schoolId !== 'all') {
      whereClause.schoolId = schoolId;
    }

    // Add location filter if provided - handle through LocationAdminAssignments for admins
    if (locationId && locationId !== 'all') {
      // For admins, we need to filter by LocationAdminAssignments
      whereClause.locationAdminAssignments = {
        some: {
          locationId: locationId
        }
      };
    }

    const admins = await prisma.user.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get location assignments for ADMIN role users
    const adminsWithLocations = await Promise.all(
      admins.map(async (admin) => {
        if (admin.role.name === 'ADMIN') {
          try {
            console.log('Fetching location assignments for admin:', admin.id);
            
            // Check if locationAdminAssignment model exists
            if (!prisma.locationAdminAssignment) {
              console.log('locationAdminAssignment model not found, trying raw query');
              
              // Try raw query as fallback
              try {
                // First check if table exists and has any data
                const tableCheck = await prisma.$queryRaw<any[]>`
                  SELECT COUNT(*) as count FROM "LocationAdminAssignments"
                `;
                
                console.log('LocationAdminAssignments table count:', tableCheck[0]?.count || 0);
                
                const rawAssignments = await prisma.$queryRaw<any[]>`
                  SELECT 
                    la.id,
                    la."locationId",
                    la."adminId",
                    la."assignedAt",
                    la."assignedBy",
                    sl.id as "locationId",
                    sl.name as "locationName",
                    sl.address as "locationAddress",
                    sl.city as "locationCity"
                  FROM "LocationAdminAssignments" la
                  JOIN "SchoolLocations" sl ON la."locationId" = sl.id
                  WHERE la."adminId" = ${admin.id}
                `;
                
                console.log('Raw query found assignments:', rawAssignments.length);
                
                const assignedLocations = rawAssignments.map((assignment: any) => ({
                  id: assignment.locationId,
                  name: assignment.locationName,
                  address: assignment.locationAddress,
                  city: assignment.locationCity,
                }));
                
                return {
                  ...admin,
                  assignedLocations
                };
              } catch (rawError) {
                console.error('Raw query also failed:', rawError);
                return {
                  ...admin,
                  assignedLocations: []
                };
              }
            }
            
            // Query location assignments for this admin
            const locationAssignments = await prisma.locationAdminAssignment.findMany({
              where: { adminId: admin.id },
              include: {
                location: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                  }
                }
              }
            });

            console.log('Found location assignments for admin', admin.id, ':', locationAssignments.length);

            return {
              ...admin,
              assignedLocations: locationAssignments.map(assignment => assignment.location)
            };
          } catch (error) {
            console.error('Error fetching location assignments for admin', admin.id, ':', error);
            return {
              ...admin,
              assignedLocations: []
            };
          }
        }
        return admin;
      })
    );

    return adminsWithLocations;
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
    // First, get the current admin to check their role
    const currentAdmin = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });

    if (!currentAdmin) {
      throw new Error('Admin not found');
    }

    // Update the admin basic info
    const updatedAdmin = await prisma.user.update({
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

    // Handle location assignment for ADMIN role
    if (currentAdmin.role.name === 'ADMIN' && data.locationId) {
      try {
        console.log('Updating location assignment for admin:', {
          adminId: id,
          newLocationId: data.locationId
        });

        // Use the current admin's ID as the assignedBy value (self-assignment)
        const assignedById = id; // The admin being updated is the assigner

        // Check if locationAdminAssignment model exists
        if (!prisma.locationAdminAssignment) {
          console.log('locationAdminAssignment model not found, using raw query for update');
          
          // First, delete existing assignments
          await prisma.$queryRaw`
            DELETE FROM "LocationAdminAssignments" WHERE "adminId" = ${id}
          `;
          
          // Then insert new assignment
          await prisma.$queryRaw`
            INSERT INTO "LocationAdminAssignments" (id, "locationId", "adminId", "assignedBy", "assignedAt")
            VALUES (gen_random_uuid(), ${data.locationId}, ${id}, ${assignedById}, NOW())
          `;
          
          console.log('Raw query location assignment updated successfully');
        } else {
          // Delete existing assignments
          await prisma.locationAdminAssignment.deleteMany({
            where: { adminId: id }
          });
          
          // Create new assignment
          await prisma.locationAdminAssignment.create({
            data: {
              locationId: data.locationId,
              adminId: id,
              assignedBy: assignedById,
            },
          });
          
          console.log('Location assignment updated successfully');
        }
      } catch (error) {
        console.error('Error updating location assignment:', error);
        // Don't fail the admin update if location assignment fails
      }
    }

    return updatedAdmin;
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

  // Delete admin (hard delete - completely remove from database)
  deleteAdmin: async (id: string) => {
    // First get the admin data to return before deletion
    const admin = await prisma.user.findUnique({
      where: { id },
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

    if (!admin) {
      throw new Error('Admin not found');
    }

    // Perform hard delete
    await prisma.user.delete({
      where: { id },
    });

    return admin;
  },

  // Check if admin email exists
  findAdminByEmail: async (email: string) => {
    return prisma.user.findFirst({
      where: {
        email,
        role: {
          name: {
            in: ['ADMIN', 'SCHOOL_SUPERADMIN', 'SUPERADMIN'],
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
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        roleId: true,
        schoolId: true,
        password: true, // Include password so it can be removed in service layer
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
    }) as any; // Type assertion to ensure password is included
  },

  // Check if school already has an admin
  findAdminBySchoolId: async (schoolId: string) => {
    return prisma.user.findFirst({
      where: {
        schoolId,
        role: {
          name: {
            in: ['ADMIN', 'SCHOOL_SUPERADMIN'],
          },
        },
      },
      include: {
        role: true,
        adminProfile: true,
      },
    });
  },
};
