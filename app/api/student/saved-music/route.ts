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

    // Use raw SQL to get saved music since Prisma model is not generating properly
    const savedMusic = await prisma.$queryRaw<Array<any>>`
      SELECT ms.*, mr.* 
      FROM "MusicSaves" ms
      JOIN "MusicResources" mr ON ms."musicId" = mr.id
      WHERE ms."studentId" = ${userId}
      ORDER BY ms."createdAt" DESC
    `;

    // If no saved music, return empty array
    if (!savedMusic || savedMusic.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Transform the data to match expected format
    const music = (savedMusic as any[]).map((item: any) => {
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        url: item.url,
        audioUrl: item.audioUrl,
        videoUrl: item.videoUrl,
        duration: item.duration,
        artist: item.artist,
        album: item.album,
        coverImage: item.coverImage,
        thumbnailUrl: item.thumbnailUrl,
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
      data: music
    });

  } catch (error) {
    console.error('Error fetching saved music:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch saved music' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission(request, 'badges.view');
    const body = await request.json();
    const { musicId } = body;

    // Use session userId instead of body studentId
    const userId = session.userId;

    if (!musicId) {
      return NextResponse.json(
        { success: false, message: 'Music ID required' },
        { status: 400 }
      );
    }

    // Check if already saved using raw SQL
    const existingSave = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM "MusicSaves" 
      WHERE "musicId" = ${musicId} 
      AND "studentId" = ${userId}
      LIMIT 1
    `;

    if (existingSave && existingSave.length > 0) {
      // If already saved, unsave it
      await prisma.$executeRaw`
        DELETE FROM "MusicSaves" 
        WHERE "musicId" = ${musicId} 
        AND "studentId" = ${userId}
      `;

      return NextResponse.json({
        success: true,
        message: 'Music removed from saved items',
        isSaved: false
      });
    } else {
      // Save the music
      await prisma.$executeRaw`
        INSERT INTO "MusicSaves" ("id", "musicId", "studentId", "createdAt")
        VALUES (gen_random_uuid(), ${musicId}, ${userId}, NOW())
      `;

      // Update user's streak for music activity
      try {
        await StreakService.updateStreak(userId);
      } catch (streakError) {
        console.error('Failed to update streak after music save:', streakError);
      }

      // Evaluate badges for music activity
      try {
        await BadgeService.evaluateUserBadges(userId);
      } catch (badgeError) {
        console.error('Failed to evaluate badges after music save:', badgeError);
      }

      // Revalidate stats cache to update frontend immediately
      revalidatePath('/api/student/stats');

      return NextResponse.json({
        success: true,
        message: 'Music added to saved items',
        isSaved: true
      });
    }

  } catch (error) {
    console.error('Error saving music:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save music' },
      { status: 500 }
    );
  }
}
