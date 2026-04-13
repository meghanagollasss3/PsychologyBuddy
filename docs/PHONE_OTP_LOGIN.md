# Phone/OTP Login System Documentation

## Overview

The Psychology Buddy platform now supports phone number login with One-Time Password (OTP) verification for enhanced security and convenience. This feature is available for School Super Admins, Admins, Counselors, and Teachers, but excludes the main system Super Admins.

## Features

### 🔐 Security Features
- **6-digit OTP codes** with 5-minute expiry
- **Maximum 3 attempts** per OTP to prevent brute force attacks
- **Phone number validation** and formatting
- **In-memory OTP storage** with automatic cleanup
- **Role-based access control** (includes School Super Admins, Admins, Counselors, Teachers; excludes main Super Admins)

### 📱 User Experience
- **Clean, responsive UI** with phone number formatting
- **Real-time validation** and error handling
- **Resend OTP functionality** with countdown timer
- **Progressive disclosure** (phone → OTP → login)
- **Clear status messages** and visual feedback

## Architecture

### Backend Components

#### 1. SMS Service (`src/services/otp/sms-service.ts`)
- **Twilio integration** for SMS delivery
- **Phone number formatting** to E.164 standard
- **Phone number validation** using Twilio Lookup API
- **Error handling** and logging

#### 2. OTP Service (`src/services/otp/otp-service.ts`)
- **OTP generation** using crypto.randomInt()
- **In-memory storage** with expiration tracking
- **Attempt limiting** and security controls
- **Automatic cleanup** of expired OTPs

#### 3. Authentication Updates
- **New repository method**: `findAdminByPhone()` (excludes SUPERADMIN)
- **New service methods**: `sendOTPToAdmin()`, `verifyOTPAndLogin()`
- **New API endpoints**: `/api/auth/send-otp`, `/api/auth/verify-otp`
- **Session management** integration

### Frontend Components

#### 1. React Hook (`src/hooks/auth/useAdminPhoneLogin.ts`)
- **Form state management** for phone and OTP inputs
- **API integration** with error handling
- **Timer management** for resend functionality
- **Navigation logic** after successful login

#### 2. UI Components
- **OTPLoginForm**: Complete phone/OTP login form
- **Updated LoginPage**: Toggle between email/password and phone/OTP
- **Responsive design** with mobile support

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+919876543210  # Indian format example
```

### Phone Number Formats

The system supports Indian phone numbers with the following formats:

#### Supported Indian Formats:
- **10-digit**: `8978009953` (most common)
- **With country code**: `919878009953`
- **With plus sign**: `+919878009953`
- **With leading zero**: `0919878009953`

#### Validation Rules:
- Must be 10 digits starting with 6, 7, 8, or 9 (Indian mobile numbers)
- Or 12 digits with 91 prefix (e.g., 919878009953)
- Or international format (10-15 digits)
- Automatically adds +91 country code for SMS delivery

### Database Requirements

Admin users must have a `phone` field populated in the database:

```sql
-- Example update for existing admin users (Indian phone numbers)
UPDATE "User" 
SET phone = '+919878009953' 
WHERE role_id IN (SELECT id FROM "Role" WHERE name IN ('ADMIN', 'SCHOOL_SUPERADMIN', 'COUNSELOR', 'TEACHER'));
```

## API Endpoints

### POST /api/auth/send-otp

Send OTP to admin's phone number.

**Request:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "adminId": "admin_id",
    "adminName": "John Doe",
    "role": "SCHOOL_ADMIN"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "No admin found with this phone number",
  "error": "No admin found with this phone number"
}
```

### POST /api/auth/verify-otp

Verify OTP and login admin.

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "admin_id",
      "email": "admin@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": {
        "name": "SCHOOL_ADMIN"
      },
      "school": {
        "id": "school_id",
        "name": "School Name"
      },
      "adminProfile": {}
    },
    "sessionId": "session_id",
    "expiresAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid OTP. 2 attempts remaining.",
  "error": "Invalid OTP. 2 attempts remaining."
}
```

## User Flow

### Phone Login Process

1. **User selects "Phone" login option**
2. **Enters phone number** → System validates format
3. **Clicks "Send Verification Code"** → System generates and sends OTP
4. **Receives SMS** with 6-digit code
5. **Enters OTP** → System validates and attempts login
6. **Successful login** → Redirected to admin dashboard

### Error Handling

- **Invalid phone number**: Clear validation message
- **No admin found**: Inform user to contact system administrator
- **SMS delivery failure**: Error message with retry option
- **Invalid OTP**: Show remaining attempts
- **OTP expired**: Prompt to request new OTP
- **Max attempts exceeded**: Block temporarily, suggest new OTP

## Security Considerations

### ✅ Implemented
- **OTP expiration** (5 minutes)
- **Attempt limiting** (max 3 attempts)
- **Phone number validation** (Twilio Lookup)
- **Role restriction** (no Super Admin phone login)
- **Secure session management**

### 🔄 Future Enhancements
- **Rate limiting** per phone number
- **Redis storage** for OTP persistence
- **Backup delivery methods** (email, WhatsApp)
- **Device fingerprinting** for enhanced security

## Testing

### Manual Testing

1. **Add phone number** to existing admin account in database
2. **Navigate to** `/login` in browser
3. **Select "Phone"** login option
4. **Enter phone number** and click "Send Verification Code"
5. **Check SMS** for OTP code
6. **Enter OTP** and verify login
7. **Test error scenarios** (wrong OTP, expired OTP, etc.)

### Automated Testing

Run the test script:

```bash
# Test OTP service logic
node test-otp-api.js

# Test complete flow (requires database setup)
npm run test:phone-otp
```

## Troubleshooting

### Common Issues

#### SMS Not Sending
- **Check Twilio credentials** in `.env`
- **Verify phone number** is in E.164 format
- **Check Twilio account balance**
- **Verify phone number is verified** in Twilio console

#### OTP Verification Failing
- **Check phone number exists** in database with correct admin role
- **Verify OTP hasn't expired** (5-minute window)
- **Check attempt count** (max 3 attempts)
- **Ensure correct OTP format** (6 digits)

#### Login Not Working
- **Check admin role** (Super Admins excluded)
- **Verify admin status** is 'ACTIVE'
- **Check session management** configuration
- **Review browser console** for JavaScript errors

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
DEBUG=otp:*
```

## Deployment

### Production Setup

1. **Configure Twilio account** and get credentials
2. **Update environment variables** with real Twilio credentials
3. **Add phone numbers** to admin accounts in database
4. **Test with real phone numbers** before going live
5. **Monitor SMS delivery** and error rates

### Monitoring

Track these metrics:
- **SMS delivery success rate**
- **OTP verification success rate**
- **Login completion rate**
- **Error rates by type**
- **Response times**

## Support

For issues with the phone/OTP login system:

1. **Check this documentation** for common solutions
2. **Review error logs** in application console
3. **Verify Twilio configuration** and account status
4. **Test with different phone numbers** and browsers
5. **Contact development team** with specific error details

---

**Last Updated**: April 2026
**Version**: 1.0.0
**Maintained by**: Psychology Buddy Development Team
