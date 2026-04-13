# Daily Summary Email System

This document describes the daily summary email system that provides administrators with comprehensive platform activity reports.

## Overview

The daily summary email system automatically sends detailed platform activity reports to all administrators (School Super Admins, Admins, and Counselors) every day at a configurable time.

## Features

### 📊 Comprehensive Metrics

- **Student Activity**: Active students, new users, total students
- **Chat Activity**: Total sessions, message count
- **Escalation Alerts**: Breakdown by severity level and category
- **Mood Check-ins**: Total check-ins and average mood analysis
- **Journaling Activity**: Writing, audio, and art journal entries
- **Meditation**: Sessions completed and total minutes
- **Article Activity**: Views and completions
- **School Statistics**: Total and active schools

### 🚨 Priority Alerts

- Critical and high-priority escalation alerts are highlighted
- Immediate attention indicators for critical cases
- Color-coded severity levels

### 📧 Professional Email Templates

- Modern, responsive HTML email design
- Color-coded metrics and visual indicators
- Mobile-friendly layout
- Text-only fallback for email clients

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Email Configuration (already configured for escalation emails)
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Psychology Buddy" <noreply@psychologybuddy.com>

# Daily Summary Configuration
DAILY_SUMMARY_ENABLED=true
DAILY_SUMMARY_HOUR=9
DAILY_SUMMARY_MINUTE=0
```

### Schedule Configuration

- **DAILY_SUMMARY_ENABLED**: Set to `true` to enable automatic daily summaries
- **DAILY_SUMMARY_HOUR**: Hour of day to send summary (0-23, default: 9)
- **DAILY_SUMMARY_MINUTE**: Minute of hour to send summary (0-59, default: 0)

**Example**: To send daily summaries at 6:30 PM:
```env
DAILY_SUMMARY_ENABLED=true
DAILY_SUMMARY_HOUR=18
DAILY_SUMMARY_MINUTE=30
```

## Usage

### Automatic Scheduling

The system automatically starts when the application boots if `DAILY_SUMMARY_ENABLED=true`.

### Manual API Control

#### Send Daily Summary
```bash
curl -X POST http://localhost:3000/api/admin/daily-summary \
  -H "Content-Type: application/json" \
  -d '{"action": "send"}'
```

#### Send for Specific Date
```bash
curl -X POST http://localhost:3000/api/admin/daily-summary \
  -H "Content-Type: application/json" \
  -d '{"action": "send", "date": "2024-01-15"}'
```

#### Test Without Sending
```bash
curl -X POST http://localhost:3000/api/admin/daily-summary \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

#### Start/Stop Scheduler
```bash
# Start scheduler
curl -X POST http://localhost:3000/api/admin/daily-summary \
  -H "Content-Type: application/json" \
  -d '{"action": "start-scheduler", "hour": 9, "minute": 0}'

# Stop scheduler
curl -X POST http://localhost:3000/api/admin/daily-summary \
  -H "Content-Type: application/json" \
  -d '{"action": "stop-scheduler"}'
```

#### Check Status
```bash
curl http://localhost:3000/api/admin/daily-summary
```

### Testing

Run the test suite:
```bash
npm run test:daily-summary
```

## Email Recipients

### Who Receives Daily Summaries?

1. **School Super Admins** - Primary administrators for each school
2. **School Admins** - Regular administrators for each organization
3. **Counselors** - Mental health support staff

### Recipient Filtering

- Only users with `ACTIVE` status receive emails
- Invalid email addresses are automatically filtered
- Duplicate recipients are removed

## Email Content

### Subject Line
```
📊 Daily Platform Summary - January 15, 2024
```

### Key Sections

1. **Header** - Date and summary title
2. **Key Metrics Grid** - Active students, sessions, messages, new users
3. **Escalation Alerts** - Total alerts, critical/high priority breakdown
4. **Activity Breakdown** - Mood check-ins and journaling activity
5. **Meditation & Articles** - Wellness content engagement
6. **Footer** - Dashboard link and generation timestamp

### Visual Design

- **Color Coding**: 
  - Blue: Student metrics
  - Green: Positive activity
  - Yellow: Neutral metrics
  - Purple: New user activity
  - Red: Critical alerts

- **Responsive Layout**: Adapts to mobile and desktop
- **Visual Hierarchy**: Important metrics highlighted
- **Professional Branding**: Consistent with Psychology Buddy design

## Data Collection

### Time Zones

All data collection uses the server's local timezone:
- Start of day: 00:00:00
- End of day: 23:59:59

### Data Sources

- **User Activity**: From `Users`, `DailyLogins` tables
- **Chat Sessions**: From `ChatSessions`, `ChatMessages` tables
- **Escalations**: From `EscalationAlerts` table
- **Mood Data**: From `MoodCheckins` table
- **Journaling**: From `WritingJournals`, `AudioJournals`, `ArtJournals` tables
- **Meditation**: From `Meditations` table
- **Articles**: From `Articles`, `ArticleCompletions` tables

## Error Handling

### Email Failures

- Individual email failures are logged but don't stop other emails
- Comprehensive error logging for debugging
- Graceful degradation if email service is unavailable

### Data Collection Errors

- Errors are logged with detailed context
- System continues to function with partial data
- Failed components are marked in logs

## Security

### Email Privacy

- Only admin users receive summary emails
- Student data is aggregated and anonymized in summaries
- No sensitive personal information included

### Access Control

- API endpoints require proper authentication
- Admin role verification for manual triggers
- Rate limiting considerations for API calls

## Performance

### Optimization

- Efficient database queries with proper indexing
- Batch processing for multiple recipients
- Minimal memory footprint for large datasets

### Scalability

- Designed for thousands of users and multiple schools
- Efficient email queuing and sending
- Database query optimization for large datasets

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check `EMAIL_ENABLED=true`
   - Verify email credentials
   - Check email service logs

2. **Scheduler not running**
   - Verify `DAILY_SUMMARY_ENABLED=true`
   - Check application logs
   - Manually start scheduler via API

3. **Missing data**
   - Check database connectivity
   - Verify date ranges
   - Review data collection logs

### Debug Mode

Enable detailed logging:
```env
LOG_LEVEL=debug
```

## Monitoring

### Key Metrics to Monitor

- Email delivery success rate
- Data collection completion time
- Scheduler execution logs
- Error frequency and types

### Health Checks

The system provides health indicators:
- Scheduler status via API
- Email service connectivity
- Data collection success rates

## Future Enhancements

### Planned Features

1. **Customizable Recipients**: Allow admins to opt-in/out
2. **Custom Schedules**: Different times for different roles
3. **Enhanced Analytics**: Trend analysis and comparisons
4. **Attachment Support**: PDF exports of detailed reports
5. **Integration**: Slack/Teams notifications

### Customization Options

- Custom email templates per school
- Configurable metric selections
- Personalized dashboard links
- Custom branding options

## Support

For issues or questions about the daily summary system:

1. Check application logs for detailed error messages
2. Verify environment variable configuration
3. Test email service connectivity
4. Review API endpoint responses

The system is designed to be robust and provide clear feedback for any issues that arise.
