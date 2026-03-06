import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const alert = await prisma.escalationAlert.findUnique({
      where: { id },
      include: {
        adminNotifications: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: { message: 'Alert not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Get escalation alert error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch alert' } },
      { status: 500 }
    );
  }
}
