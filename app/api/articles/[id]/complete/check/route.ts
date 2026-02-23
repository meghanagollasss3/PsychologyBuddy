import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { handleError } from '@/src/utils/errors';

// Create Prisma client inline to avoid import issues
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// GET /api/articles/[id]/complete/check - Check if student has completed article
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Find the student first to get the actual user ID
    const student = await prisma.user.findUnique({
      where: { studentId: studentId }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if student has already completed this article using the actual user ID
    const completion = await prisma.articleCompletion.findUnique({
      where: {
        articleId_studentId: {
          articleId: id,
          studentId: student.id // Use the actual user ID, not studentId field
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        isCompleted: !!completion
      }
    });
  } catch (error) {
    console.error('Check completion error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
}
