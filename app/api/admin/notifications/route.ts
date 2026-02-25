import { NextResponse } from "next/server";
import prisma from "@/src/prisma";

// GET /api/admin/notifications - Fetch admin notifications
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const whereClause: any = {};
    if (unreadOnly) {
      whereClause.read = false;
    }

    const notifications = await prisma.adminNotification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        alert: {
          include: {
            user: {
              select: {
                studentId: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    const unreadCount = await prisma.adminNotification.count({
      where: { read: false }
    });

    // Format notifications
    const formattedNotifications = notifications.map((notification: any) => ({
      id: notification.id,
      type: notification.type,
      message: notification.message,
      severity: notification.severity,
      timestamp: notification.createdAt.toISOString(),
      read: notification.read,
      actionUrl: notification.alertId ? `/admin/alerts` : undefined,
      escalationAlert: notification.alert ? {
        id: notification.alert.id,
        studentName: notification.alert.studentName,
        studentClass: notification.alert.studentClass,
        priority: notification.alert.priority,
        category: notification.alert.category,
        description: notification.alert.description
      } : null
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('[NotificationsAPI] Error fetching notifications:', error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/admin/notifications - Create new notification
export async function POST(req: Request) {
  try {
    const { type, message, severity, alertId } = await req.json();

    const notification = await prisma.adminNotification.create({
      data: {
        type,
        message,
        severity: severity || 'medium',
        alertId: alertId || null,
        read: false
      }
    });

    console.log('[NotificationsAPI] Created notification:', notification.id);

    // Trigger real-time notification
    const eventSourceData = JSON.stringify({
      id: notification.id,
      type,
      message,
      severity: severity || 'medium',
      timestamp: notification.createdAt.toISOString(),
      read: false,
      actionUrl: alertId ? `/admin/alerts` : undefined
    });

    return NextResponse.json({
      success: true,
      notification,
      eventSourceData
    });

  } catch (error) {
    console.error('[NotificationsAPI] Error creating notification:', error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/notifications/read - Mark notifications as read
export async function PATCH(req: Request) {
  try {
    const { notificationIds } = await req.json();

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: "notificationIds array is required" },
        { status: 400 }
      );
    }

    // Mark notifications as read
    const result = await prisma.adminNotification.updateMany({
      where: {
        id: {
          in: notificationIds
        },
        read: false // Only update unread notifications
      },
      data: {
        read: true
      }
    });

    console.log(`[NotificationsAPI] Marked ${result.count} notifications as read`);

    return NextResponse.json({
      success: true,
      updatedCount: result.count
    });

  } catch (error) {
    console.error('[NotificationsAPI] Error marking notifications as read:', error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
