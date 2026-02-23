import prisma from '../../prisma';
import { BadgeType } from '../../generated/prisma';

export class BadgeService {
  /**
   * Evaluates and awards badges for a user based on their activity
   */
  static async evaluateUserBadges(userId: string) {
    try {
      // Get all active badges
      const activeBadges = await prisma.badge.findMany({
        where: { isActive: true },
      });

      // Get user's current badges
      const userBadges = await prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      });
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

      // Get user's current stats for evaluation
      const userStats = await this.getUserStats(userId);

      // Evaluate each badge type
      for (const badge of activeBadges) {
        if (earnedBadgeIds.has(badge.id)) {
          continue; // Already earned
        }

        const hasEarned = await this.evaluateBadgeCondition(badge, userStats);
        
        if (hasEarned) {
          await this.awardBadge(userId, badge.id);
        }
      }
    } catch (error) {
      console.error('Error evaluating badges:', error);
    }
  }

  /**
   * Gets user's statistics for badge evaluation
   */
  private static async getUserStats(userId: string) {
    const [
      streak,
      writingJournalCount,
      audioJournalCount,
      artJournalCount,
      allResourceAccess,
      moodCheckinCount,
    ] = await Promise.all([
      // Current streak
      prisma.streak.findUnique({
        where: { userId },
        select: { count: true },
      }),
      // Journal counts
      prisma.writingJournal.count({ where: { userId } }),
      prisma.audioJournal.count({ where: { userId } }),
      prisma.artJournal.count({ where: { userId } }),
      // All resource access (we'll filter by type)
      prisma.resourceAccess.findMany({
        where: { userId },
        select: { resource: true },
      }),
      // Mood check-ins
      prisma.moodCheckin.count({ where: { userId } }),
    ]);

    // Count by resource type
    const articleReadCount = allResourceAccess.filter(ra => ra.resource === 'ARTICLE').length;
    const meditationCount = allResourceAccess.filter(ra => ra.resource === 'MEDITATION').length;
    const musicCount = allResourceAccess.filter(ra => ra.resource === 'MUSIC').length;

    const totalJournalCount = writingJournalCount + audioJournalCount + artJournalCount;

    return {
      streakCount: streak?.count || 0,
      journalCount: totalJournalCount,
      articleReadCount,
      meditationCount,
      musicCount,
      moodCheckinCount,
    };
  }

  /**
   * Evaluates if a user meets the conditions for a specific badge
   */
  private static async evaluateBadgeCondition(badge: any, userStats: any): Promise<boolean> {
    const { type, conditionValue } = badge;

    switch (type) {
      case BadgeType.STREAK:
        return userStats.streakCount >= (conditionValue || 0);

      case BadgeType.JOURNAL_COUNT:
        return userStats.journalCount >= (conditionValue || 0);

      case BadgeType.ARTICLE_READ:
        return userStats.articleReadCount >= (conditionValue || 0);

      case BadgeType.MEDITATION_COUNT:
        return userStats.meditationCount >= (conditionValue || 0);

      case BadgeType.MUSIC_COUNT:
        return userStats.musicCount >= (conditionValue || 0);

      case BadgeType.MOOD_CHECKIN:
        return userStats.moodCheckinCount >= (conditionValue || 0);

      default:
        return false;
    }
  }

  /**
   * Awards a badge to a user
   */
  private static async awardBadge(userId: string, badgeId: string) {
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
      },
    });

    console.log(`Badge ${badgeId} awarded to user ${userId}`);
  }

  /**
   * Gets user's earned badges with progress tracking
   */
  static async getUserBadges(userId: string) {
    const earnedBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: {
        earnedAt: 'desc',
      },
    });

    const activeBadges = await prisma.badge.findMany({
      where: { isActive: true },
    });

    const userStats = await this.getUserStats(userId);

    // Calculate progress for unearned badges
    const badgesWithProgress = earnedBadges.map(ub => ({
      id: ub.id,
      badgeId: ub.badgeId,
      earnedAt: ub.earnedAt,
      progress: 100, // Already earned
      earned: true,
      badge: ub.badge,
    }));

    for (const badge of activeBadges) {
      const alreadyEarned = earnedBadges.some(ub => ub.badgeId === badge.id);
      if (alreadyEarned) continue;

      const progress = this.calculateProgress(badge, userStats);
      badgesWithProgress.push({
        id: badge.id,
        badgeId: badge.id,
        earnedAt: new Date(),
        progress,
        earned: false,
        badge: badge,
      });
    }

    return badgesWithProgress;
  }

  /**
   * Calculates progress percentage for a badge
   */
  private static calculateProgress(badge: any, userStats: any): number {
    const { type, conditionValue } = badge;
    const currentValue = this.getCurrentValue(type, userStats);

    if (!conditionValue || conditionValue === 0) return 0;

    return Math.min(100, Math.round((currentValue / conditionValue) * 100));
  }

  /**
   * Gets current value for a badge type
   */
  private static getCurrentValue(type: BadgeType, userStats: any): number {
    switch (type) {
      case BadgeType.STREAK:
        return userStats.streakCount;
      case BadgeType.JOURNAL_COUNT:
        return userStats.journalCount;
      case BadgeType.ARTICLE_READ:
        return userStats.articleReadCount;
      case BadgeType.MEDITATION_COUNT:
        return userStats.meditationCount;
      case BadgeType.MUSIC_COUNT:
        return userStats.musicCount;
      case BadgeType.MOOD_CHECKIN:
        return userStats.moodCheckinCount;
      default:
        return 0;
    }
  }
}
