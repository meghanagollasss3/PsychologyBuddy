import { z } from 'zod';

// Student creation validator
export const CreateStudentSchema = z.object({
  studentId: z.string().min(3, 'Student ID must be at least 3 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  email: z.string().email('Valid email required').optional(),
  classId: z.string().min(1, 'Class ID is required'),
  schoolId: z.string().min(1, 'School selection is required'),
  phone: z.string().optional(),
});

// Student update validator (Admin only)
export const UpdateStudentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  email: z.string().email('Valid email required').optional(),
  phone: z.string().optional(),
  classId: z.string().optional(),
  schoolId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  dateOfBirth: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
});

// Student self-update validator (Student only - limited fields)
export const StudentSelfUpdateSchema = z.object({
  profileImage: z.string().url().optional(),
});

// Student password reset validator
export const ResetStudentPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
});

// Student status update validator
export const UpdateStudentStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});

export type CreateStudentData = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentData = z.infer<typeof UpdateStudentSchema>;
export type StudentSelfUpdateData = z.infer<typeof StudentSelfUpdateSchema>;
export type ResetStudentPasswordData = z.infer<typeof ResetStudentPasswordSchema>;
export type UpdateStudentStatusData = z.infer<typeof UpdateStudentStatusSchema>;
