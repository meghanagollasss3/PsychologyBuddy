"use client";

import { memo } from "react";
import { 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Award, 
  UserCheck,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTimeFilter, type TimeFilter, type DateRange } from "@/src/contexts/TimeFilterContext";

// ------------------------------
// Activity Type Interface
// ------------------------------
interface Activity {
  id: string;
  type: "alert" | "session" | "badge" | "checkin" | "content";
  message: string;
  time: string;
  isImportant?: boolean;
}

// ------------------------------
// API Fetching Function
// ------------------------------
async function fetchActivities({ pageParam = 0, timeFilter, dateRange }: { 
  pageParam?: number; 
  timeFilter: TimeFilter; 
  dateRange: DateRange 
}) {
  const limit = 5;
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: pageParam.toString(),
  });

  // Add time filter parameters
  if (timeFilter) {
    params.append('timeFilter', timeFilter);
    console.log('RecentActivities: Adding timeFilter', timeFilter);
  }
  
  if (dateRange) {
    params.append('startDate', dateRange.start.toISOString());
    params.append('endDate', dateRange.end.toISOString());
    console.log('RecentActivities: Adding dateRange', dateRange);
  }

  console.log('RecentActivities: Fetching with params', params.toString());

  const response = await fetch(`/api/admin/activities?${params}`);
  const result = await response.json();

  console.log('RecentActivities: API response', result);

  if (!result.success) {
    throw new Error("Failed to load recent activities");
  }

  return {
    activities: result.data.map((item: any) => ({
      id: item.id,
      type: mapActivityType(item.type),
      message: item.description,
      time: formatRelativeTime(item.timestamp),
      isImportant: item.type === "alert",
    })),
    nextOffset: result.pagination?.hasMore ? pageParam + limit : null,
  };
}

// ------------------------------
// Mapping Backend Types → UI Types
// ------------------------------
const mapActivityType = (type: string): Activity["type"] => {
  switch (type) {
    case "mood": return "checkin";
    case "journal": return "content";
    case "meditation": return "session";
    case "music": return "content";
    case "badge": return "badge";
    case "streak": return "badge";
    case "session": return "session";
    case "alert": return "alert";
    default: return "content";
  }
};

// ------------------------------
// Time Formatting
// ------------------------------
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

// ------------------------------
// Icon Map
// ------------------------------
const iconMap = {
  alert: AlertTriangle,
  session: MessageSquare,
  badge: Award,
  checkin: UserCheck,
  content: BookOpen,
};

const styleMap = {
  alert: "bg-[#EF4444]/10 text-[#EF4444]",
  session: "bg-[#3B82F6]/10 text-[#3B82F6]",
  badge: "bg-[#F59E0B]/10 text-[#F59E0B]",
  checkin: "bg-[#10B981]/10 text-[#10B981]",
  content: "bg-[#3B82F6]/10 text-[#3B82F6]",
};

// ------------------------------
// Memoized Activity Row
// ------------------------------
const ActivityRow = memo(({ activity }: { activity: Activity }) => {
  const Icon = iconMap[activity.type] || MessageSquare;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 transition-colors hover:bg-[#E2E8F0]/30",
        activity.isImportant && "bg-destructive/5"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          styleMap[activity.type] || "bg-muted/10 text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{activity.message}</p>

        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {activity.time}
        </div>
      </div>
    </div>
  );
});
ActivityRow.displayName = "ActivityRow";

// ------------------------------
// MAIN COMPONENT
// ------------------------------
export function RecentActivity() {
  const router = useRouter();
  const { timeFilter, dateRange } = useTimeFilter();

  console.log('RecentActivity Component: timeFilter', timeFilter);
  console.log('RecentActivity Component: dateRange', dateRange);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ["recent-activities", timeFilter, dateRange],
    queryFn: ({ pageParam }) => fetchActivities({ pageParam, timeFilter, dateRange }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 30_000,
  });

  const activities = data?.pages.flatMap((page) => page.activities) ?? [];

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#ffffff]]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
        <div>
          <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest system events</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/admin/activities")}
        >
          View All
        </Button>
      </div>

      {/* Content List */}
      <div className="max-h-80 overflow-y-auto scrollbar-thin">
        <div className="divide-y divide-border">
          {isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              Loading activities...
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-destructive">
              Failed to load activities.
            </div>
          )}

          {!isLoading && activities.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No recent activities found.
            </div>
          )}

          {activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="p-4 border-t border-border">
          <button
            onClick={() => fetchNextPage()}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More Activities"}
          </button>
        </div>
      )}
    </div>
  );
}