import { DailySummaryEmailService } from '../escalations/daily-summary-email-service'

export class DailySummaryScheduler {
  private static intervalId: NodeJS.Timeout | null = null
  private static isRunning = false

  /**
   * Start the daily summary scheduler
   * Runs every day at the specified time (default: 9:00 AM)
   */
  static startScheduler(hour: number = 9, minute: number = 0): void {
    if (this.isRunning) {
      console.log('[DailySummaryScheduler] Scheduler is already running')
      return
    }

    console.log(`[DailySummaryScheduler] Starting daily summary scheduler for ${hour}:${minute.toString().padStart(2, '0')}`)

    // Calculate time until next scheduled run
    const now = new Date()
    const scheduledTime = new Date()
    scheduledTime.setHours(hour, minute, 0, 0)

    // If the scheduled time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeUntilFirstRun = scheduledTime.getTime() - now.getTime()

    // Schedule the first run
    setTimeout(() => {
      this.runDailySummary()
      
      // Then set up recurring daily runs
      this.intervalId = setInterval(() => {
        this.runDailySummary()
      }, 24 * 60 * 60 * 1000) // 24 hours

    }, timeUntilFirstRun)

    this.isRunning = true

    console.log(`[DailySummaryScheduler] First daily summary scheduled for ${scheduledTime.toLocaleString()}`)
  }

  /**
   * Stop the daily summary scheduler
   */
  static stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('[DailySummaryScheduler] Daily summary scheduler stopped')
  }

  /**
   * Check if scheduler is running
   */
  static isSchedulerRunning(): boolean {
    return this.isRunning
  }

  /**
   * Run the daily summary immediately
   */
  static async runDailySummary(date?: Date): Promise<void> {
    try {
      console.log(`[DailySummaryScheduler] Running daily summary for ${date?.toDateString() || 'today'}`)
      
      await DailySummaryEmailService.sendDailySummaryEmails(date)
      
      console.log('[DailySummaryScheduler] Daily summary completed successfully')
    } catch (error) {
      console.error('[DailySummaryScheduler] Daily summary failed:', error)
    }
  }

  /**
   * Test the daily summary generation without sending emails
   */
  static async testDailySummary(date?: Date): Promise<void> {
    try {
      console.log(`[DailySummaryScheduler] Testing daily summary for ${date?.toDateString() || 'today'}`)
      
      await DailySummaryEmailService.testDailySummary(date)
      
      console.log('[DailySummaryScheduler] Daily summary test completed')
    } catch (error) {
      console.error('[DailySummaryScheduler] Daily summary test failed:', error)
    }
  }

  /**
   * Get next scheduled run time
   */
  static getNextScheduledRun(hour: number = 9, minute: number = 0): Date | null {
    if (!this.isRunning) {
      return null
    }

    const now = new Date()
    const nextRun = new Date()
    nextRun.setHours(hour, minute, 0, 0)

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }

    return nextRun
  }

  /**
   * Configure scheduler from environment variables
   */
  static configureFromEnv(): void {
    const hour = parseInt(process.env.DAILY_SUMMARY_HOUR || '9')
    const minute = parseInt(process.env.DAILY_SUMMARY_MINUTE || '0')
    const enabled = process.env.DAILY_SUMMARY_ENABLED === 'true'

    console.log(`[DailySummaryScheduler] Configuration: enabled=${enabled}, time=${hour}:${minute.toString().padStart(2, '0')}`)

    if (enabled && !this.isRunning) {
      this.startScheduler(hour, minute)
    } else if (!enabled && this.isRunning) {
      this.stopScheduler()
    }
  }
}

// Auto-start scheduler if enabled in environment
if (process.env.NODE_ENV !== 'test' && process.env.DAILY_SUMMARY_ENABLED === 'true') {
  DailySummaryScheduler.configureFromEnv()
}
