import { Twilio } from 'twilio';

export interface SMSServiceConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export class SMSService {
  private client: Twilio;
  private config: SMSServiceConfig;

  constructor(config: SMSServiceConfig) {
    this.config = config;
    this.client = new Twilio(config.accountSid, config.authToken);
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Format phone number for Twilio API
      const twilioPhone = this.formatPhoneNumberForTwilio(phoneNumber);

      const message = await this.client.messages.create({
        body: `Your Psychology Buddy verification code is: ${otp}. This code will expire in 5 minutes.`,
        from: this.config.fromNumber,
        to: twilioPhone,
      });

      console.log(`SMS sent successfully to ${twilioPhone}. Message ID: ${message.sid}`);
      
      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  public formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except plus sign at start
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Remove plus sign if it's not at the start
    cleaned = cleaned.replace(/^\+/, '').replace(/\+/g, '');
    
    // Add back plus sign if original had it
    if (phoneNumber.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    // Return as-is without adding country codes
    // User specifically requested NOT to format to add country code 91
    return cleaned;
  }

  public formatPhoneNumberForTwilio(phoneNumber: string): string {
    // Format phone number specifically for Twilio API
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Remove all plus signs
    cleaned = cleaned.replace(/\+/g, '');
    
    // Add country code if missing (Indian numbers)
    if (cleaned.length === 10 && (cleaned.startsWith('6') || cleaned.startsWith('7') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
      cleaned = '91' + cleaned;
    }
    
    // Add plus sign for international format
    return '+' + cleaned;
  }

  async verifyPhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Use Twilio Lookup API to verify phone number
      const lookup = await this.client.lookups.v2.phoneNumbers(formattedPhone).fetch();
      
      return lookup.valid || false;
    } catch (error) {
      console.error('Error verifying phone number:', error);
      return false;
    }
  }
}

// Singleton instance
let smsServiceInstance: SMSService | null = null;

export function getSMSService(): SMSService {
  if (!smsServiceInstance) {
    const config: SMSServiceConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID!,
      authToken: process.env.TWILIO_AUTH_TOKEN!,
      fromNumber: process.env.TWILIO_PHONE_NUMBER!,
    };

    if (!config.accountSid || !config.authToken || !config.fromNumber) {
      throw new Error('Twilio configuration is missing. Please check environment variables.');
    }

    smsServiceInstance = new SMSService(config);
  }

  return smsServiceInstance;
}
