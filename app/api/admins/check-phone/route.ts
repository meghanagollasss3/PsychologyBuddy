  import { NextRequest } from 'next/server';
import prisma from '@/src/prisma';

// GET /api/admins/check-phone?phone={phone} - Check if admin phone number exists
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return Response.json(
        { error: { message: 'Phone number is required', code: 400 } },
        { status: 400 }
      );
    }

    // Check if admin with this phone number already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        phone: phone.trim(),
        role: {
          name: {
            in: ['ADMIN', 'SCHOOL_SUPERADMIN', 'SUPERADMIN']
          }
        }
      },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true
      }
    });
    
    return Response.json({
      exists: !!existingAdmin,
      phone: phone.trim()
    });
  } catch (error) {
    console.error('Check admin phone error:', error);
    return Response.json(
      { error: { message: 'Failed to check phone number', code: 500 } },
      { status: 500 }
    );
  }
};
