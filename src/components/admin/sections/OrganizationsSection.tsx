"use client";

import { useState, useMemo } from "react";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";

import {
  Search,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Eye,
  MapPin,
  Trash2,
  X,
} from "lucide-react";

import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { useSchoolFilter } from "@/src/contexts/SchoolFilterContext";
import { usePermissions } from "@/src/hooks/usePermissions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import { AddOrganizationModal } from "@/src/components/admin/modals/AddOrganizationModal";
import { useAdminLoading, AdminActions } from '@/src/contexts/AdminLoadingContext';
import { LoadingButton } from '@/src/components/admin/ui/AdminLoader';

// ---------------------------
// TYPES
// ---------------------------
interface School {
  id: string;
  name: string;
  location?: string;
  studentCount: number;
  alertCount: number;
  checkInsToday: number;
  address?: string;
  phone?: string;
  email?: string;
  locationsCount?: number;
}

interface SchoolsResponse {
  data: School[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  metrics: {
    totalSchools: number;
    totalStudents: number;
    activeAlerts: number;
    checkinsToday: number;
  };
}

// ---------------------------
// API CALLER (Server-side filtering)
// ---------------------------
async function fetchSchools({
  search,
  page,
  limit,
  schoolFilter,
  isSuperAdmin,
}: any): Promise<SchoolsResponse> {
  const params = new URLSearchParams({
    search,
    page: String(page),
    limit: String(limit),
  });

  if (isSuperAdmin && schoolFilter !== "all") {
    params.append("schoolId", schoolFilter);
  }

  console.log('OrganizationsSection - Fetching schools with params:', params.toString());

  const res = await fetch(`/api/admin/schools?${params.toString()}`, {
    credentials: "include",
  });

  const schools = await res.json();
  console.log('OrganizationsSection - Schools API response:', schools);
  
  if (!Array.isArray(schools)) throw new Error("Failed to load organizations");

  // Transform the response to match expected format
  const filteredSchools = schools.filter((school: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      school.name.toLowerCase().includes(searchLower) ||
      school.email?.toLowerCase().includes(searchLower)
    );
  });

  const paginatedSchools = filteredSchools.slice(
    (page - 1) * limit,
    page * limit
  );

  return {
    data: paginatedSchools.map((school: any) => ({
      ...school,
      locationsCount: school.locations?.length || 0,
    })),
    pagination: {
      total: filteredSchools.length,
      totalPages: Math.ceil(filteredSchools.length / limit),
      page,
      limit,
    },
    metrics: {
      totalSchools: schools.length,
      totalStudents: schools.reduce((sum: number, school: any) => sum + (school._count?.users || 0), 0),
      activeAlerts: schools.reduce((sum: number, school: any) => sum + (school.alertCount || 0), 0),
      checkinsToday: schools.reduce((sum: number, school: any) => sum + (school.checkInsToday || 0), 0),
    },
  };
}

