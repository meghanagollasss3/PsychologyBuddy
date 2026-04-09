"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";

import {
  Users, Plus, Search, Filter, Eye, Edit, Trash2, RotateCcw,
  MoreVertical,
} from "lucide-react";

import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { useSchoolFilter } from "@/src/contexts/SchoolFilterContext";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useAuth } from "@/src/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Select, SelectTrigger, SelectContent, SelectValue, SelectItem,
} from "@/components/ui/select";

import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/src/utils/date.util";

import { AddStudentModal } from "../modals/AddStudentModal";
import { EditStudentModal } from "../modals/EditStudentModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Class {
  id: string;
  name: string;
  grade?: number;
  section?: string;
  schoolId?: string;
}
interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  classRef?: { id: string; name: string };
  school?: { id: string; name: string };
  studentProfile?: {
    lastMoodCheckin?: string;
    averageMood?: number;
    riskLevel?: "LOW" | "MEDIUM" | "HIGH";
    profileImage?: string;
  };
  _count?: { sessions: number };
}

interface StudentApiResponse {
  students: Student[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

// -----------------------------------------
// API CALL
// -----------------------------------------
async function fetchStudents({ page = 1, limit = 5, filters }: any): Promise<StudentApiResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  Object.entries(filters).forEach(([key, val]) => {
    if (val !== "all" && val) params.append(key, String(val));
  });

  const res = await fetch(`/api/students?${params.toString()}`, { credentials: "include" });
  const json = await res.json();

  if (!json.success) throw new Error("Failed to fetch students");

  return {
    students: json.data?.students || [],
    pagination: json.data?.pagination || {
      total: json.data?.students?.length || 0,
      totalPages: 1,
      page,
      limit,
    },
  };
}

// -----------------------------------------
// STUDENT ROW (Memoized)
// -----------------------------------------
const StudentRow = React.memo(function StudentRow({
  student,
  onView,
  onEdit,
  onArchive,
  onRestore,
  permissions,
}: {
  student: Student;
  onView: (s: Student) => void;
  onEdit: (s: Student) => void;
  onArchive: (s: Student) => void;
  onRestore: (s: Student) => void;
  permissions: any;
}) {
  const riskColor =
    (student.studentProfile?.averageMood ?? 0) >= 3.5
      ? "text-[#10B981]"
      : (student.studentProfile?.averageMood ?? 0) >= 2.5
      ? "text-[#F59E0B]"
      : "text-[#EF4444]";

  const statusBadge = {
    ACTIVE: "text-[#10B981] bg-[#10B981]/10",
    INACTIVE: "text-[#6B7280] bg-[#6B7280]/10",
    SUSPENDED: "text-[#EF4444] bg-[#EF4444]/10",
  };

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={student.studentProfile?.profileImage || ""} />
            <AvatarFallback>
              {student.firstName[0]}
              {student.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{student.firstName} {student.lastName}</p>
            <p className="text-xs text-muted-foreground">{student.email}</p>
            <p className="text-xs text-muted-foreground">{student.studentId}</p>
          </div>
        </div>
      </TableCell>

      <TableCell>{student.classRef?.name || "-"}</TableCell>

      <TableCell>
        <span className={cn("px-2 py-1 rounded-md text-xs", statusBadge[student.status])}>
          {student.status}
        </span>
      </TableCell>

      <TableCell>
        {student.studentProfile?.lastMoodCheckin
          ? formatRelativeTime(student.studentProfile.lastMoodCheckin)
          : "Never"}
      </TableCell>

      <TableCell className="text-center">
        <span className={cn("font-semibold", riskColor)}>
          {student.studentProfile?.averageMood?.toFixed(1) || "-"}
        </span>
      </TableCell>

      <TableCell className="text-center">{student._count?.sessions || 0}</TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onClick={() => onView(student)}>
              <Eye className="h-4 w-4" /> View Profile
            </DropdownMenuItem>
            {permissions.canUpdateUsers && (
              <DropdownMenuItem className="gap-2" onClick={() => onEdit(student)}>
                <Edit className="h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {student.status === 'INACTIVE' ? (
              <DropdownMenuItem className="gap-2 text-green-600 focus:text-green-600" onClick={() => onRestore(student)}>
                <RotateCcw className="h-4 w-4" /> Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => onArchive(student)}>
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

// -----------------------------------------
// MAIN PAGE
// -----------------------------------------
export default function StudentsPage() {
  const router = useRouter();
  const { selectedSchoolId, setSelectedSchoolId, schools, isSuperAdmin } = useSchoolFilter();
  const permissions = usePermissions();
  const { user } = useAuth();
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [locations, setLocations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useState(() => debounce((v) => setSearch(v), 300));
  const limit = 5;

  // Check if user should see location filter
  // Only SCHOOL_SUPERADMIN should see location filter (ADMIN users are auto-restricted to their assigned locations)
  const effectiveSchoolId = (user?.role?.name === 'SCHOOL_SUPERADMIN' || user?.role?.name === 'ADMIN') ? user?.school?.id : selectedSchoolId;
  const shouldShowLocationFilter = user?.role?.name === 'SCHOOL_SUPERADMIN' && effectiveSchoolId && effectiveSchoolId !== 'all';

  // ----------------------------
  // Fetch Classes
  // ----------------------------
  const { data: classesData } = useQuery<Class[]>({
    queryKey: ["classes", selectedSchoolId],
    queryFn: async () => {
      const url = selectedSchoolId && selectedSchoolId !== 'all' 
        ? `/api/classes?schoolId=${selectedSchoolId}` 
        : '/api/classes';
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      return data.success ? data.data : [];
    },
  });

  const classes: Class[] = classesData || [];

  // ----------------------------
  // Fetch Locations
  // ----------------------------
  useEffect(() => {
    const fetchLocations = async () => {
      if (effectiveSchoolId && effectiveSchoolId !== 'all') {
        try {
          const response = await fetch(`/api/admin/schools/locations?schoolId=${effectiveSchoolId}`, { 
            credentials: 'include' 
          });
          const data = await response.json();
          setLocations(data || []);
        } catch (error) {
          console.error('Failed to fetch locations:', error);
          setLocations([]);
        }
      } else {
        setLocations([]);
      }
    };

    fetchLocations();
  }, [effectiveSchoolId]);

  // ----------------------------
  // Fetch Students
  // ----------------------------
  const filters = {
    search,
    status: statusFilter,
    classId: classFilter,
    locationId: locationFilter === "all" ? undefined : locationFilter,
    schoolId: selectedSchoolId,
  };

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["students", { page, limit, filters }],
    queryFn: () => fetchStudents({ page, limit, filters }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20,
  });

  const students = data?.students ?? [];
  const pagination = data?.pagination;

  // ----------------------------
  // Modals
  // ----------------------------
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState<Student | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [studentToRestore, setStudentToRestore] = useState<Student | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAddStudent = () => {
    setShowAdd(true);
  };

  const handleArchive = (student: Student) => {
    setStudentToArchive(student);
    setShowArchiveDialog(true);
  };

  const handleRestore = (student: Student) => {
    setStudentToRestore(student);
    setShowRestoreDialog(true);
  };

  const confirmRestore = async () => {
    if (!studentToRestore) return;
    
    setIsRestoring(true);
    try {
      const response = await fetch(`/api/students/${studentToRestore.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'ACTIVE' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Student restored successfully",
          description: `${studentToRestore.firstName} ${studentToRestore.lastName} has been restored to active status.`
        });
        
        // Refresh the student list
        queryClient.invalidateQueries({ queryKey: ['students'] });
        
        setShowRestoreDialog(false);
        setStudentToRestore(null);
      } else {
        toast({
          title: "Failed to restore student",
          description: data.message || "An error occurred while restoring the student.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Restore student error:', error);
      toast({
        title: "Failed to restore student",
        description: "Network error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const confirmArchive = async () => {
    if (!studentToArchive) return;
    
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/students/${studentToArchive.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Student deleted successfully",
          description: `${studentToArchive.firstName} ${studentToArchive.lastName} has been permanently deleted from the system.`
        });
        
        // Refresh the student list
        queryClient.invalidateQueries({ queryKey: ['students'] });
        
        setShowArchiveDialog(false);
        setStudentToArchive(null);
      } else {
        toast({
          title: "Failed to delete student",
          description: data.message || "An error occurred while deleting the student.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Delete student error:', error);
      toast({
        title: "Failed to delete student",
        description: "Network error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">

      <AdminHeader 
        title="Student Management" 
        subtitle="View and manage student profiles" 
        showSchoolFilter={isSuperAdmin} 
        schoolFilterValue={selectedSchoolId} 
        onSchoolFilterChange={setSelectedSchoolId} 
        schools={schools} 
        showLocationFilter={shouldShowLocationFilter || false}
        locationFilterValue={locationFilter}
        onLocationFilterChange={setLocationFilter}
        locations={locations}
        showTimeFilter={false} 
        actions={permissions.canManageStudents && ( <Button onClick={handleAddStudent} className="gap-2" > <Plus className="w-4 h-4" /> <span>Add Student</span> </Button> )} 
      />

      <div className="p-6">

        {/* FILTER BAR */}
        <div className="flex flex-wrap gap-4 mb-6">

          {/* SEARCH */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search students..."
              onChange={(e) => {
                debouncedSearch(e.target.value);
                setPage(1); // Reset page when searching
              }}
            />
          </div>

          {/* STATUS FILTER */}
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1); // Reset page when filtering
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          {/* CLASS FILTER */}
          <Select value={classFilter} onValueChange={(value) => {
            setClassFilter(value);
            setPage(1); // Reset page when filtering
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
{classes.map((cls) => ( <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem> ))}            </SelectContent>
          </Select>
        </div>

        {/* TABLE */}
        <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Check-in</TableHead>
                <TableHead className="text-center">Avg Mood</TableHead>
                <TableHead className="text-center">Sessions</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* LOADING */}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              )}

              {/* EMPTY */}
              {!isLoading && students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              )}

              {/* ROWS */}
              {students.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onView={(s: Student) => {
                    router.push(`/admin/profile/student?id=${s.id}`);
                  }}
                  onEdit={(s: Student) => {
                    setCurrentStudent(s);
                    setShowEdit(true);
                  }}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  permissions={permissions}
                />
              ))}
            </TableBody>
          </Table>


        </div>
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

      {/* MODALS */}
      {showAdd && (
        <AddStudentModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
          } }
          schools={schools} classes={[]}        />
      )}

      {showEdit && currentStudent && (
        <EditStudentModal
          student={currentStudent}
          onClose={() => setShowEdit(false)}
          onSuccess={() => setShowEdit(false)} schools={[]} classes={[]}        />
      )}

      {/* Delete Confirmation Dialog */}
      {showArchiveDialog && studentToArchive && (
        <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete {studentToArchive.firstName} {studentToArchive.lastName}?
                This action cannot be undone and all student data will be permanently removed from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isArchiving}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmArchive}
                disabled={isArchiving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isArchiving ? "Deleting..." : "Delete Student"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Restore Confirmation Dialog */}
      {showRestoreDialog && studentToRestore && (
        <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to restore {studentToRestore.firstName} {studentToRestore.lastName}?
                This will set their status back to active and they will appear in the active student list again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRestoring}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRestore}
                disabled={isRestoring}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {isRestoring ? "Restoring..." : "Restore Student"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}