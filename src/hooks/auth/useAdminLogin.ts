import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';

interface AdminLoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface AdminLoginResponse {
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
  };
}

export function useAdminLogin() {
  const [formData, setFormData] = useState<AdminLoginData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: AdminLoginResponse = await response.json();

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
          if (userRole === 'SUPERADMIN' || userRole === 'SCHOOL_SUPERADMIN') {
            router.push('/admin');
          } else if (userRole === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/dashboard'); // Fallback
          }
        }, 1500);
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // For now, show message that Google sign-in is not implemented
    setError('Google sign-in is not available. Please use email and password.');
  };

  const togglePassword = () => {
    setShowPassword(prev => !prev);
  };

  return {
    formData,
    loading,
    error,
    success,
    showPassword,
    handleChange,
    handleSubmit,
    handleGoogleSignIn,
    togglePassword,
  };
}
