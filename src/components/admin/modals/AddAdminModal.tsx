"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { X, UserPlus, Check, Eye, EyeOff, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SchoolSearch } from '@/src/components/admin/modals/SchoolSearch';
import { LocationSearch } from '@/src/components/admin/modals/LocationSearch';
import { useAdminLoading, AdminActions } from '@/src/contexts/AdminLoadingContext';
import { LoadingButton } from '@/src/components/admin/ui/AdminLoader';

interface AddAdminModalProps {
  onClose: () => void;
  onSuccess: () => void;
  schools: any[];
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role: 'ADMIN' | 'SCHOOL_SUPERADMIN' | 'SUPERADMIN';
  schoolId: string;
  locationId: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  department?: string;
  status?: string;
  role?: string;
  schoolId?: string;
  locationId?: string;
}

interface SchoolLocation {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  isMain: boolean;
  school: {
    name: string;
  };
  _count: {
    users: number;
    classes: number;
  };
}

export function AddAdminModal({ onClose, onSuccess, schools }: AddAdminModalProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    status: 'ACTIVE',
    role: 'ADMIN',
    schoolId: '',
    locationId: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRolePopoverOpen, setIsRolePopoverOpen] = useState(false);
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);

  // Role options
  const roleOptions = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SCHOOL_SUPERADMIN', label: 'School Superadmin' },
    { value: 'SUPERADMIN', label: 'Super Admin' }
  ];

  // Status options
  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' }
  ];

  // Location state
  const [locations, setLocations] = useState<SchoolLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SchoolLocation | null>(null);

  const { user } = useAuth();
  const { executeWithLoading } = useAdminLoading();

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormData]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError('');
    }
  };

  // Check phone number uniqueness
  const checkPhoneUniqueness = async (phone: string) => {
    if (!phone.trim()) {
      setPhoneError("");
      return;
    }

    setIsCheckingPhone(true);
    setPhoneError("");

    try {
      const response = await fetch(`/api/admins/check-phone?phone=${encodeURIComponent(phone)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "admin@calmpath.ai",
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.exists) {
          setPhoneError("Phone number already exists");
        } else {
          setPhoneError("");
        }
      } else {
        console.error("Failed to check phone uniqueness:", data.error);
      }
    } catch (error) {
      console.error("Error checking phone uniqueness:", error);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Debounced phone uniqueness check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.phone) {
        checkPhoneUniqueness(formData.phone);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.phone]);

  // Check email uniqueness
  const checkEmailUniqueness = async (email: string) => {
    if (!email.trim()) {
      setEmailError("");
      return;
    }

    setIsCheckingEmail(true);
    setEmailError("");

    try {
      const response = await fetch(`/api/admins/check-email?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || 'admin@calmpath.ai',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        if (data.exists) {
          setEmailError("Email already exists");
        } else {
          setEmailError("");
        }
      } else {
        console.error("Failed to check email uniqueness:", data.error);
      }
    } catch (error) {
      console.error("Error checking email uniqueness:", error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Debounced email uniqueness check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        checkEmailUniqueness(formData.email);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.email, user?.id]);

  // Fetch locations when school changes
  useEffect(() => {
    const fetchLocations = async () => {
      if (!formData.schoolId) {
        setLocations([]);
        setSelectedLocation(null);
        return;
      }

      try {
        const response = await fetch(`/api/admin/schools/locations?schoolId=${formData.schoolId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || 'admin@calmpath.ai',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Locations fetched:', data);
          setLocations(data || []);
        } else {
          console.error('Failed to fetch locations - Response status:', response.status);
          setLocations([]);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
      }
    };

    fetchLocations();
  }, [formData.schoolId, user?.id]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else if (emailError) {
      newErrors.email = emailError;
    }
    if (formData.phone && formData.phone.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    } else if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must contain only digits';
    } else if (phoneError) {
      newErrors.phone = phoneError;
    }
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.status.trim()) newErrors.status = 'Status is required';
    if (formData.role === 'ADMIN' && !formData.schoolId) newErrors.schoolId = 'School is required for ADMIN role';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitError('');
    
    try {
      await executeWithLoading(
        AdminActions.ADD_ADMIN,
        (async () => {
          const response = await fetch('/api/admins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
          });
          
          const data = await response.json();
          
          if (data.success) {
            onSuccess();
            onClose();
          } else {
            // Handle specific error messages from API response
            if (data.error === 'A user with this email already exists' || data.error?.includes('email already exists') || data.error?.includes('Unique constraint') && data.error?.includes('email')) {
              setSubmitError('This email is already in use. Please use a different email address.');
              setEmailError('Email already exists');
            } else if (data.error?.includes('phone number already exists') || data.error?.includes('Unique constraint') && data.error?.includes('phone')) {
              setSubmitError('An admin with this phone number already exists. Please use a different phone number.');
              setPhoneError('Phone number already exists');
            } else {
              setSubmitError(typeof data.error === 'string' ? data.error : typeof data.message === 'string' ? data.message : 'Failed to create admin');
            }
          }
        })(),
        'Creating admin...'
      );
    } catch (error: any) {
      console.error('Error creating admin:', error);
      
      // Handle specific error messages
      if (error?.error === 'A user with this email already exists') {
        setSubmitError('This email is already in use. Please use a different email address.');
      } else {
        setSubmitError('Failed to create admin. Please try again.');
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add New Admin</DialogTitle>
          <DialogDescription>
            Create a new administrator account for the platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800">{submitError}</div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            {/* <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
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
                <div className="relative">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter Email"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email || emailError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {isCheckingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  {!isCheckingEmail && !emailError && formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {(errors.email || emailError) && (
                  <p className="mt-1 text-sm text-red-600">{errors.email || emailError}</p>
                )}
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter Password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                {/* <p className="mt-1 text-xs text-gray-500">Must contain uppercase, lowercase, and number (min 8 chars)</p> */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      // Only allow numbers, limit to 10 digits
                      const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleInputChange('phone', numericValue);
                    }}
                    placeholder="Enter 10-Digits mobile number"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone || phoneError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {isCheckingPhone && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  {!isCheckingPhone && !phoneError && formData.phone && formData.phone.length === 10 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {(errors.phone || phoneError) && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone || phoneError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <Popover open={isRolePopoverOpen} onOpenChange={setIsRolePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={`w-full justify-between text-left font-normal ${
                        errors.role ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {roleOptions.find(role => role.value === formData.role)?.label || 'Select role'}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 border z-10 bg-white shadow-xl rounded-[6px]" align="start">
                    <div className="p-1">
                      {roleOptions.map((role) => (
                        <div
                          key={role.value}
                          className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md"
                          onClick={() => {
                            handleInputChange('role', role.value);
                            setIsRolePopoverOpen(false);
                          }}
                        >
                          <div
                            className={`h-4 w-4 border rounded-full flex items-center justify-center ${
                              formData.role === role.value ? "bg-blue-500 border-blue-500" : "border-gray-300"
                            }`}
                          >
                            {formData.role === role.value && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="ml-2">{role.label}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <Input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Enter department name"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <Popover open={isStatusPopoverOpen} onOpenChange={setIsStatusPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={`w-full justify-between text-left font-normal ${
                        errors.status ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {statusOptions.find(status => status.value === formData.status)?.label || 'Select status'}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2 border z-10 bg-white shadow-xl rounded-[6px]" align="start">
                    <div className="p-1">
                      {statusOptions.map((status) => (
                        <div
                          key={status.value}
                          className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md"
                          onClick={() => {
                            handleInputChange('status', status.value);
                            setIsStatusPopoverOpen(false);
                          }}
                        >
                          <div
                            className={`h-4 w-4 border rounded-full flex items-center justify-center ${
                              formData.status === status.value ? "bg-blue-500 border-blue-500" : "border-gray-300"
                            }`}
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

              {/* School Search - Only show for ADMIN and SCHOOL_SUPERADMIN roles */}
              {(formData.role === 'ADMIN' || formData.role === 'SCHOOL_SUPERADMIN') && (
                <div className="md:col-span-2">
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
                  <p className="mt-1 text-xs text-gray-500">
                    Multiple admins can be assigned to the same school
                  </p>
                </div>
              )}

              {/* Location Assignment - Only show for ADMIN role */}
              {formData.role === 'ADMIN' && formData.schoolId && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Assignment *
                  </label>
                  <Popover open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={`w-full justify-between text-left font-normal ${
                          errors.locationId ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        {selectedLocation ? selectedLocation.name : 'Select location'}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 border bg-white shadow-xl rounded-[6px]" align="start">
                      <div className="p-1 max-h-60 overflow-y-auto">
                        {locations.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No locations available
                          </div>
                        ) : (
                          locations.map((location) => (
                            <div
                              key={location.id}
                              className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md"
                              onClick={() => {
                                setSelectedLocation(location);
                                handleInputChange('locationId', location.id);
                                setIsLocationPopoverOpen(false);
                              }}
                            >
                              <div
                                className={`h-4 w-4 border rounded-full flex items-center justify-center ${
                                  formData.locationId === location.id ? "bg-blue-500 border-blue-500" : "border-gray-300"
                                }`}
                              >
                                {formData.locationId === location.id && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className="ml-2">{location.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {errors.locationId && (
                    <p className="mt-1 text-sm text-red-600">{errors.locationId}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Select the specific location this admin will manage
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <LoadingButton
              type="button"
              variant="outline"
              onClick={onClose}
              loadingText="Cancelling..."
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              type="submit"
              loadingText="Creating..."
              className="gap-2 text-white"
            >
              
              Add Admin
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
