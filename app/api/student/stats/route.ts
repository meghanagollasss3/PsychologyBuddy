import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/src/utils/session-helper';
import { handleError } from '@/src/utils/errors';
import { BadgeService } from '@/src/server/services/badge.service';
import prisma from '@/src/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, 'badges.view');

    // Get all stats in parallel for better performance
    const [
      streak,
      writingJournalCount,
      audioJournalCount,
      artJournalCount,
      articleCompletions,
      meditationSaves,
      musicSaves,
      moodCheckinCount,
      userBadges,
    ] = await Promise.all([
      // Current streak
      prisma.streak.findUnique({
        where: { userId: session.userId },
      }),
      // Journal counts
      prisma.writingJournal.count({ where: { userId: session.userId } }),
      prisma.audioJournal.count({ where: { userId: session.userId } }),
      prisma.artJournal.count({ where: { userId: session.userId } }),
      // Article completions
      prisma.articleCompletion.count({ where: { studentId: session.userId } }),
      // Meditation saves
      prisma.meditationSave.count({ where: { studentId: session.userId } }),
      // Music saves
      prisma.musicSave.count({ where: { studentId: session.userId } }),
      // Mood check-ins
      prisma.moodCheckin.count({ where: { userId: session.userId } }),
      // User badges
      prisma.userBadge.count({
        where: { userId: session.userId },
      }),
    ]);

    const totalJournalCount = writingJournalCount + audioJournalCount + artJournalCount;
    const totalResourcesUsed = articleCompletions + meditationSaves + musicSaves;

    return NextResponse.json({
      success: true,
      message: 'User stats retrieved successfully',
      data: {
        currentStreak: streak?.count || 0,
        totalCheckins: moodCheckinCount,
        resourcesUsed: totalResourcesUsed,
        badgesEarned: userBadges,
        // Additional detailed stats for future use
        detailedStats: {
          journals: {
            writing: writingJournalCount,
            audio: audioJournalCount,
            art: artJournalCount,
            total: totalJournalCount,
          },
          resources: {
            articles: articleCompletions,
            meditation: meditationSaves,
            music: musicSaves,
            total: totalResourcesUsed,
          },
          moodCheckins: moodCheckinCount,
          streak: streak?.count || 0,
          badges: userBadges,
        },
      },
    });
  } catch (err) {
    const errorResponse = handleError(err);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
}
