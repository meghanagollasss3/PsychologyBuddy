# 📊 Badge Type Counting System

## 🎯 Overview

Each badge type in the Psychology Buddy system is tracked through specific database tables and activities. Here's how the counting works for each badge type:

## 🗄️ Database Tables Used for Badge Counting

### 1. **STREAK** Badges
**Tracked via**: `Streak` table
```sql
model Streak {
  id        String   @id @default(cuid())
  userId    String   @unique
  count     Int      @default(0)      -- Current streak count
  lastActive DateTime                   -- Last activity date
}
```

**How it's counted**:
- Current streak value stored directly in `Streak.count`
- Updated via `StreakService.updateStreak()` after any eligible activity
- Algorithm: Same day (no change), consecutive day (+1), gap (>1 day, reset to 1)

### 2. **JOURNAL_COUNT** Badges
**Tracked via**: Three separate journal tables
```sql
model WritingJournal {
  id     String @id @default(cuid())
  userId String
  title  String?
  content String?
  -- Other fields...
}

model AudioJournal {
  id     String @id @default(cuid())
  userId String
  title  String?
  audioUrl String?
  -- Other fields...
}

model ArtJournal {
  id       String @id @default(cuid())
  userId   String
  imageUrl String?
  -- Other fields...
}
```

**How it's counted**:
```typescript
// Sum of all journal types
const writingJournalCount = await prisma.writingJournal.count({ where: { userId } });
const audioJournalCount = await prisma.audioJournal.count({ where: { userId } });
const artJournalCount = await prisma.artJournal.count({ where: { userId } });

const totalJournalCount = writingJournalCount + audioJournalCount + artJournalCount;
```

### 3. **ARTICLE_READ** Badges
**Tracked via**: `ResourceAccess` table with resource type filtering
```sql
model ResourceAccess {
  id       String @id @default(cuid())
  userId   String
  resource String   -- 'ARTICLE', 'MEDITATION', 'MUSIC'
  createdAt DateTime @default(now())
}
```

**How it's counted**:
```typescript
// Filter by resource type
const allResourceAccess = await prisma.resourceAccess.findMany({
  where: { userId },
  select: { resource: true },
});

const articleReadCount = allResourceAccess.filter(ra => ra.resource === 'ARTICLE').length;
```

### 4. **MEDITATION_COUNT** Badges
**Tracked via**: `ResourceAccess` table + `Meditation` table
```sql
model Meditation {
  id          String @id @default(cuid())
  title       String
  description String
  audioUrl    String?
  duration    Int?
  -- Other fields...
}
```

**How it's counted**:
```typescript
// Two ways to track meditation:
// Method 1: Resource access (when user clicks to play)
const meditationCount = allResourceAccess.filter(ra => ra.resource === 'MEDITATION').length;

// Method 2: Actual meditation completion (more accurate)
// Currently uses ResourceAccess, but could be enhanced to track completed meditations
```

### 5. **MUSIC_COUNT** Badges
**Tracked via**: `ResourceAccess` table with resource type filtering
```sql
model MusicTherapy {
  id          String @id @default(cuid())
  title       String
  description String
  audioUrl    String?
  duration    Int?
  -- Other fields...
}
```

**How it's counted**:
```typescript
// Filter by music resource type
const musicCount = allResourceAccess.filter(ra => ra.resource === 'MUSIC').length;
```

### 6. **MOOD_CHECKIN** Badges
**Tracked via**: `MoodCheckin` table
```sql
model MoodCheckin {
  id        String @id @default(cuid())
  userId    String
  mood      String    -- 'happy', 'sad', 'anxious', etc.
  note      String?
  intensity  Int?       -- 1-10 scale
  createdAt DateTime @default(now())
}
```

**How it's counted**:
```typescript
const moodCheckinCount = await prisma.moodCheckin.count({ where: { userId } });
```

## 🔄 Real-time Counting Process

### When Counts Update:

1. **User performs activity** → Service method called
2. **Database record created** → Corresponding table updated
3. **Badge evaluation triggered** → `BadgeService.evaluateUserBadges()`
4. **Statistics recalculated** → All badge type counts updated
5. **Badge conditions checked** → Awards badges if thresholds met

### Activity Triggers:

```typescript
// Each activity updates specific counts:
ActivityService.afterJournalActivity()     → JOURNAL_COUNT++
ActivityService.afterMoodCheckin()       → MOOD_CHECKIN++
ActivityService.afterSelfHelpSession()    → MEDITATION_COUNT++ or MUSIC_COUNT++
ActivityService.afterResourceAccess()       → ARTICLE_READ++ or MEDITATION_COUNT++ or MUSIC_COUNT++
ActivityService.afterLogin()               → STREAK evaluation
```

## 📈 Performance Considerations

### Current Implementation:
- ✅ **Simple counting**: Direct table counts and filtering
- ✅ **Real-time**: Updates immediately after activities
- ✅ **Scalable**: Works with growing user base

### Potential Optimizations:

