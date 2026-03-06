"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePermissions } from '@/src/hooks/usePermissions';
import { useAuth } from '@/src/contexts/AuthContext';
import { useSchoolFilter } from '@/src/contexts/SchoolFilterContext';

import {
  Plus, Search, MoreVertical, Edit, Trash2, Shield, Eye, Users
} from 'lucide-react';

import { AddAdminModal } from '../modals/AddAdminModal';
import { EditAdminModal } from '../modals/EditAdminModal';
import { ViewAdminModal } from '../modals/ViewAdminModal';

import { Admin } from '@/src/types/admin.types';
import { AdminHeader } from '../layout/AdminHeader';

import {
  Avatar, AvatarFallback, AvatarImage
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';

import { cn } from '@/lib/utils';
import { useToast } from '@/src/hooks/use-toast';

///////////////////////////////////////////////////////////////////////////
// CONSTANTS
///////////////////////////////////////////////////////////////////////////

const DEV_LOG = false; // Set true if you want logs

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  activity: "Activity",
  contentManagement: "Psycho-Education Library",
  selfHelp: "Self-help Tools",
  analytics: "Analytics & Reports",
  userManagement: "User Management",
  alerts: "Escalation & Alerts",
  gamification: "Badges & Streaks",
  settings: "Settings",
};

const PERMISSION_MAP: Record<string, string> = {
  dashboard: 'dashboard.view',
  activity: 'activity.view',
  contentManagement: 'psycho.education.view',
  selfHelp: 'selfhelp.view',
  analytics: 'analytics.view',
  userManagement: 'users.view',
  alerts: 'escalations.view',
  gamification: 'badges.view',
  settings: 'settings.view',
};

const REVERSE_PERMISSION_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PERMISSION_MAP).map(([ui, perm]) => [perm, ui])
);

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "SUPERADMIN": { bg: "bg-[#3B82F6]/10", text: "text-[#3B82F6]", label: "Super Admin" },
  "ADMIN": { bg: "bg-[#3B82F6]/10", text: "text-[#3B82F6]", label: "Admin" },
  // Default fallback for unknown roles
  "DEFAULT": { bg: "bg-gray-100", text: "text-gray-600", label: "Unknown Role" },
};

///////////////////////////////////////////////////////////////////////////
// UTILITY HELPERS
///////////////////////////////////////////////////////////////////////////

const extractAdminPermissionKeys = (admin: Admin): Record<string, boolean> => {
  const adminPerms = admin.adminProfile?.adminPermissions || [];

  const permNames = adminPerms.map((ap: any) => {
    if (typeof ap === 'string') return ap;
    return ap.permission?.name || ap.name || '';
  });

  const result: Record<string, boolean> = {};

  Object.keys(PERMISSION_MAP).forEach((key) => {
    const permString = PERMISSION_MAP[key];
    result[key] = permNames.includes(permString);
  });

  return result;
};

///////////////////////////////////////////////////////////////////////////
// MAIN COMPONENT
///////////////////////////////////////////////////////////////////////////

