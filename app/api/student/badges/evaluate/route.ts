import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/src/utils/session-helper';
import { handleError } from '@/src/utils/errors';
import { BadgeService } from '@/src/server/services/badge.service';

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission(req, 'badges.view');

    // Get user's current badges before evaluation
    const currentBadges = await BadgeService.getUserBadges(session.userId);
    const currentEarnedBadgeIds = new Set(
      currentBadges
        .filter(b => b.earned)
        .map(b => b.badgeId)
    );

    // Evaluate and award new badges
    await BadgeService.evaluateUserBadges(session.userId);

    // Get updated badges after evaluation
    const updatedBadges = await BadgeService.getUserBadges(session.userId);
    const newBadges = updatedBadges.filter(b => 
      b.earned && !currentEarnedBadgeIds.has(b.badgeId)
    );

    // Format new badges for the modal
    const formattedNewBadges = newBadges.map(badge => ({
      name: badge.badge.name,
      description: badge.badge.description,
      icon: badge.badge.icon,
      level: Math.floor(badge.progress / 25) + 1, // Simple level calculation
    }));

    return NextResponse.json({
      success: true,
      message: 'Badge evaluation completed',
      data: {
        newBadges: formattedNewBadges,
        totalBadges: updatedBadges.filter(b => b.earned).length,
      },
    });
  } catch (err) {
    const errorResponse = handleError(err);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
}
