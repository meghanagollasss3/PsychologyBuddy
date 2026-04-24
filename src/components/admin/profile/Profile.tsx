'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building, Shield, Camera, User, Calendar, Edit2, Save, X, Key } from "lucide-react";
import { Admin } from '@/src/types/admin.types';
import { RingSpinner } from "../../ui/Spinners";

interface AdminProfile extends Admin {
  adminProfile?: {
    department?: string;
    profileImageUrl?: string;
    adminPermissions?: {
      permission: {
        name: string;
      };
    }[];
  };
  school?: {
    id: string;
    name: string;
    address: string;
  };
}

export default function Profile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  // Reset image load failure when profile or timestamp changes
  useEffect(() => {
    setImageLoadFailed(false);
  }, [profile?.adminProfile?.profileImageUrl, imageTimestamp]);

  // Debug logging
  useEffect(() => {
    console.log('Profile data:', profile);
    console.log('Profile image URL:', profile?.adminProfile?.profileImageUrl);
    console.log('Image URL length:', profile?.adminProfile?.profileImageUrl?.length);
    console.log('Image timestamp:', imageTimestamp);
  }, [profile, imageTimestamp]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile');
      const result = await response.json();
      
      if (result.success) {
        setProfile(result.data);
        setFormData({
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          phone: result.data.phone || '',
          department: result.data.adminProfile?.department || '',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to fetch profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/admin/profile/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordChange(false);
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to change password',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        setProfile(result.data);
        setIsEditing(false);
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        department: profile.adminProfile?.department || '',
      });
    }
    setIsEditing(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setProfile(result.data);
        setImageTimestamp(Date.now()); // Update timestamp to force image refresh
        toast({
          title: 'Success',
          description: 'Profile photo updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to upload photo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const response = await fetch('/api/admin/profile/photo', {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        setProfile(result.data);
        setImageTimestamp(Date.now()); // Update timestamp to force image refresh
        toast({
          title: 'Success',
          description: 'Profile photo removed successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to remove photo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove photo',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const isValidImageUrl = (url?: string) => {
    if (!url) return false;
    
    console.log('Checking image URL:', url.length, 'characters');
    
    // Check if URL is too large (over 1MB for better performance)
    if (url.length > 1024 * 1024) {
      console.warn('Image URL too large:', url.length, 'characters');
      return false;
    }
    
    // Check if it's a valid data URL
    if (!url.startsWith('data:image/')) {
      console.warn('Invalid image URL format');
      return false;
    }
    
    // Additional validation: check if base64 data is valid
    try {
      const base64Data = url.split(',')[1];
      if (!base64Data) {
        console.warn('No base64 data found in URL');
        return false;
      }
      
      // Try to decode the base64 to verify it's valid
      atob(base64Data);
      console.log('Base64 data is valid');
    } catch (error) {
      console.warn('Invalid base64 data:', error);
      return false;
    }
    
    console.log('Image URL is valid');
    return true;
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'primary';
      case 'ADMIN':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'SUSPENDED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
                      <RingSpinner className="h-8 w-8" />
                    </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader 
        title="Admin Profile" 
        subtitle="Manage your account settings"
        showTimeFilter={false}
        showSchoolFilter={false}
      />
      
      <div className="flex-1 overflow-auto p-6 animate-fade-in">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24">
                {(() => {
                  console.log('Rendering image section, has image URL:', !!profile.adminProfile?.profileImageUrl);
                  if (profile.adminProfile?.profileImageUrl && !imageLoadFailed) {
                    const isValid = isValidImageUrl(profile.adminProfile.profileImageUrl);
                    console.log('Image validation result:', isValid);
                    if (isValid) {
                      return (
                        <img 
                          src={profile.adminProfile.profileImageUrl}
                          alt={`${profile.firstName} ${profile.lastName}`}
                          className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            console.error('Image load error:', e);
                            console.error('Image URL length:', profile.adminProfile?.profileImageUrl?.length);
                            console.error('Image URL starts with:', profile.adminProfile?.profileImageUrl?.substring(0, 50));
                            console.error('Image element:', e.currentTarget);
                            console.error('Natural width:', e.currentTarget.naturalWidth);
                            console.error('Natural height:', e.currentTarget.naturalHeight);
                            setImageLoadFailed(true);
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully');
                          }}
                        />
                      );
                    } else {
                      return (
                        <div className="relative">
                          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                            <span className="text-2xl font-semibold text-gray-600">
                              {getInitials(profile.firstName, profile.lastName)}
                            </span>
                          </div>
                          {/* Warning for oversized image */}
                          <div className="absolute -bottom-16 left-0 right-0 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs">
                            <p className="text-yellow-800 font-medium">⚠️ Image too large</p>
                            <p className="text-yellow-600">Please upload a smaller image</p>
                            <button
                              onClick={handleRemovePhoto}
                              className="mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                            >
                              Clear Photo
                            </button>
                          </div>
                        </div>
                      );
                    }
                  } else {
                    return (
                      <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-2xl font-semibold text-gray-600">
                          {getInitials(profile.firstName, profile.lastName)}
                        </span>
                      </div>
                    );
                  }
                })()}
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="bg-[#3B82F6] rounded-full p-1 text-white hover:bg-primary">
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[#1E293B]">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-[#64748B] ">
                  {profile.role?.name === 'SUPERADMIN' ? 'Super Administrator' : 'School Administrator'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getRoleBadgeVariant(profile.role?.name)} className="inline-flex items-center gap-1">
                    <Shield className="h-3 w-3 " />
                    {profile.role?.name}
                  </Badge>
                </div>
              </div>
              {profile.adminProfile?.profileImageUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="text-[#3B82F6] hover:text-red-700"
                  >
                    Change Photo
                  </Button>
                  
                </>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{profile.firstName}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{profile.lastName}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{profile.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{profile.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Work Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                {isEditing ? (
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>{profile.adminProfile?.department || 'Not specified'}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span>{profile.role?.name === 'SUPERADMIN' ? 'Super Administrator' : 'School Administrator'}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className='mr-2'>Status</Label>
                <Badge variant={getStatusBadgeVariant(profile.status)} >
                  {profile.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Card>

          {profile.role?.name !== 'SUPERADMIN' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">School Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>{profile.school?.name || 'Not assigned to any school'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolId">School ID</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span>{profile.school?.id || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Change Password</Label>
                {!showPasswordChange ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPasswordChange(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPasswordChange(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>

              {showPasswordChange && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword}
                      className="flex-1"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                      disabled={isChangingPassword}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
