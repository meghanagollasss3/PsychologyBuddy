# Recent Activity Feature

## Overview

The Recent Activity feature provides administrators with a comprehensive view of all student activities across the platform, with role-based access control and advanced filtering capabilities.

## Features

### 🎯 Activity Types Supported
- **Mood Check-ins**: Student mood submissions
- **Journaling**: Writing, audio, and art journal entries
- **Meditation**: Completed meditation sessions
- **Music Therapy**: Music therapy session plays
- **Badge Earned**: Student achievement notifications
- **Streak Updated**: Daily streak milestones
- **Support Session**: Chat/completed support sessions
- **Alert Resolved**: Escalation alerts that have been resolved

### 🔐 Role-Based Access Control
- **Super Admin**: Can view activities from all schools and filter by school
- **Regular Admin**: Can only view activities from their assigned school
- **Permission-based**: Uses existing permission system (`ACTIVITY.VIEW`)

### 📊 Advanced Filtering
- **Search**: Filter by student name or activity description
- **Activity Type**: Filter by specific activity types
- **Class**: Filter by specific classes
- **Date Range**: Today, Yesterday, This Week, This Month
- **Real-time**: Instant filtering without page reload

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface following design system
- **Activity Grouping**: Activities grouped by date (Today, Yesterday, etc.)
- **Interactive Elements**: Click activities to navigate to student details
- **Responsive**: Works seamlessly on desktop and mobile devices
- **Load More**: Pagination for handling large datasets

## Architecture

### Backend Components

#### 1. Service Layer (`src/server/services/recent-activity.service.ts`)
```typescript
// Main service for activity data aggregation
RecentActivityService.getRecentActivities(adminId, filters)
RecentActivityService.getAvailableClasses(adminId)
RecentActivityService.getAvailableSchools()
```

**Key Features:**
- Role-based data filtering at database level
- Optimized queries with proper indexing
- Support for complex filtering combinations
- Pagination for large datasets

#### 2. API Endpoints

**Main Activities API**
```
GET /api/admin/activities
```
**Query Parameters:**
- `search`: Search term for student/activity
- `type`: Activity type filter
- `classId`: Class ID filter
- `dateRange`: Date range filter
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Classes API**
```
GET /api/admin/activities/classes
```
Returns available classes based on admin role permissions.

#### 3. Authentication & Authorization
- Uses `withPermission` middleware
- Required permission: `ACTIVITY.VIEW`
- Session-based authentication
- Automatic role detection (Super Admin vs Regular Admin)

### Frontend Components

#### 1. Page Component (`app/admin/activities/page.tsx`)
```typescript
// Main React component for recent activities
export default function RecentActivity()
```

**Features:**
- Real-time filtering with debounced search
- Activity type selection dropdown
- Class filtering (role-based)
- Date range selection
- Grouped activity display
- Click-to-navigate functionality
- Load more pagination

#### 2. Navigation Integration
- Added to admin sidebar: `/admin/activities`
- Proper permission checking
- Icon-based navigation

## Data Flow

### 1. User Request Flow
```
User visits /admin/activities
    ↓
Page loads with initial filters
    ↓
API call to /api/admin/activities/classes (get available classes)
    ↓
API call to /api/admin/activities (get activities)
    ↓
Permission middleware validates session
    ↓
Service applies role-based filters
    ↓
Database queries with filters
    ↓
Returns formatted activities
    ↓
Page displays grouped activities
```

### 2. Filter Interaction Flow
```
User changes filter
    ↓
Debounced state update (300ms)
    ↓
Reset pagination offset to 0
    ↓
API call with new filters
    ↓
Update displayed activities
```

### 3. Role-Based Data Access
```
Super Admin:
    ↓
Can see all schools
    ↓
Can filter by any school
    ↓
Full data access

Regular Admin:
    ↓
Restricted to assigned school
    ↓
Cannot see other schools' data
    ↓
Limited data access
```

## Database Schema Integration

### Activity Sources
The feature aggregates data from multiple database tables:

