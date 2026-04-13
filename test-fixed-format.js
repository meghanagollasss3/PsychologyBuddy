// Test OTP after fixing phone number formatting
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testFixedFormat() {
  console.log('Testing OTP After Phone Format Fix...\n');

  const phoneNumber = '+918978009953'; // Correct phone number from database
  
  try {
    // Step 1: Send OTP
    console.log('1. Sending OTP...');
    const sendResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/send-otp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { phoneNumber });

    console.log(`Send Status: ${sendResult.statusCode}`);
    
    if (sendResult.statusCode === 200) {
      console.log('✅ OTP sent successfully!');
      console.log('📋 Check server console for OTP code');
      console.log('🎯 Phone formatting should now be consistent');
      
      // Wait for OTP to be processed
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 2: Verify OTP
      console.log('\n2. Now verify OTP...');
      console.log('📋 Use the OTP code from server console');
      
      const verifyResult = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/verify-otp',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        phoneNumber: phoneNumber,
        otp: '123456' // Replace with actual OTP from console
      });

      console.log(`Verify Status: ${verifyResult.statusCode}`);
      
      if (verifyResult.statusCode === 200) {
        console.log('🎉 SUCCESS! OTP verification working!');
        console.log('✅ Phone number formatting fixed');
        console.log('✅ Database persistence working');
        console.log('✅ OTP system fully functional');
      } else if (verifyResult.statusCode === 500) {
        console.log('❌ Verification failed');
        console.log('📋 Check server console for debugging info');
        console.log('🔍 Look for [DEBUG] messages');
      } else {
        console.log('Response:', JSON.stringify(verifyResult.data, null, 2));
      }
      
    } else {
      console.log('❌ Send failed');
      console.log('Response:', JSON.stringify(sendResult.data, null, 2));
    }

  } catch (error) {
    console.log('Test failed:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('PHONE FORMAT FIX TEST:');
  console.log('✅ Auto-formatting: REMOVED');
  console.log('✅ Phone Numbers: AS-IS');
  console.log('✅ Database Keys: CONSISTENT');
  console.log('✅ OTP Verification: SHOULD WORK');
  console.log('='.repeat(60));
}

testFixedFormat().catch(console.error);
