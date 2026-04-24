import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from './admin.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import { CreateAdminSchema, UpdateAdminSchema, ResetAdminPasswordSchema, UpdateAdminStatusSchema } from './admin.validators';

export class AdminController {
  // POST /api/admins - Create admin (SuperAdmin and SchoolSuperAdmin only)
  static createAdmin = withPermission({ 
    module: 'USER_MANAGEMENT', 
    action: 'CREATE' 
  })(async (req: NextRequest, { user }: any) => {
    try {
      const body = await req.json();
      const validatedData = CreateAdminSchema.parse(body);
      
      const result = await AdminService.createAdmin(validatedData, user.id);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Create admin error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // GET /api/admins - Get all admins (SuperAdmin and SchoolSuperAdmin only)
  static getAdmins = withPermission({ 
    module: 'USER_MANAGEMENT', 
    action: 'VIEW' 
  })(async (req: NextRequest, ctx: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const schoolId = searchParams.get('schoolId') || undefined;
      const locationId = searchParams.get('locationId') || undefined;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      
      // For SCHOOL_SUPERADMIN, only show admins from their school (same as SUPERADMIN features)
      // For SUPERADMIN, use the schoolId parameter (if provided)
      const effectiveSchoolId = ctx.user.role.name === 'SCHOOL_SUPERADMIN' ? ctx.userSchoolId : (schoolId ?? undefined);
      
      const result = await AdminService.getAllAdmins(effectiveSchoolId, ctx.userSchoolId, locationId, page, limit);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Get admins error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // GET /api/admins/:id - Get admin by ID (SuperAdmin and SchoolSuperAdmin only)
  static getAdminById = withPermission({ 
    module: 'USER_MANAGEMENT', 
    action: 'VIEW' 
  })(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const result = await AdminService.getAdminById(id);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Get admin error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // PUT /api/admins/:id - Update admin (SuperAdmin and SchoolSuperAdmin only)
  static updateAdmin = withPermission({ 
    module: 'USER_MANAGEMENT', 
    action: 'UPDATE' 
  })(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validatedData = UpdateAdminSchema.parse(body);
      
      const result = await AdminService.updateAdmin(id, validatedData);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Update admin error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // POST /api/admins/:id/reset-password - Reset admin password (SuperAdmin and SchoolSuperAdmin only)
  static resetAdminPassword = withPermission({ 
    module: 'USER_MANAGEMENT', 
    action: 'UPDATE' 
  })(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validatedData = ResetAdminPasswordSchema.parse(body);
      
      const result = await AdminService.resetAdminPassword(id, validatedData);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Reset admin password error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // PATCH /api/admins/:id/status - Update admin status (SuperAdmin and SchoolSuperAdmin only)
  static updateAdminStatus = withPermission({ 
    module: 'USER_MANAGEMENT', 
    action: 'UPDATE' 
  })(async (req: NextRequest, { params, user }: { params: Promise<{ id: string }>, user: any }) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validatedData = UpdateAdminStatusSchema.parse(body);
      
      const result = await AdminService.updateAdminStatus(id, validatedData, user);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Update admin status error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // DELETE /api/admins/:id - Delete admin (SuperAdmin and SchoolSuperAdmin only)
  static deleteAdmin = withPermission({ 
    module: 'USER_MANAGEMENT', 
    action: 'DELETE' 
  })(async (req: NextRequest, { params, user }: { params: Promise<{ id: string }>, user: any }) => {
    try {
      const { id } = await params;
      const result = await AdminService.deleteAdmin(id, user);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Delete admin error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });
}
