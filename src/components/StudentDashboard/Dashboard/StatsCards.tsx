"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import React from "react";

/* ---------------------------------------------
   CONFIG (Memoized outside component)
---------------------------------------------- */
const statsConfig = [
  {
    key: "currentStreak",
    label: "Current Streaks",
    sublabel: "Days",
    image: "/Dashboard/StatCards/Streaks.svg",
    className: "border-[2px] border-[#FFEAD0] bg-gradient-to-b from-[#ffffff] to-[#FFFAF3]",
    gradient: "from-orange-100/60 to-orange-50/20",
  },
  {
    key: "totalCheckins",
    label: "Check-ins",
    sublabel: "Total",
    image: "/Dashboard/StatCards/Checkin.svg",
    className: "border-[2px] border-[#EFD9FF] bg-gradient-to-b from-[#ffffff] to-[#F7ECFF]",
    gradient: "from-purple-100/60 to-purple-50/20",
  },
  {
    key: "resourcesUsed",
    label: "Resources Used",
    sublabel: "Accessed",
    image: "/Dashboard/StatCards/Resources.svg",
    className: "border-[2px] border-[#D5FFE2] bg-gradient-to-b from-[#ffffff] to-[#E9FFF0]",
    gradient: "from-green-100/60 to-green-50/20",
  },
  {
    key: "badgesEarned",
    label: "Badges Earned",
    sublabel: "Unlocked",
    image: "/Dashboard/StatCards/Badges.svg",
    className: "border-[2px] border-[#D1E2FF] bg-gradient-to-b from-[#ffffff] to-[#EDF4FF]",
    gradient: "from-blue-100/60 to-blue-50/20",
  },
];

/* --------------------------------------------------
   Fetcher (REST API)
--------------------------------------------------- */
async function fetchStats() {
  const res = await fetch("/api/student/stats");
  const data = await res.json();
  if (!data.success) throw new Error("Failed to fetch stats");
  return data.data;
}

/* --------------------------------------------------
   Memoized Stat Card Component
--------------------------------------------------- */
const StatCard = React.memo(function StatCard({
  config,
  value,
  loading,
  onClick,
}: {
  config: any;
  value: number;
  loading: boolean;
  onClick?: () => void;
}) {
  return (
    <Card 
      className={`relative w-[293px] h-auto overflow-hidden rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] ${config.className} ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''
      }`}
      onClick={onClick}
    >
      {/* Gradient BG */}
      <div
        className={`absolute inset-0 w-[150px] h-[150px] left-[186px] top-[-55px] rounded-full bg-gradient-to-br ${config.gradient} opacity-70`}
      />

      {/* Blob */}
      <svg
        className="absolute left-[186px] top-[-55px] opacity-20"
        viewBox="0 0 200 200"
      >
        <path
          fill="currentColor"
          className="text-white"
          d="M43.3,-74.3C57.4,-66.4..."
          transform="translate(100 100)"
        />
      </svg>

      <CardContent className="relative p-6 flex flex-col gap-4">
        {/* Image */}
        <div>
          <img 
            src={config.image} 
            alt={config.label}
            className="h-[56px] w-[55px] "
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = "/images/placeholder.png";
            }}
          />
        </div>

        {/* Animated Number */}
        {loading ? (
          <Skeleton className="h-10 w-20 rounded-md" />
        ) : (
          <h2 className="text-[37px] -mt-4 font-bold text-[#2F3D43] z-10">
            {value.toString().padStart(2, "0")}
          </h2>
        )}

        {/* Labels */}
        <div className="z-10">
          <p className="text-[16px] -mt-6 font-medium text-[#686D70]">{config.sublabel}</p>
          <p className="text-[14px] mt-2 text-[#767676] -mt-1">{config.label}</p>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = "StatCard";

/* --------------------------------------------------
   Main Optimized StatsCards Component
--------------------------------------------------- */
export default function StatsCards() {
  const router = useRouter();
  
  /* --- Fetch stats with react-query --- */
  const { data, isLoading, error } = useQuery({
    queryKey: ["studentStats"],
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 2, // cache 2 minutes for balance
  });

  /* --- Animated numbers state --- */
  const [values, setValues] = useState<number[]>(
    statsConfig.map(() => 0)
  );

  const animationRef = useRef<number | null>(null);
  const startTimestamp = useRef<number>(0);

  /* --- Handle click for totalCheckins card --- */
  const handleCheckinClick = () => {
    router.push('/students/mood-checkin');
  };

  /* --- Start animation when data loads --- */
  useEffect(() => {
    if (!data) return;

    const targetValues = statsConfig.map((c) => data[c.key]);
    const duration = 900; // ms

    function animate(timestamp: number) {
      if (!startTimestamp.current) startTimestamp.current = timestamp;
      const progress = Math.min((timestamp - startTimestamp.current) / duration, 1);

      const newValues = targetValues.map((end) => Math.floor(end * progress));
      setValues(newValues);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationRef.current!);
  }, [data]);

  /* --- Render --- */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
      {statsConfig.map((config, idx) => (
        <StatCard
          key={config.key}
          config={config}
          value={values[idx]}
          loading={isLoading}
          onClick={config.key === 'totalCheckins' ? handleCheckinClick : undefined}
        />
      ))}
    </div>
  );
}