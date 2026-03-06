"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { X, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddStudentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  schools: any[];
  classes: any[];
  onClassesUpdated?: () => void; // Add callback to refresh classes (optional)
}

interface FormData {
  studentId: string;
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  grade: string;
  section: string;
  phone: string;
  schoolId: string;
}

export function AddStudentModal({ onClose, onSuccess, schools, classes, onClassesUpdated }: AddStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    firstName: '',
    lastName: '',
    password: '',
    email: '',
    grade: '10',
    section: 'A',
    phone: '',
    schoolId: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Set schoolId when user changes (for regular admins)
  useEffect(() => {
    if (user?.role?.name !== 'SUPERADMIN' && user?.school?.id) {
      setFormData(prev => ({ ...prev, schoolId: user.school?.id || '' }));
    }
  }, [user]);

  const generateDefaultPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const allChars = lowercase + uppercase + numbers;
    
    let password = '';
    // Ensure at least one of each required type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    // Add remaining characters to reach 8 characters minimum
    for (let i = 3; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const createOrFindClass = async (grade: string, section: string) => {
    console.log('=== CREATE OR FIND CLASS ===');
    const className = `Class ${grade}-${section}`;
    
    // Use schoolId from form instead of user
    const schoolId = formData.schoolId;
    console.log('Selected school ID from form:', schoolId);
    
    if (!schoolId) {
      console.error('No schoolId selected for class creation');
      return null;
    }
    
    try {
      // First, check if class already exists in local classes array
      console.log('Checking for existing class in local array...');
      const existingClass = classes.find(cls => 
        cls.schoolId === schoolId && 
        cls.grade === parseInt(grade) && 
        cls.section === section
      );
      
      if (existingClass) {
        console.log('Found existing class in local array:', existingClass);
        return existingClass.id;
      }
      
      // Try to create/find class via API
      console.log('Calling API to create class with:', {
        name: className,
        grade: parseInt(grade),
        section,
        schoolId
      });
      
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: className,
          grade: parseInt(grade),
          section,
          schoolId
        })
      });
      
      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('Class operation successful:', data.message);
        if (data.message === 'Class already exists') {
          console.log('Using existing class:', data.data);
        } else {
          console.log('Created new class:', data.data);
          // Call callback to refresh classes list
          if (onClassesUpdated) {
            onClassesUpdated();
          }
        }
        return data.data.id;
      } else {
        console.error('Failed to create/find class:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error in createOrFindClass:', error);
      return null;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field as keyof FormData]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
    
    // Special handling for schoolId field to ensure it updates properly
    if (field === 'schoolId') {
      console.log('SchoolId changed to:', value);
      console.log('Current formData.schoolId:', formData.schoolId);
      setFormData(prev => ({ ...prev, schoolId: value }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.schoolId.trim()) newErrors.schoolId = 'School selection is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.grade) newErrors.grade = 'Grade is required';
    if (!formData.section) newErrors.section = 'Section is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setSubmitError('');
    
    try {
      // Create or find class based on grade and section
      const classId = await createOrFindClass(formData.grade, formData.section);
      if (!classId) {
        setSubmitError('Failed to create or find class');
        return;
      }
      
      // Update form data with the class ID and schoolId
      const submitData = {
        ...formData,
        classId,
        schoolId: formData.schoolId
      };
      
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        setSubmitError(data.message || 'Failed to create student');
      }
    } catch (error) {
      console.error('Error creating student:', error);
      setSubmitError('Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Register a new student to the platform.
            </DialogDescription>
          </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800">{submitError}</div>
            </div>
          )}
          
          {/* Student Information */}
          <div>
            {/* <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* School Selection - Only show for super admins */}
              {user?.role?.name === 'SUPERADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School ID *
                  </label>
                  <Input
                    type="text"
                    value={formData.schoolId}
                    onChange={(e) => handleInputChange('schoolId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.schoolId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter school ID"
                  />
                  {errors.schoolId && (
                    <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID *
                </label>
                <Input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.studentId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter student ID"
                />
                {errors.studentId && (
                  <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Password (uppercase, lowercase, number)"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Must contain uppercase, lowercase, and number (min 8 chars)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="student@school.edu"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade *
                </label>
                <Input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.grade ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter grade (e.g., 10)"
                />
                {errors.grade && (
                  <p className="mt-1 text-sm text-red-600">{errors.grade}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section *
                </label>
                <Input
                  type="text"
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.section ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter section (e.g., A)"
                />
                {errors.section && (
                  <p className="mt-1 text-sm text-red-600">{errors.section}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span>Add Student</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