// ---------------------------
// MAIN PAGE
// ---------------------------
export default function OrganizationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const { user } = useAuth();
  const { toast } = useToast();
  const { executeWithLoading } = useAdminLoading();

  const {
    selectedSchoolId,
    setSelectedSchoolId,
    schools,
    setSchools,
    isSuperAdmin,
  } = useSchoolFilter();

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<School | null>(null);

  // Memoized search (debounce unnecessary because server handles it)
  const search = useMemo(() => searchInput.trim(), [searchInput]);

  // React Query
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "organizations",
      { search, page, limit, selectedSchoolId, isSuperAdmin },
    ],
    queryFn: () =>
      fetchSchools({
        search,
        page,
        limit,
        schoolFilter: selectedSchoolId,
        isSuperAdmin,
      }),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });

  const organizations = data?.data ?? [];
  const pagination = data?.pagination;
  const metrics = data?.metrics;

  console.log('OrganizationsSection - Organizations data:', organizations);
  console.log('OrganizationsSection - Sample organization alertCount:', organizations[0]?.alertCount);

  const handleViewSchool = (schoolId: string) => {
    router.push(`/admin?school=${schoolId}`);
  };

  const handleAddOrganization = (newSchool: any) => {
    // Invalidate the organizations query to refresh the list
    queryClient.invalidateQueries({ queryKey: ["organizations"] });
  };

  const handleDeleteOrganization = (school: School) => {
    setOrganizationToDelete(school);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!organizationToDelete) return;
    
    try {
      await executeWithLoading(
        AdminActions.DELETE_ORGANIZATION,
        (async () => {
          const response = await fetch(`/api/schools/${organizationToDelete.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          const data = await response.json();
          
          if (data.success) {
            toast({
              title: "Organization deleted successfully",
              description: `${organizationToDelete.name} has been deleted.`
            });
            
            // Refresh the organizations list
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
            
            setShowDeleteDialog(false);
            setOrganizationToDelete(null);
          } else {
            toast({
              title: "Failed to delete organization",
              description: data.message || "An error occurred while deleting the organization.",
              variant: "destructive"
            });
          }
        })(),
        'Deleting organization...'
      );
    } catch (error) {
      console.error('Delete organization error:', error);
      toast({
        title: "Failed to delete organization",
        description: "Network error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Access Control
  if (!permissions.canManageOrgs) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900">
            Access Denied
          </h3>
          <p className="text-red-700 mt-1">
            You don't have permission to manage organizations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <AdminHeader
        title="Organizations"
        subtitle="Manage all schools in the system"
        showSchoolFilter={false}
        schoolFilterValue={selectedSchoolId}
        onSchoolFilterChange={setSelectedSchoolId}
        showTimeFilter={false}
        schools={schools}
        actions={
          permissions.canManageOrgs && (
            <Button className="flex items-center gap-2" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />
              Add Organization
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Summary Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-lg bg-[#ebf2fe]">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Schools</p>
                  <p className="text-2xl font-semibold">
                    {metrics.totalSchools}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Students
                  </p>
                  <p className="text-2xl font-semibold">
                    {metrics.totalStudents.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Alerts
                  </p>
                  <p className="text-2xl font-semibold">
                    {metrics.activeAlerts}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Check-ins Today
                  </p>
                  <p className="text-2xl font-semibold">
                    {metrics.checkinsToday}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by school or email..."
            className="pl-9 pr-10"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1); // Reset page when searching
            }}
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setPage(1); // Reset page when clearing search
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  {/* <TableHead>School ID</TableHead> */}
                  {/* <TableHead>Location</TableHead> */}
                  <TableHead className="text-center">Locations</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Alerts</TableHead>
                  <TableHead className="text-center">
                    Check-ins Today
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No schools found.
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((school: School) => (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#64748B]" />
                          {school.name}
                        </div>
                      </TableCell>

                      {/* <TableCell className="font-mono text-sm text-[#64748B]">
                        {school.id}
                      </TableCell> */}

                      {/* <TableCell className="text-[#64748B]">
                        {school.location || "N/A"}
                      </TableCell> */}

                      <TableCell className="text-center">
                        {school.studentCount}
                      </TableCell>

                      <TableCell className="text-center">
                        {school.alertCount > 0 ? (
                        <Badge variant="destructive">
                            {school.alertCount}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">0</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        {school.checkInsToday || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/locations?school=${school.id}`)}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Locations
                          <Badge variant="secondary" className="ml-1">
                            {school.locationsCount || 0}
                          </Badge>
                        </Button>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSchool(school.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {permissions.canDeleteOrgs && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteOrganization(school)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>

            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <Button
              variant="outline"
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Add Organization Modal */}
      {showAddModal && (
        <AddOrganizationModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newSchool) => {
            setShowAddModal(false);
            handleAddOrganization(newSchool);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && organizationToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {organizationToDelete.name}?
                This action cannot be undone and will permanently remove the organization from the system.
                Note: You can only delete organizations that have no users or classes assigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-[#EF4444] text-white hover:bg-[#EF4444]/90"
              >
                Delete Organization
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}