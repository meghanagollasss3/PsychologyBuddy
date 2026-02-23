import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/src/server/profiles/admin/admin.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { permissions } = await request.json();
    
    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: { message: 'Permissions must be an array' } },
        { status: 400 }
      );
    }

    // Check if the method exists
    if (typeof AdminService.updateAdminPermissions !== 'function') {
      console.error('updateAdminPermissions method not found on AdminService');
      return NextResponse.json(
        { error: { message: 'Service method not available' } },
        { status: 500 }
      );
    }

    const result = await AdminService.updateAdminPermissions(id, permissions);

    console.log('Permissions API - result:', result);
    console.log('Permissions API - saved permissions:', permissions);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating admin permissions:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
