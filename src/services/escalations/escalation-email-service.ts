import prisma from '../../prisma'

export interface EmailNotificationData {
  alertId: string
  studentName: string
  studentClass: string | null
  studentId: string
  category: string
  level: string
  severity: number
  description: string
  detectedPhrases: string[]
  context: string | null
  recommendation: string | null
  detectionMethod: string
  messageContent: string
  messageTimestamp: string
  requiresImmediateAction: boolean
  schoolName?: string
  organizationName?: string
}

export interface EmailRecipient {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  schoolId?: string
  schoolName?: string
}

export interface EmailTemplate {
  subject: string
  htmlBody: string
  textBody?: string
}

export class EscalationEmailService {
  /**
   * Gets all relevant admin recipients for an escalation alert
   */
  private static async getAdminRecipients(studentUserId: string): Promise<EmailRecipient[]> {
    try {
      // Get the student's school information
      const student = await prisma.user.findUnique({
        where: { id: studentUserId },
        select: {
          schoolId: true,
          school: {
            select: {
              id: true,
              name: true,
              primaryAdminId: true
            }
          }
        }
      })

      if (!student) {
        console.error('[EscalationEmail] Student not found:', studentUserId)
        return []
      }

      const schoolId = student.schoolId
      const recipients: EmailRecipient[] = []

      // 1. Get School Super Admin for this school
      if (schoolId) {
        const schoolSuperAdmins = await prisma.user.findMany({
          where: {
            schoolId: schoolId,
            role: {
              name: 'SCHOOL_SUPERADMIN'
            }
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: {
              select: {
                name: true
              }
            }
          }
        })

        recipients.push(...schoolSuperAdmins.map((admin: any) => ({
          ...admin,
          role: admin.role.name,
          schoolId: schoolId || undefined,
          schoolName: student.school?.name || 'Unknown School'
        })))

        // 2. Get Primary Admin of the school
        if (student.school?.primaryAdminId) {
          const primaryAdmin = await prisma.user.findUnique({
            where: { id: student.school.primaryAdminId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          })

          if (primaryAdmin) {
            recipients.push({
              ...primaryAdmin,
              role: primaryAdmin.role.name,
              schoolId: schoolId || undefined,
              schoolName: student.school?.name || 'Unknown School'
            })
          }
        }
      }

      // 3. Get all regular Admins for this school
      if (schoolId) {
        const schoolAdmins = await prisma.user.findMany({
          where: {
            schoolId: schoolId,
            role: {
              name: 'ADMIN'
            }
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: {
              select: {
                name: true
              }
            }
          }
        })

        recipients.push(...schoolAdmins.map((admin: any) => ({
          ...admin,
          role: admin.role.name,
          schoolId: schoolId || undefined,
          schoolName: student.school?.name || 'Unknown School'
        })))
      }

      // 4. Get Counselors for this school
      if (schoolId) {
        const counselors = await prisma.user.findMany({
          where: {
            schoolId: schoolId,
            role: {
              name: 'COUNSELOR'
            }
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: {
              select: {
                name: true
              }
            }
          }
        })

        recipients.push(...counselors.map((counselor: any) => ({
          ...counselor,
          role: counselor.role.name,
          schoolId: schoolId || undefined,
          schoolName: student.school?.name || 'Unknown School'
        })))
      }

      // 5. For critical escalations, also notify teachers
      const alert = await prisma.escalationAlert.findFirst({
        where: {
          studentId: studentUserId,
          status: 'open'
        },
        orderBy: { createdAt: 'desc' },
        select: { level: true }
      })

      if (alert && (alert.level === 'critical' || alert.level === 'high')) {
        const teachers = await prisma.user.findMany({
          where: {
            schoolId: schoolId,
            role: {
              name: 'TEACHER'
            }
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: {
              select: {
                name: true
              }
            }
          }
        })

        recipients.push(...teachers.map((teacher: any) => ({
          ...teacher,
          role: teacher.role.name,
          schoolId: schoolId || undefined,
          schoolName: student.school?.name || 'Unknown School'
        })))
      }

      // Remove duplicates and filter out invalid emails
      const uniqueRecipients = recipients.filter((recipient, index, self) =>
        index === self.findIndex(r => r.id === recipient.id) && 
        recipient.email && 
        recipient.email.includes('@')
      )

      console.log(`[EscalationEmail] Found ${uniqueRecipients.length} admin recipients for escalation`)
      return uniqueRecipients

    } catch (error) {
      console.error('[EscalationEmail] Error getting admin recipients:', error)
      return []
    }
  }

  /**
   * Generates email template for escalation alert
   */
  public static generateEmailTemplate(data: EmailNotificationData): EmailTemplate {
    const severityColors = {
      low: '#10b981',      // green
      medium: '#f59e0b',    // amber  
      high: '#ef4444',       // red
      critical: '#dc2626'     // dark red
    }

    const categoryIcons = {
      self_harm: '⚠️',
      violence: '🔫',
      abuse: '🛡️',
      substance_abuse: '💊',
      mental_health_crisis: '🧠',
      behavioral_concern: '📊',
      check_in_missed: '📅',
      mood_trend_decline: '📉',
      other: '⚡'
    }

    const urgencyBadge = data.requiresImmediateAction 
      ? `<div style="display: inline-block; background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
          🚨 Immediate Action Required
        </div>`
      : `<div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
          📋 Attention Required
        </div>`

    const subject = `${categoryIcons[data.category as keyof typeof categoryIcons]} ${data.level.toUpperCase()} ESCALATION: ${data.category.replace('_', ' ').toUpperCase()} - ${data.studentName}`

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Escalation Alert</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        
        <!-- Email Container -->
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4FC1F9, #1B9EE0); padding: 32px 24px; text-align: center; position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
              <div style="font-size: 48px; margin-bottom: 16px;">${categoryIcons[data.category as keyof typeof categoryIcons]}</div>
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                ${data.level.toUpperCase()} ESCALATION ALERT
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 500;">
                ${data.category.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>

          <!-- Urgency Badge -->
          <div style="padding: 24px 24px 0 24px; text-align: center;">
            ${urgencyBadge}
          </div>

          <!-- Student Info Card -->
          <div style="padding: 0 24px 24px 24px;">
            <div style="background: linear-gradient(135deg, #f1f5f9, #e2e8f0); border-radius: 12px; padding: 20px; border-left: 4px solid ${severityColors[data.level as keyof typeof severityColors]};">
              <h2 style="margin: 0 0 16px 0; color: #475569; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                👤 Student Information
              </h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Name</p>
                  <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.studentName}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Class</p>
                  <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.studentClass}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Student ID</p>
                  <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.studentId}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">School</p>
                  <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.schoolName}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div style="padding: 0 24px 24px 24px;">
            <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); border-radius: 12px; padding: 20px; border-left: 4px solid ${severityColors[data.level as keyof typeof severityColors]};">
              <h2 style="margin: 0 0 16px 0; color: #475569; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                📋 Description
              </h2>
              <p style="margin: 0; color: #1e293b; line-height: 1.6; font-weight: 500;">${data.description}</p>
            </div>
          </div>

          ${data.recommendation ? `
          <!-- Recommendation -->
          <div style="padding: 0 24px 24px 24px;">
            <div style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); border-radius: 12px; padding: 20px; border-left: 4px solid #22c55e;">
              <h2 style="margin: 0 0 16px 0; color: #14532d; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                💡 Recommendation
              </h2>
              <p style="margin: 0; color: #166534; line-height: 1.6; font-weight: 500;">${data.recommendation}</p>
            </div>
          </div>
          ` : ''}

          ${data.requiresImmediateAction ? `
          <!-- Action Required -->
          <div style="padding: 0 24px 24px 24px;">
            <div style="background: linear-gradient(135deg, #fee2e2, #fecaca); border-radius: 12px; padding: 20px; border-left: 4px solid #ef4444;">
              <h2 style="margin: 0 0 16px 0; color: #991b1b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                🚨 Action Required
              </h2>
              <p style="margin: 0; color: #7f1d1d; line-height: 1.6; font-weight: 500;">
                This escalation requires immediate attention. Please check your admin dashboard for full details and take appropriate action to ensure student safety.
              </p>
            </div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="margin-bottom: 16px;">
              <div style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                View in Admin Dashboard
              </div>
            </div>
            <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
              This alert was generated by Psychology Buddy's intelligent monitoring system.<br>
              Alert ID: ${data.alertId} | Generated: ${new Date().toLocaleString()}
            </p>
          </div>

        </div>

      </body>
      </html>
    `

    const textBody = `
ESCALATION ALERT - ${data.level.toUpperCase()}

Student Information:
- Name: ${data.studentName}
- Class: ${data.studentClass || 'Not assigned'}
- Student ID: ${data.studentId}
${data.schoolName ? `- School: ${data.schoolName}` : ''}

Alert Details:
- Category: ${data.category.replace('_', ' ').toUpperCase()}
- Severity Level: ${data.level.toUpperCase()}
- Detection Method: ${data.detectionMethod}
- Detected: ${new Date(data.messageTimestamp).toLocaleString()}
- Description: ${data.description}

${data.detectedPhrases.length > 0 ? `Key Indicators:\n${data.detectedPhrases.map(phrase => `- ${phrase}`).join('\n')}\n` : ''}

${data.context ? `Context:\n${data.context}\n` : ''}

${data.recommendation ? `Recommendation:\n${data.recommendation}\n` : ''}

${data.requiresImmediateAction ? 'IMMEDIATE ATTENTION REQUIRED - Please log in to the admin panel to review this alert.' : ''}

Alert ID: ${data.alertId}

This is an automated alert from the Psychology Buddy system.
    `

    return { subject, htmlBody, textBody }
  }

  /**
   * Sends escalation email notifications to all relevant admins
   */
  static async sendEscalationEmails(alertId: string): Promise<void> {
    try {
      console.log(`[EscalationEmail] Starting email notifications for alert ${alertId}`)

      // Get alert details
      const alert = await prisma.escalationAlert.findUnique({
        where: { id: alertId },
        include: {
          user: {
            select: {
              id: true,
              studentId: true,
              school: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      if (!alert) {
        console.error('[EscalationEmail] Alert not found:', alertId)
        return
      }

      // Prepare email data
      const emailData: EmailNotificationData = {
        alertId: alert.id,
        studentName: alert.studentName,
        studentClass: alert.studentClass,
        studentId: alert.user.studentId || 'Unknown',
        category: alert.category,
        level: alert.level,
        severity: alert.severity,
        description: alert.description,
        detectedPhrases: alert.detectedPhrases,
        context: alert.context,
        recommendation: alert.recommendation,
        detectionMethod: alert.detectionMethod,
        messageContent: alert.messageContent,
        messageTimestamp: alert.messageTimestamp,
        requiresImmediateAction: alert.requiresImmediateAction,
        schoolName: alert.user.school?.name
      }

      // Get all admin recipients
      const recipients = await this.getAdminRecipients(alert.user.id)
      
      if (recipients.length === 0) {
        console.log('[EscalationEmail] No admin recipients found for escalation')
        return
      }

      // Generate email template
      const emailTemplate = this.generateEmailTemplate(emailData)

      // Send emails (in a real implementation, you would use an email service like SendGrid, Nodemailer, etc.)
      console.log(`[EscalationEmail] Would send emails to ${recipients.length} recipients`)
      
      for (const recipient of recipients) {
        console.log(`[EscalationEmail] Sending email to: ${recipient.email} (${recipient.role})`)
        
        // Send email using the real email service
        await this.sendEmail({
          to: recipient.email,
          subject: emailTemplate.subject,
          html: emailTemplate.htmlBody,
          text: emailTemplate.textBody
        })
      }

      console.log(`[EscalationEmail] Email notifications completed for alert ${alertId}`)

    } catch (error) {
      console.error('[EscalationEmail] Error sending escalation emails:', error)
    }
  }

  /**
   * Send email using real email service
   * Integration with Nodemailer or your preferred email service
   */
  public static async sendEmail(options: {
    to: string
    subject: string
    html: string
    text?: string
  }): Promise<void> {
    try {
      // Import and use the real email sender
      const { EmailSender } = await import('./email-sender')
      await EmailSender.sendEmail(options)
      
    } catch (error) {
      console.error('[EscalationEmail] Error sending email:', error)
      
      // Fallback to logging if email service fails
      console.log(`[EscalationEmail] Email would be sent to ${options.to}: ${options.subject}`)
      console.log(`[EscalationEmail] HTML content: ${options.html.substring(0, 200)}...`)
    }
  }
}
