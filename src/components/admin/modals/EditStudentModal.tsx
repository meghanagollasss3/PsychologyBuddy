"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { X, Edit, Loader } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditStudentModalProps {
  student: any;
  onClose: () => void;
  onSuccess: () => void;
  schools: any[];
  classes: any[];
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  classId: string;
  schoolId: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export function EditStudentModal({ student, onClose, onSuccess, schools, classes }: EditStudentModalProps) {
  // Early return if student is not valid
  if (!student || !student.id) {
    console.error('EditStudentModal: Invalid student prop', student);
    return null;
  }

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    classId: '',
    schoolId: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    status: 'ACTIVE'
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const { user } = useAuth();

  useEffect(() => {
    // Pre-fill form with student data
    if (student && typeof student === 'object' && student.id) {
      try {
        const dateOfBirthValue = student.studentProfile?.dateOfBirth || student.dateOfBirth || student.date_of_birth;

        let processedDateOfBirth = '';
        if (dateOfBirthValue) {
          if (typeof dateOfBirthValue === 'string') {
            // If it's already a string, check if it's in YYYY-MM-DD format
            if (dateOfBirthValue.includes('T')) {
              processedDateOfBirth = dateOfBirthValue.split('T')[0];
            } else {
              processedDateOfBirth = dateOfBirthValue;
            }
          } else if (dateOfBirthValue instanceof Date) {
            processedDateOfBirth = dateOfBirthValue.toISOString().split('T')[0];
          } else {
            // Try to create a date from it
            try {
              const date = new Date(dateOfBirthValue);
              if (!isNaN(date.getTime())) {
                processedDateOfBirth = date.toISOString().split('T')[0];
              }
            } catch (dateError) {
              console.error('Error processing date:', dateError);
            }
          }
        }

        setFormData({
          firstName: student.firstName || student.first_name || '',
          lastName: student.lastName || student.last_name || '',
          email: student.email || '',
          phone: student.phone || '',
          dateOfBirth: processedDateOfBirth,
          classId: student.classRef?.name || student.className || student.class_name || '',
          schoolId: student.school?.id || student.schoolId || student.school_id || '',
          emergencyContact: {
            name: student.studentProfile?.emergencyContact?.name || student.emergencyContact?.name || student.emergency_contact?.name || '',
            phone: student.studentProfile?.emergencyContact?.phone || student.emergencyContact?.phone || student.emergency_contact?.phone || '',
            relationship: student.studentProfile?.emergencyContact?.relationship || student.emergencyContact?.relationship || student.emergency_contact?.relationship || ''
          },
          status: student.studentProfile?.status || student.status || 'ACTIVE'
        });
      } catch (error) {
        console.error('Error setting form data from student:', error, student);
      }
    } else {
      console.warn('Invalid student data for form initialization:', student);
    }
  }, [student]);

  const handleInputChange = (field: string, value: string) => {
    // Handle nested emergency contact fields
    if (field.startsWith('emergencyContact.')) {
      const nestedField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [nestedField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error for this field
    if (errors[field as keyof FormData]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.classId) newErrors.classId = 'Class is required';
    if (!formData.schoolId) newErrors.schoolId = 'School is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Student Updated Successfully",
          description: "The student's profile has been updated and will reflect in their student dashboard."
        });
        onSuccess();
      } else {
        toast({
          title: "Update Failed",
          description: data.error?.message || "Failed to update student",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center space-x-3">
          <Edit className="w-5 h-5 text-blue-600" />
          <span>Edit Student</span>
        </DialogTitle>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <Input
                  type="text"
                  value={formData.classId}
                  onChange={(e) => handleInputChange('classId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.classId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter class name"
                />
                {errors.classId && (
                  <p className="mt-1 text-sm text-red-600">{errors.classId}</p>
                )}
              </div>
            </div>
          </div>

          {/* School */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">School</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School *
              </label>
              <Input
                type="text"
                value={formData.schoolId}
                onChange={(e) => handleInputChange('schoolId', e.target.value)}
                disabled={user?.role?.name !== 'SUPERADMIN'}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.schoolId ? 'border-red-500' : 'border-gray-300'
                } ${user?.role?.name !== 'SUPERADMIN' ? 'bg-gray-100' : ''}`}
                placeholder="Enter school name"
              />
              {errors.schoolId && (
                <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>
              )}
              {user?.role?.name !== 'SUPERADMIN' && (
                <p className="mt-1 text-xs text-gray-500">
                  You can only assign students to your school
                </p>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Parent/Guardian name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <Input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <Input
                  type="text"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Parent, Guardian, etc."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Student'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
