"use client";

import { useState, useMemo } from "react";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  Search,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Eye,
} from "lucide-react";

import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { useSchoolFilter } from "@/src/contexts/SchoolFilterContext";
import { usePermissions } from "@/src/hooks/usePermissions";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import { AddOrganizationModal } from "@/src/components/admin/modals/AddOrganizationModal";

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

  const res = await fetch(`/api/schools?${params.toString()}`, {
    credentials: "include",
  });

  const json = await res.json();
  if (!json.success) throw new Error("Failed to load organizations");

  return json;
}

// ---------------------------
// MAIN PAGE
// ---------------------------
export default function OrganizationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const permissions = usePermissions();

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

  const handleViewSchool = (schoolId: string) => {
    router.push(`/admin?school=${schoolId}`);
  };

  const handleAddOrganization = (newSchool: any) => {
    // Invalidate the organizations query to refresh the list
    queryClient.invalidateQueries({ queryKey: ["organizations"] });
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
        showSchoolFilter={isSuperAdmin}
        schoolFilterValue={selectedSchoolId}
        onSchoolFilterChange={setSelectedSchoolId}
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
            className="pl-9"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1); // Reset page when searching
            }}
          />
        </div>

        {/* Organizations Table */}
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>School ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Alerts</TableHead>
                  <TableHead className="text-center">
                    Check-ins Today
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No schools found.
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((school: School) => (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {school.name}
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {school.id}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {school.location || "N/A"}
                      </TableCell>

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
                        {school.checkInsToday}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSchool(school.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
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
    </div>
  );
}