'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';

interface StudentLoginData {
  studentId: string;
  password: string;
}

interface StudentLoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      studentId: string;
      firstName: string;
      lastName: string;
      role: {
        name: string;
      };
      school?: {
        id: string;
        name: string;
      };
      classRef?: {
        id: string;
        name: string;
        grade: number;
        section: string;
      };
    };
  };
}

export function useStudentLogin() {
  const [formData, setFormData] = useState<StudentLoginData>({
    studentId: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.studentId || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.studentId.length < 3) {
      setError('Student ID must be at least 3 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: StudentLoginResponse = await response.json();

      if (data.success && data.data?.user) {
        setSuccess('Login successful!');
        
        // Login user in context with required adminProfile (empty for students)
        const userWithProfile = {
          ...data.data?.user,
          adminProfile: {} // Students don't have adminProfile but it's required by User interface
        };
        login(userWithProfile);
        
        // Check if mood checkin is already done today
        setTimeout(async () => {
          try {
            console.log('Checking mood checkin status after login...');
            
            // Store studentId in localStorage first
            const studentId = data.data?.user?.studentId;
            if (studentId) {
              localStorage.setItem('studentId', studentId);
              console.log('Stored studentId in localStorage:', studentId);
            }
            
            // Use the studentId directly from the login response
            const headers: Record<string, string> = {
              'Content-Type': 'application/json'
            };
            
            if (studentId) {
              headers['Authorization'] = studentId;
              console.log('Making API call with studentId:', studentId);
            }

            const response = await fetch('/api/students/mood/checkin/today', {
              method: 'GET',
              headers,
            });

            console.log('API response status:', response.status);

            if (response.ok) {
              const moodData = await response.json();
              console.log('Mood checkin data:', moodData);
              
              if (moodData.data?.hasCheckin) {
                // Mood checkin already done, redirect to dashboard
                console.log('Mood checkin already done, redirecting to dashboard');
                router.push('/students');
              } else {
                // Mood checkin not done, redirect to mood checkin
                console.log('Mood checkin not done, redirecting to mood checkin');
                router.push('/students/mood-checkin');
              }
            } else {
              // If there's an error checking mood status, default to mood checkin
              console.log('API call failed, defaulting to mood checkin');
              router.push('/students/mood-checkin');
            }
          } catch (error) {
            // If there's an error checking mood status, default to mood checkin
            console.error('Error checking mood checkin status:', error);
            router.push('/students/mood-checkin');
          }
        }, 1500);
      } else {
        setError(data.message || 'Login failed. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error('Student login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    error,
    success,
    handleChange,
    handleSubmit,
  };
}
