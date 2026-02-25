// components/dashboard/StatsCards.tsx
"use client";

import React, { memo } from "react";
import { Users, BookOpen, Smile, MessageSquare, AlertTriangle } from "lucide-react";

interface StatsData {
  totalStudents?: number;
  checkinsToday?: number;
  activeSessions?: number;
  activeAlerts?: number;
  articles?: number;
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
    { title: "Total Students", value: stats.totalStudents, icon: "users", permission: "users.view", color: "bg-blue-500" },
    { title: "Today's Check-ins", value: stats.checkinsToday, icon: "checkins", permission: "analytics.view", color: "bg-green-500" },
    { title: "Counselling Sessions", value: stats.activeSessions, icon: "sessions", permission: "analytics.view", color: "bg-purple-500" },
    { title: "High-Risk Alerts", value: stats.activeAlerts, icon: "alerts", permission: "analytics.view", color: "bg-red-500" },
    { title: "Resources Published", value: stats.articles, icon: "articles", permission: "psycho.education.view", color: "bg-orange-500" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards
        .filter((c) => permissions.hasPermission(c.permission))
        .map((stat, i) => {
          const Icon = iconMap[stat.icon];
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-5 hover:shadow-card-hover">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">{stat.title}</span>
                  <span className="text-2xl font-semibold">{loading ? "..." : stat.value}</span>
                </div>
                <div className={`${stat.color} h-10 w-10 flex items-center justify-center rounded-lg text-white`}>
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