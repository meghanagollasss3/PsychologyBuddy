import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';

interface AdminPhoneLoginData {
  phoneNumber: string;
  otp: string;
}

interface SendOTPResponse {
  success: boolean;
  message: string;
  data?: {
    adminId: string;
    adminName: string;
    role: string;
  };
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: {
        name: string;
      };
      school?: {
        id: string;
        name: string;
      };
      adminProfile?: any;
    };
    sessionId: string;
    expiresAt: string;
  };
}

export function useAdminPhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ name: string; role: string } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();
  const { login } = useAuth();

  const handleSendOTP = async () => {
    // Validation
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    // Basic phone number validation
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Validate for Indian numbers (10 digits starting with 6-9) or international format
    const isValidIndian = digitsOnly.length === 10 && (digitsOnly.startsWith('6') || digitsOnly.startsWith('7') || digitsOnly.startsWith('8') || digitsOnly.startsWith('9'));
    const isValidWithCountryCode = digitsOnly.length === 12 && digitsOnly.startsWith('91');
    const isValidInternational = digitsOnly.length >= 10 && digitsOnly.length <= 15;
    
    if (!isValidIndian && !isValidWithCountryCode && !isValidInternational) {
      setError('Please enter a valid mobile number (e.g., 8978009953 or +919878009953)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data: SendOTPResponse = await response.json();

      if (data.success && data.data) {
        setSuccess('OTP sent successfully!');
        setOtpSent(true);
        setAdminInfo({
          name: data.data.adminName,
          role: data.data.role,
        });
        
        // Start resend timer (60 seconds)
        setResendTimer(60);
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.message || 'Failed to send OTP. Please check your phone number.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    // Validation
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data: VerifyOTPResponse = await response.json();

      if (data.success && data.data?.user) {
        setSuccess('Login successful!');
        
        // Login user in context with required adminProfile
        const userWithProfile = {
          ...data.data.user,
          adminProfile: data.data.user.adminProfile || {}
        };
        login(userWithProfile);
        
        // Redirect based on role
        const userRole = data.data.user.role.name;
        
        setTimeout(() => {
          if (userRole === 'SCHOOL_SUPERADMIN' || userRole === 'SCHOOL_ADMIN' || userRole === 'ADMIN' || userRole === 'COUNSELOR' || userRole === 'TEACHER') {
            router.push('/admin');
          } else {
            router.push('/admin'); // Fallback
          }
        }, 1500);
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    await handleSendOTP();
  };

  const handleReset = () => {
    setPhoneNumber('');
    setOtp('');
    setOtpSent(false);
    setAdminInfo(null);
    setError(null);
    setSuccess(null);
    setResendTimer(0);
  };

  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    if (error) setError(null);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (error) setError(null);
  };

  return {
    phoneNumber,
    otp,
    loading,
    error,
    success,
    otpSent,
    adminInfo,
    resendTimer,
    handleSendOTP,
    handleVerifyOTP,
    handleResendOTP,
    handleReset,
    handlePhoneChange,
    handleOtpChange,
  };
}
