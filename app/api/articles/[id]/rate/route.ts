import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { rating, studentId } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Invalid rating' },
        { status: 400 }
      );
    }

    // Get current article
    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }

    // Process studentId - convert 'anonymous' and invalid UUIDs to null
    let processedStudentId = (studentId && studentId !== 'anonymous') ? studentId : null;

    // Validate that processedStudentId is either null or a valid UUID
    if (processedStudentId !== null) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(processedStudentId)) {
        // If it's not a valid UUID, set it to null
        processedStudentId = null;
      }
    }

    // Check if user already rated this article
    const existingRating = await prisma.rating.findFirst({
      where: {
        articleId: id,
        studentId: processedStudentId
      }
    });

    if (existingRating) {
      // Update existing rating
      await prisma.rating.update({
        where: { id: existingRating.id },
        data: { score: rating }
      });
    } else {
      // Create new rating
      await prisma.rating.create({
        data: {
          articleId: id,
          score: rating,
          studentId: processedStudentId
        }
      });
    }

    // Calculate new average rating
    const allRatings = await prisma.rating.findMany({
      where: { articleId: id }
    });

    const averageRating = allRatings.reduce((sum: number, r: any) => sum + r.score, 0) / allRatings.length;

    // Update article with new average rating
    await prisma.article.update({
      where: { id },
      data: {
        averageRating: averageRating,
        ratingCount: allRatings.length
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Rating saved successfully',
      userRating: rating,
      averageRating,
      totalRatings: allRatings.length
    });

  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save rating' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { studentId } = await request.json();

    // Get current article
    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }

    // Process studentId - convert 'anonymous' and invalid UUIDs to null
    let processedStudentId = (studentId && studentId !== 'anonymous') ? studentId : null;

    // Validate that processedStudentId is either null or a valid UUID
    if (processedStudentId !== null) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(processedStudentId)) {
        // If it's not a valid UUID, set it to null
        processedStudentId = null;
      }
    }

    // Find and delete the user's rating
    const existingRating = await prisma.rating.findFirst({
      where: {
        articleId: id,
        studentId: processedStudentId
      }
    });

    if (existingRating) {
      // Delete the rating
      await prisma.rating.delete({
        where: { id: existingRating.id }
      });

      // Recalculate average rating
      const remainingRatings = await prisma.rating.findMany({
        where: { articleId: id }
      });

      const newAverageRating = remainingRatings.length > 0 
        ? remainingRatings.reduce((sum: number, r: any) => sum + r.score, 0) / remainingRatings.length
        : null;

      // Update article with new average rating
      await prisma.article.update({
        where: { id },
        data: {
          averageRating: newAverageRating,
          ratingCount: remainingRatings.length
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Rating removed successfully',
        averageRating: newAverageRating,
        totalRatings: remainingRatings.length
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'No rating found to remove' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error removing rating:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove rating' },
      { status: 500 }
    );
  }
}
