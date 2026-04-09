import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/src/server/profiles/admin/admin.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import { UpdateAdminProfileSchema } from '@/src/server/profiles/admin/admin.validators';

// GET /api/admin/profile - Get current admin's profile
export const GET = withPermission({ 
  module: 'SETTINGS', 
  action: 'VIEW' 
})(async (req: NextRequest, { user }: any) => {
  try {
    console.log('Profile endpoint called for user:', {
      userId: user.id,
      userRole: user.role.name,
      userSchoolId: user.schoolId
    });
    
    const result = await AdminService.getAdminById(user.id);
    console.log('Profile service result:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get admin profile error:', error);
    const errorResponse = handleError(error);
    console.error('Error response:', errorResponse);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// PUT /api/admin/profile - Update current admin's profile
export const PUT = withPermission({ 
  module: 'SETTINGS', 
  action: 'UPDATE' 
})(async (req: NextRequest, { user }: any) => {
  try {
    const body = await req.json();
    const validatedData = UpdateAdminProfileSchema.parse(body);
    
    const result = await AdminService.updateAdmin(user.id, validatedData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update admin profile error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
