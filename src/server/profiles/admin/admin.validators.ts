import { z } from 'zod';

// Admin creation validator
export const CreateAdminSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'SCHOOL_SUPERADMIN', 'SUPERADMIN']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  schoolId: z.string().optional(),
  locationId: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  createdBy: z.string().optional(),
}).refine((data) => {
  // If role is ADMIN, schoolId and locationId are required
  if (data.role === 'ADMIN') {
    return data.schoolId && data.schoolId.trim().length > 0 && 
           data.locationId && data.locationId.trim().length > 0;
  }
  // If role is SCHOOL_SUPERADMIN, schoolId is required but locationId is not
  if (data.role === 'SCHOOL_SUPERADMIN') {
    return data.schoolId && data.schoolId.trim().length > 0;
  }
  // If role is SUPERADMIN, schoolId is not required
  return true;
}, {
  message: 'School ID is required for ADMIN and SCHOOL_SUPERADMIN roles, Location ID is required for ADMIN role',
  path: ['schoolId']
});

// Admin update validator
export const UpdateAdminSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  profileImage: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  schoolId: z.string().optional(),
  locationId: z.string().optional(),
});

// Admin password reset validator
export const ResetAdminPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
});

// Admin status update validator
export const UpdateAdminStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});

// Admin profile update validator (for self-profile updates)
export const UpdateAdminProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
});

export type CreateAdminData = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminData = z.infer<typeof UpdateAdminSchema>;
export type ResetAdminPasswordData = z.infer<typeof ResetAdminPasswordSchema>;
export type UpdateAdminStatusData = z.infer<typeof UpdateAdminStatusSchema>;
export type UpdateAdminProfileData = z.infer<typeof UpdateAdminProfileSchema>;
