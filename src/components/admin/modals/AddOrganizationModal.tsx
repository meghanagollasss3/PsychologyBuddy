"use client";

import React, { useState, useEffect } from 'react';
import { X, School, Mail, Phone, Building2, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLoading, AdminActions } from '@/src/contexts/AdminLoadingContext';
import { LoadingButton } from '@/src/components/admin/ui/AdminLoader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (schoolData: any) => void;
}

export function AddOrganizationModal({ isOpen, onClose, onSuccess }: AddOrganizationModalProps) {
  const { toast } = useToast();
  const { executeWithLoading } = useAdminLoading();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    locationName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [locationError, setLocationError] = useState('');

  const validateName = (name: string): { isValid: boolean; message: string } => {
    if (!name || name.trim() === '') {
      return { isValid: false, message: 'School name is required' };
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: 'School name must be at least 2 characters' };
    }
    return { isValid: true, message: '' };
  };

  const validateLocation = (): { isValid: boolean; message: string } => {
    if (!formData.locationName || formData.locationName.trim() === '') {
      return { isValid: false, message: 'Location name is required' };
    }
    if (!formData.address || formData.address.trim() === '') {
      return { isValid: false, message: 'Address is required' };
    }
    return { isValid: true, message: '' };
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

  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Handle phone number input
    if (name === 'phone') {
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
    
    // Handle postal code input (numeric only)
    if (name === 'postalCode') {
      // Only allow numeric input
      const numericValue = value.replace(/\D/g, '');
      // Limit to reasonable length (10 digits for most postal codes)
      processedValue = numericValue.slice(0, 10);
    }
    
    // Clear errors when user starts typing
    if (name === 'name') {
      setNameError('');
    }
    if (name === 'email') {
      setEmailError('');
    }
    if (['locationName', 'address', 'city', 'state', 'country', 'postalCode'].includes(name)) {
      setLocationError('');
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const isSubmitDisabled = (): boolean => {
    const nameValidation = validateName(formData.name);
    const nameIsInvalid: boolean = !nameValidation.isValid;
    const emailValidation = validateEmail(formData.email);
    const emailIsInvalid: boolean = !emailValidation.isValid;
    const phoneValidation = validatePhone(formData.phone);
    const phoneIsInvalid: boolean = !phoneValidation.isValid;
    const locationValidation = validateLocation();
    const locationIsInvalid: boolean = !locationValidation.isValid;
    return Boolean(nameIsInvalid || emailIsInvalid || phoneIsInvalid || locationIsInvalid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate school name
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      setNameError(nameValidation.message);
      return;
    }

    // Validate email format
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message);
      return;
    }

    // Validate phone number
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message);
      return;
    }

    // Validate location
    const locationValidation = validateLocation();
    if (!locationValidation.isValid) {
      setLocationError(locationValidation.message);
      return;
    }

    setError('');

    try {
      await executeWithLoading(
        AdminActions.CREATE_ORGANIZATION,
        (async () => {
          // First create the school
          const schoolResponse = await fetch('/api/admin/schools', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              name: formData.name,
              phone: formData.phone,
              email: formData.email,
              location: {
                name: formData.locationName,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                postalCode: formData.postalCode,
                isMain: true
              }
            }),
          });

          const schoolData = await schoolResponse.json();
          console.log('School creation response:', schoolResponse.status, schoolData);

          if (!schoolResponse.ok) {
            const errorMessage = schoolData.error?.message || schoolData.message || 'Failed to create school';
            console.log('Error message:', errorMessage);
            
            if (errorMessage.toLowerCase().includes('already exists')) {
              if (errorMessage.toLowerCase().includes('email')) {
                setEmailError(errorMessage);
              } else if (errorMessage.toLowerCase().includes('phone')) {
                setPhoneError(errorMessage);
              } else if (errorMessage.toLowerCase().includes('name')) {
                setNameError(errorMessage);
              } else {
                setError(errorMessage);
              }
              return;
            }
            throw new Error(errorMessage);
          }

          const newSchool = schoolData.data;
          console.log('New school created:', newSchool);

          toast({ title: "School created successfully" });
          onSuccess(newSchool);
          
          // Reset form
          setFormData({
            name: '',
            phone: '',
            email: '',
            locationName: '',
            address: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
          });
          setEmailError('');
          setPhoneError('');
          setNameError('');
          setLocationError('');
          onClose();
        })(),
        'Creating organization...'
      );
    } catch (error: any) {
      console.error('Create school error:', error);
      if (error.message?.includes('already exists')) {
        if (error.message.toLowerCase().includes('email')) {
          setEmailError(error.message);
        } else if (error.message.toLowerCase().includes('phone')) {
          setPhoneError(error.message);
        } else if (error.message.toLowerCase().includes('name')) {
          setNameError(error.message);
        } else {
          setError(error.message);
        }
      } else {
        setError(error.message || 'Failed to create organization');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <School className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Add Organization</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {emailError && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-600">{emailError}</p>
            </div>
          )}

          {phoneError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{phoneError}</p>
            </div>
          )}

          {nameError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{nameError}</p>
            </div>
          )}

          {locationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{locationError}</p>
            </div>
          )}

          {/* School Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              School Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Name *
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      nameError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter school name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      onChange={handleInputChange}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        phoneError 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter 10-digit mobile number"
                      required
                    />
                  </div>
                  {phoneError && (
                    <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                  )}
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
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        emailError 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1 text-xs text-red-600">{emailError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Name *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleInputChange}
                    required
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      locationError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter location name (e.g., Main Campus)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <Textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    locationError 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter complete address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <Input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter state"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <Input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <Input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter postal code (numbers only)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <LoadingButton
              variant="outline"
              onClick={onClose}
              loadingText="Cancelling..."
              className="flex-1"
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              type="submit"
              disabled={isSubmitDisabled()}
              loadingText="Creating..."
              className="flex-1 bg-[#3B82F6] text-white hover:bg-blue-700"
            >
              Create Organization
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
