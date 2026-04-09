import { AdminRepository } from './admin.repository';
import { PasswordUtil } from '@/src/utils/password.util';
import { ApiResponse } from '@/src/utils/api-response';
import { AuthError } from '@/src/utils/errors';
import { CreateAdminData, UpdateAdminData, ResetAdminPasswordData, UpdateAdminStatusData } from './admin.validators';
import prisma from '@/src/prisma';

export class AdminService {
  // Create admin (SuperAdmin only)
  static async createAdmin(data: CreateAdminData, creatorId: string) {
    try {
      // Check if any user with this email already exists (not just admins)
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      
      if (existingUser) {
        throw AuthError.conflict('A user with this email already exists');
      }

      // Multiple admins can be assigned to the same school
      // No longer enforcing one admin per school policy

      // Get role based on selection
      const role = await prisma.role.findUnique({
        where: { name: data.role },
      });

      if (!role) {
        throw new Error(`${data.role} role not found`);
      }

      // Hash password
      const hashedPassword = await PasswordUtil.hash(data.password);

      // Create admin with profile
      const admin = await AdminRepository.createAdmin({
        ...data,
        password: hashedPassword,
        roleId: role.id,
        createdBy: creatorId,
      });

      // Remove password from response
      const { password, ...adminWithoutPassword } = admin;

      return ApiResponse.success(adminWithoutPassword, 'Admin created successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get all admins (SuperAdmin and SchoolSuperAdmin only)
  static async getAllAdmins(schoolId?: string, userSchoolId?: string, locationId?: string) {
    try {
      const admins = await AdminRepository.getAllAdmins(schoolId, locationId);
      
      // Remove passwords from response
      const adminsWithoutPasswords = admins.map(admin => {
        const { password, ...adminWithoutPassword } = admin;
        return adminWithoutPassword;
      });

      return ApiResponse.success(adminsWithoutPasswords, 'Admins retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get admin by ID
  static async getAdminById(id: string) {
    try {
      console.log('Getting admin by ID:', id);
      const admin = await AdminRepository.getAdminById(id);
      console.log('Admin repository result:', admin);
      
      if (!admin) {
        console.log('Admin not found for ID:', id);
        throw AuthError.notFound('Admin not found');
      }

      // Remove password from response
      const { password, ...adminWithoutPassword } = admin;
      console.log('Admin without password:', adminWithoutPassword);

      return ApiResponse.success(adminWithoutPassword, 'Admin retrieved successfully');
    } catch (error) {
      console.error('Error in getAdminById:', error);
      throw error;
    }
  }

  // Update admin (SuperAdmin only)
  static async updateAdmin(id: string, data: UpdateAdminData) {
    try {
      // Check if admin exists
      const existingAdmin = await AdminRepository.getAdminById(id);
      if (!existingAdmin) {
        throw AuthError.notFound('Admin not found');
      }

      // Multiple admins can be assigned to the same school
      // No longer enforcing one admin per school policy

      // Update admin
      const updatedAdmin = await AdminRepository.updateAdmin(id, data);

      // Remove password from response
      const { password, ...adminWithoutPassword } = updatedAdmin;

      return ApiResponse.success(adminWithoutPassword, 'Admin updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Change own password (admin self-service)
  static async changeOwnPassword(id: string, data: ResetAdminPasswordData) {
    try {
      // Check if admin exists
      const existingAdmin = await AdminRepository.getAdminById(id);
      if (!existingAdmin) {
        throw AuthError.notFound('Admin not found');
      }

      // Verify current password (you'll need to add currentPassword to the schema)
      // For now, we'll skip current password verification, but you should add it
      // const isCurrentPasswordValid = await PasswordUtil.verify(data.currentPassword, existingAdmin.password);
      // if (!isCurrentPasswordValid) {
      //   throw AuthError.unauthorized('Current password is incorrect');
      // }

      // Hash new password
      const hashedPassword = await PasswordUtil.hash(data.newPassword);

      // Update password
      const updatedAdmin = await AdminRepository.updateAdminPassword(id, hashedPassword);

      return ApiResponse.success(updatedAdmin, 'Password changed successfully');
    } catch (error) {
      throw error;
    }
  }

  // Reset admin password (SuperAdmin only)
  static async resetAdminPassword(id: string, data: ResetAdminPasswordData) {
    try {
      // Check if admin exists
      const existingAdmin = await AdminRepository.getAdminById(id);
      if (!existingAdmin) {
        throw AuthError.notFound('Admin not found');
      }

      // Hash new password
      const hashedPassword = await PasswordUtil.hash(data.newPassword);

      // Update password
      const updatedAdmin = await AdminRepository.updateAdminPassword(id, hashedPassword);

      return ApiResponse.success(updatedAdmin, 'Admin password reset successfully');
    } catch (error) {
      throw error;
    }
  }

  // Update admin status (SuperAdmin and SchoolSuperAdmin only)
  static async updateAdminStatus(id: string, data: UpdateAdminStatusData, currentUser?: any) {
    try {
      // Check if admin exists
      const existingAdmin = await AdminRepository.getAdminById(id);
      if (!existingAdmin) {
        throw AuthError.notFound('Admin not found');
      }

      // For SCHOOL_SUPERADMIN, ensure the admin being updated is in the same school
      if (currentUser?.role?.name === 'SCHOOL_SUPERADMIN' && existingAdmin.schoolId !== currentUser.schoolId) {
        throw AuthError.forbidden('You can only manage admins in your own school');
      }

      // Update status
      const updatedAdmin = await AdminRepository.updateAdminStatus(id, data.status);

      // Remove password from response
      const { password, ...adminWithoutPassword } = updatedAdmin;

      return ApiResponse.success(adminWithoutPassword, `Admin status updated to ${data.status}`);
    } catch (error) {
      throw error;
    }
  }

  // Update admin permissions (SuperAdmin and SchoolSuperAdmin only)
  static async updateAdminPermissions(id: string, permissions: string[]) {
    try {
      // Check if admin exists
      const existingAdmin = await AdminRepository.getAdminById(id);
      if (!existingAdmin) {
        throw AuthError.notFound('Admin not found');
      }

      const updatedAdmin = await AdminRepository.updateAdminPermissions(id, permissions);

      // Remove password from response
      const { password, ...adminWithoutPassword } = updatedAdmin;

      return ApiResponse.success(adminWithoutPassword, 'Admin permissions updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Delete admin (SuperAdmin and SchoolSuperAdmin only - hard delete)
  static async deleteAdmin(id: string, currentUser?: any) {
    try {
      // Check if admin exists
      const existingAdmin = await AdminRepository.getAdminById(id);
      if (!existingAdmin) {
        throw AuthError.notFound('Admin not found');
      }

      // For SCHOOL_SUPERADMIN, ensure the admin being deleted is in the same school
      if (currentUser?.role?.name === 'SCHOOL_SUPERADMIN' && existingAdmin.schoolId !== currentUser.schoolId) {
        throw AuthError.forbidden('You can only manage admins in your own school');
      }

      // Hard delete - completely remove from database
      const deletedAdmin = await AdminRepository.deleteAdmin(id);

      // Remove password from response
      const { password, ...adminWithoutPassword } = deletedAdmin;

      return ApiResponse.success(adminWithoutPassword, 'Admin deleted permanently from the system');
    } catch (error) {
      throw error;
    }
  }
}
