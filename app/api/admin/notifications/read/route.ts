import { NextResponse } from "next/server";
import prisma from "@/src/prisma";

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
        read: true,
        readAt: new Date()
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
