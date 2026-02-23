# Badge Unlocked System

This document explains how the badge congratulation system works and how to integrate it into your application.

## Overview

The badge system provides automatic congratulatory modals when students earn new badges through their activities on the platform.

## Components

### 1. BadgeUnlockedModal
**Location**: `src/components/StudentDashboard/BadgesAndStreaks/BadgeUnlockedModal.tsx`

A beautiful modal that displays when a student earns a new badge. Features:
- Animated confetti effect
- Badge icon with glow
- Student name personalization
- Badge details and level
- "Continue Learning" button

### 2. useBadgeEvaluation Hook
**Location**: `src/hooks/useBadgeEvaluation.ts`

A custom hook that handles badge evaluation and modal display:
```typescript
const { evaluateBadges, isModalOpen, closeModal, newBadge } = useBadgeEvaluation();
```

### 3. API Endpoint
**Location**: `app/api/student/badges/evaluate/route.ts`

Evaluates badges for a user and returns newly earned badges.

## How It Works

1. **Activity Completion**: When a student completes an activity (journaling, meditation, etc.)
2. **Badge Evaluation**: The system checks if any new badges are earned
3. **Modal Display**: Shows congratulatory modal for each new badge
4. **Data Refresh**: Updates badge counts and progress

## Integration Examples

### In Journal Components
```typescript
import { useBadgeEvaluation } from '@/src/hooks/useBadgeEvaluation';

const MyJournalComponent = () => {
  const { evaluateBadges } = useBadgeEvaluation();

  const handleSave = async () => {
    await saveJournal();
    await evaluateBadges(); // Check for new badges
  };
};
```

### In Meditation Components
```typescript
const handleMeditationComplete = async () => {
  await completeMeditation();
  await evaluateBadges(); // Check for new badges
};
```

## Badge Types

Students can earn badges for:
- **STREAK**: Consecutive daily activity
- **JOURNAL_COUNT**: Total journal entries
- **ARTICLE_READ**: Articles read
- **MEDITATION_COUNT**: Meditation sessions
- **MUSIC_COUNT**: Music resources accessed
- **MOOD_CHECKIN**: Mood check-ins completed

## Automatic Trigger Points

The badge evaluation is automatically triggered:
- On Badges & Streaks page load
- After saving a journal entry
- After completing meditation
- After reading articles
- After mood check-ins

## Customization

### Badge Icons
Update the `getBadgeIcon` function in `BadgeUnlockedModal.tsx` to add new icons:
```typescript
const getBadgeIcon = (iconName: string) => {
  const iconMap = {
    flame: <Flame className="w-8 h-8 text-orange-500" />,
    // Add your new icons here
  };
  return iconMap[iconName.toLowerCase()] || <Trophy className="w-8 h-8 text-yellow-500" />;
};
```

### Modal Styling
The modal uses Tailwind CSS classes. Modify the styling in `BadgeUnlockedModal.tsx`:
- Background gradient: `from-blue-50 to-indigo-50`
- Confetti colors and animations
- Button styling and colors

## Best Practices

1. **Trigger After Activities**: Always call `evaluateBadges()` after meaningful user actions
2. **Don't Overwhelm**: The system shows one badge at a time to avoid overwhelming users
3. **Personalize**: Use actual student names from user session
4. **Performance**: Badge evaluation is optimized to only check for new badges

## Troubleshooting

### Modal Not Showing
- Check if API endpoint is working: `POST /api/student/badges/evaluate`
- Verify badge conditions are met in `BadgeService.evaluateBadgeCondition`
- Ensure `useBadgeEvaluation` hook is properly integrated

### Badge Not Awarding
- Check `BadgeService.evaluateUserBadges` logic
- Verify badge `conditionValue` in database
- Ensure user activity is being tracked correctly

## Future Enhancements

- Badge sharing to social media
- Badge animations and effects
- Badge rarity levels
- Achievement streaks
- Leaderboard integration
