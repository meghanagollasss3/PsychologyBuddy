import { NextRequest } from 'next/server';
import prisma from '@/src/prisma';

// GET /api/admins/check-email - Check if email already exists
// Query params: email (required), excludeId (optional)
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const excludeId = searchParams.get('excludeId');

    if (!email) {
      return Response.json(
        { error: { message: 'Email is required', code: 400 } },
        { status: 400 }
      );
    }

    // Check if admin with this email exists (excluding current admin if excludeId provided)
    const whereClause: any = {
      email: email.toLowerCase().trim(),
    };

    if (excludeId) {
      whereClause.id = {
        not: excludeId
      };
    }

    const existingAdmin = await prisma.user.findFirst({
      where: {
        ...whereClause,
        role: {
          name: {
            in: ['ADMIN', 'SCHOOL_SUPERADMIN', 'SUPERADMIN']
          }
        }
      }
    });

    return Response.json({
      exists: !!existingAdmin,
      admin: existingAdmin ? {
        id: existingAdmin.id,
        email: existingAdmin.email,
        firstName: existingAdmin.firstName,
        lastName: existingAdmin.lastName
      } : null
    });
  } catch (error) {
    console.error('Check email error:', error);
    return Response.json(
      { error: { message: 'Internal server error', code: 500 } },
      { status: 500 }
    );
  }
};
