"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import debounce from "lodash/debounce";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertTriangle,
  MessageSquare,
  Award,
  UserCheck,
  FileText,
  Clock,
  Search,
  Music,
  Brain,
  BookOpen,
  Flame,
} from "lucide-react";

import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { cn } from "@/lib/utils";
import { useSchoolFilter } from "@/src/contexts/SchoolFilterContext";
import React from "react";

// --------------------------
// TYPES
// --------------------------
interface Activity {
  id: string;
  type: string;
  studentName: string;
  studentId: string;
  classSection?: string;
  description: string;
  timestamp: string;
}

interface Class {
  id: string | number;
  name: string;
}

interface ActivitiesResponse {
  data: Activity[];
  pagination: {
    hasMore: boolean;
    nextOffset: number | null;
  };
}

// --------------------------
// CONSTANTS
// --------------------------
const typeLabels: Record<string, string> = {
  mood: "Mood Check-in",
  journal: "Journaling",
  meditation: "Meditation",
  music: "Music Therapy",
  badge: "Badge Earned",
  streak: "Streak Updated",
  session: "Support Session",
  alert: "Alert Triggered",
};

const iconMap: Record<string, any> = {
  mood: UserCheck,
  journal: BookOpen,
  meditation: Brain,
  music: Music,
  badge: Award,
  streak: Flame,
  session: MessageSquare,
  alert: AlertTriangle,
};

const styleMap: Record<string, string> = {
mood: "bg-[#10B981]/10 text-[#10B981]",
  journal: "bg-[#3B82F6]/10 text-[#3B82F6]",
  meditation: "bg-[#3B82F6]/10 text-[#3B82F6]",
  music: "bg-violet-100 text-violet-600",
  badge: "bg-[#F59E0B]/10 text-[#F59E0B]",
  streak: "bg-orange-100 text-orange-600",
  session: "bg-[#3B82F6]/10 text-[#3B82F6]",
  alert: "bg-[#EF4444]/10 text-[#EF4444]",
};

// --------------------------
// TIME DISPLAY ONLY
// --------------------------
const formatTime = (timestamp: string) => {
  const activityDate = new Date(timestamp);
  return activityDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

// --------------------------
// DATE GROUPING
// --------------------------
const getRelativeDate = (timestamp: string) => {
  const now = new Date();
  const activityDate = new Date(timestamp);
  
  // Reset time to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
  
  const diffTime = today.getTime() - activityDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return activityDate.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: activityDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
  }
};

// --------------------------
// API FETCHER (SERVER-SIDE FILTERING)
// --------------------------
async function fetchActivitiesServer({
  pageParam = 0,
  filters,
}: any): Promise<ActivitiesResponse> {
  const params = new URLSearchParams({
    limit: "50",
    offset: pageParam.toString(),
  });

  // Attach ALL filters. Backend handles EVERYTHING.
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== "all") params.append(k, String(v));
  });

  const res = await fetch(`/api/admin/activities?${params}`);
  const json = await res.json();

  if (!json.success) throw new Error("Failed to fetch");

  return json;
}

// --------------------------
// MEMOIZED ACTIVITY ROW
// --------------------------
const ActivityRow = React.memo(function ActivityRow({
  activity,
  // onClick,
}: {
  activity: Activity;
  // onClick: (a: Activity) => void;
}) {
  const Icon = iconMap[activity.type] ?? FileText;

  return (
    <div
      // onClick={() => onClick(activity)}
      className="flex items-start gap-4 p-4 hover:bg-[#E2E8F0]/40 cursor-pointer"
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          styleMap[activity.type]
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
          <span className="font-medium uppercase tracking-wide">
            {typeLabels[activity.type]}
          </span>
          {activity.classSection && <span>• {activity.classSection}</span>}
        </div>

        <p className="text-sm text-foreground leading-snug">
          <span className="font-medium">{activity.studentName}</span> —{" "}
          {activity.description}
        </p>
      </div>

      <div className="text-xs text-[#64748B] shrink-0 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {formatTime(activity.timestamp)}
      </div>
    </div>
  );
});

// --------------------------
// MAIN PAGE
// --------------------------
export default function ActivitiesPage() {
  const router = useRouter();
  const { selectedSchoolId, setSelectedSchoolId, schools, isSuperAdmin } =
    useSchoolFilter();

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: React.SetStateAction<string>) => setSearch(value), 400),
    []
  );

  // Fetch classes via useQuery
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

  // All filters passed to API
  const filters = useMemo(
    () => ({
      search,
      type: typeFilter,
      classId: classFilter,
      dateRange: dateFilter,
      schoolId: selectedSchoolId,
    }),
    [search, typeFilter, classFilter, dateFilter, selectedSchoolId]
  );

  // Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["activities-server", filters],
    queryFn: ({ pageParam }) =>
      fetchActivitiesServer({ pageParam, filters }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.nextOffset ?? null,
    initialPageParam: 0,
  });

  // Flat list
  const activities = data?.pages.flatMap((p) => p.data) ?? [];

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    
    activities.forEach((activity) => {
      const dateKey = getRelativeDate(activity.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });
    
    return groups;
  }, [activities]);

  const handleClick = (activity: Activity) => {
    if (activity.studentId)
      router.push(`/admin/users/students/${activity.studentId}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Recent Activity"
        subtitle="Track all activity with server-side filtering"
        showSchoolFilter={isSuperAdmin}
        schoolFilterValue={selectedSchoolId}
        onSchoolFilterChange={setSelectedSchoolId}
        schools={schools}
      />

      <div className="p-6 flex-1 overflow-auto animate-fade-in">
        <div className="rounded-xl border border-border bg-card">

          {/* FILTER BAR */}
          <div className="flex flex-wrap gap-3 p-4 border-b border-border">

            {/* Search */}
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <Input
                placeholder="Search by student or activity..."
                className="pl-9"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>

            {/* Date */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Class */}
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => ( <SelectItem key={cls.id} value={String(cls.id || '')}>{cls.name}</SelectItem> ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {/* LIST */}
          <div className="divide-y divide-border">
            {isLoading && (
              <div className="p-8 text-center text-muted-foreground">
                Loading...
              </div>
            )}

            {!isLoading && activities.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No activities found.
              </div>
            )}

            {!isLoading && Object.entries(groupedActivities).map(([dateLabel, dateActivities]) => (
              <div key={dateLabel}>
                {/* Date Header */}
                <div className="px-4 py-2 bg-[#E2E8F0]/30 border-b border-[#E2E8F0] font-medium text-sm text-[#1E293B] sticky top-0 z-10">
                  {dateLabel}
                </div>
                
                {/* Activities for this date */}
                <div className="">
                  {dateActivities.map((act) => (
                    <ActivityRow key={act.id} activity={act}  />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* LOAD MORE */}
          {hasNextPage && (
            <div className="p-4 border-t border-border">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}