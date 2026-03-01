import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { handleError } from '@/src/utils/errors';
import { StreakService } from '@/src/server/services/streak.service';
import { BadgeService } from '@/src/server/services/badge.service';
import { revalidatePath } from 'next/cache';

// Create Prisma client inline to avoid import issues
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// POST /api/articles/[id]/complete - Mark article as completed (only once per student)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get student ID from request body or session
    const body = await req.json();
    const studentId = body.studentId;

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    // Find the article first
    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }

    // Verify student exists first
    const student = await prisma.user.findUnique({
      where: { studentId: studentId }
    });

    if (!student) {
      console.error(`Student with studentId ${studentId} not found`);
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if student has already completed this article
    const existingCompletion = await prisma.articleCompletion.findUnique({
      where: {
        articleId_studentId: {
          articleId: id,
          studentId: student.id // Use the actual user ID, not studentId field
        }
      }
    });

    if (existingCompletion) {
      console.log(`Student ${studentId} already completed article ${id}`);
      return NextResponse.json({
        success: true,
        message: 'Article already completed by this student',
        data: {
          alreadyCompleted: true,
          views: article.views
        }
      });
    }

    console.log(`Found student: ${student.id} (${student.firstName} ${student.lastName})`);
    await prisma.$transaction([
      prisma.articleCompletion.create({
        data: {
          articleId: id,
          studentId: student.id // Use the actual user ID, not studentId field
        }
      }),
      prisma.article.update({
        where: { id },
        data: {
          views: {
            increment: 1
          }
        }
      })
    ]);

    // Update user's streak for article completion activity
    try {
      await StreakService.updateStreak(student.id);
    } catch (streakError) {
      console.error('Failed to update streak after article completion:', streakError);
    }

    // Evaluate badges for article completion activity
    try {
      await BadgeService.evaluateUserBadges(student.id);
    } catch (badgeError) {
      console.error('Failed to evaluate badges after article completion:', badgeError);
    }

    // Revalidate stats cache to update frontend immediately
    revalidatePath('/api/student/stats');

    // Get updated article with new view count
    const updatedArticle = await prisma.article.findUnique({
      where: { id },
      select: { views: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Article marked as completed',
      data: {
        alreadyCompleted: false,
        views: updatedArticle?.views
      }
    });
  } catch (error) {
    console.error('Complete article error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
}
