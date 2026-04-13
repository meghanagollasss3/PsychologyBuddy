import * as crypto from 'crypto';
import { getSMSService } from './sms-service';
import prisma from '../../prisma';

export interface OTPData {
  otp: string;
  phoneNumber: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
  isVerified: boolean;
}

export class OTPService {
  private static instance: OTPService;
  private static otpStore: Map<string, OTPData> = new Map();
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;

  private constructor() {}

  static getInstance(): OTPService {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService();
    }
    return OTPService.instance;
  }

  async generateOTP(phoneNumber: string): Promise<{ success: boolean; otp?: string; error?: string }> {
    try {
      // Clean existing OTP for this phone number
      await OTPService.cleanupExpiredOTP(phoneNumber);

      // Generate random 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();

      const otpData: OTPData = {
        otp,
        phoneNumber,
        attempts: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000),
        isVerified: false,
      };

      // Store OTP data in database for persistence
      const key = OTPService.getOTPKey(phoneNumber);
      OTPService.otpStore.set(key, otpData);

      // Store in database for cross-server persistence
      try {
        await prisma.oTP.upsert({
          where: { phoneNumber: phoneNumber },
          update: {
            otp: otpData.otp,
            phoneNumber: phoneNumber,
            attempts: otpData.attempts,
            createdAt: otpData.createdAt,
            expiresAt: otpData.expiresAt,
            isVerified: false,
          },
          create: {
            otp: otpData.otp,
            phoneNumber: phoneNumber,
            attempts: otpData.attempts,
            createdAt: otpData.createdAt,
            expiresAt: otpData.expiresAt,
            isVerified: false,
          },
        });
        console.log(`OTP stored in database for ${phoneNumber}: ${otp}`);
      } catch (dbError) {
        console.error('Failed to store OTP in database:', dbError);
        // Continue with in-memory storage as fallback
      }

      return {
        success: true,
        otp,
      };
    } catch (error) {
      console.error('Error generating OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate OTP',
      };
    }
  }

  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    let formattedPhone: string;
    const smsService = getSMSService();
    
    try {
      // Basic phone number validation (no API calls)
      formattedPhone = smsService.formatPhoneNumber(phoneNumber);
      
      // Simple validation: check if it has reasonable length
      if (formattedPhone.length < 10 || formattedPhone.length > 15) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }
    } catch (error) {
      console.error('Error formatting phone number:', error);
      return {
        success: false,
        error: 'Phone number format error',
      };
    }
    
    try {
      // Generate OTP with formatted phone number for consistency
      const otpResult = await this.generateOTP(formattedPhone);
      
      if (!otpResult.success || !otpResult.otp) {
        return {
          success: false,
          error: otpResult.error || 'Failed to generate OTP',
        };
      }

      // Send OTP via SMS
      const smsResult = await smsService.sendOTP(phoneNumber, otpResult.otp);
      
      if (!smsResult.success) {
        // For development: Log OTP for testing when SMS fails
        console.log(`\n==========================================`);
        console.log(`SMS FAILED - OTP for ${phoneNumber}`);
        console.log(`==========================================`);
        console.log(`Your Psychology Buddy verification code is: ${otpResult.otp}`);
        console.log(`This code will expire in 5 minutes.`);
        console.log(`==========================================\n`);
        
        // Keep OTP even if SMS failed for testing
        // In production, you might want to remove it: OTPService.removeOTP(phoneNumber);
        return {
          success: false,
          error: smsResult.error || 'Failed to send OTP',
        };
      }

      // For development: Also log OTP when SMS succeeds
      console.log(`\n==========================================`);
      console.log(`SMS SENT - OTP for ${phoneNumber}`);
      console.log(`==========================================`);
      console.log(`Your Psychology Buddy verification code is: ${otpResult.otp}`);
      console.log(`This code will expire in 5 minutes.`);
      console.log(`==========================================\n`);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      };
    }
  }

  async verifyOTP(phoneNumber: string, providedOTP: string): Promise<{ success: boolean; error?: string }> {
    try {
      const key = OTPService.getOTPKey(phoneNumber);
      
      // Get OTP from database first
      const dbOtp = await prisma.oTP.findUnique({
        where: { phoneNumber: phoneNumber }
      });

      if (!dbOtp) {
        return {
          success: false,
          error: 'OTP not found or expired',
        };
      }

      // Check if OTP is expired
      if (new Date() > dbOtp.expiresAt) {
        // Remove expired OTP from database
        await prisma.oTP.delete({
          where: { phoneNumber: phoneNumber }
        });
        return {
          success: false,
          error: 'OTP has expired',
        };
      }

      // Check maximum attempts
      if (dbOtp.attempts >= this.MAX_ATTEMPTS) {
        await prisma.oTP.delete({
          where: { phoneNumber: phoneNumber }
        });
        return {
          success: false,
          error: 'Maximum OTP attempts exceeded',
        };
      }

      // Increment attempt count
      await prisma.oTP.update({
        where: { phoneNumber: phoneNumber },
        data: {
          attempts: dbOtp.attempts + 1,
        }
      });

      // Verify OTP
      if (dbOtp.otp !== providedOTP) {
        if (dbOtp.attempts >= this.MAX_ATTEMPTS) {
          await prisma.oTP.delete({
            where: { phoneNumber: phoneNumber }
          });
        }
        return {
          success: false,
          error: 'Invalid OTP',
        };
      }

      // Mark as verified and remove
      await prisma.oTP.delete({
        where: { phoneNumber: phoneNumber }
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP',
      };
    }
  }

  isOTPVerified(phoneNumber: string): boolean {
    const key = OTPService.getOTPKey(phoneNumber);
    const otpData = OTPService.otpStore.get(key);
    
    return otpData?.isVerified || false;
  }

  async consumeOTP(phoneNumber: string): Promise<void> {
    const key = OTPService.getOTPKey(phoneNumber);
    try {
      await prisma.oTP.delete({
        where: { phoneNumber: key }
      });
    } catch (error) {
      // Ignore if no record exists (P2025 error)
      // This is expected when consuming non-existent OTPs
    }
  }

  private static async cleanupExpiredOTP(phoneNumber: string): Promise<void> {
    const key = OTPService.getOTPKey(phoneNumber);
    try {
      await prisma.oTP.delete({
        where: { phoneNumber: key }
      });
    } catch (error) {
      // Ignore if no record exists (P2025 error)
      // This is expected when cleaning up non-existent OTPs
    }
  }

  private static removeOTP(phoneNumber: string): void {
    const key = OTPService.getOTPKey(phoneNumber);
    OTPService.otpStore.delete(key);
  }

  private static getOTPKey(phoneNumber: string): string {
    return `otp_${phoneNumber.replace(/\D/g, '')}`;
  }

  // Cleanup method to remove expired OTPs (can be called periodically)
  cleanupAllExpiredOTPs(): void {
    const now = new Date();
    Array.from(OTPService.otpStore.entries()).forEach(([key, otpData]) => {
      if (now > otpData.expiresAt) {
        OTPService.otpStore.delete(key);
      }
    });
  }

  // Get remaining time for OTP in seconds
  getRemainingTime(phoneNumber: string): number {
    const key = OTPService.getOTPKey(phoneNumber);
    const otpData = OTPService.otpStore.get(key);
    
    if (!otpData) {
      return 0;
    }
    
    const remaining = Math.max(0, Math.floor((otpData.expiresAt.getTime() - Date.now()) / 1000));
    return remaining;
  }
}

export const otpService = OTPService.getInstance();
