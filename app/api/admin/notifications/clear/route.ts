import { NextResponse } from "next/server";
import prisma from "@/src/prisma";

// DELETE /api/admin/notifications/clear - Clear all notifications
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get('clearAll') === 'true';
    const notificationIds = searchParams.get('ids')?.split(',').map(id => id.trim()).filter(Boolean);

    let result;

    if (clearAll) {
      // Delete all notifications
      result = await prisma.adminNotification.deleteMany({});
      console.log(`[NotificationsAPI] Cleared all ${result.count} notifications`);
    } else if (notificationIds && notificationIds.length > 0) {
      // Delete specific notifications
      result = await prisma.adminNotification.deleteMany({
        where: {
          id: {
            in: notificationIds
          }
        }
      });
      console.log(`[NotificationsAPI] Cleared ${result.count} specific notifications`);
    } else {
      return NextResponse.json(
        { error: "Either clearAll=true or ids parameter is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.count
    });

  } catch (error) {
    console.error('[NotificationsAPI] Error clearing notifications:', error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
