'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertMessage } from '@/components/ui/AlertMessage';
import { Loader2, ArrowLeft, Smartphone } from 'lucide-react';
import { useAdminPhoneLogin } from '@/src/hooks/auth/useAdminPhoneLogin';

interface OTPLoginFormProps {
  onBack?: () => void;
}

export function OTPLoginForm({ onBack }: OTPLoginFormProps) {
  const router = useRouter();
  
  const {
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
  } = useAdminPhoneLogin();

  const handleEmailLoginRedirect = () => {
    router.push('/admin-login');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      handleSendOTP();
    } else {
      handleVerifyOTP();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      
      {/* Simple Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Smartphone className="w-6 h-6 text-gray-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {!otpSent ? 'Phone Login' : 'Enter Code'}
        </h2>
        <p className="text-gray-600 text-sm">
          {!otpSent 
            ? "Enter your phone number to receive a code"
            : `Code sent to ${phoneNumber}`
          }
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {success}
        </div>
      )}

      {adminInfo && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
          Welcome back, <strong>{adminInfo.name}</strong> ({adminInfo.role})
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!otpSent ? (
          // Phone Input
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="8978009953"
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={loading}
            />
          </div>
        ) : (
          // OTP Input
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
              Verification Code
            </Label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={handleOtpChange}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-500 text-center">
              Code expires in 5 minutes
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            type="submit"
            disabled={loading || (!otpSent ? !phoneNumber : !otp)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {!otpSent ? 'Sending...' : 'Verifying...'}
              </>
            ) : (
              !otpSent ? 'Send Code' : 'Verify & Login'
            )}
          </Button>

          {otpSent && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResendOTP}
              disabled={resendTimer > 0 || loading}
              className="w-full"
            >
              {resendTimer > 0 
                ? `Resend in ${resendTimer}s`
                : 'Resend Code'
              }
            </Button>
          )}

          <div className="flex gap-2">
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={loading}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={loading}
              className={!onBack ? "w-full" : "flex-1"}
            >
              Reset
            </Button>
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-3">
        <p className="text-xs text-gray-500">
          Available for School Admins, Counselors & Teachers
        </p>
        <div className="text-sm">
          <span className="text-gray-600">Prefer email login? </span>
          <button
            type="button"
            onClick={handleEmailLoginRedirect}
            className="text-blue-600 hover:text-blue-700 underline font-medium"
          >
            Login with Email
          </button>
        </div>
      </div>
    </div>
  );
}
