"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { X, UserPlus, ChevronDown, Plus, Phone, Mail, Eye, EyeOff, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SchoolSearch } from "./SchoolSearch";
import { useToast } from "@/components/ui/use-toast";
import {
  useAdminLoading,
  AdminActions,
} from "@/src/contexts/AdminLoadingContext";
import { LoadingButton } from "@/src/components/admin/ui/AdminLoader";

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
  dateOfBirth: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface FormErrors {
  studentId?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  email?: string;
  grade?: string;
  section?: string;
  phone?: string;
  schoolId?: string;
  locationId?: string;
  dateOfBirth?: string;
  status?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

export function AddStudentModal({
  onClose,
  onSuccess,
  schools,
  classes,
  onClassesUpdated,
}: AddStudentModalProps) {
  const [submitError, setSubmitError] = useState("");
  const [isCheckingStudentId, setIsCheckingStudentId] = useState(false);
  const [studentIdError, setStudentIdError] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const { executeWithLoading } = useAdminLoading();
  const [formData, setFormData] = useState<FormData>({
    studentId: "",
    firstName: "",
    lastName: "",
    password: "",
    email: "",
    grade: "",
    section: "A",
    phone: "",
    schoolId: "",
    locationId: "",
    dateOfBirth: "",
    status: "ACTIVE",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });
  const [errors, setErrors] = useState<Partial<FormErrors>>({});
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // School-related sections state
  const [isSectionPopoverOpen, setIsSectionPopoverOpen] = useState(false);
  const [newSection, setNewSection] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  // School-related locations state
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Status options
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const statusOptions: { value: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' }
  ];

  // Location popover state
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);

  // Fetch school sections when school is selected
  useEffect(() => {
    const fetchSchoolSections = async () => {
      if (formData.schoolId) {
        setLoadingSections(true);
        try {
          const response = await fetch(
            `/api/admin/schools/${formData.schoolId}/sections`,
          );
          const data = await response.json();
          if (data.success) {
            setSections(data.sections || []);
          } else {
            setSections([]);
            toast({
              title: "Error",
              description: "Failed to load school sections",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching school sections:", error);
          setSections([]);
          toast({
            title: "Error",
            description: "Failed to load school sections",
            variant: "destructive",
          });
        } finally {
          setLoadingSections(false);
        }
      } else {
        setSections([]);
        setFormData((prev) => ({ ...prev, section: "" }));
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
          const response = await fetch(
            `/api/admin/schools/locations?schoolId=${formData.schoolId}`,
          );
          const data = await response.json();
          setLocations(data || []);
        } catch (error) {
          console.error("Error fetching school locations:", error);
          setLocations([]);
          toast({
            title: "Error",
            description: "Failed to load school locations",
            variant: "destructive",
          });
        } finally {
          setLoadingLocations(false);
        }
      } else {
        setLocations([]);
        setFormData((prev) => ({ ...prev, locationId: "" }));
      }
    };

    fetchSchoolLocations();
  }, [formData.schoolId]);

  // Set schoolId when user changes (for regular admins)
  useEffect(() => {
    if (user?.role?.name !== "SUPERADMIN" && user?.school?.id) {
      setFormData((prev) => ({ ...prev, schoolId: user.school?.id || "" }));
    }
  }, [user]);

  // Debounced student ID uniqueness check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.studentId) {
        checkStudentIdUniqueness(formData.studentId);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.studentId]);

  const checkStudentIdUniqueness = async (studentId: string) => {
    if (!studentId.trim()) {
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
        // If API fails, don't show error to user, just log it
        console.error("Failed to check student ID uniqueness:", data.error);
      }
    } catch (error) {
      console.error("Error checking student ID uniqueness:", error);
    } finally {
      setIsCheckingStudentId(false);
    }
  };

  const generateDefaultPassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const allChars = lowercase + uppercase + numbers;

    let password = "";
    // Ensure at least one of each required type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    // Add remaining characters to reach 8 characters minimum
    for (let i = 3; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  };

  const createOrFindClass = async (grade: string, section: string) => {
    console.log("=== CREATE OR FIND CLASS ===");
    const className = `Class ${grade}-${section}`;

    // Use schoolId from form instead of user
    const schoolId = formData.schoolId;
    console.log("Selected school ID from form:", schoolId);

    if (!schoolId) {
      console.error("No schoolId selected for class creation");
      return null;
    }

    try {
      // First, check if class already exists in local classes array
      console.log("Checking for existing class in local array...");
      const existingClass = classes.find(
        (cls) =>
          cls.schoolId === schoolId &&
          cls.grade === parseInt(grade) &&
          cls.section === section,
      );

      if (existingClass) {
        console.log("Found existing class in local array:", existingClass);
        return existingClass.id;
      }

      // Try to create/find class via API
      console.log("Calling API to create class with:", {
        name: className,
        grade: parseInt(grade),
        section,
        schoolId,
      });

      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: className,
          grade: parseInt(grade),
          section,
          schoolId,
        }),
      });

      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2));

      if (data.success) {
        console.log("Class operation successful:", data.message);
        if (data.message === "Class already exists") {
          console.log("Using existing class:", data.data);
        } else {
          console.log("Created new class:", data.data);
          // Call callback to refresh classes list
          if (onClassesUpdated) {
            onClassesUpdated();
          }
        }
        return data.data.id;
      } else {
        console.error("Failed to create/find class:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Error in createOrFindClass:", error);
      return null;
    }
  };

  const validateEmail = (email: string): { isValid: boolean; message: string } => {
    if (!email || email.trim() === '') {
      return { isValid: false, message: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true, message: '' };
  };

  const validatePhone = (phone: string): { isValid: boolean; message: string } => {
    if (!phone || phone.trim() === '') {
      return { isValid: false, message: 'Mobile number is required' };
    }
    
    // Remove all non-numeric characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if exactly 10 digits
    if (cleanPhone.length !== 10) {
      if (cleanPhone.length < 10) {
        return { isValid: false, message: `Please enter ${10 - cleanPhone.length} more digit${10 - cleanPhone.length > 1 ? 's' : ''}` };
      } else {
        return { isValid: false, message: 'Mobile number must be exactly 10 digits' };
      }
    }
    
    // Check if contains only numbers (after cleaning)
    if (!/^\d{10}$/.test(cleanPhone)) {
      return { isValid: false, message: 'Only numbers are allowed' };
    }
    
    return { isValid: true, message: '' };
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    // Handle phone number input
    if (field === 'phone') {
      // Only allow numeric input
      const numericValue = value.replace(/\D/g, '');
      // Limit to 10 digits
      processedValue = numericValue.slice(0, 10);
      
      // Real-time validation for phone number
      const phoneValidation = validatePhone(processedValue);
      if (!phoneValidation.isValid && processedValue.length > 0) {
        setPhoneError(phoneValidation.message);
      } else {
        setPhoneError('');
      }
    }
    
    // Handle email input
    if (field === 'email') {
      // Real-time validation for email
      const emailValidation = validateEmail(processedValue);
      if (!emailValidation.isValid && processedValue.length > 0) {
        setEmailError(emailValidation.message);
      } else {
        setEmailError('');
      }
    }
    
    // Clear errors when user starts typing
    if (field === 'email') {
      setEmailError('');
    }
    if (field === 'phone') {
      setPhoneError('');
    }
    
    // Clear other errors for this field
    if (errors[field as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError("");
    }

    // Handle nested emergency contact fields
    if (field.startsWith('emergencyContact.')) {
      const emergencyField = field.split('.')[1]; // Get 'name', 'phone', or 'relationship'
      setFormData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [emergencyField]: processedValue
        }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: processedValue }));
    }

    // Special handling for schoolId field to ensure it updates properly
    if (field === "schoolId") {
      console.log("SchoolId changed to:", value);
      console.log("Current formData.schoolId:", formData.schoolId);
      setFormData((prev) => ({ ...prev, schoolId: value }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormErrors> = {};

    if (!formData.studentId.trim())
      newErrors.studentId = "Student ID is required";
    else if (studentIdError)
      newErrors.studentId = studentIdError;
    if (!formData.schoolId.trim())
      newErrors.schoolId = "School selection is required";
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }
    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message);
    }
    
    // Phone validation
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message);
    }
    
    // Email uniqueness check will be done on backend
    // Phone uniqueness check will be done on backend
    if (formData.schoolId && !formData.grade)
      newErrors.grade = "Grade is required";
    if (formData.schoolId && !formData.section)
      newErrors.section = "Section is required";
    if (!formData.locationId) newErrors.locationId = "Location is required";
    
    // Date of birth validation
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = "Date of birth is required";
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
    
    // Emergency contact validation
    if (!formData.emergencyContact.name.trim()) {
      newErrors.emergencyContact = { 
        ...newErrors.emergencyContact,
        name: "Emergency contact name is required" 
      };
    } else if (formData.emergencyContact.name.length < 3) {
      newErrors.emergencyContact = { 
        ...newErrors.emergencyContact,
        name: "Emergency contact name must be at least 3 characters" 
      };
    }
    
    if (!formData.emergencyContact.phone.trim()) {
      newErrors.emergencyContact = { 
        ...newErrors.emergencyContact,
        phone: "Emergency contact phone is required" 
      };
    } else {
      // Remove all non-numeric characters for validation
      const cleanPhone = formData.emergencyContact.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        newErrors.emergencyContact = { 
          ...newErrors.emergencyContact,
          phone: "Emergency contact phone must be exactly 10 digits" 
        };
      }
    }
    
    if (!formData.emergencyContact.relationship.trim()) {
      newErrors.emergencyContact = { 
        ...newErrors.emergencyContact,
        relationship: "Relationship is required" 
      };
    } else if (formData.emergencyContact.relationship.length < 2) {
      newErrors.emergencyContact = { 
        ...newErrors.emergencyContact,
        relationship: "Relationship must be at least 2 characters" 
      };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitError("");

    try {
      await executeWithLoading(
        AdminActions.ADD_STUDENT,
        (async () => {
          // Create or find class based on grade and section
          const classId = await createOrFindClass(
            formData.grade,
            formData.section,
          );
          if (!classId) {
            setSubmitError("Failed to create or find class");
            return;
          }

          // Update form data with the class ID and schoolId
          const submitData = {
            ...formData,
            classId,
            schoolId: formData.schoolId,
          };

          const response = await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(submitData),
          });

          const data = await response.json();

          if (data.success) {
            onSuccess();
          } else {
            // Handle specific error messages
            if (data.error === "Valid email required") {
              setSubmitError(
                "Please enter a valid email address (e.g., user@domain.com)",
              );
            } else if (data.error?.includes("email already exists")) {
              setSubmitError("This email address is already registered to another student");
              setEmailError("This email is already in use");
            } else if (data.error?.includes("phone number already exists")) {
              setSubmitError("This phone number is already registered to another student");
              setPhoneError("This phone number is already in use");
            } else if (data.error?.includes("Student with this ID already exists") || data.error?.includes("studentId") || data.error?.includes("Unique constraint")) {
              setSubmitError("A student with this ID already exists. Please use a different Student ID.");
              setStudentIdError("Student ID already exists");
            } else if (data.error && data.error.includes("email")) {
              setSubmitError("Please enter a valid email address");
            } else {
              setSubmitError(
                data.error || data.message || "Failed to create student",
              );
            }
          }
        })(),
        "Creating student...",
      );
    } catch (error: any) {
      console.error("Error creating student:", error);
      // Handle specific error messages
      if (  
        error?.error?.includes("email") ||
        error?.error?.includes("Valid email required")
      ) {
        setSubmitError("Please enter a valid email address");
      } else {
        setSubmitError(
          "Failed to create student. Please check your information and try again.",
        );
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID *
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) =>
                      handleInputChange("studentId", e.target.value)
                    }
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.studentId || studentIdError ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter student ID"
                  />
                  {isCheckingStudentId && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  {!isCheckingStudentId && !studentIdError && formData.studentId && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {(errors.studentId || studentIdError) && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.studentId || studentIdError}
                  </p>
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
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full pr-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter Password "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                {/* <p className="mt-1 text-xs text-gray-500">
                  Must contain uppercase, lowercase, and number (min 8 chars)
                </p> */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      emailError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter Email Address"
                    required
                  />
                </div>
                {emailError && (
                  <p className="mt-1 text-xs text-red-600">{emailError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      phoneError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter 10-Digits Mobile Number"
                    required
                  />
                </div>
                {phoneError && (
                  <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                )}
              </div>
            </div>
            
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                )}
              </div>
              
              <div>
                <Label>Status *</Label>
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
                            setFormData((prev) => ({ ...prev, status: status.value }));
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
            
            {/* School Selection - Only show for super admins */}
            <div className="grid grid-col-1 gap-4 mt-6">
              {user?.role?.name === "SUPERADMIN" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School *
                  </label>
                  <SchoolSearch
                    onSchoolSelect={(school: any) => {
                      if (school) {
                        handleInputChange("schoolId", school.id);
                      } else {
                        handleInputChange("schoolId", "");
                      }
                    }}
                    placeholder="Search for a school..."
                  />
                  {errors.schoolId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.schoolId}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {formData.schoolId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade *
                  </label>
                  <Input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => handleInputChange("grade", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.grade ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter grade (e.g., 10)"
                  />
                  {errors.grade && (
                    <p className="mt-1 text-sm text-red-600">{errors.grade}</p>
                  )}
                </div>
              )}
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
                    <Popover
                      open={isSectionPopoverOpen}
                      onOpenChange={setIsSectionPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between hover:bg-gray-200"
                          disabled={loadingSections}
                        >
                          <span
                            className={
                              formData.section ? "" : "text-muted-foreground"
                            }
                          >
                            {loadingSections
                              ? "Loading sections..."
                              : formData.section || "Select section..."}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-full p-2 border bg-white shadow-xl rounded-[6px]"
                        align="start"
                      >
                        <div className="space-y-2">
                          {sections.length > 0 ? (
                            sections.map((section) => (
                              <div
                                key={section}
                                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, section }));
                                  setIsSectionPopoverOpen(false);
                                }}
                              >
                                <div
                                  className={`h-4 w-4 border rounded-full flex items-center justify-center ${formData.section === section ? "bg-primary border-primary" : "border-input"}`}
                                >
                                  {formData.section === section && (
                                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                                  )}
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
                              <Input
                                placeholder="Add new section..."
                                value={newSection}
                                onChange={(e) => setNewSection(e.target.value)}
                                className="h-8 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                size="sm"
                                className="h-8"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (
                                    newSection.trim() &&
                                    !sections.includes(newSection.trim())
                                  ) {
                                    try {
                                      const response = await fetch(
                                        `/api/admin/schools/${formData.schoolId}/sections`,
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            "x-user-id":
                                              user?.id || "admin@calmpath.ai",
                                          },
                                          body: JSON.stringify({
                                            name: newSection.trim(),
                                          }),
                                        },
                                      );
                                      const result = await response.json();
                                      if (result.success) {
                                        setSections((prev) => [
                                          ...prev,
                                          newSection.trim(),
                                        ]);
                                        toast({ title: "Section Added" });
                                        setNewSection("");
                                      } else {
                                        toast({
                                          title: "Error",
                                          description:
                                            result.error ||
                                            "Failed to create section",
                                          variant: "destructive",
                                        });
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to create section",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            {/* Location Field */}
            {formData.schoolId && (
              <div className="grid gap-2 mt-6">
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
                      className="w-full p-2 border bg-white shadow-xl rounded-[6px]"
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

            {/* Emergency Contact Section */}
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Contact Name *
                  </label>
                  <Input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleInputChange("emergencyContact.name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.emergencyContact?.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter emergency contact name"
                    required
                  />
                  {errors.emergencyContact?.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContact.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Contact Phone *
                  </label>
                  <Input
                    type="tel"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleInputChange("emergencyContact.phone", e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.emergencyContact?.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter 10-digit phone number"
                    required
                  />
                  {errors.emergencyContact?.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContact?.phone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Relationship *
                  </label>
                  <Input
                    type="text"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleInputChange("emergencyContact.relationship", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.emergencyContact?.relationship ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g., Parent, Guardian, Sibling"
                    required
                  />
                  {errors.emergencyContact?.relationship && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContact?.relationship}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loadingText="Creating..."
              className="gap-2 bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80"
            >
              {/* <UserPlus className="w-4 h-4" /> */}
              Add Student
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
