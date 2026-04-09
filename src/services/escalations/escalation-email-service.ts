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
    const urgencyLevel = data.requiresImmediateAction ? 'URGENT - ' : ''
    const severityColor = data.level === 'critical' ? '#dc2626' : 
                         data.level === 'high' ? '#ea580c' : 
                         data.level === 'medium' ? '#ca8a04' : '#65a30d'

    const subject = `${urgencyLevel}Escalation Alert: ${data.category.replace('_', ' ').toUpperCase()} - ${data.studentName}`

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Escalation Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8fafc; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .alert-level { display: inline-block; padding: 6px 12px; border-radius: 4px; color: white; font-weight: bold; margin: 10px 0; }
        .content { background: white; padding: 20px; border: 1px solid #e5e7eb; }
        .student-info { background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .alert-details { margin: 20px 0; }
        .footer { background: #f8fafc; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
        .urgent { color: #dc2626; font-weight: bold; }
        .action-required { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Psychology Buddy - Escalation Alert</h1>
            <div class="alert-level" style="background-color: ${severityColor};">
                ${data.level.toUpperCase()} SEVERITY
            </div>
            ${data.requiresImmediateAction ? '<p class="urgent">IMMEDIATE ATTENTION REQUIRED</p>' : ''}
        </div>

        <div class="content">
            <h2>Student Information</h2>
            <div class="student-info">
                <p><strong>Name:</strong> ${data.studentName}</p>
                <p><strong>Class:</strong> ${data.studentClass || 'Not assigned'}</p>
                <p><strong>Student ID:</strong> ${data.studentId}</p>
                ${data.schoolName ? `<p><strong>School:</strong> ${data.schoolName}</p>` : ''}
            </div>

            <h2>Alert Details</h2>
            <div class="alert-details">
                <p><strong>Category:</strong> ${data.category.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Severity Level:</strong> ${data.level.toUpperCase()}</p>
                <p><strong>Detection Method:</strong> ${data.detectionMethod}</p>
                <p><strong>Detected:</strong> ${new Date(data.messageTimestamp).toLocaleString()}</p>
                <p><strong>Description:</strong> ${data.description}</p>
                
                ${data.detectedPhrases.length > 0 ? `
                <p><strong>Key Indicators:</strong></p>
                <ul>
                    ${data.detectedPhrases.map(phrase => `<li>${phrase}</li>`).join('')}
                </ul>
                ` : ''}
                
                ${data.context ? `
                <p><strong>Context:</strong></p>
                <p style="background: #f9fafb; padding: 10px; border-radius: 4px; font-style: italic;">
                    ${data.context}
                </p>
                ` : ''}
                
                ${data.recommendation ? `
                <p><strong>Recommendation:</strong></p>
                <p style="background: #ecfdf5; padding: 10px; border-radius: 4px;">
                    ${data.recommendation}
                </p>
                ` : ''}
            </div>

            ${data.requiresImmediateAction ? `
            <div class="action-required">
                <h3 style="color: #dc2626; margin-top: 0;">Action Required</h3>
                <p>This escalation requires immediate attention. Please log in to the Psychology Buddy admin panel to review and take appropriate action.</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 20px 0;">
                <a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Alert in Admin Panel
                </a>
            </div>
        </div>

        <div class="footer">
            <p>This is an automated alert from the Psychology Buddy system.</p>
            <p>If you believe this is an error or need assistance, please contact your system administrator.</p>
            <p>Alert ID: ${data.alertId}</p>
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
