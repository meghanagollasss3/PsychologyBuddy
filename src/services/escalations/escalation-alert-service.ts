import { EscalationDetection, EscalationAlert } from './content-escalation-detector'
import prisma from '../../prisma'

export interface NotificationChannel {
  type: 'email' | 'sms' | 'in_app' | 'webhook'
  enabled: boolean
  config: Record<string, any>
}

export interface EscalationNotification {
  alertId: string
  channels: NotificationChannel[]
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recipients: string[]
  sentAt?: string
  status: 'pending' | 'sent' | 'failed'
}

export interface AdminNotification {
  id: string
  adminId: string
  alertId: string
  type: 'escalation' | 'resolution' | 'update'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  read: boolean
  createdAt: string
  readAt?: string
}

export class EscalationAlertService {
  /**
   * Gets student name for display
   */
  private static async getStudentName(studentId: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { studentId },
        select: { firstName: true, lastName: true }
      });
      
      return user ? `${user.firstName} ${user.lastName}` : 'Unknown Student';
    } catch (error) {
      console.error('[EscalationAlert] Failed to get student name:', error);
      return 'Unknown Student';
    }
  }

  /**
   * Gets student class for display
   */
  private static async getStudentClass(studentId: string): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { studentId },
        select: { 
          classRef: {
            select: { 
              name: true,
              grade: true,
              section: true
            }
          }
        }
      });
      
      if (user?.classRef) {
        return `Class ${user.classRef.grade}${user.classRef.section ? `-${user.classRef.section}` : ''}`;
      }
      
      return null;
    } catch (error) {
      console.error('[EscalationAlert] Failed to get student class:', error);
      return null;
    }
  }

  /**
   * Generates alert description for display
   */
  private static generateAlertDescription(detection: EscalationDetection): string {
    const categoryDescriptions = {
      self_harm: 'Self-harm or suicidal ideation detected in conversation',
      violence: 'Violent thoughts or threats detected in conversation',
      abuse: 'Abuse or harassment disclosure detected in conversation',
      substance_abuse: 'Substance abuse concerns detected in conversation',
      mental_health_crisis: 'Mental health crisis indicators detected in conversation',
      behavioral_concern: 'Behavioral concerns detected in conversation',
      other: 'Concerning content detected in conversation'
    };

    const baseDescription = categoryDescriptions[detection.category.type] || 'Concerning content detected';
    
    if (detection.detectedPhrases.length > 0) {
      return `${baseDescription}. Key indicators: ${detection.detectedPhrases.slice(0, 3).join(', ')}`;
    }
    
    return baseDescription;
  }

  /**
   * Creates and processes an escalation alert
   */
  static async createEscalationAlert(
    studentId: string,
    sessionId: string,
    detection: EscalationDetection,
    messageContent: string,
    messageTimestamp: string
  ): Promise<EscalationAlert> {
    try {
      console.log(`[EscalationAlert] Creating alert for student ${studentId}, session ${sessionId}`)
      
      // Resolve the user ID from the studentId
      const user = await prisma.user.findUnique({
        where: { studentId: studentId },
        select: { id: true, firstName: true, lastName: true }
      });

      if (!user) {
        throw new Error(`User not found for studentId: ${studentId}`);
      }

      const userId = user.id;
      const studentName = `${user.firstName} ${user.lastName}`;

      console.log(`[EscalationAlert] Resolved user ID: ${userId} for studentId: ${studentId}`);
      
      // Create alert record in database
      const alert = await prisma.escalationAlert.create({
        data: {
          studentId: userId, // Use the resolved user ID
          sessionId,
          studentName: studentName, // Use the resolved name
          studentClass: await this.getStudentClass(studentId), // Get student class using the original studentId
          category: detection.category.type,
          level: detection.level.level,
          severity: detection.level.severity,
          confidence: detection.category.confidence,
          detectedPhrases: detection.detectedPhrases,
          context: detection.context,
          recommendation: detection.recommendation,
          description: this.generateAlertDescription(detection),
          detectionMethod: 'AI Analysis',
          messageContent,
          messageTimestamp,
          requiresImmediateAction: detection.level.requiresImmediateAction,
          status: 'open',
          priority: detection.level.level,
        }
      })

      console.log(`[EscalationAlert] Alert created with ID: ${alert.id}`)

      // Send notifications to appropriate staff
      await this.sendNotifications(alert.id, detection.level.level, detection.level.requiresImmediateAction)

      // Create admin notifications
      await this.createAdminNotifications(alert.id, detection)

      return {
        id: alert.id,
        studentId,
        sessionId,
        detection,
        messageContent,
        messageTimestamp,
        status: 'pending',
        createdAt: alert.createdAt.toISOString(),
        updatedAt: alert.updatedAt.toISOString()
      }
    } catch (error) {
      console.error('[EscalationAlert] Failed to create escalation alert:', error)
      throw new Error('Failed to create escalation alert')
    }
  }

  /**
   * Sends notifications through appropriate channels
   */
  private static async sendNotifications(
    alertId: string,
    level: string,
    requiresImmediateAction: boolean
  ): Promise<void> {
    try {
      // Get notification settings based on escalation level
      const notificationSettings = await this.getNotificationSettings(level)
      
      // Get relevant staff members to notify
      const staffToNotify = await this.getStaffToNotify(level, requiresImmediateAction)
      
      console.log(`[EscalationAlert] Notifying ${staffToNotify.length} staff members for alert ${alertId}`)

      // Send notifications through each enabled channel
      for (const channel of notificationSettings.channels) {
        if (channel.enabled) {
          await this.sendChannelNotification(alertId, channel, staffToNotify, level)
        }
      }
    } catch (error) {
      console.error('[EscalationAlert] Failed to send notifications:', error)
      // Don't throw here - we don't want to fail the alert creation if notifications fail
    }
  }

  
  /**
   * Gets notification settings based on escalation level
   */
  private static async getNotificationSettings(level: string): Promise<{
    channels: NotificationChannel[]
  }> {
    // Default notification settings - these could be configurable in the database
    const defaultSettings = {
      channels: [
        {
          type: 'in_app' as const,
          enabled: true,
          config: {}
        },
        {
          type: 'email' as const,
          enabled: level === 'critical' || level === 'high',
          config: {
            template: 'escalation_alert',
            urgent: level === 'critical'
          }
        },
        {
          type: 'sms' as const,
          enabled: level === 'critical',
          config: {
            urgent: true
          }
        }
      ]
    }

    return defaultSettings
  }

  /**
   * Gets staff members who should be notified
   */
  private static async getStaffToNotify(
    level: string,
    requiresImmediateAction: boolean
  ): Promise<Array<{ id: string; email: string; phone?: string; role: string }>> {
    const whereClause: any = {
      role: {
        name: {
          in: ['ADMIN', 'COUNSELOR']
        }
      }
    }

    // For critical escalations, include all admin staff
    if (level === 'critical' || requiresImmediateAction) {
      whereClause.role.name.in.push('TEACHER')
    }

    const staff = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        phone: true,
        role: {
          select: {
            name: true
          }
        }
      }
    })

    return staff.map(member => ({
      id: member.id,
      email: member.email,
      phone: member.phone || undefined,
      role: member.role.name
    }))
  }

  /**
   * Sends notification through a specific channel
   */
  private static async sendChannelNotification(
    alertId: string,
    channel: NotificationChannel,
    recipients: Array<{ id: string; email: string; phone?: string; role: string }>,
    level: string
  ): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(alertId, recipients, level)
          break
        case 'sms':
          await this.sendSMSNotification(alertId, recipients.filter(r => r.phone), level)
          break
        case 'in_app':
          // In-app notifications are already created via createAdminNotifications
          break
        case 'webhook':
          await this.sendWebhookNotification(alertId, level)
          break
      }
    } catch (error) {
      console.error(`[EscalationAlert] Failed to send ${channel.type} notification:`, error)
    }
  }

  /**
   * Sends email notifications
   */
  private static async sendEmailNotification(
    alertId: string,
    recipients: Array<{ id: string; email: string; role: string }>,
    level: string
  ): Promise<void> {
    // This would integrate with your email service (SendGrid, etc.)
    console.log(`[EscalationAlert] Would send email notification for alert ${alertId} to ${recipients.length} recipients`)
    
    // Example implementation:
    // for (const recipient of recipients) {
    //   await emailService.send({
    //     to: recipient.email,
    //     template: 'escalation_alert',
    //     data: { alertId, level, urgent: level === 'critical' }
    //   })
    // }
  }

  /**
   * Sends SMS notifications
   */
  private static async sendSMSNotification(
    alertId: string,
    recipients: Array<{ id: string; phone?: string; role: string }>,
    level: string
  ): Promise<void> {
    // Filter recipients who have phone numbers
    const recipientsWithPhones = recipients.filter(r => r.phone)
    
    // This would integrate with your SMS service (Twilio, etc.)
    console.log(`[EscalationAlert] Would send SMS notification for alert ${alertId} to ${recipientsWithPhones.length} recipients`)
    
    // Example implementation:
    // for (const recipient of recipientsWithPhones) {
    //   await smsService.send({
    //     to: recipient.phone!,
    //     message: `URGENT: Escalation alert ${alertId} requires immediate attention`
    //   })
    // }
  }

  /**
   * Sends webhook notifications
   */
  private static async sendWebhookNotification(
    alertId: string,
    level: string
  ): Promise<void> {
    // This would send to external monitoring systems
    console.log(`[EscalationAlert] Would send webhook notification for alert ${alertId}`)
  }

  /**
   * Generates notification message
   */
  private static generateNotificationMessage(detection: EscalationDetection): string {
    const { category, level } = detection
    
    const categoryDescriptions = {
      self_harm: 'Self-harm or suicidal ideation',
      violence: 'Violent thoughts or threats',
      abuse: 'Abuse or harassment disclosure',
      substance_abuse: 'Substance abuse concerns',
      mental_health_crisis: 'Mental health crisis',
      behavioral_concern: 'Behavioral concerns',
      other: 'Concerning content'
    }

    return `🚨 Escalation Alert: ${categoryDescriptions[category.type]} detected (${level.level} severity). Immediate attention required.`
  }

  /**
   * Updates alert status
   */
  static async updateAlertStatus(
    alertId: string,
    status: 'pending' | 'reviewed' | 'resolved' | 'false_positive',
    assignedTo?: string,
    notes?: string
  ): Promise<void> {
    try {
      await prisma.escalationAlert.update({
        where: { id: alertId },
        data: {
          status,
          assignedTo,
          notes,
          updatedAt: new Date()
        }
      })

      console.log(`[EscalationAlert] Alert ${alertId} status updated to ${status}`)
    } catch (error) {
      console.error('[EscalationAlert] Failed to update alert status:', error)
      throw new Error('Failed to update alert status')
    }
  }

  /**
   * Gets pending alerts for admin dashboard
   */
  static async getPendingAlerts(
    limit: number = 50,
    offset: number = 0
  ): Promise<EscalationAlert[]> {
    try {
      const alerts = await prisma.escalationAlert.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              studentId: true,
              email: true
            }
          }
        }
      })

      return alerts.map((alert: any) => ({
        id: alert.id,
        studentId: alert.user.studentId,
        sessionId: alert.sessionId,
        detection: {
          isEscalation: true,
          category: {
            type: alert.category as any,
            confidence: alert.confidence
          },
          level: {
            level: alert.level as any,
            severity: alert.severity,
            requiresImmediateAction: alert.requiresImmediateAction
          },
          detectedPhrases: alert.detectedPhrases,
          context: alert.context,
          recommendation: alert.recommendation,
          timestamp: alert.createdAt.toISOString()
        },
        messageContent: alert.messageContent,
        messageTimestamp: alert.messageTimestamp,
        status: alert.status as any,
        assignedTo: alert.assignedTo || undefined,
        notes: alert.notes || undefined,
        createdAt: alert.createdAt.toISOString(),
        updatedAt: alert.updatedAt.toISOString()
      }))
    } catch (error) {
      console.error('[EscalationAlert] Failed to get pending alerts:', error)
      return []
    }
  }

  /**
   * Creates admin notifications for escalation alerts
   */
  static async createAdminNotifications(alertId: string, detection: EscalationDetection) {
    try {
      // Only create notifications for critical and high priority escalations
      if (detection.level.level === 'critical' || detection.level.level === 'high') {
        console.log(`[EscalationAlert] Creating admin notification for ${detection.level.level} escalation`);
        
        // Get real admin users who should be notified
        const adminUsers = await prisma.user.findMany({
          where: {
            role: {
              name: {
                in: ['ADMIN', 'COUNSELOR', 'TEACHER']
              }
            }
          }
        });

        const notificationMessage = `🚨 ${detection.level.level.toUpperCase()} ESCALATION: ${detection.category.type.replace('_', ' ').toUpperCase()}`;

        for (const admin of adminUsers) {
          await prisma.adminNotification.create({
            data: {
              userId: admin.id,
              alertId: alertId,
              type: 'escalation',
              message: notificationMessage,
              severity: detection.level.level,
              read: false
            }
          });
        }

        console.log(`[EscalationAlert] Created ${adminUsers.length} admin notifications for alert ${alertId}`);
      }
    } catch (error) {
      console.error('[EscalationAlert] Error creating admin notifications:', error);
    }
  }

  /**
   * Gets escalation statistics
   */
  static async getEscalationStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number
    byCategory: Record<string, number>
    byLevel: Record<string, number>
    byStatus: Record<string, number>
    averageResponseTime: number
  }> {
    try {
      const whereClause: any = {}
      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) whereClause.createdAt.gte = startDate
        if (endDate) whereClause.createdAt.lte = endDate
      }

      const alerts = await prisma.escalationAlert.findMany({
        where: whereClause,
        select: {
          category: true,
          level: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      })

      const stats = {
        total: alerts.length,
        byCategory: {} as Record<string, number>,
        byLevel: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        averageResponseTime: 0
      }

      let totalResponseTime = 0
      let responseCount = 0

      for (const alert of alerts) {
        // Count by category
        stats.byCategory[alert.category] = (stats.byCategory[alert.category] || 0) + 1
        
        // Count by level
        stats.byLevel[alert.level] = (stats.byLevel[alert.level] || 0) + 1
        
        // Count by status
        stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1
        
        // Calculate response time for resolved alerts
        if (alert.status === 'resolved') {
          const responseTime = alert.updatedAt.getTime() - alert.createdAt.getTime()
          totalResponseTime += responseTime
          responseCount++
        }
      }

      stats.averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0

      return stats
    } catch (error) {
      console.error('[EscalationAlert] Failed to get escalation stats:', error)
      return {
        total: 0,
        byCategory: {},
        byLevel: {},
        byStatus: {},
        averageResponseTime: 0
      }
    }
  }
}