1. **Mood Check-ins** → `MoodCheckin` table
2. **Journaling** → `WritingJournal`, `AudioJournal`, `ArtJournal` tables
3. **Meditation** → `MeditationSave` table (session tracking)
4. **Music Therapy** → `MusicSave` table
5. **Badges** → `UserBadge` table
6. **Streaks** → `Streak` table
7. **Sessions** → `Session` table
8. **Alerts** → `EscalationAlert` table (resolved status)

### Data Enrichment
- Student information joined from `User` table
- Class information joined from `Class` table
- School-based filtering applied at query level
- Real-time data aggregation

## Performance Optimizations

### Database Level
- **Efficient Queries**: Optimized WHERE clauses and JOINs
- **Indexing**: Uses existing database indexes
- **Pagination**: Limits data transfer with offset/limit
- **Role Filtering**: Applied at database level, not in memory

### Frontend Level
- **Debounced Search**: 300ms delay to prevent excessive API calls
- **Lazy Loading**: Load more functionality for large datasets
- **Memoization**: React state management for performance
- **Virtual Scrolling**: Ready for large lists (future enhancement)

## Security Considerations

### Access Control
- **Permission-Based**: Uses existing permission system
- **Role Validation**: Super Admin vs Regular Admin checks
- **Session Validation**: Middleware validates user sessions
- **School Isolation**: Regular admins can't access other schools

### Data Protection
- **Input Validation**: All query parameters validated
- **SQL Injection Prevention**: Prisma ORM protection
- **Rate Limiting**: Ready for implementation
- **Audit Trail**: All access logged through middleware

## Testing

### Manual Testing Steps

1. **Authentication Test**
   ```
   1. Log out of admin panel
   2. Try to access /admin/activities
   3. Should redirect to login (401 Unauthorized)
   ```

2. **Permission Test**
   ```
   1. Log in as user without ACTIVITY.VIEW permission
   2. Try to access /admin/activities
   3. Should show access denied (403 Forbidden)
   ```

3. **Role-Based Access Test**
   ```
   1. Log in as Regular Admin
   2. Check if only assigned school's activities appear
   3. Log in as Super Admin
   4. Verify all schools' activities appear
   ```

4. **Filter Functionality Test**
   ```
   1. Test search functionality
   2. Test activity type filters
   3. Test class filters
   4. Test date range filters
   5. Verify combinations work correctly
   ```

5. **Performance Test**
   ```
   1. Test with large dataset
   2. Verify pagination works
   3. Check load more functionality
   4. Monitor response times
   ```

### Automated Testing
```bash
# Test service logic
node test-activity-service.js

# Test API endpoints (requires authentication)
curl -X GET "http://localhost:3000/api/admin/activities" \
  -H "Cookie: sessionId=<valid-session-id>"
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - **Cause**: Invalid or expired session
   - **Solution**: Log in again or check session cookie

2. **403 Forbidden**
   - **Cause**: Missing ACTIVITY.VIEW permission
   - **Solution**: Contact administrator for proper permissions

3. **Empty Activities List**
   - **Cause**: No matching activities for filters
   - **Solution**: Clear filters or check date range

4. **Slow Loading**
   - **Cause**: Large dataset or missing indexes
   - **Solution**: Use filters to reduce dataset size

### Debug Mode
Add `?debug=true` to API calls for detailed error information:
```
GET /api/admin/activities?debug=true&limit=10
```

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live activity feeds
- **Export Functionality**: CSV/PDF export of filtered activities
- **Advanced Analytics**: Activity trends and insights
- **Bulk Actions**: Multi-select for batch operations
- **Email Notifications**: Automated alerts for specific activities

### Performance Improvements
- **Caching Layer**: Redis caching for frequent queries
- **Database Optimization**: Additional indexes for complex queries
- **CDN Integration**: Static asset optimization
- **Background Jobs**: Async processing for large datasets

## Support

### Documentation
- **API Documentation**: Check endpoint responses for data structure
- **Permission System**: See `src/config/permission.ts` for available permissions
- **Database Schema**: Refer to `prisma/schema.prisma` for table structures

### Contact
For issues or questions about the Recent Activity feature:
- Check the application logs for detailed error messages
- Verify user permissions in the admin panel
- Test with different user roles and schools
- Contact the development team for technical support

---

**Version**: 1.0.0  
**Last Updated**: February 2025  
**Compatibility**: Next.js 14+, Prisma, PostgreSQL
