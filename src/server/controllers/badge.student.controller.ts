import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/src/utils/session-helper';
import { handleError } from '@/src/utils/errors';
import { BadgeService } from '../services/badge.service';
import { z } from 'zod';
import prisma from '@/src/prisma';

export class BadgeStudentController {
  async getUserBadges(req: NextRequest) {
    try {
      const session = await requirePermission(req, 'badges.view');

      const { searchParams } = new URL(req.url);
      const parsed = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      }).parse({
        page: searchParams.get('page') || 1,
        limit: searchParams.get('limit') || 20,
      });

      const badges = await BadgeService.getUserBadges(session.userId);

      // Simple pagination for earned badges
      const earnedBadges = badges.filter(b => b.progress === 100).map(badge => ({
        id: badge.badge.id,
        icon: badge.badge.icon,
        iconBg: "bg-amber-50",
        name: badge.badge.name,
        description: badge.badge.description,
        date: new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }));

      const inProgressBadges = badges.filter(b => b.progress < 100).map(badge => ({
        id: badge.badge.id,
        icon: badge.badge.icon,
        iconBg: "bg-rose-50",
        name: badge.badge.name,
        description: badge.badge.description,
        progress: badge.progress,
        color: "bg-blue-400",
      }));

      // Get current streak
      const streak = await prisma.streak.findUnique({
        where: { userId: session.userId },
      });

      return NextResponse.json({
        success: true,
        message: 'User badges retrieved successfully',
        data: {
          earnedBadges,
          inProgressBadges,
          currentStreak: streak?.count || 0,
        },
      });
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }

  async getUserStreak(req: NextRequest) {
    try {
      const session = await requirePermission(req, 'badges.view');

      const streak = await prisma.streak.findUnique({
        where: { userId: session.userId },
      });

      return NextResponse.json({
        success: true,
        message: 'User streak retrieved successfully',
        data: streak || {
          count: 0,
          lastActive: new Date(),
        },
      });
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }
}
