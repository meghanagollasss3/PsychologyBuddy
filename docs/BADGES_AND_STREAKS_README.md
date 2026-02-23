# 🏆 Badges & Streaks System

A comprehensive gamification system for the Psychology Buddy app that encourages consistent user engagement through achievement badges and streak tracking.

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Badge Types & Logic](#badge-types--logic)
- [Streak Calculation](#streak-calculation)
- [Automatic Badge Allocation](#automatic-badge-allocation)
- [Admin Management](#admin-management)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Implementation Examples](#implementation-examples)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Badges & Streaks system automatically rewards students for consistent engagement with the Psychology Buddy platform. It tracks various user activities and awards badges when specific milestones are reached.

### Key Features:
- **Automatic Badge Awarding**: No manual intervention required
- **Real-time Streak Tracking**: Monitors daily activity consistency
- **Multiple Badge Types**: Covers all major platform activities
- **Admin Management Interface**: Create, edit, and manage badges
- **Progress Tracking**: Students can see their progress toward earning badges

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Student UI    │    │   Admin Panel   │    │   Badge Service │
│                 │    │                 │    │                 │
│ • View Badges   │    │ • Create Badges │    │ • Evaluate      │
│ • Track Progress│    │ • Edit/Delete   │    │ • Award Badges  │
│ • See Streaks   │    │ • View Stats    │    │ • Calculate     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Activity      │
                    │   Service       │
                    │                 │
                    │ • Track Actions │
                    │ • Update Streak │
                    │ • Trigger Eval │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │                 │
                    │ • Badges        │
                    │ • UserBadges    │
                    │ • Streaks       │
                    │ • Activities    │
                    └─────────────────┘
```

## 🎖️ Badge Types & Logic

### Available Badge Types:

| Type | Description | Example Condition | Tracked Activity |
|------|-------------|-------------------|------------------|
| `STREAK` | Consecutive days of activity | 7-day streak | Daily login, mood check-in, journal, self-help |
| `JOURNAL_COUNT` | Total journal entries | 10 journals | Writing, audio, and art journals |
| `ARTICLE_READ` | Articles read | 5 articles | Psychoeducation articles |
| `MEDITATION_COUNT` | Meditation sessions | 10 sessions | Guided meditation exercises |
| `MUSIC_COUNT` | Music therapy sessions | 15 sessions | Music therapy activities |
| `MOOD_CHECKIN` | Mood check-ins completed | 20 check-ins | Daily mood tracking |

### Badge Evaluation Logic:

```typescript
// For each badge type, the system checks:
switch (badge.type) {
  case 'STREAK':
    return userStats.streakCount >= badge.conditionValue;
  case 'JOURNAL_COUNT':
    return userStats.journalCount >= badge.conditionValue;
  case 'ARTICLE_READ':
    return userStats.articleReadCount >= badge.conditionValue;
  case 'MEDITATION_COUNT':
    return userStats.meditationCount >= badge.conditionValue;
  case 'MUSIC_COUNT':
    return userStats.musicCount >= badge.conditionValue;
  case 'MOOD_CHECKIN':
    return userStats.moodCheckinCount >= badge.conditionValue;
}
```

## 🔥 Streak Calculation

### How Streaks Work:

The streak system tracks consecutive days of activity to encourage consistent engagement.

### Streak Logic Algorithm:

```typescript
function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  const existingStreak = getStreak(userId);
  const lastActive = new Date(existingStreak.lastActive);
  lastActive.setHours(0, 0, 0, 0);

  const daysDiff = getDaysDifference(lastActive, today);

  let newCount = existingStreak.count;

  switch (daysDiff) {
    case 0:
      // Same day - no change to streak
      break;
    case 1:
      // Yesterday - increment streak
      newCount++;
      break;
    default:
      // More than 1 day gap - reset to 1
      newCount = 1;
      break;
  }

  updateStreakCount(userId, newCount, today);
}
```

### Streak Rules:

1. **Same Day Activity**: No change to streak count
2. **Consecutive Day**: Streak increments by 1
3. **Gap (>1 day)**: Streak resets to 1
4. **First Activity**: Creates new streak with count = 1

### Eligible Activities for Streak:

- ✅ Daily login
- ✅ Mood check-in
- ✅ Journal entry (writing, audio, or art)
- ✅ Self-help session completion
- ✅ Resource access (article, meditation, music)

## 🤖 Automatic Badge Allocation

### Trigger Points:

Badges are automatically evaluated and awarded when users perform these activities:

```typescript
// Activity triggers that initiate badge evaluation
1. ActivityService.afterJournalActivity()
2. ActivityService.afterMoodCheckin()
3. ActivityService.afterSelfHelpSession()
4. ActivityService.afterResourceAccess()
5. ActivityService.afterLogin()
```

### Evaluation Process:

```typescript
async function evaluateUserBadges(userId: string) {
  // 1. Get all active badges
  const activeBadges = await getActiveBadges();
  
  // 2. Get user's already earned badges
  const earnedBadges = await getUserEarnedBadges(userId);
  
  // 3. Get user's current statistics
  const userStats = await getUserStats(userId);
  
  // 4. Evaluate each badge condition
  for (const badge of activeBadges) {
    if (alreadyEarned(badge.id)) continue;
    
    const hasEarned = evaluateBadgeCondition(badge, userStats);
    
    if (hasEarned) {
      await awardBadge(userId, badge.id);
    }
  }
}
```

### User Statistics Calculation:

```typescript
async function getUserStats(userId: string) {
  const [
    streak,
    writingJournalCount,
    audioJournalCount,
    artJournalCount,
    allResourceAccess,
    moodCheckinCount,
  ] = await Promise.all([
    // Current streak
    getStreak(userId),
    // Journal counts by type
    countWritingJournals(userId),
    countAudioJournals(userId),
    countArtJournals(userId),
    // All resource access
    getResourceAccess(userId),
    // Mood check-ins
    countMoodCheckins(userId),
  ]);

  // Calculate totals by type
  const articleReadCount = allResourceAccess.filter(ra => ra.resource === 'ARTICLE').length;
  const meditationCount = allResourceAccess.filter(ra => ra.resource === 'MEDITATION').length;
  const musicCount = allResourceAccess.filter(ra => ra.resource === 'MUSIC').length;
  const totalJournalCount = writingJournalCount + audioJournalCount + artJournalCount;

  return {
    streakCount: streak?.count || 0,
    journalCount: totalJournalCount,
    articleReadCount,
    meditationCount,
    musicCount,
    moodCheckinCount,
  };
}
```

## 👨‍💼 Admin Management

### Badge Creation:

Admins can create new badges through the admin panel at `/admin/badges-streaks`:

**Required Fields:**
- **Badge Name**: Human-readable title (e.g., "Week Warrior")
- **Icon**: Emoji representation (e.g., "⭐")
- **Description**: What the badge represents
- **Requirement**: How to earn the badge (display text)
- **Type**: Badge category (STREAK, JOURNAL_COUNT, etc.)
- **Condition Value**: Numeric threshold (e.g., 7 for 7-day streak)
- **Active Status**: Whether badge is available for earning

### Badge Management Features:

- ✅ **Create**: Add new achievement badges
- ✅ **Edit**: Modify existing badge details
- ✅ **Delete**: Remove badges (with confirmation)
- ✅ **Filter**: Search by name, status, or type
- ✅ **Statistics**: View earned counts and engagement metrics

## 🔌 API Endpoints

### Admin Badge Management:

#### Create Badge
```http
POST /api/admin/badges
Authorization: Admin session required

{
  "name": "Week Warrior",
  "icon": "⭐",
  "description": "Maintain a 7-day streak",
  "requirement": "7 consecutive days of activity",
  "type": "STREAK",
  "conditionValue": 7,
  "isActive": true
}
```

#### Get Badges
```http
GET /api/admin/badges?page=1&limit=20&search=warrior&type=STREAK&isActive=true
Authorization: Admin session required
```

#### Update Badge
```http
PATCH /api/admin/badges?id=badge_id
Authorization: Admin session required

{
  "name": "Updated Badge Name",
  "icon": "🏆",
  "conditionValue": 10
}
```

#### Delete Badge
```http
DELETE /api/admin/badges?id=badge_id
Authorization: Admin session required
```

### Student Badge Access:

#### Get User Badges
```http
GET /api/student/badges?page=1&limit=20
Authorization: Student session required

Response:
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "badge_id",
        "name": "Week Warrior",
        "icon": "⭐",
        "description": "7-day streak achieved",
        "progress": 100,
        "earned": true,
        "earnedAt": "2024-01-07T00:00:00.000Z"
      }
    ],
    "earnedCount": 5,
    "inProgressCount": 3
  }
}
```

#### Get User Streak
```http
GET /api/student/streak
Authorization: Student session required

