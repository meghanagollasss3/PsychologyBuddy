# Email Setup for Escalation Alerts

## Quick Setup Guide

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and update the email settings:

```bash
cp .env.example .env
```

Update these variables in your `.env` file:

```env
# Email Service for Escalation Notifications
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="Psychology Buddy" <noreply@psychologybuddy.com>
EMAIL_ENABLED=true
EMAIL_TEST_MODE=false
```

### 2. Gmail Setup (Recommended for Development)

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Psychology Buddy"
   - Use this app password (not your regular password)

3. **Update .env**:
   ```env
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-16-character-app-password"
   ```

### 3. Production SMTP Setup

For production, use your organization's SMTP server:

```env
EMAIL_HOST="smtp.yourdomain.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="noreply@yourdomain.com"
EMAIL_PASS="your-smtp-password"
EMAIL_FROM="Psychology Buddy" <noreply@yourdomain.com>"
```

### 4. Test Email Configuration

Run the test script to verify email sending:

```bash
npm run test:emails
```

Or manually test:

```typescript
import { EmailSender } from './src/services/escalations/email-sender'

// Test email configuration
await EmailSender.testEmail()

// Send test email
await EmailSender.sendEmail({
  to: 'admin@example.com',
  subject: 'Test Email',
  html: '<h1>Test Email</h1><p>This is a test email.</p>',
  text: 'Test Email - This is a test email.'
})
```

### 5. Email Recipients

The system automatically sends emails to:

**For ALL escalations:**
- School Super Admins
- School Admins  
- Counselors
- Primary School Admin

**For HIGH/CRITICAL escalations only:**
- Teachers (in addition to above)

### 6. Troubleshooting

**Emails not sending:**
1. Check `EMAIL_ENABLED=true` in .env
2. Verify email credentials are correct
3. Check if app password is used (for Gmail)
4. Ensure firewall allows SMTP traffic

**Gmail authentication issues:**
- Use App Password, not regular password
- Enable "Less secure app access" if needed
- Check 2FA is enabled

**Spam filtering:**
- Add FROM address to contacts
- Check spam/junk folders
- Verify SPF/DKIM records for production

### 7. Features

✅ **Organization-specific**: Only admins from student's school receive emails
✅ **Severity-based**: Different recipients for different escalation levels
✅ **Professional templates**: HTML emails with proper styling
✅ **Error handling**: Graceful fallback if email service fails
✅ **Logging**: Detailed logs for troubleshooting

### 8. Security Notes

- Never commit email credentials to version control
- Use environment variables for all sensitive data
- Use app-specific passwords for Gmail
- Consider using email service APIs (SendGrid, AWS SES) for production

## Configuration Complete!

Once configured, escalation alerts will automatically email the appropriate admins when students trigger escalations.
