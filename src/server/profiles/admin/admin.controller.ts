import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from './admin.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import { CreateAdminSchema, UpdateAdminSchema, ResetAdminPasswordSchema, UpdateAdminStatusSchema } from './admin.validators';

export class AdminController {
  // POST /api/admins - Create admin (SuperAdmin only)
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

  // GET /api/admins - Get all admins (SuperAdmin only)
  static getAdmins = withPermission({ 
    module: 'USER_MANAGEMENT', 
    action: 'VIEW' 
  })(async (req: NextRequest) => {
    try {
      const result = await AdminService.getAllAdmins();
      return NextResponse.json(result);
    } catch (error) {
      console.error('Get admins error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // GET /api/admins/:id - Get admin by ID (SuperAdmin only)
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

  // PUT /api/admins/:id - Update admin (SuperAdmin only)
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

  // POST /api/admins/:id/reset-password - Reset admin password (SuperAdmin only)
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

  // PATCH /api/admins/:id/status - Update admin status (SuperAdmin only)
  static updateAdminStatus = withPermission({ 
    module: 'USER_MANAGEMENT', 
    action: 'UPDATE' 
  })(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validatedData = UpdateAdminStatusSchema.parse(body);
      
      const result = await AdminService.updateAdminStatus(id, validatedData);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Update admin status error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // DELETE /api/admins/:id - Delete admin (SuperAdmin only)
  static deleteAdmin = withPermission({ 
    module: 'USER_MANAGEMENT', 
    action: 'DELETE' 
  })(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const result = await AdminService.deleteAdmin(id);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Delete admin error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });
}