Response:
{
  "success": true,
  "data": {
    "count": 7,
    "lastActive": "2024-01-07T00:00:00.000Z"
  }
}
```

## 🗄️ Database Schema

### Badge Table
```sql
CREATE TABLE Badge (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  requirement TEXT NOT NULL,
  type TEXT NOT NULL, -- 'STREAK', 'JOURNAL_COUNT', etc.
  conditionValue INTEGER,
  isActive BOOLEAN DEFAULT true,
  createdBy TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES User(id)
);
```

### UserBadge Table
```sql
CREATE TABLE UserBadge (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  badgeId TEXT NOT NULL,
  earnedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (badgeId) REFERENCES Badge(id),
  UNIQUE(userId, badgeId)
);
```

### Streak Table
```sql
CREATE TABLE Streak (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 0,
  lastActive DATETIME,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

## 💡 Implementation Examples

### Example 1: Creating a "Week Warrior" Badge

```typescript
// Admin creates badge via API
const response = await fetch('/api/admin/badges', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Week Warrior",
    icon: "⭐",
    description: "Maintain a 7-day streak",
    requirement: "7 consecutive days of activity",
    type: "STREAK",
    conditionValue: 7,
    isActive: true
  })
});
```

### Example 2: User Earning the Badge

```typescript
// User logs in daily for 7 days
// Day 1: StreakService.updateStreak() → streak = 1
// Day 2: StreakService.updateStreak() → streak = 2
// ...
// Day 7: StreakService.updateStreak() → streak = 7

// After streak update, badge evaluation runs:
// BadgeService.evaluateUserBadges(userId)
// → Finds STREAK badge with conditionValue = 7
// → Checks: 7 >= 7 → true
// → Awards badge to user
```

### Example 3: Progress Tracking

```typescript
// Student viewing their progress
const badges = await getUserBadges(userId);

// Response includes progress for unearned badges:
{
  name: "Month Master",
  icon: "🏆",
  progress: 23,  // 23% complete (7 days out of 30)
  earned: false,
  requirement: "30 consecutive days"
}
```

## 🐛 Troubleshooting

### Common Issues:

#### 1. Badges Not Awarding
**Symptoms**: Users meet conditions but don't receive badges

**Solutions**:
- Verify `BadgeService.evaluateUserBadges()` is called after activities
- Check badge `isActive` status in database
- Ensure `conditionValue` matches user statistics
- Review activity triggers are properly connected

#### 2. Streak Not Updating
**Symptoms**: User activity doesn't increment streak

**Solutions**:
- Verify `ActivityService.afterLogin()` is called
- Check `lastActive` date comparison logic
- Ensure `userId` is correct in streak updates
- Confirm activity is marked as eligible for streak

#### 3. Permission Errors
**Symptoms**: 403/401 errors when accessing badge endpoints

**Solutions**:
- Verify user has required permissions (`badges.view`, `badges.assign`)
- Check role assignments in database
- Ensure session is valid and not expired
- Review permission middleware configuration

#### 4. Performance Issues
**Symptoms**: Slow badge evaluation affecting user experience

**Solutions**:
- Optimize database queries with proper indexes
- Consider caching user statistics
- Implement batch evaluation for multiple badges
- Add async processing for non-critical updates

### Debug Mode:

Enable debug logging to trace badge allocation:

```typescript
// In development, add detailed logging
console.log(`Evaluating badges for user ${userId}`);
console.log(`User stats:`, userStats);
console.log(`Badge conditions:`, activeBadges);
console.log(`Awarding badge: ${badge.name} to user ${userId}`);
```

## 🚀 Future Enhancements

### Planned Features:
- **Badge Categories**: Group badges by themes
- **Leaderboards**: Compare progress with peers
- **Badge Sharing**: Share achievements on social media
- **Seasonal Badges**: Limited-time special badges
- **Advanced Analytics**: Detailed engagement insights
- **Custom Badge Paths**: Personalized achievement tracks

### Performance Optimizations:
- **Background Processing**: Async badge evaluation
- **Caching Layer**: Redis for user statistics
- **Batch Operations**: Bulk badge updates
- **Real-time Updates**: WebSocket integration

---

## 📞 Support

For technical support or questions about the Badges & Streaks system:

1. Check this documentation first
2. Review the troubleshooting section
3. Check database logs for errors
4. Verify API endpoint configurations
5. Test with debug logging enabled

**System Requirements**: Node.js 18+, Next.js 14+, Prisma ORM