export function AdminManagementSection() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const { selectedSchoolId, setSelectedSchoolId, schools, isSuperAdmin } = useSchoolFilter();

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [editedPermissions, setEditedPermissions] = useState<Record<string, boolean>>({});
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const { hasPermission } = usePermissions();

  const canCreateAdmins = hasPermission('users.create');
  const canViewAdmins = hasPermission('users.view');
  const canUpdateAdmins = hasPermission('users.update');
  const canManagePermissions = hasPermission('permissions.manage');

  ///////////////////////////////////////////////////////////////////////////
  // FETCH ADMINS
  ///////////////////////////////////////////////////////////////////////////

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      
      // Add school filter if applicable
      if (isSuperAdmin && selectedSchoolId && selectedSchoolId !== 'all') {
        params.append('schoolId', selectedSchoolId);
      }
      
      const url = `/api/admins${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) return;

      const data = await response.json();
      if (data.success) setAdmins(data.data || []);

    } catch (err) {
      console.error("Error fetching admins:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSchoolId, isSuperAdmin]);

  ///////////////////////////////////////////////////////////////////////////
  // INITIAL LOAD
  ///////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (canViewAdmins) {
      fetchAdmins();
    }
  }, [canViewAdmins, fetchAdmins]);

  ///////////////////////////////////////////////////////////////////////////
  // FILTER ADMINS (MEMOIZED)
  ///////////////////////////////////////////////////////////////////////////

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const term = searchTerm.toLowerCase();
      return (
        admin.firstName.toLowerCase().includes(term) ||
        admin.lastName.toLowerCase().includes(term) ||
        admin.email.toLowerCase().includes(term)
      );
    });
  }, [admins, searchTerm]);

  ///////////////////////////////////////////////////////////////////////////
  // DELETE ADMIN
  ///////////////////////////////////////////////////////////////////////////

  const deleteAdmin = useCallback(async () => {
    if (!selectedAdmin) return;

    try {
      const response = await fetch(`/api/admins/${selectedAdmin.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: "Admin Removed", description: "Admin removed successfully." });
        fetchAdmins();
      } else {
        toast({ title: "Error", description: data.error?.message, variant: "destructive" });
      }

    } catch (err) {
      console.error("Delete error:", err);
    }
  }, [selectedAdmin, fetchAdmins, toast]);

  ///////////////////////////////////////////////////////////////////////////
  // MANAGE PERMISSIONS
  ///////////////////////////////////////////////////////////////////////////

  const openPermissions = useCallback(async (admin: Admin) => {
    try {
      const res = await fetch(`/api/admins/${admin.id}`, { credentials: 'include' });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {

          const updatedAdmin = data.data;
          setSelectedAdmin(updatedAdmin);

          const keys = extractAdminPermissionKeys(updatedAdmin);
          setEditedPermissions(keys);

          setShowPermissionsModal(true);
          return;
        }
      }
    } catch (e) {
      console.error("Fetch admin error:", e);
    }

    // fallback
    setSelectedAdmin(admin);
    setEditedPermissions(extractAdminPermissionKeys(admin));
    setShowPermissionsModal(true);
  }, []);

  ///////////////////////////////////////////////////////////////////////////
  // SAVE PERMISSIONS (OPTIMIZED)
  ///////////////////////////////////////////////////////////////////////////

  const savePermissions = useCallback(async () => {
    if (!selectedAdmin) return;

    try {
      const enabledPermissions = Object.entries(editedPermissions)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => PERMISSION_MAP[key]);

      const response = await fetch(`/api/admins/${selectedAdmin.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permissions: enabledPermissions }),
      });

      if (!response.ok) throw new Error("Failed to update permissions");

      toast({
        title: "Permissions Updated",
        description: `Updated permissions for ${selectedAdmin.firstName}`,
      });

      setShowPermissionsModal(false);
      fetchAdmins();
      refreshUser();

      if (user?.id === selectedAdmin.id) {
        window.location.reload();
      }

    } catch (err) {
      toast({
        title: "Error",
        description: "Could not update permissions",
        variant: "destructive",
      });
    }

  }, [
    editedPermissions,
    selectedAdmin,
    toast,
    fetchAdmins,
    refreshUser,
    user,
  ]);

  ///////////////////////////////////////////////////////////////////////////
  // UI BLOCKED WITHOUT PERMISSION
  ///////////////////////////////////////////////////////////////////////////

  if (!canViewAdmins) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view admins.</p>
        </div>
      </div>
    );
  }

  ///////////////////////////////////////////////////////////////////////////
  // JSX RENDER (UI UNCHANGED)
  ///////////////////////////////////////////////////////////////////////////

  return (
    <div className="flex flex-col min-h-screen">

      <AdminHeader
        title="Admin Management"
        subtitle="Manage administrators and their permissions"
        
        showTimeFilter={false}
        showSchoolFilter={isSuperAdmin}
        schoolFilterValue={selectedSchoolId}
        schools={schools}
        onSchoolFilterChange={setSelectedSchoolId}
        actions={
          canCreateAdmins && (
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Admin
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search admins..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-300 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200/50">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    No admins found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin) => (
                  <TableRow key={admin.id} className="hover:bg-gray-200/30">

                    {/* USER */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={admin.adminProfile?.profileImageUrl || ''}
                            alt={`${admin.firstName} ${admin.lastName}`}
                          />
                          <AvatarFallback className="bg-blue-500/10 text-blue-500 text-sm">
                            {admin.firstName[0]}{admin.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {admin.firstName} {admin.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* ROLE */}
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          ROLE_STYLES[admin.role.name]?.bg || ROLE_STYLES.DEFAULT.bg,
                          ROLE_STYLES[admin.role.name]?.text || ROLE_STYLES.DEFAULT.text
                        )}
                      >
                        {ROLE_STYLES[admin.role.name]?.label || ROLE_STYLES.DEFAULT.label}
                      </Badge>
                    </TableCell>

                    {/* STATUS */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            admin.status === "ACTIVE" ? "bg-green-500" : "bg-gray-400"
                          )}
                        />
                        <span className="text-sm capitalize">{admin.status.toLowerCase()}</span>
                      </div>
                    </TableCell>

                    {/* PERMISSIONS */}
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {admin.role.name === "SUPERADMIN" ? "All features" : `${admin.adminProfile?.adminPermissions?.length || 0}/9 features`}
                      </Badge>
                    </TableCell>

                    {/* LAST ACTIVE */}
                    <TableCell className="text-gray-500">
                      {admin.adminProfile?.lastActive
                        ? new Date(admin.adminProfile.lastActive).toLocaleDateString()
                        : "Never"}
                    </TableCell>

                    {/* ACTION MENU */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">

                          {/* <DropdownMenuItem className="gap-2" onClick={() => {
                            setSelectedAdmin(admin);
                            setShowViewModal(true);
                          }}>
                            <Eye className="h-4 w-4" /> View
                          </DropdownMenuItem> */}

                          <DropdownMenuItem className="gap-2" onClick={() => {
                            setSelectedAdmin(admin);
                            setShowEditModal(true);
                          }}>
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem className="gap-2" onClick={() => openPermissions(admin)}>
                            <Shield className="h-4 w-4" /> Manage Permissions
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="gap-2 text-red-500"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Remove
                          </DropdownMenuItem>

                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ADD ADMIN */}
      {showAddModal && (
        <AddAdminModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchAdmins();
          }}
          schools={schools}
        />
      )}

      {/* EDIT ADMIN */}
      {showEditModal && selectedAdmin && (
        <EditAdminModal
          admin={selectedAdmin}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchAdmins();
          }}
          schools={schools}
        />
      )}

      {/* VIEW ADMIN */}
      {showViewModal && selectedAdmin && (
        <ViewAdminModal
          admin={selectedAdmin}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {/* DELETE CONFIRMATION */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{selectedAdmin?.firstName} {selectedAdmin?.lastName}"?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteAdmin();
                setIsDeleteOpen(false);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PERMISSIONS MODAL */}
      <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>

            <DialogDescription>
              {selectedAdmin && (
                <span className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={selectedAdmin.adminProfile?.profileImageUrl || ''}
                      alt={`${selectedAdmin.firstName} ${selectedAdmin.lastName}`}
                    />
                    <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xs">
                      {selectedAdmin.firstName[0]}{selectedAdmin.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900">
                    {selectedAdmin.firstName} {selectedAdmin.lastName}
                  </span>
                </span>
              )}
            </DialogDescription>

            {selectedAdmin && (
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    ROLE_STYLES[selectedAdmin.role.name]?.bg || ROLE_STYLES.DEFAULT.bg,
                    ROLE_STYLES[selectedAdmin.role.name]?.text || ROLE_STYLES.DEFAULT.text
                  )}
                >
                  {ROLE_STYLES[selectedAdmin.role.name]?.label || ROLE_STYLES.DEFAULT.label}
                </Badge>
              </div>
            )}
          </DialogHeader>

          {/* PERMISSION TOGGLES */}
          <div className="py-4 space-y-4">
            {selectedAdmin?.role.name === 'SUPERADMIN' ? (
              <div className="rounded-lg bg-gray-200 p-3 text-sm text-gray-700">
                Super Admin permissions cannot be modified. They have full access.
              </div>
            ) : (
              <div className="rounded-lg bg-blue-100 p-3 text-sm text-blue-900">
                As a Super Admin, you can manage this admin's access.
              </div>
            )}

            <div className="space-y-3">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                  <span className="text-sm font-medium">{label}</span>

                  <Switch
                    checked={editedPermissions[key] || false}
                    onCheckedChange={(checked) => {
                      if (selectedAdmin?.role.name !== 'SUPERADMIN') {
                        setEditedPermissions((prev) => ({ ...prev, [key]: checked }));
                      }
                    }}
                    disabled={selectedAdmin?.role.name === 'SUPERADMIN'}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsModal(false)}>
              Cancel
            </Button>

            <Button
              onClick={savePermissions}
              disabled={selectedAdmin?.role.name === 'SUPERADMIN'}
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}