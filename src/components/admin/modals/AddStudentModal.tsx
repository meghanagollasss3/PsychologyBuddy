"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { X, UserPlus, ChevronDown, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SchoolSearch } from './SchoolSearch';
import { useToast } from '@/components/ui/use-toast';

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
  locationId: string;
}

export function AddStudentModal({ onClose, onSuccess, schools, classes, onClassesUpdated }: AddStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    firstName: '',
    lastName: '',
    password: '',
    email: '',
    grade: '10',
    section: 'A',
    phone: '',
    schoolId: '',
    locationId: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  // School-related sections state
  const [isSectionPopoverOpen, setIsSectionPopoverOpen] = useState(false);
  const [newSection, setNewSection] = useState('');
  const [sections, setSections] = useState<string[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  // School-related locations state
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Fetch school sections when school is selected
  useEffect(() => {
    const fetchSchoolSections = async () => {
      if (formData.schoolId) {
        setLoadingSections(true);
        try {
          const response = await fetch(`/api/admin/schools/${formData.schoolId}/sections`);
          const data = await response.json();
          if (data.success) {
            setSections(data.sections || []);
          } else {
            setSections([]);
            toast({ title: "Error", description: "Failed to load school sections", variant: "destructive" });
          }
        } catch (error) {
          console.error('Error fetching school sections:', error);
          setSections([]);
          toast({ title: "Error", description: "Failed to load school sections", variant: "destructive" });
        } finally {
          setLoadingSections(false);
        }
      } else {
        setSections([]);
        setFormData(prev => ({ ...prev, section: '' }));
      }
    };

    fetchSchoolSections();
  }, [formData.schoolId]);

  // Fetch school locations when school is selected
  useEffect(() => {
    const fetchSchoolLocations = async () => {
      if (formData.schoolId) {
        setLoadingLocations(true);
        try {
          const response = await fetch(`/api/admin/schools/locations?schoolId=${formData.schoolId}`);
          const data = await response.json();
          setLocations(data || []);
        } catch (error) {
          console.error('Error fetching school locations:', error);
          setLocations([]);
          toast({ title: "Error", description: "Failed to load school locations", variant: "destructive" });
        } finally {
          setLoadingLocations(false);
        }
      } else {
        setLocations([]);
        setFormData(prev => ({ ...prev, locationId: '' }));
      }
    };

    fetchSchoolLocations();
  }, [formData.schoolId]);

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
    // Enhanced email validation
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address (e.g., user@domain.com)';
      }
    }
    if (!formData.grade) newErrors.grade = 'Grade is required';
    if (!formData.section) newErrors.section = 'Section is required';
    if (!formData.locationId) newErrors.locationId = 'Location is required';

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
        // Handle Zod validation errors specifically
        if (data.error === 'Valid email required') {
          setSubmitError('Please enter a valid email address (e.g., user@domain.com)');
        } else if (data.error && data.error.includes('email')) {
          setSubmitError('Please enter a valid email address');
        } else {
          setSubmitError(data.error || data.message || 'Failed to create student');
        }
      }
    } catch (error: any) {
      console.error('Error creating student:', error);
      // Handle specific error messages
      if (error?.error?.includes('email') || error?.error?.includes('Valid email required')) {
        setSubmitError('Please enter a valid email address');
      } else {
        setSubmitError('Failed to create student. Please check your information and try again.');
      }
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
              {/* <div>
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
              </div> */}
          {/* School-related sections - Only show when school is selected */}
          {formData.schoolId && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Section</Label>
                <Popover open={isSectionPopoverOpen} onOpenChange={setIsSectionPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between hover:bg-gray-200" disabled={loadingSections}>
                      <span className={formData.section ? "" : "text-muted-foreground"}>
                        {loadingSections ? "Loading sections..." : (formData.section || "Select section...")}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 border bg-white shadow-xl rounded-[6px]" align="start">
                    <div className="space-y-2">
                      {sections.length > 0 ? (
                        sections.map((section) => (
                          <div key={section} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted" onClick={() => { setFormData(prev => ({ ...prev, section })); setIsSectionPopoverOpen(false); }}>
                            <div className={`h-4 w-4 border rounded-full flex items-center justify-center ${formData.section === section ? 'bg-primary border-primary' : 'border-input'}`}>
                              {formData.section === section && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                            </div>
                            <span className="text-sm">{section}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No sections available for this school
                        </div>
                      )}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex gap-2">
                          <Input placeholder="Add new section..." value={newSection} onChange={(e) => setNewSection(e.target.value)} className="h-8 text-sm" onClick={(e) => e.stopPropagation()} />
                          <Button size="sm" className="h-8" onClick={async (e) => { 
                            e.stopPropagation(); 
                            if (newSection.trim() && !sections.includes(newSection.trim())) { 
                              try {
                                const response = await fetch(`/api/admin/schools/${formData.schoolId}/sections`, {
                                  method: 'POST',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'x-user-id': user?.id || 'admin@calmpath.ai'
                                  },
                                  body: JSON.stringify({ name: newSection.trim() })
                                });
                                const result = await response.json();
                                if (result.success) {
                                  setSections(prev => [...prev, newSection.trim()]); 
                                  toast({ title: "Section Added" }); 
                                  setNewSection(""); 
                                } else {
                                  toast({ title: "Error", description: result.error || "Failed to create section", variant: "destructive" });
                                }
                              } catch (error) {
                                toast({ title: "Error", description: "Failed to create section", variant: "destructive" });
                              }
                            } 
                          }}><Plus className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Location Field */}
              <div className="grid gap-2">
                <Label>Location</Label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.locationId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loadingLocations}
                >
                  <option value="">
                    {loadingLocations ? "Loading locations..." : "Select location..."}
                  </option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {errors.locationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.locationId}</p>
                )}
                {locations.length === 0 && !loadingLocations && formData.schoolId && (
                  <p className="text-sm text-gray-500">No locations available for this school</p>
                )}
              </div>
            </div>
          )}
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
