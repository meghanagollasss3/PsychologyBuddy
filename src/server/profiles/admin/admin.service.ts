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

      // For ADMIN role, check if school already has an admin (one admin per school policy)
      if (data.role === 'ADMIN' && data.schoolId) {
        const existingSchoolAdmin = await AdminRepository.findAdminBySchoolId(data.schoolId);
        if (existingSchoolAdmin) {
          throw AuthError.conflict('School already has an admin assigned');
        }
      }

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
      });

      // Remove password from response
      const { password, ...adminWithoutPassword } = admin;

      return ApiResponse.success(adminWithoutPassword, 'Admin created successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get all admins (SuperAdmin only)
  static async getAllAdmins() {
    try {
      const admins = await AdminRepository.getAllAdmins();
      
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
      const admin = await AdminRepository.getAdminById(id);
      
      if (!admin) {
        throw AuthError.notFound('Admin not found');
      }

      // Remove password from response
      const { password, ...adminWithoutPassword } = admin;

      return ApiResponse.success(adminWithoutPassword, 'Admin retrieved successfully');
    } catch (error) {
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

      // If updating schoolId, check if new school already has admin
      if (data.schoolId && data.schoolId !== existingAdmin.schoolId) {
        const existingSchoolAdmin = await AdminRepository.findAdminBySchoolId(data.schoolId);
        if (existingSchoolAdmin && existingSchoolAdmin.id !== id) {
          throw AuthError.conflict('Target school already has an admin assigned');
        }
      }

      // Update admin
      const updatedAdmin = await AdminRepository.updateAdmin(id, data);

      // Remove password from response
      const { password, ...adminWithoutPassword } = updatedAdmin;

      return ApiResponse.success(adminWithoutPassword, 'Admin updated successfully');
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

  // Update admin status (SuperAdmin only)
  static async updateAdminStatus(id: string, data: UpdateAdminStatusData) {
    try {
      // Check if admin exists
      const existingAdmin = await AdminRepository.getAdminById(id);
      if (!existingAdmin) {
        throw AuthError.notFound('Admin not found');
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

  // Update admin permissions (SuperAdmin only)
  static async updateAdminPermissions(id: string, permissions: string[]) {
    try {
      // Check if admin exists
      const existingAdmin = await AdminRepository.getAdminById(id);
      if (!existingAdmin) {
        throw AuthError.notFound('Admin not found');
      }

      // Don't allow updating permissions for SuperAdmin
      if (existingAdmin.role.name === 'SUPERADMIN') {
        throw new Error('Cannot modify SuperAdmin permissions');
      }

      // Update admin permissions
      const updatedAdmin = await AdminRepository.updateAdminPermissions(id, permissions);

      return ApiResponse.success(updatedAdmin, 'Admin permissions updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Delete admin (SuperAdmin only)
  static async deleteAdmin(id: string) {
    try {
      // Check if admin exists
      const existingAdmin = await AdminRepository.getAdminById(id);
      if (!existingAdmin) {
        throw AuthError.notFound('Admin not found');
      }

      // Soft delete by setting status to INACTIVE
      const deletedAdmin = await AdminRepository.deleteAdmin(id);

      // Remove password from response
      const { password, ...adminWithoutPassword } = deletedAdmin;

      return ApiResponse.success(adminWithoutPassword, 'Admin deleted successfully');
    } catch (error) {
      throw error;
    }
  }
}
