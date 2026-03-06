import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/src/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { id } = await params;
    // Get session from cookie or header
    const sessionId = request.cookies.get('sessionId')?.value || 
                      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get current user to verify authentication
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        'Cookie': `sessionId=${sessionId}`
      }
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    if (!authData.success || !authData.data?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const studentId = id;
    
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: { message: 'Student ID is required' } },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' } },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { message: 'File too large. Maximum size is 5MB' } },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Update student profile with new image
    // First check if student profile exists, if not create it
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
    });

    let updatedProfile;
    if (existingProfile) {
      // Update existing profile
      updatedProfile = await prisma.studentProfile.update({
        where: { userId: studentId },
        data: {
          profileImage: dataUrl,
        },
        select: {
          id: true,
          profileImage: true,
        },
      });
    } else {
      // Create new profile
      updatedProfile = await prisma.studentProfile.create({
        data: {
          userId: studentId,
          profileImage: dataUrl,
        },
        select: {
          id: true,
          profileImage: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        profileImage: updatedProfile.profileImage,
      },
    });

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to upload profile photo' } },
      { status: 500 }
    );
  }
}