#### 1. **Indexing for Performance**:
```sql
-- Recommended database indexes
CREATE INDEX idx_resource_access_user_resource ON "ResourceAccess"(userId, resource);
CREATE INDEX idx_mood_checkin_user ON "MoodCheckin"(userId);
CREATE INDEX idx_writing_journal_user ON "WritingJournal"(userId);
CREATE INDEX idx_audio_journal_user ON "AudioJournal"(userId);
CREATE INDEX idx_art_journal_user ON "ArtJournal"(userId);
```

#### 2. **Caching Layer**:
```typescript
// Cache user statistics to avoid repeated queries
const userStatsCache = new Map<string, UserStats>();

async function getCachedUserStats(userId: string): Promise<UserStats> {
  if (userStatsCache.has(userId)) {
    return userStatsCache.get(userId)!;
  }
  
  const stats = await calculateUserStats(userId);
  userStatsCache.set(userId, stats);
  
  // Invalidate cache after 5 minutes
  setTimeout(() => userStatsCache.delete(userId), 5 * 60 * 1000);
  
  return stats;
}
```

#### 3. **Batch Processing**:
```typescript
// Process multiple badge evaluations in batches
async function batchEvaluateBadges(userIds: string[]) {
  const batchSize = 50;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    await Promise.all(batch.map(userId => evaluateUserBadges(userId)));
  }
}
```

## 🎯 Badge Threshold Examples

### Example Badge Configurations:

#### "Week Warrior" - STREAK Badge
```json
{
  "name": "Week Warrior",
  "icon": "⭐",
  "type": "STREAK",
  "conditionValue": 7,
  "description": "Maintain a 7-day streak"
}
// Awarded when: Streak.count >= 7
```

#### "Journal Starter" - JOURNAL_COUNT Badge
```json
{
  "name": "Journal Starter", 
  "icon": "📝",
  "type": "JOURNAL_COUNT",
  "conditionValue": 5,
  "description": "Write 5 journal entries"
}
// Awarded when: (WritingJournal + AudioJournal + ArtJournal).count >= 5
```

#### "Knowledge Seeker" - ARTICLE_READ Badge
```json
{
  "name": "Knowledge Seeker",
  "icon": "📚", 
  "type": "ARTICLE_READ",
  "conditionValue": 10,
  "description": "Read 10 articles"
}
// Awarded when: ResourceAccess.resource = 'ARTICLE'.count >= 10
```

#### "Meditation Practitioner" - MEDITATION_COUNT Badge
```json
{
  "name": "Meditation Practitioner",
  "icon": "🧘",
  "type": "MEDITATION_COUNT", 
  "conditionValue": 15,
  "description": "Complete 15 meditation sessions"
}
// Awarded when: ResourceAccess.resource = 'MEDITATION'.count >= 15
```

#### "Music Enthusiast" - MUSIC_COUNT Badge
```json
{
  "name": "Music Enthusiast",
  "icon": "🎵",
  "type": "MUSIC_COUNT",
  "conditionValue": 20, 
  "description": "Listen to 20 music therapy sessions"
}
// Awarded when: ResourceAccess.resource = 'MUSIC'.count >= 20
```

#### "Mood Regular" - MOOD_CHECKIN Badge
```json
{
  "name": "Mood Regular",
  "icon": "😊",
  "type": "MOOD_CHECKIN",
  "conditionValue": 30,
  "description": "Complete 30 mood check-ins"
}
// Awarded when: MoodCheckin.count >= 30
```

## 🔍 Debugging Badge Counts

### SQL Queries for Manual Verification:

```sql
-- Check current streak counts
SELECT userId, count, lastActive FROM "Streak" WHERE userId = 'USER_ID';

-- Check journal counts by type
SELECT 
  'Writing' as type,
  COUNT(*) as count 
FROM "WritingJournal" 
WHERE userId = 'USER_ID'
UNION ALL
SELECT 
  'Audio' as type,
  COUNT(*) as count 
FROM "AudioJournal" 
WHERE userId = 'USER_ID'
UNION ALL
SELECT 
  'Art' as type,
  COUNT(*) as count 
FROM "ArtJournal" 
WHERE userId = 'USER_ID';

-- Check resource access by type
SELECT 
  resource,
  COUNT(*) as count 
FROM "ResourceAccess" 
WHERE userId = 'USER_ID'
GROUP BY resource;

-- Check mood check-ins
SELECT COUNT(*) as count FROM "MoodCheckin" WHERE userId = 'USER_ID';
```

## 🚀 Future Enhancements

### Advanced Counting Features:

#### 1. **Activity Completion Tracking**:
- Track actual meditation completion vs. just access
- Measure time spent on articles vs. just opening
- Count journal words for more meaningful engagement metrics

#### 2. **Streak Heatmap**:
- Visual representation of activity patterns
- Identify most/least active days
- Predict streak sustainability

#### 3. **Badge Progress Analytics**:
- Track how long users take to earn badges
- Identify most difficult/challenging badges
- Suggest personalized badge paths

---

This system provides a comprehensive foundation for tracking user engagement and awarding badges based on genuine activity across all platform features.
