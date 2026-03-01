"use client";

import { Flame, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useRef } from "react";

/* ------------------------------ Fetcher ------------------------------ */
async function fetchCurrentStreak(): Promise<{
  count: number;
  lastActive: string;
  bestStreak: number;
}> {
  const res = await fetch("/api/student/streak");
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch streak");
  return json.data;
}

/* ------------------------------ Component ------------------------------ */
export default function CurrentStreak() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["currentStreak"],
    queryFn: fetchCurrentStreak,
    refetchInterval: 60000,
    staleTime: 60000,
  });

  /* ---- Number Animation ---- */
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!data) return;

    const start = displayValue;
    const end = data.count;
    const duration = 600;
    let startTime = 0;

    function animate(time: number) {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = start + (end - start) * progress;
      setDisplayValue(Math.floor(eased));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [data]);

  /* ---- Best streak + last active ---- */
  const streakDetails = useMemo(() => {
    if (!data) return { best: 0 };
    return { best: data.bestStreak ?? 0 };
  }, [data]);

  /* ------------------------------ Loading State ------------------------------ */
  if (isLoading) {
    return (
      <div className="rounded-2xl p-5 bg-orange-50 animate-pulse h-[150px]" />
    );
  }

  /* ------------------------------ Error State ------------------------------ */
  if (isError || !data) {
    return (
      <div className="rounded-2xl p-5 bg-orange-50 h-[150px] flex items-center justify-center">
        <p className="text-sm text-gray-600">Failed to load streak</p>
      </div>
    );
  }

  /* ------------------------------ MAIN UI ------------------------------ */
  return (
    <div
      className="
        rounded-2xl p-5 
        bg-gradient-to-br 
                 from-[#ffeada8f] via-[#FFFBF8] to-[#ffeada88] drop-shadow-sm
        border-2 border-[#ffffff] 
        shadow-sm w-auto
      "
    >
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 ml-5">
          <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center 
                         bg-gradient-to-br from-[#FFECDE] to-[#FBE1CF] drop-shadow-xl">
            <Flame className="h-6 w-6 text-[#FB9A56]" />
          </div>

          <div>
            <h3 className="text-[20px] font-semibold text-[#2F3D43]">
              Current Streak
            </h3>
            <p className="text-[14px] text-[#767676]">Keep showing up!</p>
          </div>
        </div>

        {/* Number (07 Days) */}
        <div className="text-right mr-4">
          <p className="text-[32px] font-semibold text-[#E57C30] leading-none">
            {String(displayValue).padStart(2, "0")}
          </p>
          <p className="text-[16px] text-[#7C7C7C]">Days</p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-[480px] ml-6 mt-8 h-[1px] bg-[#D0D0D0] my-4" />

      {/* BEST STREAK */}
      <div className="flex items-center gap-2 ml-5 mt-1">
        <Trophy className="h-[20px] w-[20px] text-[#9770DB]" />
        <p className="text-[14px] text-[#767676]">
          Your best:{" "}
          <span className="text-[16px] font-semibold text-[#3A3A3A]">
            {streakDetails.best} days
          </span>
        </p>
      </div>
    </div>
  );
}