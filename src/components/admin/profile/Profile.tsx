'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/src/hooks/use-toast';
import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building, Shield, Camera, User, Calendar, Edit2, Save, X } from "lucide-react";
import { Admin } from '@/src/types/admin.types';

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
  role?: {
    id: string;
    name: string;
    rolePermissions?: {
      permission: {
        name: string;
      };
    }[];
  };
}

export default function Profile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

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

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'destructive';
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
      />
      
      <div className="flex-1 overflow-auto p-6 animate-fade-in">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 object-contain">
                  {profile.adminProfile?.profileImageUrl ? (
                    <AvatarImage src={profile.adminProfile.profileImageUrl} />
                  ) : null}
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.firstName, profile.lastName)}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="bg-blue-600 rounded-full p-1 text-white hover:bg-blue-700">
                    <Camera className="h-4 w-4" />
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
                <h2 className="text-xl font-semibold text-foreground">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-muted-foreground">
                  {profile.role?.name === 'SUPERADMIN' ? 'Super Administrator' : 'School Administrator'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getRoleBadgeVariant(profile.role?.name)} className="inline-flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {profile.role?.name}
                  </Badge>
                </div>
              </div>
              {profile.adminProfile?.profileImageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove Photo
                </Button>
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
                <Label>Status</Label>
                <Badge variant={getStatusBadgeVariant(profile.status)}>
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
