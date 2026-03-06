import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { studentId } = await request.json();

    console.log('💾 Save API called:', { id, studentId });

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

    // Check if article is already saved
    const existingSave = await prisma.savedArticle.findFirst({
      where: {
        articleId: id,
        studentId: processedStudentId
      }
    });

    console.log('🔍 Existing save check result:', { 
      existingSave: !!existingSave, 
      articleId: id, 
      studentId: processedStudentId,
      existingSaveId: existingSave?.id 
    });

    if (existingSave) {
      console.log('⚠️ Article already saved, returning 409');
      return NextResponse.json(
        { success: false, message: 'Article already saved' },
        { status: 409 }
      );
    }

    // Create new saved article
    console.log('💾 Creating new saved article...');
    const newSave = await prisma.savedArticle.create({
      data: {
        articleId: id,
        studentId: processedStudentId
      }
    });

    console.log('✅ Article saved to database:', { 
      saveId: newSave.id, 
      articleId: id, 
      studentId: processedStudentId 
    });

    return NextResponse.json({
      success: true,
      message: 'Article saved successfully'
    });

  } catch (error) {
    console.error('Error saving article:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save article' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { studentId } = await request.json();

    console.log('🗑️ Delete save API called:', { id, studentId });

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

    // Find and delete the saved article
    const existingSave = await prisma.savedArticle.findFirst({
      where: {
        articleId: id,
        studentId: processedStudentId
      }
    });

    console.log('🔍 Existing save for delete:', { existingSave: !!existingSave });

    if (existingSave) {
      await prisma.savedArticle.delete({
        where: { id: existingSave.id }
      });

      console.log('✅ Article unsaved:', { saveId: existingSave.id, articleId: id, studentId: processedStudentId });

      return NextResponse.json({
        success: true,
        message: 'Article unsaved successfully'
      });
    } else {
      console.log('❌ No saved article found to delete');
      return NextResponse.json(
        { success: false, message: 'No saved article found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error unsaving article:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to unsave article' },
      { status: 500 }
    );
  }
}
