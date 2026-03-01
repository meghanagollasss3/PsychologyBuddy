import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/prisma';
import { StreakService } from '@/src/server/services/streak.service';
import { BadgeService } from '@/src/server/services/badge.service';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/src/utils/session-helper';

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'badges.view');
    const userId = session.userId;

    // Use raw SQL to get saved meditations since Prisma model is not generating properly
    const savedMeditations = await prisma.$queryRaw<Array<any>>`
      SELECT ms.*, m.* 
      FROM "MeditationSaves" ms
      JOIN "Meditation" m ON ms."meditationId" = m.id
      WHERE ms."studentId" = ${userId}
      ORDER BY ms."createdAt" DESC
    `;

    // If no saved meditations, return empty array
    if (!savedMeditations || savedMeditations.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Transform the data to match expected format (simplified version)
    const meditations = (savedMeditations as any[]).map((item: any) => {
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnailUrl: item.thumbnailUrl,
        audioUrl: item.audioUrl,
        videoUrl: item.videoUrl,
        durationSec: item.durationSec,
        instructor: item.instructor,
        type: item.type,
        status: item.status,
        schoolId: item.schoolId,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        savedAt: item.createdAt,
        isSaved: true,
        categories: [],
        goals: [],
        moods: []
      };
    });

    return NextResponse.json({
      success: true,
      data: meditations
    });

  } catch (error) {
    console.error('Error fetching saved meditations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch saved meditations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'badges.view');
    const body = await request.json();
    const { meditationId } = body;

    // Use session userId instead of body studentId
    const userId = session.userId;

    if (!meditationId) {
      return NextResponse.json(
        { success: false, message: 'Meditation ID required' },
        { status: 400 }
      );
    }

    // Check if meditation exists
    const meditation = await prisma.meditation.findUnique({
      where: { id: meditationId }
    });

    if (!meditation) {
      return NextResponse.json(
        { success: false, message: 'Meditation not found' },
        { status: 404 }
      );
    }

    // Check if already saved using raw SQL
    const existingSave = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM "MeditationSaves" 
      WHERE "meditationId" = ${meditationId} 
      AND "studentId" = ${userId}
      LIMIT 1
    `;

    if (existingSave && existingSave.length > 0) {
      // If already saved, unsave it
      await prisma.$executeRaw`
        DELETE FROM "MeditationSaves" 
        WHERE "meditationId" = ${meditationId} 
        AND "studentId" = ${userId}
      `;

      return NextResponse.json({
        success: true,
        message: 'Meditation removed from saved items',
        isSaved: false
      });
    } else {
      // Save the meditation
      await prisma.$executeRaw`
        INSERT INTO "MeditationSaves" ("id", "meditationId", "studentId", "createdAt")
        VALUES (gen_random_uuid(), ${meditationId}, ${userId}, NOW())
      `;

      // Update user's streak for meditation activity
      try {
        await StreakService.updateStreak(userId);
      } catch (streakError) {
        console.error('Failed to update streak after meditation save:', streakError);
      }

      // Evaluate badges for meditation activity
      try {
        await BadgeService.evaluateUserBadges(userId);
      } catch (badgeError) {
        console.error('Failed to evaluate badges after meditation save:', badgeError);
      }

      // Revalidate stats cache to update frontend immediately
      revalidatePath('/api/student/stats');

      return NextResponse.json({
        success: true,
        message: 'Meditation added to saved items',
        isSaved: true
      });
    }

  } catch (error) {
    console.error('Error saving meditation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save meditation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meditationId = searchParams.get('meditationId');
    const studentId = searchParams.get('studentId');

    if (!meditationId) {
      return NextResponse.json(
        { success: false, message: 'Meditation ID required' },
        { status: 400 }
      );
    }

    // Delete the saved meditation using raw SQL
    const result = await prisma.$executeRaw`
      DELETE FROM "MeditationSaves" 
      WHERE "meditationId" = ${meditationId} 
      AND ("studentId" = ${studentId} OR "studentId" IS NULL)
    `;

    if (result === 0) {
      return NextResponse.json(
        { success: false, message: 'Saved meditation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meditation removed from saved items'
    });

  } catch (error) {
    console.error('Error removing saved meditation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove saved meditation' },
      { status: 500 }
    );
  }
}
