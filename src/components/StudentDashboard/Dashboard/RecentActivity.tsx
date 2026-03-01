"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Activity,
  BookOpen,
  Wind,
  Brain,
  Heart,
  Target,
  FileText,
  PenLine,
  Headphones,
  Award,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";

interface ActivityItem {
  id: string;
  type:
    | "checkin"
    | "meditation"
    | "journaling"
    | "tool"
    | "reading";
  title: string;
  time: string;
  timestamp?: string;
  details?: string;
  date: string;
}

// API function to fetch recent activity (same as StudentProfile)
async function fetchStudentProfile(id: string) {
  const res = await fetch(`/api/students/${id}/profile`);
  const json = await res.json();
  if (!json.success)
    throw new Error(json.error?.message || "Failed to fetch profile");
  return json.data;
}

function ActivitySection({ activities }: { activities: ActivityItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  const getIcon = (type: string) => {
    const iconWrapper = (icon: React.ReactNode, bg: string) => (
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-xl ${bg}`}
      >
        {icon}
      </div>
    );

    if (type === "journaling")
      return iconWrapper(
        <PenLine className="w-5 h-5 text-[#3164CA]" />,
        "bg-[#EDF3FF]",
      );

    if (type === "exercise")
      return iconWrapper(
        <Wind className="w-5 h-5 text-[#B65CF4]" />,
        "bg-[#F7ECFF]",
      );

    if (type === "tool")
      return iconWrapper(
        <Award className="w-5 h-5 text-[#e1ad01]" />,
        "bg-[#FFF7EE]",
      );

    if (type === "checkin")
      return iconWrapper(
        <Heart className="w-5 h-5 text-[#E10157]" />,
        "bg-[#FFE9F2]",
      );

    if (type === "reading")
      return iconWrapper(
        <BookOpen className="w-5 h-5 text-[#23910D]" />,
        "bg-[#EBFFEF]",
      );

    if (type === "meditation")
      return iconWrapper(
        <Headphones className="w-5 h-5 text-[#5ED7AC]" />,
        "bg-[#E3FFF5]",
      );

    // Default
    return iconWrapper(
      <Activity className="w-5 h-5 text-blue-500" />,
      "bg-blue-100",
    );
  };

  // Sort activities by date (most recent first)
  const sortedActivities = displayedActivities.sort(
    (a: ActivityItem, b: ActivityItem) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="bg-white rounded-[16px] drop-shadow-sm p-6 border border-white ">
      <div className="flex items-center">
        <Activity className="w-[20px] h-[20px] text-[#3164CA]" />
        <h2 className="text-[20px] font-semibold text-[#3164CA] ml-2">
          Recent Activity
        </h2>
      </div>

      {sortedActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No activities yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Start using journaling, exercises, or self-help tools to see your
            activity here
          </p>
        </div>
      ) : (
        <div className="mt-4 max-h-96 overflow-y-auto space-y-4 border-l-2 border-gray-200 pl-4">
          {sortedActivities.map((activity: ActivityItem) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                {getIcon(activity.type)}
              </div>

              <div className="flex-1">
                <p className="font-medium text-gray-800">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
                {activity.details && (
                  <p className="text-xs text-gray-400 mt-1">
                    {activity.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View More Button */}
      {activities.length > 6 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAll ? 'View Less' : `View More (${activities.length - 6} more)`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function RecentActivity() {
  const { user } = useAuth();
  const {
    data: profileData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: () => fetchStudentProfile(user!.id),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Activity
          </h2>
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4 border-l-2 border-gray-200 pl-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !profileData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Activity
        </h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-sm text-gray-500">
            Failed to load recent activity
          </p>
        </div>
      </div>
    );
  }

  const { activities } = profileData;
  return <ActivitySection activities={activities || []} />;
}
