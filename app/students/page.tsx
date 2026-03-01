"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import StudentLayout from "@/src/components/StudentDashboard/Layout/StudentLayout";

/* -------------------------
   LIGHTWEIGHT / ABOVE FOLD
------------------------- */

// These are light, safe for immediate hydration
import HeaderGreeting from "@/src/components/StudentDashboard/Dashboard/HeaderGreeting";
import StatsCards from "@/src/components/StudentDashboard/Dashboard/StatsCards";
import ExploreSpace from "@/src/components/StudentDashboard/Dashboard/ExploreSpace";
import DailyMotivation from "@/src/components/StudentDashboard/Dashboard/DailyMotivation";

/* -------------------------
   HEAVY COMPONENTS (Lazy)
------------------------- */

// Chart.js components (heavy)
const WeeklyMoodTrends = dynamic(
  () =>
    import("@/src/components/StudentDashboard/Dashboard/WeeklyMoodTrends"),
  {
    ssr: false, // prevents hydration mismatch + lighter HTML
    loading: () => <div className="h-[280px] bg-gray-100 rounded-xl animate-pulse" />,
  }
);

// Chart or SVG-heavy component
const EmotionalPatterns = dynamic(
  () =>
    import("@/src/components/StudentDashboard/Dashboard/EmotionalPatterns"),
  {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />,
  }
);

// Animated component (breathing)
const ExerciseCard = dynamic(
  () =>
    import("@/src/components/StudentDashboard/Dashboard/ExerciseCard"),
  {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />,
  }
);

// Query-heavy activity fetch
const RecentActivity = dynamic(
  () =>
    import("@/src/components/StudentDashboard/Dashboard/RecentActivity"),
  {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />,
  }
);

// Query-based
const BadgeProgress = dynamic(
  () => import("@/src/components/StudentDashboard/Dashboard/BadgeProgress"),
  {
    ssr: false,
  }
);

// Query-based
const CurrentStreak = dynamic(
  () => import("@/src/components/StudentDashboard/Dashboard/CurrentStreak"),
  {
    ssr: false,
  }
);

/* -------------------------
   Root Page
------------------------- */

export default function DashboardPage() {
  return (
    <StudentLayout>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[1312px] p-6 space-y-8">

          {/* Greeting */}
          <HeaderGreeting />

          {/* Stats Row */}
          <Suspense fallback={<div className="h-20 bg-gray-100 rounded-xl animate-pulse" />}>
            <StatsCards />
          </Suspense>

          {/* Explore */}
          <ExploreSpace />

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT COLUMN */}
            <div className="space-y-6 mt-5">
              <DailyMotivation />

              <Suspense fallback={<div className="h-[120px] bg-gray-100 rounded-xl animate-pulse" />}>
                <BadgeProgress />
              </Suspense>

              <Suspense fallback={<div className="h-[120px] bg-gray-100 rounded-xl animate-pulse" />}>
                <CurrentStreak />
              </Suspense>

              <Suspense fallback={<div className="h-[220px] bg-gray-100 rounded-xl animate-pulse" />}>
                <EmotionalPatterns />
              </Suspense>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6 mt-5">

              <Suspense fallback={<div className="h-[280px] bg-gray-100 rounded-xl animate-pulse" />}>
                <WeeklyMoodTrends />
              </Suspense>

              <Suspense fallback={<div className="h-[220px] bg-gray-100 rounded-xl animate-pulse" />}>
                <ExerciseCard />
              </Suspense>

              <Suspense fallback={<div className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />}>
                <RecentActivity />
              </Suspense>

            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}