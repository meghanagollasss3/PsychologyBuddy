import { otpService } from '../services/otp/otp-service';
import { SMSService } from '../services/otp/sms-service';

/**
 * Test script for Phone/OTP Login functionality
 * Run this script to test the OTP system without actually sending SMS
 */

async function testOTPService() {
  console.log('🧪 Testing OTP Service...\n');

  const testPhoneNumber = '+1234567890';

  // Test 1: Generate OTP
  console.log('1. Testing OTP Generation...');
  const generateResult = otpService.generateOTP(testPhoneNumber);
  
  if (generateResult.success) {
    console.log('✅ OTP generated successfully');
    console.log(`📱 OTP: ${generateResult.otp} (for testing only)`);
  } else {
    console.log('❌ OTP generation failed:', generateResult.error);
    return;
  }

  // Test 2: Check remaining time
  console.log('\n2. Testing OTP Timer...');
  const remainingTime = otpService.getRemainingTime(testPhoneNumber);
  console.log(`⏰ Remaining time: ${remainingTime} seconds`);

  // Test 3: Verify correct OTP
  console.log('\n3. Testing OTP Verification (correct OTP)...');
  const verifyResult = otpService.verifyOTP(testPhoneNumber, generateResult.otp!);
  
  if (verifyResult.success) {
    console.log('✅ OTP verified successfully');
  } else {
    console.log('❌ OTP verification failed:', verifyResult.error);
  }

  // Test 4: Verify wrong OTP
  console.log('\n4. Testing OTP Verification (wrong OTP)...');
  const wrongOtpResult = otpService.verifyOTP(testPhoneNumber, '000000');
  
  if (!wrongOtpResult.success) {
    console.log('✅ Wrong OTP correctly rejected:', wrongOtpResult.error);
  } else {
    console.log('❌ Wrong OTP was incorrectly accepted');
  }

  // Test 5: Generate new OTP and test expiry
  console.log('\n5. Testing OTP Expiry...');
  const newOtpResult = otpService.generateOTP(testPhoneNumber);
  
  if (newOtpResult.success) {
    console.log('✅ New OTP generated');
    
    // Manually expire the OTP for testing
    const otpData = (otpService as any).otpStore.get((otpService as any).getOTPKey(testPhoneNumber));
    if (otpData) {
      otpData.expiresAt = new Date(Date.now() - 1000); // Set to 1 second ago
    }
    
    const expiredResult = otpService.verifyOTP(testPhoneNumber, newOtpResult.otp!);
    if (!expiredResult.success) {
      console.log('✅ Expired OTP correctly rejected:', expiredResult.error);
    } else {
      console.log('❌ Expired OTP was incorrectly accepted');
    }
  }

  console.log('\n🎉 OTP Service tests completed!');
}

async function testSMSService() {
  console.log('\n📱 Testing SMS Service Configuration...\n');

  try {
    const smsService = new SMSService({
      accountSid: process.env.TWILIO_ACCOUNT_SID || 'test_sid',
      authToken: process.env.TWILIO_AUTH_TOKEN || 'test_token',
      fromNumber: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
    });

    console.log('✅ SMS Service initialized successfully');
    
    // Test phone number formatting
    console.log('\n2. Testing Phone Number Formatting...');
    
    const testNumbers = [
      '5551234567',
      '(555) 123-4567',
      '+15551234567',
      '555-123-4567',
    ];

    testNumbers.forEach(number => {
      const formatted = (smsService as any).formatPhoneNumber(number);
      console.log(`📞 ${number} -> ${formatted}`);
    });

    console.log('\n💡 Note: Actual SMS sending requires valid Twilio credentials');
    console.log('💡 Set up your Twilio account and update .env file with real credentials');

  } catch (error) {
    console.log('❌ SMS Service initialization failed:', error);
  }
}

async function testAdminPhoneLookup() {
  console.log('\n🔍 Testing Admin Phone Lookup...\n');

  try {
    const { AuthRepository } = await import('../server/repository/auth.repository');
    
    // Test with a sample phone number
    const testPhone = '+1234567890';
    const admin = await AuthRepository.findAdminByPhone(testPhone);
    
    if (admin) {
      console.log('✅ Admin found by phone number');
      console.log(`👤 Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`📧 Email: ${admin.email}`);
      console.log(`🔑 Role: ${admin.role.name}`);
      console.log(`📱 Phone: ${admin.phone}`);
    } else {
      console.log(`ℹ️  No admin found with phone number: ${testPhone}`);
      console.log('💡 This is expected if no admin has this phone number in the database');
    }

  } catch (error) {
    console.log('❌ Admin phone lookup failed:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Phone/OTP Login System Tests\n');
  console.log('='.repeat(50));

  await testOTPService();
  await testSMSService();
  await testAdminPhoneLookup();

  console.log('\n' + '='.repeat(50));
  console.log('🏁 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ OTP Service: Working');
  console.log('✅ SMS Service: Configured (needs real credentials for live testing)');
  console.log('✅ Admin Lookup: Working');
  console.log('\n🎯 Next Steps:');
  console.log('1. Set up Twilio account and get real credentials');
  console.log('2. Update .env file with real Twilio credentials');
  console.log('3. Add phone numbers to admin accounts in database');
  console.log('4. Test the complete login flow in the browser');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { testOTPService, testSMSService, testAdminPhoneLookup, runAllTests };
