"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { X, Edit, ChevronDown, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAdminLoading, AdminActions } from '@/src/contexts/AdminLoadingContext';
import { LoadingButton } from '@/src/components/admin/ui/AdminLoader';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SchoolSearch } from './SchoolSearch';

interface EditStudentModalProps {
  student: any;
  onClose: () => void;
  onSuccess: () => void;
  schools: any[];
  classes: any[];
}

interface FormData {
  studentId: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  classId: string;
  schoolId: string;
  locationId: string;
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

  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    classId: '',
    schoolId: '',
    locationId: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    status: 'ACTIVE'
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isCheckingStudentId, setIsCheckingStudentId] = useState(false);
  const [studentIdError, setStudentIdError] = useState("");

  // Status options
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' }
  ];

  // Location state
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const { user } = useAuth();
  const { executeWithLoading } = useAdminLoading();

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
          studentId: student.studentId || student.student_id || '',
          password: '', // Keep empty for password field (user can enter new password)
          firstName: student.firstName || student.first_name || '',
          lastName: student.lastName || student.last_name || '',
          email: student.email || '',
          phone: student.phone || '',
          dateOfBirth: processedDateOfBirth,
          classId: student.classRef?.name || student.className || student.class_name || '',
          schoolId: student.school?.id || student.schoolId || student.school_id || '',
          locationId: student.location?.id || student.locationId || student.location_id || '',
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

  // Fetch school locations when school is selected
  useEffect(() => {
    const fetchSchoolLocations = async () => {
      if (formData.schoolId && formData.schoolId.trim() !== '') {
        console.log('Fetching locations for schoolId:', formData.schoolId);
        setLoadingLocations(true);
        try {
          const response = await fetch(
            `/api/admin/schools/locations?schoolId=${formData.schoolId}`,
            {
              headers: {
                "x-user-id": user?.id || "admin@calmpath.ai",
              },
            }
          );
          console.log('Locations response status:', response.status);
          const data = await response.json();
          console.log('Locations data:', data);
          setLocations(data || []);
        } catch (error) {
          console.error("Error fetching school locations:", error);
          setLocations([]);
        } finally {
          setLoadingLocations(false);
        }
      } else {
        console.log('No schoolId provided, clearing locations');
        setLocations([]);
      }
    };

    fetchSchoolLocations();
  }, [formData.schoolId, user?.id]);

  // Check student ID uniqueness
  const checkStudentIdUniqueness = async (studentId: string) => {
    if (!studentId.trim()) {
      setStudentIdError("");
      return;
    }

    // Skip check if studentId is the same as the original student's ID
    if (student?.studentId === studentId.trim()) {
      setStudentIdError("");
      return;
    }

    setIsCheckingStudentId(true);
    setStudentIdError("");

    try {
      const response = await fetch(`/api/students/check-id?studentId=${encodeURIComponent(studentId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "admin@calmpath.ai",
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.exists) {
          setStudentIdError("Student ID already exists");
        } else {
          setStudentIdError("");
        }
      } else {
        console.error("Failed to check student ID uniqueness:", data.error);
      }
    } catch (error) {
      console.error("Error checking student ID uniqueness:", error);
    } finally {
      setIsCheckingStudentId(false);
    }
  };

  // Debounced student ID uniqueness check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.studentId) {
        checkStudentIdUniqueness(formData.studentId);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.studentId]);

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    // Handle phone number input
    if (field === 'phone') {
      // Only allow numeric input
      const numericValue = value.replace(/\D/g, '');
      // Limit to 10 digits
      processedValue = numericValue.slice(0, 10);
    }
    
    // Handle nested emergency contact fields
    if (field.startsWith('emergencyContact.')) {
      const nestedField = field.split('.')[1];
      // Apply phone processing to emergency contact phone
      if (nestedField === 'phone') {
        // Only allow numeric input
        const numericValue = processedValue.replace(/\D/g, '');
        // Limit to 10 digits
        processedValue = numericValue.slice(0, 10);
      }
      setFormData(prev => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [nestedField]: processedValue }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: processedValue }));
    }
    
    // Clear error for this field
    if (errors[field as keyof FormData]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    else if (studentIdError) newErrors.studentId = studentIdError;
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.classId) newErrors.classId = 'Class is required';
    if (!formData.schoolId) newErrors.schoolId = 'School is required';
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        dob.setFullYear(today.getFullYear() - 1);
      }
      
      const finalAge = today.getFullYear() - dob.getFullYear();
      
      if (dob > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      } else if (finalAge < 13) {
        newErrors.dateOfBirth = "Student must be 13 years or older";
      } else if (finalAge > 100) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
      }
    }

    // Password validation (only if password is provided)
    if (formData.password && formData.password.trim()) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await executeWithLoading(
        AdminActions.EDIT_STUDENT,
        (async () => {
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
            let errorMessage = "Failed to update student";
            if (data.error?.includes("email already exists")) {
              errorMessage = "This email address is already registered to another student";
            } else if (data.error?.includes("phone number already exists")) {
              errorMessage = "This phone number is already registered to another student";
            } else if (data.error?.includes("Student with this ID already exists") || data.error?.includes("studentId") || data.error?.includes("Unique constraint")) {
              errorMessage = "A student with this ID already exists. Please use a different Student ID.";
              setStudentIdError("Student ID already exists");
            } else if (data.error?.message) {
              errorMessage = data.error.message;
            }
            
            toast({
              title: "Update Failed",
              description: errorMessage,
              variant: "destructive"
            });
          }
        })(),
        'Updating student...'
      );
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update student. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="flex items-center space-x-3">
          <Edit className="w-5 h-5 text-blue-600" />
          <span>Edit Student</span>
        </DialogTitle>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Editable Student ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID *
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={formData.studentId || ''}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.studentId || studentIdError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter student ID"
                  />
                  {isCheckingStudentId && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  {!isCheckingStudentId && !studentIdError && formData.studentId && student?.studentId !== formData.studentId && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {(errors.studentId || studentIdError) && (
                  <p className="mt-1 text-sm text-red-600">{errors.studentId || studentIdError}</p>
                )}
              </div>

              {/* Editable Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <Input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password (leave blank to keep current)"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank to keep current password
                </p>
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
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
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
                <Label>Status</Label>
                <Popover
                  open={isStatusPopoverOpen}
                  onOpenChange={setIsStatusPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between hover:bg-gray-200"
                    >
                      <span
                        className={
                          formData.status ? "" : "text-muted-foreground"
                        }
                      >
                        {formData.status || "Select status..."}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full p-2 border z-10 bg-white shadow-xl rounded-[6px]"
                    align="start"
                  >
                    <div className="space-y-2">
                      {statusOptions.map((status) => (
                        <div
                          key={status.value}
                          className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, status: status.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }));
                            setIsStatusPopoverOpen(false);
                          }}
                        >
                          <div
                            className={`h-4 w-4 border rounded-full flex items-center justify-center ${formData.status === status.value ? "bg-primary border-primary" : "border-input"}`}
                          >
                            {formData.status === status.value && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="ml-2">{status.label}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {user?.role?.name === 'SUPERADMIN' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School *
                </label>
                <SchoolSearch
                  onSchoolSelect={(school: any) => {
                    if (school) {
                      handleInputChange('schoolId', school.id);
                    } else {
                      handleInputChange('schoolId', '');
                    }
                  }}
                  placeholder="Search for a school..."
                  initialSchool={student?.school || null}
                />
                {errors.schoolId && (
                  <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School *
                </label>
                <Input
                  type="text"
                  value={student?.school?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  placeholder="School assigned by admin"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You can only assign students to your school
                </p>
              </div>
            )}

              {/* Location Field */}
              {formData.schoolId && (
                <div>
                  <Label>Location</Label>
                  <Popover
                    open={isLocationPopoverOpen}
                    onOpenChange={setIsLocationPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between hover:bg-gray-200"
                        disabled={loadingLocations}
                      >
                        <span
                          className={
                            formData.locationId ? "" : "text-muted-foreground"
                          }
                        >
                          {loadingLocations
                            ? "Loading locations..."
                            : formData.locationId 
                              ? locations.find(loc => loc.id === formData.locationId)?.name || "Select location..."
                              : "Select location..."}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-full p-2 border z-10 bg-white shadow-xl rounded-[6px]"
                        align="start"
                      >
                        <div className="space-y-2">
                          {locations.length > 0 ? (
                            locations.map((location) => (
                              <div
                                key={location.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, locationId: location.id }));
                                  setIsLocationPopoverOpen(false);
                                }}
                              >
                                <div
                                  className={`h-4 w-4 border rounded-full flex items-center justify-center ${formData.locationId === location.id ? "bg-primary border-primary" : "border-input"}`}
                                >
                                  {formData.locationId === location.id && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span className="ml-2">{location.name}</span>
                              </div>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                              {loadingLocations
                                ? "Loading locations..."
                                : "No locations available for this school"}
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {errors.locationId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.locationId}
                      </p>
                    )}
                </div>
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
                  placeholder="Enter phone number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
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
            <LoadingButton
              type="submit"
              loadingText="Updating..."
              className="gap-2 text-white"
            >
              Update Student
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
