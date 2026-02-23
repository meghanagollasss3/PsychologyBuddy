import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/src/utils/session-helper';
import { handleError } from '@/src/utils/errors';
import { BadgeService } from '../services/badge.service';
import { z } from 'zod';
import prisma from '@/src/prisma';

export class BadgeAdminController {
  async createBadge(req: NextRequest) {
    try {
      const session = await requirePermission(req, 'badges.assign');

      const body = await req.json();
      
      const parsed = z.object({
        name: z.string().min(1, 'Name is required'),
        icon: z.string().min(1, 'Icon is required'),
        description: z.string().min(1, 'Description is required'),
        requirement: z.string().min(1, 'Requirement is required'),
        type: z.enum(['STREAK', 'JOURNAL_COUNT', 'ARTICLE_READ', 'MEDITATION_COUNT', 'MUSIC_COUNT', 'MOOD_CHECKIN']),
        conditionValue: z.number().min(1, 'Condition value must be at least 1').optional().nullable(),
        isActive: z.boolean().default(true),
        schoolId: z.string().optional(),
      }).parse(body);

      // For non-super admins, force the schoolId to their own school
      let badgeSchoolId = parsed.schoolId;
      if (session.role !== 'SUPERADMIN' && session.schoolId) {
        badgeSchoolId = session.schoolId;
      }

      // Extract only badge fields, include schoolId for badge creation
      const { ...badgeData } = parsed;

      const badge = await prisma.badge.create({
        data: {
          ...badgeData,
          schoolId: badgeSchoolId, // Set the schoolId
          createdBy: session.userId,
        },
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              schoolId: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Badge created successfully',
        data: badge,
      });
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }

  async getBadges(req: NextRequest) {
    try {
      const session = await requirePermission(req, 'badges.view');

      const { searchParams } = new URL(req.url);
      
      const parsed = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        search: z.string().optional(),
        type: z.enum(['STREAK', 'JOURNAL_COUNT', 'ARTICLE_READ', 'MEDITATION_COUNT', 'MUSIC_COUNT', 'MOOD_CHECKIN']).optional(),
        isActive: z.coerce.boolean().optional(),
        schoolId: z.string().optional(),
      }).parse({
        page: searchParams.get('page') || 1,
        limit: searchParams.get('limit') || 20,
        search: searchParams.get('search') || undefined,
        type: searchParams.get('type') || undefined,
        isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
        schoolId: searchParams.get('schoolId') || undefined,
      });

      const where: any = {};

      if (parsed.search) {
        where.OR = [
          { name: { contains: parsed.search, mode: 'insensitive' } },
          { description: { contains: parsed.search, mode: 'insensitive' } },
        ];
      }

      if (parsed.type) {
        where.type = parsed.type;
      }

      if (parsed.isActive !== undefined) {
        where.isActive = parsed.isActive;
      }

      // Handle school filtering
      if (session.role === 'SUPERADMIN') {
        // Super admin can filter by any school or see all
        if (parsed.schoolId && parsed.schoolId !== 'all') {
          where.schoolId = parsed.schoolId;
        }
        // If no schoolId specified, super admin sees all badges (including null schoolId)
      } else {
        // Regular admin can only see badges from their school or global badges (null schoolId)
        if (session.schoolId) {
          where.OR = [
            { schoolId: session.schoolId },
            { schoolId: null } // Global badges
          ];
        } else {
          // Admin without school assignment can only see global badges
          where.schoolId = null;
        }
      }

      const skip = (parsed.page - 1) * parsed.limit;

      const [badges, total] = await Promise.all([
        prisma.badge.findMany({
          where,
          skip,
          take: parsed.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            admin: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                schoolId: true,
              },
            },
          },
        }),
        prisma.badge.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Badges retrieved successfully',
        data: {
          badges,
          pagination: {
            page: parsed.page,
            limit: parsed.limit,
            total,
            totalPages: Math.ceil(total / parsed.limit),
          },
        },
      });
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }

  async updateBadge(req: NextRequest) {
    try {
      const session = await requirePermission(req, 'badges.assign');

      const { searchParams } = new URL(req.url);
      const body = await req.json();
      
      const parsed = z.object({
        id: z.string().min(1, 'Badge ID is required'),
        name: z.string().min(1, 'Name is required').optional(),
        icon: z.string().min(1, 'Icon is required').optional(),
        description: z.string().min(1, 'Description is required').optional(),
        requirement: z.string().min(1, 'Requirement is required').optional(),
        type: z.enum(['STREAK', 'JOURNAL_COUNT', 'ARTICLE_READ', 'MEDITATION_COUNT', 'MUSIC_COUNT', 'MOOD_CHECKIN']).optional(),
        conditionValue: z.number().min(1, 'Condition value must be at least 1').optional(),
        isActive: z.boolean().optional(),
      }).parse({
        ...body,
        id: searchParams.get('id'),
      });

      // Check if badge exists and user has permission to modify it
      const existingBadge = await prisma.badge.findUnique({
        where: { id: parsed.id },
      });

      if (!existingBadge) {
        return NextResponse.json({
          success: false,
          error: {
            code: 404,
            message: 'Badge not found',
          },
        }, { status: 404 });
      }

      // Check permission: Super admin can modify any badge, regular admin can only modify their school's badges or global badges
      if (session.role !== 'SUPERADMIN') {
        if (existingBadge.schoolId && existingBadge.schoolId !== session.schoolId) {
          return NextResponse.json({
            success: false,
            error: {
              code: 403,
              message: 'You can only modify badges from your school',
            },
          }, { status: 403 });
        }
      }

      const badge = await prisma.badge.update({
        where: { id: parsed.id },
        data: {
          name: parsed.name,
          icon: parsed.icon,
          description: parsed.description,
          requirement: parsed.requirement,
          type: parsed.type,
          conditionValue: parsed.conditionValue,
          isActive: parsed.isActive,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Badge updated successfully',
        data: badge,
      });
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }

  async deleteBadge(req: NextRequest) {
    try {
      const session = await requirePermission(req, 'badges.assign');

      const { searchParams } = new URL(req.url);
      const parsed = z.object({
        id: z.string().min(1, 'Badge ID is required'),
      }).parse({
        id: searchParams.get('id'),
      });

      // Check if badge exists
      const existingBadge = await prisma.badge.findUnique({
        where: { id: parsed.id },
      });

      if (!existingBadge) {
        return NextResponse.json({
          success: false,
          error: {
            code: 404,
            message: 'Badge not found',
          },
        }, { status: 404 });
      }

      // Check permission: Super admin can delete any badge, regular admin can only delete their school's badges or global badges
      if (session.role !== 'SUPERADMIN') {
        if (existingBadge.schoolId && existingBadge.schoolId !== session.schoolId) {
          return NextResponse.json({
            success: false,
            error: {
              code: 403,
              message: 'You can only delete badges from your school',
            },
          }, { status: 403 });
        }
      }

      await prisma.badge.delete({
        where: { id: parsed.id },
      });

      return NextResponse.json({
        success: true,
        message: 'Badge deleted successfully',
      });
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }
}
