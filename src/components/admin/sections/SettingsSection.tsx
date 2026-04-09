"use client";

import React, { useState, useEffect } from 'react';
import { Building2, Bell, Shield, Palette, Database, Key } from "lucide-react";
import { AdminHeader } from '../layout/AdminHeader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSchoolFilter } from "@/src/contexts/SchoolFilterContext";

interface OrganizationData {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
}

interface AdminLocation {
  id: string;
  name: string;
  address: string;
  city: string;
}

export default function SettingsSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { schools, isSuperAdmin, selectedSchoolId, setSelectedSchoolId } = useSchoolFilter();
  
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    id: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    timezone: 'est',
  });
  
  const [adminLocations, setAdminLocations] = useState<AdminLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize organization data based on user role
  useEffect(() => {
    if (user?.school) {
      setSelectedSchoolId(user.school.id);
      setOrganizationData({
        id: user.school.id,
        name: user.school.name || '',
        address: '',
        phone: '',
        email: '',
        timezone: 'est',
      });
      // Fetch full school details if needed
      fetchSchoolDetails(user.school.id);
    } else if (isSuperAdmin && selectedSchoolId === 'all' && schools.length > 0) {
      setSelectedSchoolId(schools[0].id);
    }
  }, [user, isSuperAdmin, schools, selectedSchoolId]);

  // Fetch school details when selectedSchoolId changes
  useEffect(() => {
    if (selectedSchoolId && selectedSchoolId !== 'all') {
      setOrganizationData(prev => ({ ...prev, id: selectedSchoolId }));
      fetchSchoolDetails(selectedSchoolId);
    }
  }, [selectedSchoolId]);

  // Fetch admin locations for ADMIN users
  useEffect(() => {
    if (user?.role?.name === 'ADMIN' && user?.school?.id) {
      fetchAdminLocations();
    }
  }, [user]);

  // Fetch admin locations from API
  const fetchAdminLocations = async () => {
    if (!user?.school?.id) return;
    
    try {
      setLoadingLocations(true);
      console.log('Fetching admin assigned locations...');
      
      // Get only the locations assigned to this admin
      const adminLocationResponse = await fetch(`/api/admin/locations/assigned`, { credentials: 'include' });
      const adminLocationData = await adminLocationResponse.json();
      
      console.log('Admin locations response:', adminLocationData);
      
      if (adminLocationData.success && adminLocationData.data) {
        setAdminLocations(adminLocationData.data.map((loc: any) => ({
          id: loc.locationId,
          name: loc.name,
          address: loc.address,
          city: loc.city
        })));
      } else {
        console.log('No admin locations found or API error:', adminLocationData);
        setAdminLocations([]);
      }
    } catch (error) {
      console.error('Failed to fetch admin locations:', error);
      setAdminLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Fetch school details from API
  const fetchSchoolDetails = async (schoolId: string) => {
    if (!schoolId || schoolId === 'all') return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/schools/${schoolId}`);
      const data = await response.json();
      
      if (data.success) {
        setOrganizationData({
          id: data.data.id,
          name: data.data.name,
          address: data.data.address || '',
          phone: data.data.phone || '',
          email: data.data.email || '',
          timezone: 'est', // Default, can be extended
        });
      }
    } catch (error) {
      console.error('Failed to fetch school details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle school selection change (for super admin)
  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    if (schoolId && schoolId !== 'select') {
      fetchSchoolDetails(schoolId);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof OrganizationData, value: string) => {
    setOrganizationData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save organization changes
  const handleSaveOrganization = async () => {
    if (!organizationData.id || !organizationData.name.trim()) {
      toast({ title: "Error", description: "School name is required", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/schools/${organizationData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: organizationData.name,
          address: organizationData.address,
          phone: organizationData.phone,
          email: organizationData.email,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Success", description: "Organization settings saved successfully" });
      } else {
        toast({ title: "Error", description: data.error?.message || "Failed to save organization settings", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save organization settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader 
        title="Settings" 
        subtitle="Manage platform configuration and preferences"
        showTimeFilter={false}
        showSchoolFilter={isSuperAdmin}
        schoolFilterValue={selectedSchoolId}
        onSchoolFilterChange={setSelectedSchoolId}
        schools={schools}
      />
      
      <div className="flex-1 overflow-auto p-6 animate-fade-in">
        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 w-full lg:w-auto bg-[#edf0f3]`}>
            <TabsTrigger value="organization" className="gap-2 data-[state=active]:bg-[#f9fafb] text-[#65758b] hover:text-gray-900 data-[state=active]:text-black">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Organization</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-[#f9fafb] text-[#65758b] hover:text-gray-900 data-[state=active]:text-black">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            {/* <TabsTrigger value="permissions" className="gap-2 data-[state=active]:bg-[#f9fafb] text-[#65758b] hover:text-gray-900 data-[state=active]:text-black">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissions</span>
            </TabsTrigger> */}
            {/* <TabsTrigger value="appearance" className="gap-2 data-[state=active]:bg-[#f9fafb] text-[#65758b] hover:text-gray-900 data-[state=active]:text-black">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger> */}
            {/* <TabsTrigger value="data" className="gap-2 data-[state=active]:bg-[#f9fafb] text-[#65758b] hover:text-gray-900 data-[state=active]:text-black">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger> */}
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-[#f9fafb] text-[#65758b] hover:text-gray-900 data-[state=active]:text-black">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>Manage your school's information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="schoolName">School Name</Label>
                      <Input 
                        id="schoolName" 
                        value={organizationData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter school name"
                        disabled={loading || saving}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="adminEmail">
                        {user?.role?.name === 'ADMIN' ? 'Your Email' : 'Admin Email'}
                      </Label>
                      <Input 
                        id="adminEmail" 
                        type="email" 
                        value={user?.role?.name === 'ADMIN' ? user?.email || '' : organizationData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="admin@school.edu"
                        disabled={loading || saving || user?.role?.name === 'ADMIN'} // ADMIN users can't change their email here
                      />
                    </div>
                  </div>
                  {user?.role?.name === 'ADMIN' ? (
                    <div className="grid gap-2">
                      <Label htmlFor="address">Assigned Locations</Label>
                      <div className="space-y-2">
                        {loadingLocations ? (
                          <div className="text-sm text-muted-foreground">Loading assigned locations...</div>
                        ) : adminLocations.length > 0 ? (
                          adminLocations.map((location) => (
                            <div key={location.id} className="p-3 border rounded-md bg-gray-50">
                              <div className="font-medium text-sm">{location.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {location.address}, {location.city}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No locations assigned</div>
                        )}
                      </div>
                    </div>
                  ) : user?.role?.name === 'SUPERADMIN' || user?.role?.name === 'SCHOOL_SUPERADMIN' ? null : (
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea 
                        id="address" 
                        value={organizationData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="School address"
                        rows={2} 
                        disabled={loading || saving}
                      />
                    </div>
                  )}
                  {/* <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">
                        {user?.role?.name === 'ADMIN' ? 'Your Phone' : 'Phone'}
                      </Label>
                      <Input 
                        id="phone" 
                        value={user?.role?.name === 'ADMIN' ? user?.phone || '' : organizationData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        disabled={loading || saving || user?.role?.name === 'ADMIN'} // ADMIN users can't change their phone here
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        value={organizationData.timezone} 
                        onValueChange={(value) => handleInputChange('timezone', value)}
                        disabled={loading || saving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                          <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                          <SelectItem value="cst">Central Time (CST)</SelectItem>
                          <SelectItem value="est">Eastern Time (EST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div> */}
                  <Separator />
                  <Button 
                    onClick={handleSaveOrganization} 
                    disabled={loading || saving || !organizationData.id}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure alert and notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Critical Alerts</p>
                      <p className="text-sm text-muted-foreground">Receive immediate notifications for critical alerts</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Daily Digest</p>
                      <p className="text-sm text-muted-foreground">Receive daily summary of platform activity</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Reports</p>
                      <p className="text-sm text-muted-foreground">Receive weekly analytics reports</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Label>Notification Email</Label>
                  <Input type="email" defaultValue="alerts@greenfield.edu" />
                </div>
                <Button>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Role & Permission Management</CardTitle>
                <CardDescription>Configure access levels for different user roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">Super Admin</p>
                        <p className="text-sm text-muted-foreground">Full system access</p>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">All Permissions</span>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">Admin</p>
                        <p className="text-sm text-muted-foreground">Platform management</p>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded">Content</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">Analytics</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">Users</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">Settings</span>
                    </div>
                  </div>
                </div>
                <Button>Create New Role</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance & Branding</CardTitle>
                <CardDescription>Customize the look and feel of the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" defaultValue="#3b82f6" className="w-12 h-10 p-1" />
                      <Input defaultValue="#3b82f6" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Logo</Label>
                    <Input type="file" accept="image/*" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show School Logo</p>
                    <p className="text-sm text-muted-foreground">Display logo in navigation</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button>Save Appearance</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Manage data retention and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label>Data Retention Period</Label>
                  <Select defaultValue="2years">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="2years">2 Years</SelectItem>
                      <SelectItem value="5years">5 Years</SelectItem>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Anonymize Inactive Users</p>
                    <p className="text-sm text-muted-foreground">Automatically anonymize data for inactive users</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Data Export</p>
                    <p className="text-sm text-muted-foreground">Allow admins to export student data</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline">Export All Data</Button>
                  <Button variant="destructive">Purge Old Data</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure authentication and security options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">IP Allowlist</p>
                    <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Audit Logging</p>
                    <p className="text-sm text-muted-foreground">Log all admin actions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button>Save Security Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
