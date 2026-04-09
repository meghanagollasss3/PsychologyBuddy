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
      // Get student's school information
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

        // 2. Get Primary Admin of school
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

      // Remove duplicates
      const uniqueRecipients = recipients.filter((recipient, index, self) =>
        index === self.findIndex((r) => r.id === recipient.id)
      )

      console.log(`[EscalationEmail] Found ${uniqueRecipients.length} admin recipients`)
      return uniqueRecipients

    } catch (error) {
      console.error('[EscalationEmail] Error getting admin recipients:', error)
      return []
    }
  }

  /**
   * Generates modern HTML email template for escalation alert
   */
  private static generateHtmlTemplate(data: EmailNotificationData): string {
    const severityColors = {
      critical: '#dc2626',
      high: '#ea580c', 
      medium: '#f59e0b',
      low: '#10b981'
    }

    const severityColor = severityColors[data.level as keyof typeof severityColors] || '#6b7280'

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Escalation Alert - ${data.studentName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #374151;
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
          }
          
          .container {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .header {
            background: ${severityColor};
            color: white;
            padding: 24px 32px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 20px;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .header p {
            font-size: 14px;
            opacity: 0.9;
          }
          
          .content {
            padding: 32px;
          }
          
          .section {
            margin-bottom: 28px;
          }
          
          .section:last-child {
            margin-bottom: 0;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
          }
          
          .info-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
            font-weight: 500;
          }
          
          .info-value {
            font-size: 14px;
            color: #111827;
            font-weight: 400;
          }
          
          .severity-badge {
            display: inline-block;
            padding: 4px 8px;
            background: ${severityColor};
            color: white;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-radius: 4px;
          }
          
          .context-box {
            background: #f9fafb;
            border-left: 3px solid ${severityColor};
            padding: 16px;
            font-style: italic;
            color: #4b5563;
            font-size: 14px;
            line-height: 1.6;
            margin-top: 12px;
          }
          
          .recommendation-box {
            background: #f0fdf4;
            border-left: 3px solid #10b981;
            padding: 16px;
            color: #065f46;
            font-size: 14px;
            line-height: 1.6;
            margin-top: 12px;
          }
          
          .action-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            padding: 20px;
            text-align: center;
            margin-top: 20px;
          }
          
          .action-box h3 {
            color: #dc2626;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .action-box p {
            color: #991b1b;
            font-size: 14px;
          }
          
          .phrases {
            margin-top: 12px;
          }
          
          .phrase {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 500;
            border-radius: 4px;
            margin: 2px 4px 2px 0;
          }
          
          .footer {
            background: #f9fafb;
            padding: 20px 32px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
          
          @media (max-width: 600px) {
            body {
              margin: 20px;
            }
            
            .content {
              padding: 24px;
            }
            
            .info-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ESCALATION ALERT</h1>
            <p>Immediate attention required</p>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">Student Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Name</span>
                  <span class="info-value">${data.studentName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Student ID</span>
                  <span class="info-value">${data.studentId}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Class</span>
                  <span class="info-value">${data.studentClass || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">School</span>
                  <span class="info-value">${data.schoolName || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Alert Details</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Category</span>
                  <span class="info-value">${data.category.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Severity</span>
                  <span class="severity-badge">${data.level.toUpperCase()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Score</span>
                  <span class="info-value">${data.severity}/10</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Detected</span>
                  <span class="info-value">${new Date(data.messageTimestamp).toLocaleString()}</span>
                </div>
              </div>
              
              ${data.detectedPhrases && data.detectedPhrases.length > 0 ? `
              <div class="phrases">
                <span class="info-label">Key Indicators</span>
                <div style="margin-top: 8px;">
                  ${data.detectedPhrases.map(phrase => `<span class="phrase">${phrase}</span>`).join('')}
                </div>
              </div>
              ` : ''}
            </div>
            
            ${data.context ? `
            <div class="section">
              <div class="section-title">Context</div>
              <div class="context-box">
                "${data.context}"
              </div>
            </div>
            ` : ''}
            
            ${data.recommendation ? `
            <div class="section">
              <div class="section-title">Recommendation</div>
              <div class="recommendation-box">
                ${data.recommendation}
              </div>
            </div>
            ` : ''}
            
            ${data.requiresImmediateAction ? `
            <div class="action-box">
              <h3>Action Required</h3>
              <p>Please check your admin dashboard immediately and take appropriate action.</p>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Alert ID: ${data.alertId} | Generated: ${new Date().toLocaleString()}</p>
            <p>This is an automated alert from Psychology Buddy.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generates email template for escalation alert
   */
  public static generateEmailTemplate(data: EmailNotificationData): EmailTemplate {
    const htmlBody = this.generateHtmlTemplate(data)
    
    const subject = `🚨 ${data.level.toUpperCase()} ESCALATION: ${data.category.replace('_', ' ').toUpperCase()} - ${data.studentName}`

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
