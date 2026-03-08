import { createAPIHandler } from '@/src/lib/create-api-handler'
import { StreakService } from '@/src/server/services/streak.service'

export const dynamic = 'force-dynamic'

export const GET = createAPIHandler.get(
  async (_, context) => {
    const streak = await StreakService.getStreak(context.id)
    return {
      count: streak.count,
      lastActive: streak.lastActive
    }
  },
  { requireAuth: true }
)
