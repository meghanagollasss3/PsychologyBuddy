'use client';

import React from 'react';
import { useStudentLogin } from '@/src/hooks/auth/useStudentLogin';
import { StudentLoginForm } from '@/src/components/forms/StudentLoginForm';
import { PageIllustration } from '@/components/LandingPage/components/PageIllustration';
import { RingSpinner } from '@/components/ui/Spinners';

export default function StudentLoginPage() {
  const {
    formData,
    loading,
    error,
    success,
    handleChange,
    handleSubmit,
  } = useStudentLogin();

  return (
    <div className="flex min-h-screen relative">
      <PageIllustration />
      
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white relative z-10">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-[28px] sm:text-[32px] lg:text-4xl font-bold text-gray-900 mb-2">
              Student Login
            </h1>
          </div>

          <StudentLoginForm
            formData={formData}
            loading={loading}
            error={error}
            success={success}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
