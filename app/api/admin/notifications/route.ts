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
      title: notification.type === 'system' ? 'System Notification' : 
             notification.type === 'escalation' ? 'Escalation Alert' : 'Message',
      message: notification.message,
      priority: notification.severity === 'critical' ? 'critical' :
                notification.severity === 'high' ? 'high' :
                notification.severity === 'medium' ? 'medium' : 'low',
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
    const { type, message, severity, alertId, userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const notification = await prisma.adminNotification.create({
      data: {
        userId,
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
      title: type === 'system' ? 'System Notification' : 
             type === 'escalation' ? 'Escalation Alert' : 'Message',
      message,
      priority: severity === 'critical' ? 'critical' :
                severity === 'high' ? 'high' :
                severity === 'medium' ? 'medium' : 'low',
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