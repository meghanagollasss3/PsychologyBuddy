import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    console.log('🔍 Save check API called:', { id, studentId });

    // Process studentId - convert 'anonymous', empty string, and invalid UUIDs to null
    let processedStudentId = (studentId && studentId !== 'anonymous' && studentId !== '') ? studentId : null;

    // Validate that processedStudentId is either null or a valid UUID
    if (processedStudentId !== null) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(processedStudentId)) {
        // If it's not a valid UUID, set it to null
        processedStudentId = null;
      }
    }

    // Check if article is saved
    const savedArticle = await prisma.savedArticle.findFirst({
      where: {
        articleId: id,
        studentId: processedStudentId
      }
    });

    console.log('📊 Save check database result:', { 
      savedArticle: !!savedArticle, 
      articleId: id, 
      studentId: processedStudentId,
      foundSaveId: savedArticle?.id 
    });

    return NextResponse.json({
      success: true,
      isSaved: !!savedArticle
    });

  } catch (error) {
    console.error('Error checking saved status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check saved status' },
      { status: 500 }
    );
  }
}
