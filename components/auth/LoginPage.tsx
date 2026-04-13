import React from 'react';
import { useAdminLogin } from '@/src/hooks/auth/useAdminLogin';
import { LoginForm } from '@/src/components/forms/LoginForm';
import { PageIllustration } from '@/components/LandingPage/components/PageIllustration';

export default function LoginPage() {
  const {
    formData,
    loading,
    error,
    success,
    showPassword,
    handleChange,
    handleSubmit,
    handleGoogleSignIn,
    togglePassword, 
  } = useAdminLogin();

  return (
    <div className="flex min-h-screen relative">
      <PageIllustration />
      
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white relative z-10">
        <div className="w-full max-w-md sm:max-w-lg space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Admin Login
            </h1>
          </div>

          {/* Login Form */}
          <LoginForm
            formData={formData}
            showPassword={showPassword}
            loading={loading}
            error={error}
            success={success}
            isGoogleLoading={false}
            onChange={handleChange}
            onTogglePassword={togglePassword}
            onSubmit={handleSubmit}
            onGoogleSignIn={handleGoogleSignIn}
          />
        </div>
      </div>
    </div>
  );
}