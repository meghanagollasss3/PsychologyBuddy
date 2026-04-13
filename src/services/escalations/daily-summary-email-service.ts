import prisma from '../../prisma'
import { EmailSender } from './email-sender'

export interface DailySummaryData {
  date: string
  totalStudents: number
  activeStudents: number
  totalSessions: number
  totalMessages: number
  escalationAlerts: {
    total: number
    byLevel: Record<string, number>
    byCategory: Record<string, number>
    critical: number[]
    high: number[]
  }
  moodCheckins: {
    total: number
    averageMood: string
    moodDistribution: Record<string, number>
  }
  journalingActivity: {
    writing: number
    audio: number
    art: number
  }
  meditationActivity: {
    sessions: number
    totalMinutes: number
    topCategories: string[]
  }
  articlesActivity: {
    views: number
    completions: number
    averageRating: number
  }
  newUsers: number
  schools: {
    total: number
    active: number
  }
}

export interface DailySummaryEmailTemplate {
  subject: string
  htmlBody: string
  textBody?: string
}

export class DailySummaryEmailService {
  /**
   * Gets all admin recipients for daily summary
   */
  private static async getAllAdmins(): Promise<any[]> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: {
            name: {
              in: ['SCHOOL_SUPERADMIN', 'ADMIN', 'COUNSELOR']
            }
          },
          status: 'ACTIVE',
          email: {
            not: null as any
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
          },
          school: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return admins.map((admin: any) => ({
        ...admin,
        role: admin.role.name,
        schoolId: admin.school?.id,
        schoolName: admin.school?.name || 'System Admin'
      }))
    } catch (error) {
      console.error('[DailySummaryEmail] Error getting admins:', error)
      return []
    }
  }

  /**
   * Collects daily platform activity data
   */
  private static async collectDailySummaryData(date: Date): Promise<DailySummaryData> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    try {
      // Get basic user stats
      const [totalStudents, activeStudents, newUsers] = await Promise.all([
        prisma.user.count({
          where: {
            role: { name: 'STUDENT' },
            status: 'ACTIVE'
          }
        }),
        prisma.user.count({
          where: {
            role: { name: 'STUDENT' },
            status: 'ACTIVE',
            dailyLogins: {
              some: {
                date: {
                  gte: startOfDay,
                  lte: endOfDay
                }
              }
            }
          }
        }),
        prisma.user.count({
          where: {
            role: { name: 'STUDENT' },
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        })
      ])

      // Get session and message stats
      const [totalSessions, totalMessages] = await Promise.all([
        prisma.chatSession.count({
          where: {
            startedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        prisma.chatMessage.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        })
      ])

      // Get escalation alerts
      const escalationAlerts = await prisma.escalationAlert.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        select: {
          id: true,
          level: true,
          category: true,
          severity: true
        }
      })

      const escalationStats = {
        total: escalationAlerts.length,
        byLevel: escalationAlerts.reduce((acc, alert) => {
          acc[alert.level] = (acc[alert.level] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byCategory: escalationAlerts.reduce((acc, alert) => {
          acc[alert.category] = (acc[alert.category] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        critical: escalationAlerts.filter(alert => alert.level === 'critical').map(alert => parseInt(alert.id)),
        high: escalationAlerts.filter(alert => alert.level === 'high').map(alert => parseInt(alert.id))
      }

      // Get mood checkins
      const moodCheckins = await prisma.moodCheckin.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        select: {
          mood: true
        }
      })

      const moodStats = {
        total: moodCheckins.length,
        averageMood: moodCheckins.length > 0 
          ? moodCheckins.reduce((acc, checkin) => {
              const moodValue = this.getMoodValue(checkin.mood)
              return acc + moodValue
            }, 0) / moodCheckins.length > 3 ? 'Positive' : 
            moodCheckins.reduce((acc, checkin) => {
              const moodValue = this.getMoodValue(checkin.mood)
              return acc + moodValue
            }, 0) / moodCheckins.length > 2 ? 'Neutral' : 'Concerning'
          : 'No data',
        moodDistribution: moodCheckins.reduce((acc, checkin) => {
          acc[checkin.mood] = (acc[checkin.mood] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      // Get journaling activity
      const [writingJournals, audioJournals, artJournals] = await Promise.all([
        prisma.writingJournal.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        prisma.audioJournal.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        prisma.artJournal.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        })
      ])

      // Get meditation activity
      const meditationSessions = await prisma.meditation.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          categories: {
            include: {
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      const meditationStats = {
        sessions: meditationSessions.length,
        totalMinutes: meditationSessions.reduce((acc, session) => acc + ((session as any).duration || 0), 0),
        topCategories: meditationSessions
          .flatMap(session => session.categories.map(cat => cat.category.name))
          .reduce((acc, category) => {
            acc[category] = (acc[category] || 0) + 1
            return acc
          }, {} as Record<string, number>)
      }

      // Get article activity
      const [articleViews, articleCompletions] = await Promise.all([
        prisma.article.aggregate({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          _sum: {
            views: true
          }
        }),
        prisma.articleCompletion.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        })
      ])

      // Get school stats
      const [totalSchools, activeSchools] = await Promise.all([
        prisma.school.count(),
        prisma.school.count({
          where: {
            users: {
              some: {
                role: { name: 'STUDENT' },
                dailyLogins: {
                  some: {
                    date: {
                      gte: startOfDay,
                      lte: endOfDay
                    }
                  }
                }
              }
            }
          }
        })
      ])

      return {
        date: date.toLocaleDateString(),
        totalStudents,
        activeStudents,
        totalSessions,
        totalMessages,
        escalationAlerts: escalationStats,
        moodCheckins: moodStats,
        journalingActivity: {
          writing: writingJournals,
          audio: audioJournals,
          art: artJournals
        },
        meditationActivity: {
          ...meditationStats,
          topCategories: Object.entries(meditationStats.topCategories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([category]) => category)
        },
        articlesActivity: {
          views: articleViews._sum.views || 0,
          completions: articleCompletions,
          averageRating: 0 // Would need to calculate from ratings
        },
        newUsers,
        schools: {
          total: totalSchools,
          active: activeSchools
        }
      }
    } catch (error) {
      console.error('[DailySummaryEmail] Error collecting daily data:', error)
      throw error
    }
  }

  /**
   * Converts mood to numeric value for calculation
   */
  private static getMoodValue(mood: string): number {
    const moodValues: Record<string, number> = {
      'happy': 5,
      'excited': 5,
      'great': 5,
      'good': 4,
      'okay': 3,
      'neutral': 3,
      'sad': 2,
      'anxious': 2,
      'angry': 1,
      'depressed': 1,
      'stressed': 1
    }
    return moodValues[mood.toLowerCase()] || 3
  }

  /**
   * Generates HTML email template for daily summary
   */
  public static generateDailySummaryTemplate(data: DailySummaryData): DailySummaryEmailTemplate {
    const subject = `📊 Daily Platform Summary - ${data.date}`

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Platform Summary</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        
        <!-- Email Container -->
        <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
              Daily Platform Summary
            </h1>
            <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 18px; font-weight: 500;">
              ${data.date}
            </p>
          </div>

          <!-- Key Metrics Grid -->
          <div style="padding: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px;">
              <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 12px; padding: 16px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #1e40af;">${data.activeStudents}</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 500;">Active Students</div>
              </div>
              <div style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); border-radius: 12px; padding: 16px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #166534;">${data.totalSessions}</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 500;">Chat Sessions</div>
              </div>
              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 16px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #92400e;">${data.totalMessages}</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 500;">Messages</div>
              </div>
              <div style="background: linear-gradient(135deg, #ede9fe, #ddd6fe); border-radius: 12px; padding: 16px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #5b21b6;">${data.newUsers}</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 500;">New Users</div>
              </div>
            </div>

            <!-- Escalation Alerts Section -->
            <div style="background: ${data.escalationAlerts.critical.length > 0 ? '#fee2e2' : '#f1f5f9'}; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${data.escalationAlerts.critical.length > 0 ? '#ef4444' : '#64748b'};">
              <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                🚨 Escalation Alerts
              </h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 12px;">
                <div>
                  <div style="font-size: 20px; font-weight: 700; color: #dc2626;">${data.escalationAlerts.total}</div>
                  <div style="font-size: 11px; color: #64748b;">Total Alerts</div>
                </div>
                <div>
                  <div style="font-size: 20px; font-weight: 700; color: #dc2626;">${data.escalationAlerts.critical.length}</div>
                  <div style="font-size: 11px; color: #64748b;">Critical</div>
                </div>
                <div>
                  <div style="font-size: 20px; font-weight: 700; color: #ea580c;">${data.escalationAlerts.high.length}</div>
                  <div style="font-size: 11px; color: #64748b;">High</div>
                </div>
              </div>
              ${data.escalationAlerts.critical.length > 0 ? '<div style="color: #dc2626; font-weight: 600; font-size: 14px;">⚠️ Critical alerts require immediate attention</div>' : ''}
            </div>

            <!-- Activity Breakdown -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
              <!-- Mood Checkins -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 16px;">
                <h3 style="margin: 0 0 12px 0; color: #475569; font-size: 14px; font-weight: 600;">
                  😊 Mood Check-ins
                </h3>
                <div style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">${data.moodCheckins.total}</div>
                <div style="font-size: 12px; color: #64748b;">Average: ${data.moodCheckins.averageMood}</div>
              </div>

              <!-- Journaling Activity -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 16px;">
                <h3 style="margin: 0 0 12px 0; color: #475569; font-size: 14px; font-weight: 600;">
                  📝 Journaling Activity
                </h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 12px;">
                  <div style="text-align: center;">
                    <div style="font-weight: 700; color: #1e293b;">${data.journalingActivity.writing}</div>
                    <div style="color: #64748b;">Writing</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-weight: 700; color: #1e293b;">${data.journalingActivity.audio}</div>
                    <div style="color: #64748b;">Audio</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-weight: 700; color: #1e293b;">${data.journalingActivity.art}</div>
                    <div style="color: #64748b;">Art</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Meditation & Articles -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Meditation -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 16px;">
                <h3 style="margin: 0 0 12px 0; color: #475569; font-size: 14px; font-weight: 600;">
                  🧘 Meditation
                </h3>
                <div style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">${data.meditationActivity.sessions} sessions</div>
                <div style="font-size: 12px; color: #64748b;">${Math.round(data.meditationActivity.totalMinutes)} minutes total</div>
              </div>

              <!-- Articles -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 16px;">
                <h3 style="margin: 0 0 12px 0; color: #475569; font-size: 14px; font-weight: 600;">
                  📖 Articles
                </h3>
                <div style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">${data.articlesActivity.views} views</div>
                <div style="font-size: 12px; color: #64748b;">${data.articlesActivity.completions} completions</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="margin-bottom: 16px;">
              <div style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                View Admin Dashboard
              </div>
            </div>
            <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
              This is an automated daily summary from Psychology Buddy.<br>
              Generated: ${new Date().toLocaleString()}
            </p>
          </div>

        </div>

      </body>
      </html>
    `

    const textBody = `
DAILY PLATFORM SUMMARY - ${data.date}

KEY METRICS:
- Active Students: ${data.activeStudents}
- Chat Sessions: ${data.totalSessions}
- Messages: ${data.totalMessages}
- New Users: ${data.newUsers}

ESCALATION ALERTS:
- Total Alerts: ${data.escalationAlerts.total}
- Critical: ${data.escalationAlerts.critical.length}
- High: ${data.escalationAlerts.high.length}

ACTIVITY BREAKDOWN:
- Mood Check-ins: ${data.moodCheckins.total} (Average: ${data.moodCheckins.averageMood})
- Journaling: ${data.journalingActivity.writing} writing, ${data.journalingActivity.audio} audio, ${data.journalingActivity.art} art
- Meditation: ${data.meditationActivity.sessions} sessions (${Math.round(data.meditationActivity.totalMinutes)} minutes)
- Articles: ${data.articlesActivity.views} views, ${data.articlesActivity.completions} completions

Generated: ${new Date().toLocaleString()}
    `

    return { subject, htmlBody, textBody }
  }

  /**
   * Sends daily summary emails to all admins
   */
  static async sendDailySummaryEmails(date: Date = new Date()): Promise<void> {
    try {
      console.log(`[DailySummaryEmail] Starting daily summary for ${date.toDateString()}`)

      // Collect daily data
      const summaryData = await this.collectDailySummaryData(date)
      
      // Get all admin recipients
      const admins = await this.getAllAdmins()
      
      if (admins.length === 0) {
        console.log('[DailySummaryEmail] No admin recipients found')
        return
      }

      // Generate email template
      const emailTemplate = this.generateDailySummaryTemplate(summaryData)

      // Send emails to all admins
      console.log(`[DailySummaryEmail] Sending daily summary to ${admins.length} admins`)
      
      for (const admin of admins) {
        try {
          await EmailSender.sendEmail({
            to: admin.email,
            subject: emailTemplate.subject,
            html: emailTemplate.htmlBody,
            text: emailTemplate.textBody
          })
          
          console.log(`[DailySummaryEmail] Daily summary sent to: ${admin.email} (${admin.role})`)
        } catch (error) {
          console.error(`[DailySummaryEmail] Failed to send daily summary to ${admin.email}:`, error)
        }
      }

      console.log(`[DailySummaryEmail] Daily summary emails completed for ${date.toDateString()}`)

    } catch (error) {
      console.error('[DailySummaryEmail] Error sending daily summary emails:', error)
    }
  }

  /**
   * Test daily summary generation
   */
  static async testDailySummary(date: Date = new Date()): Promise<void> {
    try {
      console.log('[DailySummaryEmail] Testing daily summary generation...')
      
      const summaryData = await this.collectDailySummaryData(date)
      const emailTemplate = this.generateDailySummaryTemplate(summaryData)
      
      console.log('[DailySummaryEmail] Daily summary test completed successfully')
      console.log('[DailySummaryEmail] Summary data:', JSON.stringify(summaryData, null, 2))
      console.log('[DailySummaryEmail] Email subject:', emailTemplate.subject)
      
    } catch (error) {
      console.error('[DailySummaryEmail] Daily summary test failed:', error)
    }
  }
}
