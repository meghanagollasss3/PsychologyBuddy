import { NextResponse } from "next/server";
import prisma from "@/src/prisma";
import { ContentEscalationDetector } from "@/src/services/escalations/content-escalation-detector";
import { EscalationAlertService } from "@/src/services/escalations/escalation-alert-service";
import { withPermission } from "@/src/middleware/permission.middleware";

export async function POST(req: Request) {
  try {
    const { message, studentId, sessionId } = await req.json();

    if (!message || !studentId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log('[EscalationAPI] Analyzing message for escalation:', { studentId, sessionId, messageLength: message.length });

    // Get conversation context for better analysis
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { content: true, senderType: true }
    });

    const conversationContext = recentMessages
      .reverse()
      .map(msg => msg.senderType === 'STUDENT' ? msg.content : `Bot: ${msg.content}`);

    // Analyze the message for escalation indicators
    const detection = await ContentEscalationDetector.analyzeMessage(
      message,
      studentId,
      sessionId,
      conversationContext
    );

    console.log('[EscalationAPI] Detection result:', {
      isEscalation: detection.isEscalation,
      category: detection.category.type,
      level: detection.level.level,
      severity: detection.level.severity
    });

    // If this is a valid escalation, create an alert
    if (ContentEscalationDetector.isValidEscalation(detection)) {
      console.log('[EscalationAPI] Valid escalation detected, creating alert');
      
      try {
        const alert = await EscalationAlertService.createEscalationAlert(
          studentId,
          sessionId,
          detection,
          message,
          new Date().toISOString()
        );

        console.log('[EscalationAPI] Alert created successfully:', alert.id);

        return NextResponse.json({
          success: true,
          escalationDetected: true,
          alert: {
            id: alert.id,
            category: detection.category.type,
            level: detection.level.level,
            severity: detection.level.severity,
            requiresImmediateAction: detection.level.requiresImmediateAction,
            recommendation: detection.recommendation
          },
          message: "Escalation alert has been created and staff have been notified"
        });
      } catch (error) {
        console.error('[EscalationAPI] Failed to create escalation alert:', error);
        
        // Still return detection info even if alert creation fails
        return NextResponse.json({
          success: false,
          escalationDetected: true,
          error: "Failed to create escalation alert",
          detection: {
            category: detection.category.type,
            level: detection.level.level,
            severity: detection.level.severity,
            requiresImmediateAction: detection.level.requiresImmediateAction
          }
        }, { status: 500 });
      }
    }

    // No escalation detected
    return NextResponse.json({
      success: true,
      escalationDetected: false,
      message: "No escalation indicators detected"
    });

  } catch (error) {
    console.error('[EscalationAPI] Error in escalation detection:', error);
    
    return NextResponse.json(
      { 
        error: "Failed to analyze message for escalation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export const GET = withPermission({
  module: 'ESCALATIONS',
  action: 'VIEW'
})(async (req: Request, { user }: any) => {
  try {
    console.log('[EscalationAPI] Fetching escalation alerts...');
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const schoolId = searchParams.get('schoolId');
    const priority = searchParams.get('priority');
    const timeFilter = searchParams.get('timeFilter');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('[EscalationAPI] Query params:', { status, limit, offset, schoolId, priority, timeFilter, startDate, endDate });
    console.log('[EscalationAPI] User role:', user.role.name, 'User school:', user.schoolId);

    // Build where clause
    let whereClause: any = {};

    if (status !== 'all') {
      whereClause.status = status;
    }

    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }

    // Add school filtering based on user role
    let targetSchoolId: string | undefined;
    if (user.role.name === 'ADMIN' || user.role.name === 'SCHOOL_SUPERADMIN') {
      targetSchoolId = user.schoolId;
    } else if (user.role.name === 'SUPERADMIN') {
      if (schoolId && schoolId !== 'all') {
        targetSchoolId = schoolId;
      }
    }

    if (targetSchoolId) {
      whereClause.user = {
        schoolId: targetSchoolId
      };
    }

    // Add time filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lt: new Date(endDate),
      };
    } else if (timeFilter) {
      const now = new Date();
      const start = new Date();
      const end = new Date();

      switch (timeFilter) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          start.setDate(now.getDate() - dayOfWeek);
          start.setHours(0, 0, 0, 0);
          end.setDate(now.getDate() + (6 - dayOfWeek));
          end.setHours(23, 59, 59, 999);
          break;
        case 'month':
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end.setMonth(now.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          break;
        default:
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
      }

      whereClause.createdAt = {
        gte: start,
        lt: end,
      };
    }

    console.log('[EscalationAPI] Where clause:', JSON.stringify(whereClause, null, 2));

    // Get total count for pagination
    const totalCount = await prisma.escalationAlert.count({
      where: whereClause
    });

    console.log('[EscalationAPI] Total alerts count:', totalCount);

    // Fetch alerts with pagination
    const alerts = await prisma.escalationAlert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            schoolId: true,
            school: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    console.log('[EscalationAPI] Found alerts:', alerts.length);
    console.log('[EscalationAPI] Alert IDs:', alerts.map(a => a.id));

    // Format alerts for response
    const formattedAlerts = alerts.map((alert: any) => ({
      id: alert.id,
      studentId: alert.studentId,
      studentName: alert.studentName || `${alert.user.firstName} ${alert.user.lastName}`,
      studentClass: alert.studentClass,
      studentEmail: alert.user.email,
      sessionId: alert.sessionId,
      category: alert.category,
      level: alert.level,
      severity: alert.severity,
      confidence: alert.confidence,
      detectedPhrases: alert.detectedPhrases,
      context: alert.context,
      recommendation: alert.recommendation,
      description: alert.description,
      detectionMethod: alert.detectionMethod,
      messageContent: alert.messageContent,
      messageTimestamp: alert.messageTimestamp,
      requiresImmediateAction: alert.requiresImmediateAction,
      status: alert.status,
      priority: alert.priority,
      assignedTo: alert.assignedTo,
      notes: alert.notes,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString()
    }));

    console.log('[EscalationAPI] Formatted alerts count:', formattedAlerts.length);
    console.log('[EscalationAPI] Sample alert:', formattedAlerts[0] || 'No alerts');

    return NextResponse.json({
      success: true,
      alerts: formattedAlerts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('[EscalationAPI] Error fetching alerts:', error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch escalation alerts",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
});

export async function PATCH(req: Request) {
  try {
    const { alertId, status, assignedTo, notes, recommendedResources } = await req.json();

    if (!alertId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: alertId and status" },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'reviewed', 'resolved', 'false_positive'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: " + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    console.log('[EscalationAPI] Updating escalation alert:', { alertId, status, assignedTo, recommendedResources });

    // Combine notes and recommended resources into structured format
    let finalNotes = notes || '';
    if (recommendedResources && recommendedResources.length > 0) {
      const resourcesData = {
        recommendedResources: recommendedResources.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          duration: r.duration
        }))
      };
      
      // If there are existing notes, append resources as structured data
      if (finalNotes) {
        finalNotes += '\n\n--- RECOMMENDED RESOURCES ---\n' + JSON.stringify(resourcesData, null, 2);
      } else {
        finalNotes = '--- RECOMMENDED RESOURCES ---\n' + JSON.stringify(resourcesData, null, 2);
      }
    }

    // Update the alert
    const updatedAlert = await prisma.escalationAlert.update({
      where: { id: alertId },
      data: {
        status,
        assignedTo: assignedTo || null,
        notes: finalNotes || null,
        updatedAt: new Date()
      },
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
    });

    console.log('[EscalationAPI] Alert updated successfully:', updatedAlert.id);

    // Create resolution notification if status is resolved or false_positive
    if (status === 'resolved' || status === 'false_positive') {
      try {
        await prisma.adminNotification.create({
          data: {
            userId: updatedAlert.assignedTo || 'system', // Would need to get actual user ID
            alertId,
            type: 'resolution',
            message: `Escalation alert ${alertId} has been marked as ${status}`,
            severity: updatedAlert.level,
            read: false
          }
        });
      } catch (error) {
        console.error('[EscalationAPI] Failed to create resolution notification:', error);
        // Don't fail the request if notification creation fails
      }
    }

    return NextResponse.json({
      success: true,
      alert: {
        id: updatedAlert.id,
        studentId: updatedAlert.user.studentId,
        studentName: `${updatedAlert.user.firstName} ${updatedAlert.user.lastName}`,
        studentEmail: updatedAlert.user.email,
        sessionId: updatedAlert.sessionId,
        category: updatedAlert.category,
        level: updatedAlert.level,
        severity: updatedAlert.severity,
        confidence: updatedAlert.confidence,
        detectedPhrases: updatedAlert.detectedPhrases,
        context: updatedAlert.context,
        recommendation: updatedAlert.recommendation,
        description: updatedAlert.description,
        detectionMethod: updatedAlert.detectionMethod,
        messageContent: updatedAlert.messageContent,
        messageTimestamp: updatedAlert.messageTimestamp,
        requiresImmediateAction: updatedAlert.requiresImmediateAction,
        status: updatedAlert.status,
        assignedTo: updatedAlert.assignedTo,
        notes: updatedAlert.notes,
        createdAt: updatedAlert.createdAt.toISOString(),
        updatedAt: updatedAlert.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('[EscalationAPI] Error updating escalation alert:', error);
    
    return NextResponse.json(
      { 
        error: "Failed to update escalation alert",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
