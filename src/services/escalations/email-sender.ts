import nodemailer from 'nodemailer'
import { EscalationEmailService } from './escalation-email-service'

/**
 * Real email service implementation using Nodemailer
 * This replaces the placeholder in EscalationEmailService
 */

export class EmailSender {
  private static transporter: nodemailer.Transporter | null = null

  /**
   * Initialize email transporter with your email service configuration
   * Configure this with your actual email service settings
   */
  private static async initializeTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter
    }

    // Check if email is enabled
    if (process.env.EMAIL_ENABLED !== 'true') {
      throw new Error('Email service is disabled')
    }

    // Configure based on environment variables
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_HOST?.includes('gmail') ? false : (process.env.SMTP_SECURE === 'true'),
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    }

    this.transporter = nodemailer.createTransport(emailConfig)
    
    // Test the connection
    await this.transporter.verify()
    console.log('[EmailSender] Email transporter initialized and verified')
    
    return this.transporter
  }

  /**
   * Send email using Nodemailer
   */
  static async sendEmail(options: {
    to: string
    subject: string
    html: string
    text?: string
  }): Promise<void> {
    try {
      const transporter = await this.initializeTransporter()

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Psychology Buddy" <noreply@psychologybuddy.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      }

      const result = await transporter.sendMail(mailOptions)
      console.log(`[EmailSender] Email sent successfully to ${options.to}:`, result.messageId)
      
    } catch (error) {
      console.error(`[EmailSender] Failed to send email to ${options.to}:`, error)
      throw error
    }
  }

  /**
   * Test email configuration
   */
  static async testEmail(): Promise<boolean> {
    try {
      const transporter = await this.initializeTransporter()
      await transporter.verify()
      console.log('[EmailSender] Email transporter is ready')
      return true
    } catch (error) {
      console.error('[EmailSender] Email transporter test failed:', error)
      return false
    }
  }
}

