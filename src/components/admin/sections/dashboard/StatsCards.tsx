// components/dashboard/StatsCards.tsx
"use client";

import React, { memo } from "react";
import { Users, BookOpen, Smile, MessageSquare, AlertTriangle } from "lucide-react";

interface StatsData {
  totalStudents?: number;
  checkinsToday?: number;
  activeSessions?: number;
  highRiskAlerts?: number;
  totalResources?: number;
}

interface Permissions {
  hasPermission: (permission: string) => boolean; 
}

interface StatsCardsProps {
  stats: StatsData;
  loading: boolean;
  permissions: Permissions;
}

type IconKey = "users" | "checkins" | "sessions" | "alerts" | "articles";

const iconMap: Record<IconKey, React.ComponentType<any>> = {
  users: Users,
  checkins: Smile,
  sessions: MessageSquare,
  alerts: AlertTriangle,
  articles: BookOpen,
};

function StatsCards({ stats, loading, permissions }: StatsCardsProps) {
  const cards: Array<{
    title: string;
    value: number | undefined;
    icon: IconKey;
    permission: string;
    color: string;
  }> = [
    { title: "Total Students", value: stats.totalStudents, icon: "users", permission: "users.view", color: "bg-[#3B82F6]/10 text-[#3B82F6]" },
    { title: "Today's Check-ins", value: stats.checkinsToday, icon: "checkins", permission: "analytics.view", color: "bg-[#10B981]/10 text-[#10B981]" },
    { title: "Counselling Sessions", value: stats.activeSessions, icon: "sessions", permission: "analytics.view", color: "bg-[#E2E8F0] text-[#64748B]" },
    { title: "High & Critical Alerts", value: stats.highRiskAlerts, icon: "alerts", permission: "analytics.view", color: "bg-[#EF4444]/10 text-[#EF4444]" },
    { title: "Resources Published", value: stats.totalResources, icon: "articles", permission: "psycho.education.view", color: "bg-[#E2E8F0] text-[#64748B]" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards
        .filter((c) => permissions.hasPermission(c.permission))
        .map((stat, i) => {
          const Icon = iconMap[stat.icon];
          return (
            <div key={i} className="rounded-xl relative overflow-hidden border border-border bg-card p-5  transition-all duration-200 hover:shadow-lg hover:border-[#3B82F6]/20">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-sm text-[#64748B]">{stat.title}</span>
                  <span className="text-2xl font-semibold">{loading ? "..." : stat.value}</span>
                </div>
                <div className={`${stat.color} h-10 w-10 flex items-center justify-center rounded-lg `}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default memo(StatsCards);