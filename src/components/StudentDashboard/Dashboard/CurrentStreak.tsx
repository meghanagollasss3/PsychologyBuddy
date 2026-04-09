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
      <div className="rounded-2xl p-4 sm:p-5 bg-orange-50 animate-pulse h-[130px] sm:h-[150px]" />
    );
  }

  /* ------------------------------ Error State ------------------------------ */
  if (isError || !data) {
    return (
      <div className="rounded-2xl p-4 sm:p-5 bg-orange-50 h-[130px] sm:h-[150px] flex items-center justify-center">
        <p className="text-sm text-gray-600">Failed to load streak</p>
      </div>
    );
  }

  /* ------------------------------ MAIN UI ------------------------------ */
  return (
    <div
      className="
        rounded-[12px] sm:rounded-[14px] md:rounded-2xl p-4 sm:p-5 
        bg-gradient-to-br 
                 from-[#ffeada8f] via-[#FFFBF8] to-[#ffeada88] drop-shadow-sm
        border-2 border-[#ffffff] 
        shadow-sm w-full
      "
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-5">
          <div className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] md:w-[48px] md:h-[48px] rounded-xl flex items-center justify-center 
                         bg-gradient-to-br from-[#FFECDE] to-[#FBE1CF] drop-shadow-xl">
            <Flame className="h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6 text-[#FB9A56]" />
          </div>

          <div>
            <h3 className="text-[16px] sm:text-[18px] md:text-[20px] font-semibold text-[#2F3D43]">
              Current Streak
            </h3>
            <p className="text-[12px] sm:text-[13px] md:text-[14px] text-[#767676]">Keep showing up!</p>
          </div>
        </div>

        <div className="text-right mr-2 sm:mr-4">
          <p className="text-[24px] sm:text-[28px] md:text-[32px] font-semibold text-[#E57C30] leading-none">
            {String(displayValue).padStart(2, "0")}
          </p>
          <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#7C7C7C]">Days</p>
        </div>
      </div>

      <div className="w-full sm:w-[400px] md:w-[480px] ml-2 sm:ml-6 mt-6 sm:mt-8 h-[1px] bg-[#D0D0D0] my-3 sm:my-4" />

      <div className="flex items-center gap-2 ml-2 sm:ml-5 mt-1">
        <Trophy className="h-[16px] w-[16px] sm:h-[18px] sm:w-[18px] md:h-[20px] md:w-[20px] text-[#9770DB]" />
        <p className="text-[12px] sm:text-[13px] md:text-[14px] text-[#767676]">
          Your best:{" "}
          <span className="text-[14px] sm:text-[15px] md:text-[16px] font-semibold text-[#3A3A3A]">
            {streakDetails.best} days
          </span>
        </p>
      </div>
    </div>
  );
}