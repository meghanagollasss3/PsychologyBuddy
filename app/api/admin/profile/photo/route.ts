import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

// POST /api/admin/profile/photo - Upload profile photo
export const POST = withPermission({ 
  module: 'SETTINGS', 
  action: 'UPDATE' 
})(async (req: NextRequest, { user }: any) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: { message: 'No file provided', code: 400 } },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: { message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed', code: 400 } },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: { message: 'File too large. Maximum size is 5MB', code: 400 } },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // For now, store as base64. In production, you'd want to use a cloud storage service
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Log data URL length for debugging
    console.log('Data URL length:', dataUrl.length);

    // Update admin profile with new photo
    const updatedProfile = await prisma.adminProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        profileImageUrl: dataUrl,
      },
      update: {
        profileImageUrl: dataUrl,
      },
      include: {
        adminPermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    // Get the full user data with the same structure as the profile API
    const fullUserData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastActive: true,
        emailVerified: true,
        roleId: true,
        schoolId: true,
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

    return NextResponse.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: fullUserData
    });

  } catch (error) {
    console.error('Upload profile photo error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// DELETE /api/admin/profile/photo - Remove profile photo
export const DELETE = withPermission({ 
  module: 'SETTINGS', 
  action: 'UPDATE' 
})(async (req: NextRequest, { user }: any) => {
  try {
    // Check if admin profile exists before trying to update
    const existingProfile = await prisma.adminProfile.findUnique({
      where: { userId: user.id }
    });

    if (!existingProfile) {
      return NextResponse.json({
        success: false,
        error: { message: 'No profile photo to remove', code: 404 }
      }, { status: 404 });
    }

    const updatedProfile = await prisma.adminProfile.update({
      where: { userId: user.id },
      data: { profileImageUrl: null },
      include: {
        adminPermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    // Get the full user data with the same structure as the profile API
    const fullUserData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastActive: true,
        emailVerified: true,
        roleId: true,
        schoolId: true,
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

    return NextResponse.json({
      success: true,
      message: 'Profile photo removed successfully',
      data: fullUserData
    });

  } catch (error) {
    console.error('Remove profile photo error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
