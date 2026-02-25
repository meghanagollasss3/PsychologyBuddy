"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";

import {
  Users, Plus, Search, Filter, Eye, Edit, Archive,
  MoreVertical,
} from "lucide-react";

import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { useSchoolFilter } from "@/src/contexts/SchoolFilterContext";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useAuth } from "@/src/contexts/AuthContext";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { ViewStudentModal } from "../modals/ViewStudentModal";
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
  nextOffset: number | null;
  hasMore: boolean;
}

// -----------------------------------------
// API CALL
// -----------------------------------------
async function fetchStudents({ pageParam = 0, filters }: any): Promise<StudentApiResponse> {
  const params = new URLSearchParams({
    limit: "30",
    offset: pageParam.toString(),
  });

  Object.entries(filters).forEach(([key, val]) => {
    if (val !== "all" && val) params.append(key, String(val));
  });

  const res = await fetch(`/api/students?${params.toString()}`, { credentials: "include" });
  const json = await res.json();

  if (!json.success) throw new Error("Failed to fetch students");

  return {
    students: json.data,
    nextOffset: json.pagination?.hasMore ? pageParam + 30 : null,
    hasMore: json.pagination?.hasMore || false,
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
  permissions,
}: {
  student: Student;
  onView: (s: Student) => void;
  onEdit: (s: Student) => void;
  onArchive: (s: Student) => void;
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
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => onArchive(student)}>
              <Archive className="h-4 w-4" /> Archive
            </DropdownMenuItem>
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
  const { user } = useAuth();
  const permissions = usePermissions();

  // ----------------------------
  // Filters (With Debounce)
  // ----------------------------
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useState(() => debounce((v) => setSearch(v), 300));

  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

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
  // Fetch Students
  // ----------------------------
  const filters = {
    search,
    status: statusFilter,
    classId: classFilter,
    schoolId: selectedSchoolId,
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["students", filters],
    queryFn: ({ pageParam }) => fetchStudents({ pageParam, filters }),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 1000 * 20,
  });

  const students = data?.pages.flatMap((p) => p.students) ?? [];

  // ----------------------------
  // Modals
  // ----------------------------
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const handleArchive = (student: Student) => {
    // TODO: Implement archive functionality
    console.log('Archive student', student);
  };

  return (
    <div className="flex flex-col min-h-screen">

      <AdminHeader
        title="Students"
        subtitle="Manage student profiles"
        showSchoolFilter={isSuperAdmin}
        schools={schools}
        schoolFilterValue={selectedSchoolId}
        onSchoolFilterChange={setSelectedSchoolId}
        actions={
          permissions.canManageStudents && (
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          )
        }
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
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>

          {/* STATUS FILTER */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          <Select value={classFilter} onValueChange={setClassFilter}>
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
                    setCurrentStudent(s);
                    setShowView(true);
                  }}
                  onEdit={(s: Student) => {
                    setCurrentStudent(s);
                    setShowEdit(true);
                  }}
                  onArchive={handleArchive}
                  permissions={permissions}
                />
              ))}
            </TableBody>
          </Table>

          {/* LOAD MORE */}
          {hasNextPage && (
            <div className="p-4 text-center">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}

        </div>
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

      {showView && currentStudent && (
        <ViewStudentModal student={currentStudent} onClose={() => setShowView(false)} />
      )}
    </div>
  );
}