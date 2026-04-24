"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Users, 
  GraduationCap, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/src/contexts/AuthContext';
import { usePermissions } from '@/src/hooks/usePermissions';
import { AdminHeader } from '@/src/components/admin/layout/AdminHeader';
import { useAdminLoading, AdminActions } from '@/src/contexts/AdminLoadingContext';
import { RingSpinner } from '@/src/components/ui/Spinners';

interface SchoolLocation {
  id: string;
  schoolId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  school: { name: string };
  _count: {
    users: number;
    classes: number;
  };
  users?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: { name: string };
    studentProfile?: { status: string };
    classRef?: { name: string; grade: number; section: string };
  }>;
  classes?: Array<{
    id: string;
    name: string;
    grade: number;
    section?: string;
    _count: { users: number };
  }>;
}

interface School {
  id: string;
  name: string;
  locations: SchoolLocation[];
}

export default function SchoolLocationsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const permissions = usePermissions();
  const schoolId = searchParams.get('school');
  const { executeWithLoading } = useAdminLoading();

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [locations, setLocations] = useState<SchoolLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SchoolLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    notes: '',
    isMain: false,
  });

  // Load schools with locations
  useEffect(() => {
    loadSchools();
  }, []);

  // Load locations for selected school
  useEffect(() => {
    if (selectedSchool) {
      loadLocations(selectedSchool.id);
    }
  }, [selectedSchool]);

  // Auto-select school if schoolId is in URL
  useEffect(() => {
    if (schoolId && schools.length > 0) {
      const school = schools.find(s => s.id === schoolId);
      if (school) {
        setSelectedSchool(school);
      }
    }
  }, [schoolId, schools]);

  const loadSchools = async () => {
    try {
      return await executeWithLoading(
        AdminActions.FETCH_SCHOOLS,
        (async () => {
          let apiUrl = '/api/admin/schools/with-locations';
          
          // For SCHOOL_SUPERADMIN, only load their school
          if (user?.role?.name === 'SCHOOL_SUPERADMIN' && user?.school?.id) {
            apiUrl = `/api/admin/schools/with-locations?schoolId=${user.school.id}`;
          }
          
          const res = await fetch(apiUrl, {
            credentials: 'include',
          });
          const data = await res.json();
          setSchools(data);
          
          // Auto-select school based on user role
          if (!selectedSchool && data.length > 0) {
            if (user?.role?.name === 'SCHOOL_SUPERADMIN' && user?.school?.id) {
              // Find the user's school
              const userSchool = data.find((s: any) => s.id === user.school?.id);
              setSelectedSchool(userSchool || data[0]);
            } else {
              // For other roles, select first school
              setSelectedSchool(data[0]);
            }
          }
          
          return data;
        })(),
        'Loading schools...'
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load schools",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocations = async (schoolId: string) => {
    try {
      const res = await fetch(`/api/admin/schools/locations?schoolId=${schoolId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setLocations(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load locations",
        variant: "destructive",
      });
    }
  };

  const loadLocationDetails = async (locationId: string) => {
    try {
      const res = await fetch(`/api/admin/schools/locations/${locationId}/details`, {
        credentials: 'include',
      });
      const data = await res.json();
      setSelectedLocation(data);
      setShowDetailsModal(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load location details",
        variant: "destructive",
      });
    }
  };

  const handleAddLocation = async () => {
    if (!selectedSchool) return;

    try {
      await executeWithLoading(
        AdminActions.ADD_LOCATION,
        (async () => {
          const res = await fetch('/api/admin/schools/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              schoolId: selectedSchool.id,
              ...formData,
            }),
          });

          if (res.ok) {
            toast({
              title: "Success",
              description: "Location created successfully",
            });
            setShowAddModal(false);
            resetForm();
            loadLocations(selectedSchool.id);
            loadSchools(); // Refresh to show new location count
          } else {
            const error = await res.json();
            toast({
              title: "Error",
              description: error.error?.message || "Failed to create location",
              variant: "destructive",
            });
            throw new Error(error.error?.message || "Failed to create location");
          }
        })(),
        'Creating location...'
      );
    } catch (error) {
      // Error already handled in executeWithLoading
    }
  };

  const handleUpdateLocation = async () => {
    if (!selectedLocation || !selectedSchool) return;

    try {
      await executeWithLoading(
        AdminActions.EDIT_LOCATION,
        (async () => {
          const res = await fetch(`/api/admin/schools/locations/${selectedLocation.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData),
          });

          if (res.ok) {
            toast({
              title: "Success",
              description: "Location updated successfully",
            });
            setShowEditModal(false);
            resetForm();
            loadLocations(selectedSchool.id);
            loadSchools();
          } else {
            const error = await res.json();
            toast({
              title: "Error",
              description: error.error?.message || "Failed to update location",
              variant: "destructive",
            });
            throw new Error(error.error?.message || "Failed to update location");
          }
        })(),
        'Updating location...'
      );
    } catch (error) {
      // Error already handled in executeWithLoading
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!selectedSchool) {
      return;
    }
    
    setLocationToDelete(locationId);
    setShowDeleteModal(true);
  };

  const confirmDeleteLocation = async () => {
    if (!locationToDelete || !selectedSchool) {
      return;
    }

    try {
      await executeWithLoading(
        AdminActions.DELETE_LOCATION,
        (async () => {
          const res = await fetch(`/api/admin/schools/locations/${locationToDelete}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (res.ok) {
            toast({
              title: "Success",
              description: "Location deleted successfully",
            });
            loadLocations(selectedSchool.id);
            loadSchools();
            setShowDeleteModal(false);
            setLocationToDelete(null);
          } else {
            const error = await res.json();
            toast({
              title: "Error",
              description: error.error?.message || "Failed to delete location",
              variant: "destructive",
            });
            throw new Error(error.error?.message || "Failed to delete location");
          }
        })(),
        'Deleting location...'
      );
    } catch (error) {
      // Error already handled in executeWithLoading
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      notes: '',
      isMain: false,
    });
  };

  const openEditModal = (location: SchoolLocation) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      country: location.country || '',
      postalCode: location.postalCode || '',
      notes: location.notes || '',
      isMain: location.isMain,
    });
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RingSpinner size="md" color="blue" />
          <p className="mt-2 text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <AdminHeader
        title="School Locations"
        subtitle="Manage branches and campuses for your schools"
        showTimeFilter={false}
        showSchoolFilter={user?.role?.name === "SUPERADMIN"}
        schoolFilterValue={selectedSchool?.id || ''}
        onSchoolFilterChange={(value) => {
          const school = schools.find(s => s.id === value);
          setSelectedSchool(school || null);
        }}
        schools={schools.map(school => ({ id: school.id, name: school.name }))}
        actions={
            <div className="flex items-center gap-2">
                {user?.role?.name !== "SCHOOL_SUPERADMIN" && (
                  <Button variant="outline" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
          {permissions.canUpdateOrgs && (
            <Button onClick={() => setShowAddModal(true)} disabled={!selectedSchool}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          )}
          </div>
        }
      />

      {/* Locations Grid */}
      {selectedSchool && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-6">
          {locations.map((location) => (
            <Card key={location.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {location.isMain && (
                      <Badge variant="default" className="text-xs">
                        Main
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{location.school.name}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address */}
                {location.address && (
                  <div className="text-sm">
                    <p className="text-gray-700">{location.address}</p>
                    {(location.city || location.state || location.country) && (
                      <p className="text-gray-600">
                        {[location.city, location.state, location.country].filter(Boolean).join(', ')}
                        {location.postalCode && ` ${location.postalCode}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Stats */}
                {/* <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{location._count.users} users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <span>{location._count.classes} classes</span>
                  </div>
                </div> */}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadLocationDetails(location.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(location)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteLocation(location.id)}
                    disabled={location.isMain || location._count.users > 0 || location._count.classes > 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {locations.length === 0 && (
            <div className="col-span-full text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
              <p className="text-gray-600 mb-4">Add your first location to get started</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Location Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        if (!open) {
          setShowAddModal(false);
        }
      }}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter location name (e.g., Main Campus)"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter complete address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => {
                    // Only allow numeric input
                    const numericValue = e.target.value.replace(/\D/g, '');
                    // Limit to reasonable length (10 digits for most postal codes)
                    setFormData({ ...formData, postalCode: numericValue.slice(0, 10) });
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Enter postal code (numbers only)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information about this location..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMain"
                checked={formData.isMain}
                onCheckedChange={(checked) => setFormData({ ...formData, isMain: !!checked })}
              />
              <Label htmlFor="isMain">Mark as main location</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLocation} disabled={!formData.name.trim() || !formData.address.trim()}>
                Add Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Location Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowEditModal(false);
        }
      }}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter location name (e.g., Main Campus)"
                  className={`pl-10 ${!formData.name.trim() ? 'border-red-300 focus:border-red-500' : ''}`}
                  required
                />
              </div>
              {!formData.name.trim() && (
                <p className="text-sm text-red-600 mt-1">Location name is required</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter complete address"
                rows={2}
                className={`${!formData.address.trim() ? 'border-red-300 focus:border-red-500' : ''}`}
                required
              />
              {!formData.address.trim() && (
                <p className="text-sm text-red-600 mt-1">Address is required</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
                  id="edit-country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <Input
                  id="edit-postalCode"
                  value={formData.postalCode}
                  onChange={(e) => {
                    // Only allow numeric input
                    const numericValue = e.target.value.replace(/\D/g, '');
                    // Limit to reasonable length (10 digits for most postal codes)
                    setFormData({ ...formData, postalCode: numericValue.slice(0, 10) });
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Enter postal code (numbers only)"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information about this location..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isMain"
                checked={formData.isMain}
                onCheckedChange={(checked) => setFormData({ ...formData, isMain: !!checked })}
              />
              <Label htmlFor="edit-isMain">Mark as main location</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateLocation} disabled={!formData.name.trim() || !formData.address.trim()}>
                Update Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={(open) => {
        if (!open) {
          setShowDetailsModal(false);
        }
      }}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Location Details</DialogTitle>
              {/* <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button> */}
            </div>
          </DialogHeader>
          {selectedLocation ? (
            <div className="space-y-6">
              {/* Location Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Location Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Name</Label>
                      <p className="text-gray-900">{selectedLocation?.name}</p>
                    </div>
                    {selectedLocation?.address && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Address</Label>
                        <p className="text-gray-900">{selectedLocation?.address}</p>
                        {(selectedLocation?.city || selectedLocation?.state || selectedLocation?.country) && (
                          <p className="text-gray-600 text-sm">
                            {[selectedLocation?.city, selectedLocation?.state, selectedLocation?.country].filter(Boolean).join(', ')}
                            {selectedLocation?.postalCode && ` ${selectedLocation.postalCode}`}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedLocation?.notes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Notes</Label>
                        <p className="text-gray-900">{selectedLocation?.notes}</p>
                      </div>
                    )}
                    {selectedLocation?.isMain && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Main Location</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{selectedLocation?._count?.users || 0}</div>
                        <div className="text-sm text-gray-600">Total Users</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <GraduationCap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{selectedLocation?._count?.classes || 0}</div>
                        <div className="text-sm text-gray-600">Total Classes</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Users */}
              {selectedLocation?.users && selectedLocation.users.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Users ({selectedLocation?.users?.length || 0})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLocation?.users?.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {user.role.name}
                                </Badge>
                                {user.classRef && (
                                  <Badge variant="secondary" className="text-xs">
                                    {user.classRef.name}
                                  </Badge>
                                )}
                                {user.studentProfile?.status === 'ACTIVE' && (
                                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                    Active
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Classes */}
              {selectedLocation?.classes && selectedLocation.classes.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Classes ({selectedLocation?.classes?.length || 0})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedLocation?.classes?.map((cls) => (
                      <Card key={cls.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{cls.name}</p>
                              <p className="text-sm text-gray-600">Grade {cls.grade}{cls.section && ` - Section ${cls.section}`}</p>
                              <p className="text-sm text-blue-600 mt-1">{cls._count.users} students</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading location details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteModal(false);
          setLocationToDelete(null);
        }
      }}>
        <DialogContent 
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Confirm Delete Location</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Are you sure you want to delete this location?
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This action cannot be undone and will permanently remove the location from the system.
                </p>
              </div>
            </div>

            {(() => {
              const location = locations.find(loc => loc.id === locationToDelete);
              return location ? (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{location.name}</p>
                  {location.address && (
                    <p className="text-xs text-gray-600 mt-1">{location.address}</p>
                  )}
                </div>
              ) : null;
            })()}

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setLocationToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteLocation}
              >
                Delete Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}