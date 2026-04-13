'use client';

import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { RegistrationFormField } from './RegistrationFormField';
import { AlertMessage } from '@/components/ui/AlertMessage';
import { RingSpinner } from '@/components/ui/Spinners';

interface StudentLoginFormProps {
  formData: {
    studentId: string;
    password: string;
  };
  loading: boolean;
  error: string | null;
  success: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export const StudentLoginForm: React.FC<StudentLoginFormProps> = ({
  formData,
  loading,
  error,
  success,
  onChange,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const onTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="max-w-[512px] space-y-6 mx-auto">
      {/* Error and Success Messages */}
      {error && <AlertMessage type="error" message={error} />}
      {success && <AlertMessage type="success" message={success} />}

      {/* Student ID Field */}
      <RegistrationFormField
        id="studentId"
        label="Student ID"
        type="text"
        name="studentId"
        value={formData.studentId}
        onChange={onChange}
        placeholder="Enter your student ID"
        icon={<User className="w-4 h-4 sm:w-5 sm:h-5" />}
        required
      />

      {/* Password Field */}
      <RegistrationFormField
        id="password"
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={onChange}
        placeholder="Enter your password"
        icon={<Lock className="w-4 h-4 sm:w-5 sm:h-5" />}
        showPasswordToggle
        showPassword={showPassword}
        onTogglePassword={onTogglePassword}
        required
      />

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full h-[47px] bg-gradient-to-b from-[#4FC1F9] to-[#1B9EE0] text-base sm:text-xl text-white rounded-full font-medium hover:from-[#4FC1F9] hover:to-[#1B9EE0] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <RingSpinner size="sm" color="white" />
            <span>Signing in...</span>
          </>
        ) : (
          'Access Psychology Buddy'
        )}
      </button>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs sm:text-sm text-gray-600 px-2">
          Enter your student ID and password to access the student portal
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 px-2">
          If you don't have login credentials, please contact your school administrator
        </p>
      </div>

      {/* Admin Login Link */}
      <div className="text-base sm:text-lg text-center">
        <span className="text-gray-600">Are you an administrator? </span>
        <button
          onClick={() => window.location.href = '/login'}
          className="text-[#1B9EE0] hover:text-[#4FC1F9] underline font-medium"
        >
          Sign in here
        </button>
      </div>
    </div>
  );
};
