import React from 'react';
import { OTPLoginForm } from '@/src/components/forms/OTPLoginForm';
import { PageIllustration } from '@/components/LandingPage/components/PageIllustration';

export default function AdminPhoneLoginPage() {
  return (
    <div className="flex min-h-screen relative">
      <PageIllustration />
      
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white relative z-10">
        <div className="w-full max-w-md sm:max-w-lg">
          <OTPLoginForm />
        </div>
      </div>
    </div>
  );
}
