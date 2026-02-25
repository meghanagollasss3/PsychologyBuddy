"use client";

import React from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useSchoolFilter } from "@/src/contexts/SchoolFilterContext";

import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import StatsCards from "./StatsCards";
import SchoolInfo from "./SchoolInfo";
import ClassHeatmap from "./ClassHeatMap";

import { useDashboardStats } from "@/src/hooks/adminDashboard/useDashboardStats";
import { useClassData } from "@/src/hooks/adminDashboard/useClassData";
import { useMoodData } from "@/src/hooks/adminDashboard/useMoodData";
import { useTriggerData } from "@/src/hooks/adminDashboard/useTriggerData";
import { MoodDistributionChart } from "../../charts/MoodDistributionChartChartJS";
import { TriggerAnalysisChart } from "../../charts/TriggerAnalysisChartChartJS";
import { AlertsOverview } from "../AlertsOverview";
import { RecentActivity } from "../RecentActivity";

export function DashboardOverview() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const { selectedSchoolId, setSelectedSchoolId, schools, isSuperAdmin } = useSchoolFilter();

  const { data: stats, isLoading } = useDashboardStats(selectedSchoolId, isSuperAdmin, user);
  const { data: classData } = useClassData(selectedSchoolId, isSuperAdmin, user);
  const { data: moodData } = useMoodData(selectedSchoolId, isSuperAdmin, user);
  const { data: triggerData } = useTriggerData(selectedSchoolId, isSuperAdmin, user);

  return (
    <div>
      <AdminHeader
        title={`Welcome back, ${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Admin"}`}
        subtitle="Here's what's happening today"
        showSchoolFilter={isSuperAdmin}
        schoolFilterValue={selectedSchoolId}
        schools={schools}
        onSchoolFilterChange={setSelectedSchoolId}
      />
    <div className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">

      <StatsCards stats={stats || {}} loading={isLoading} permissions={permissions} />

      {!selectedSchoolId && permissions.isAdmin && user?.school && (
                  <SchoolInfo 
                    school={user.school}
                    stats={{ totalStudents: stats.totalStudents }}
                    />
                )}

      <ClassHeatmap classData={classData || []} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood Distribution Chart */}
              <MoodDistributionChart 
                data={Array.isArray(moodData?.chartData) ? moodData.chartData : []}
                totalCheckins={moodData?.totalCheckins || 0}
                dominantMood={moodData?.dominantMood || null}
              />
      
              {/* Emotional Triggers Chart */}
              <TriggerAnalysisChart 
                data={Array.isArray(triggerData?.chartData) ? triggerData.chartData : []}
                totalReports={triggerData?.totalReports || 0}
                timeRange={triggerData?.timeRange || 'week'}
              />
            </div>
              <div className="flex-1 overflow-auto space-y-6 animate-fade-in">
      
              <RecentActivity/>
              </div>
              <div>
                <AlertsOverview/>
              </div>
                    </div>
    </div>
  );
}