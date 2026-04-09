import prisma from '@/src/prisma';
import { ApiResponse } from '@/src/utils/api-response';
import { AuthError } from '@/src/utils/errors';

export class SchoolLocationService {
  // ============================================
  // SCHOOL LOCATION MANAGEMENT
  // ============================================

  // Create school location
  static async createLocation(data: {
    schoolId: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    notes?: string;
    isMain?: boolean;
  }) {
    try {
      // Check if school exists
      const school = await prisma.school.findUnique({
        where: { id: data.schoolId },
      });

      if (!school) {
        throw AuthError.notFound('School not found');
      }

      // If this is marked as main location, unmark existing main location
      if (data.isMain) {
        await prisma.schoolLocation.updateMany({
          where: { schoolId: data.schoolId, isMain: true },
          data: { isMain: false },
        });
      }

      const location = await prisma.schoolLocation.create({
        data: {
          schoolId: data.schoolId,
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
          notes: data.notes,
          isMain: data.isMain || false,
        },
        include: {
          school: { select: { name: true } },
          _count: {
            select: {
              users: true,
              classes: true,
            },
          },
        },
      });

      return ApiResponse.success(location, 'School location created successfully');
    } catch (error) {
      throw error;
    }
  }

  // Update school location
  static async updateLocation(locationId: string, data: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    notes?: string;
    isMain?: boolean;
  }) {
    try {
      // Get existing location to verify it exists and get schoolId
      const existingLocation = await prisma.schoolLocation.findUnique({
        where: { id: locationId },
        include: { school: true },
      });

      if (!existingLocation) {
        throw AuthError.notFound('Location not found');
      }

      // If this is being marked as main location, unmark existing main location
      if (data.isMain && !existingLocation.isMain) {
        await prisma.schoolLocation.updateMany({
          where: { 
            schoolId: existingLocation.schoolId, 
            isMain: true,
            id: { not: locationId }
          },
          data: { isMain: false },
        });
      }

      const location = await prisma.schoolLocation.update({
        where: { id: locationId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          school: { select: { name: true } },
          _count: {
            select: {
              users: true,
              classes: true,
            },
          },
        },
      });

      return ApiResponse.success(location, 'School location updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get all locations for a school
  static async getSchoolLocations(schoolId: string) {
    try {
      const locations = await prisma.schoolLocation.findMany({
        where: { schoolId },
        include: {
          school: { select: { name: true } },
          _count: {
            select: {
              users: true,
              classes: true,
            },
          },
        },
        orderBy: [
          { isMain: 'desc' }, // Main location first
          { name: 'asc' },
        ],
      });

      return ApiResponse.success(locations, 'School locations retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get location by ID
  static async getLocationById(locationId: string) {
    try {
      const location = await prisma.schoolLocation.findUnique({
        where: { id: locationId },
        include: {
          school: { select: { name: true } },
          _count: {
            select: {
              users: true,
              classes: true,
            },
          },
        },
      });

      if (!location) {
        throw AuthError.notFound('Location not found');
      }

      return ApiResponse.success(location, 'Location retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Delete school location
  static async deleteLocation(locationId: string) {
    try {
      // Check if location exists and get associated data
      const location = await prisma.schoolLocation.findUnique({
        where: { id: locationId },
        include: {
          _count: {
            select: {
              users: true,
              classes: true,
            },
          },
        },
      });

      if (!location) {
        throw AuthError.notFound('Location not found');
      }

      // Check if location has users or classes
      if (location._count.users > 0 || location._count.classes > 0) {
        throw new AuthError('Cannot delete location with existing users or classes. Please reassign them first.', 400);
      }

      // Check if it's the main location
      if (location.isMain) {
        throw new AuthError('Cannot delete the main location. Please assign a new main location first.', 400);
      }

      // Delete the location
      await prisma.schoolLocation.delete({
        where: { id: locationId },
      });

      return ApiResponse.success(null, 'School location deleted successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get all schools with their locations
  static async getSchoolsWithLocations() {
    try {
      const schools = await prisma.school.findMany({
        include: {
          locations: {
            include: {
              _count: {
                select: {
                  users: true,
                  classes: true,
                },
              },
            },
            orderBy: [
              { isMain: 'desc' },
              { name: 'asc' },
            ],
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return ApiResponse.success(schools, 'Schools with locations retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get users and classes for a specific location
  static async getLocationDetails(locationId: string) {
    try {
      const location = await prisma.schoolLocation.findUnique({
        where: { id: locationId },
        include: {
          school: { select: { name: true } },
          users: {
            include: {
              role: { select: { name: true } },
              studentProfile: { select: { status: true } },
              classRef: { select: { name: true, grade: true, section: true } },
            },
            orderBy: [
              { role: { name: 'asc' } },
              { firstName: 'asc' },
              { lastName: 'asc' },
            ],
          },
          classes: {
            include: {
              _count: {
                select: { users: true },
              },
            },
            orderBy: [
              { grade: 'asc' },
              { section: 'asc' },
              { name: 'asc' },
            ],
          },
        },
      });

      if (!location) {
        throw AuthError.notFound('Location not found');
      }

      return ApiResponse.success(location, 'Location details retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Assign user to location
  static async assignUserToLocation(userId: string, locationId: string) {
    try {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { school: true },
      });

      if (!user) {
        throw AuthError.notFound('User not found');
      }

      // Verify location exists and belongs to same school
      const location = await prisma.schoolLocation.findUnique({
        where: { id: locationId },
      });

      if (!location) {
        throw AuthError.notFound('Location not found');
      }

      if (user.schoolId !== location.schoolId) {
        throw AuthError.forbidden('Cannot assign user to location from different school');
      }

      // Update user location
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { locationId },
        include: {
          role: { select: { name: true } },
          school: { select: { name: true } },
          location: { select: { name: true } },
        },
      });

      const { password, ...userWithoutPassword } = updatedUser;

      return ApiResponse.success(userWithoutPassword, 'User assigned to location successfully');
    } catch (error) {
      throw error;
    }
  }

  // Remove user from location
  static async removeUserFromLocation(userId: string) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { locationId: null },
        include: {
          role: { select: { name: true } },
          school: { select: { name: true } },
        },
      });

      const { password, ...userWithoutPassword } = updatedUser;

      return ApiResponse.success(userWithoutPassword, 'User removed from location successfully');
    } catch (error) {
      throw error;
    }
  }

  // Assign class to location
  static async assignClassToLocation(classId: string, locationId: string) {
    try {
      // Verify class exists
      const existingClass = await prisma.class.findUnique({
        where: { id: classId },
        include: { school: true },
      });

      if (!existingClass) {
        throw AuthError.notFound('Class not found');
      }

      // Verify location exists and belongs to same school
      const location = await prisma.schoolLocation.findUnique({
        where: { id: locationId },
      });

      if (!location) {
        throw AuthError.notFound('Location not found');
      }

      if (existingClass.schoolId !== location.schoolId) {
        throw AuthError.forbidden('Cannot assign class to location from different school');
      }

      // Update class location
      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: { locationId },
        include: {
          school: { select: { name: true } },
          location: { select: { name: true } },
          _count: {
            select: { users: true },
          },
        },
      });

      return ApiResponse.success(updatedClass, 'Class assigned to location successfully');
    } catch (error) {
      throw error;
    }
  }

  // Remove class from location
  static async removeClassFromLocation(classId: string) {
    try {
      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: { locationId: null },
        include: {
          school: { select: { name: true } },
          _count: {
            select: { users: true },
          },
        },
      });

      return ApiResponse.success(updatedClass, 'Class removed from location successfully');
    } catch (error) {
      throw error;
    }
  }
}
