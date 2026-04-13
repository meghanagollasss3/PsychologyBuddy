import { NextRequest, NextResponse } from 'next/server'
import { DailySummaryEmailService } from '@/src/services/escalations/daily-summary-email-service'
import { DailySummaryScheduler } from '@/src/services/scheduler/daily-summary-scheduler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, date, hour, minute } = body

    switch (action) {
      case 'send':
        // Send daily summary for specified date (or today if not provided)
        const targetDate = date ? new Date(date) : new Date()
        await DailySummaryEmailService.sendDailySummaryEmails(targetDate)
        
        return NextResponse.json({ 
          success: true, 
          message: `Daily summary sent for ${targetDate.toDateString()}` 
        })

      case 'test':
        // Test daily summary generation without sending emails
        const testDate = date ? new Date(date) : new Date()
        await DailySummaryEmailService.testDailySummary(testDate)
        
        return NextResponse.json({ 
          success: true, 
          message: `Daily summary test completed for ${testDate.toDateString()}` 
        })

      case 'start-scheduler':
        // Start the scheduler with optional custom time
        const startHour = hour || 9
        const startMinute = minute || 0
        DailySummaryScheduler.startScheduler(startHour, startMinute)
        
        return NextResponse.json({ 
          success: true, 
          message: `Scheduler started for ${startHour}:${startMinute.toString().padStart(2, '0')}` 
        })

      case 'stop-scheduler':
        // Stop the scheduler
        DailySummaryScheduler.stopScheduler()
        
        return NextResponse.json({ 
          success: true, 
          message: 'Scheduler stopped' 
        })

      case 'status':
        // Get scheduler status
        const isRunning = DailySummaryScheduler.isSchedulerRunning()
        const nextRun = DailySummaryScheduler.getNextScheduledRun()
        
        return NextResponse.json({ 
          success: true, 
          data: {
            isRunning,
            nextRun: nextRun ? nextRun.toISOString() : null,
            nextRunFormatted: nextRun ? nextRun.toLocaleString() : null
          }
        })

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use: send, test, start-scheduler, stop-scheduler, or status' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('[API] Daily summary error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process daily summary request' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get scheduler status
    const isRunning = DailySummaryScheduler.isSchedulerRunning()
    const nextRun = DailySummaryScheduler.getNextScheduledRun()
    
    return NextResponse.json({ 
      success: true, 
      data: {
        isRunning,
        nextRun: nextRun ? nextRun.toISOString() : null,
        nextRunFormatted: nextRun ? nextRun.toLocaleString() : null,
        configuredTime: {
          hour: parseInt(process.env.DAILY_SUMMARY_HOUR || '9'),
          minute: parseInt(process.env.DAILY_SUMMARY_MINUTE || '0'),
          enabled: process.env.DAILY_SUMMARY_ENABLED === 'true'
        }
      }
    })

  } catch (error) {
    console.error('[API] Daily summary status error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get daily summary status' 
    }, { status: 500 })
  }
}
