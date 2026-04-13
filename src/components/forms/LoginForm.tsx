"use client";



import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import { AlertMessage } from '@/components/ui/AlertMessage';

import { RegistrationFormField } from '@/src/components/forms/RegistrationFormField';

// import { GoogleOAuthButton } from '@/src/components/auth/GoogleOAuthButton';

import { Mail, Lock } from 'lucide-react';



interface LoginFormProps {

  formData: {

    email: string;

    password: string;

    rememberMe: boolean;

  };

  showPassword: boolean;

  loading: boolean;

  error: string | null;

  success: string | null;

  isGoogleLoading: boolean;

  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  onTogglePassword: () => void;

  onSubmit: () => void;

  onGoogleSignIn: () => void;

}



export const LoginForm: React.FC<LoginFormProps> = ({

  formData,

  showPassword,

  loading,

  error,

  success,

  isGoogleLoading,

  onChange,

  onTogglePassword,

  onSubmit,

  onGoogleSignIn,

}) => {

  const router = useRouter();



  const handleStudentLoginRedirect = () => {

    router.push('/student-login');

  };



  const handleAdminRegisterRedirect = () => {

    router.push('/admin-register');

  };



  const handleForgotPasswordRedirect = () => {

    router.push('/forgot-password');

  };

  

  const handlePhoneLoginRedirect = () => {

    router.push('/admin-login-phone');

  };

  return (

    <div className="max-w-[512px] space-y-6 mx-auto">

      {/* Error and Success Messages */}

      {error && <AlertMessage type="error" message={error} />}

      {success && <AlertMessage type="success" message={success} />}



      {/* Email Field */}

      <RegistrationFormField

        id="email"

        label="Email"

        type="email"

        name="email"

        value={formData.email}

        onChange={onChange}

        placeholder="Enter your email"

        className='text-[#667085]'

        icon={<Mail className="w-5 h-5" />}

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

        icon={<Lock className="w-5 h-5" />}

        className='text-[#667085]'

        showPasswordToggle

        showPassword={showPassword}

        onTogglePassword={onTogglePassword}

        required

      />



      {/* Remember Me & Forgot Password */}

      <div className="flex items-center justify-between ">

        {/* <div className="flex items-center space-x-2">

          <input

            type="checkbox"

            id="rememberMe"

            name="rememberMe"

            checked={formData.rememberMe}

            onChange={onChange}

            className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"

          />

          <label htmlFor="rememberMe" className="text-sm text-gray-600">

            Remember me

          </label>

        </div> */}

        

        {/* <button

          type="button"

          onClick={handleForgotPasswordRedirect}

          className="text-[14px] sm:text-[16px] text-[#1B9EE0] -mt-3 hover:text-[#4FC1F9] underline font-medium"

        >

          Forgot password?

        </button> */}

      </div>



      {/* Submit Button */}

      {/* <button

        onClick={onSubmit}

        disabled={loading}

        className="w-full bg-gradient-to-r from-blue-400 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-blue-500 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"

      >

        {loading ? 'Signing in...' : 'Sign In'}

      </button> */}

      <button

        onClick={onSubmit}

        disabled={loading}

        className="w-full h-[47px] sm:w-[512px] sm:h-[47px] bg-gradient-to-b from-[#4FC1F9] to-[#1B9EE0] text-lg sm:text-xl text-white rounded-full font-medium hover:from-[#4FC1F9] hover:to-[#1B9EE0] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"

      >

        {loading ? 'Signing in...' : 'Get started'}

      </button>



      {/* Divider */}

      <div className="relative">

        <div className="absolute inset-0 flex items-center">

          <div className="w-full border-t border-gray-300"></div>

        </div>

        <div className="relative flex justify-center text-[14px] sm:text-[16px]">

          <span className="px-4 bg-white text-[#6D6D6D]">or</span>

        </div>

      </div>



      {/* Google Sign-In Button */}

      {/* <GoogleOAuthButton

        onClick={() => {

          console.log('Initiating Google sign-in for admin login');

        }}

        loading={isGoogleLoading}

        text="Sign in with Google"

        userType="admin"

      /> */}



     



      {/* Register Link */}

      {/* <div className="text-[14px] sm:text-[16px] text-center">

        <span className="text-gray-600">Are you an admin who needs an account? </span>

        <button

          type="button"

          onClick={handleAdminRegisterRedirect}

          className="text-[#1B9EE0] hover:text-[#4FC1F9] underline font-medium"

        >

          Register here

        </button>

      </div> */}



      {/* Student Login Link */}

      <div className="text-[14px] sm:text-[16px] text-center">

        <span className="text-gray-600">Are you a student? </span>

        <button

          type="button"

          onClick={handleStudentLoginRedirect}

          className="text-[#1B9EE0] hover:text-[#4FC1F9] underline font-medium"

        >

          Access with School ID

        </button>

</div>
      
      {/* Phone Login Link */}
      <div className="text-[14px] sm:text-[16px] text-center">
        <span className="text-gray-600">Prefer phone login? </span>
        <button
          type="button"
          onClick={handlePhoneLoginRedirect}
          className="text-[#1B9EE0] hover:text-[#4FC1F9] underline font-medium"
        >
          Login with Phone Number
        </button>
      </div>
    </div>
  );
};
