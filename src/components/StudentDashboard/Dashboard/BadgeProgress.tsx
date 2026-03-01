"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

interface BadgeProgressData {
  progress: number;
  nextBadge: {
    name: string;
    description: string;
    icon: string;
  } | null;
  totalBadges: number;
  earnedBadges: number;
}

/* -----------------------------
   API Fetcher
----------------------------- */
async function fetchBadgeProgress(): Promise<BadgeProgressData> {
  const res = await fetch("/api/student/badge-progress");
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch badge progress");
  return json.data;
}

/* -----------------------------
   MAIN COMPONENT
----------------------------- */
export default function BadgeProgress() {
  /* QUERY */
  const { data, isLoading, isError } = useQuery({
    queryKey: ["badgeProgress"],
    queryFn: fetchBadgeProgress,
    refetchInterval: 30000,
    staleTime: 60000,
  });

  /* ANIMATION STATE (Ref-based for perfect stability) */
  const [displayValue, setDisplayValue] = useState(0);
  const lastValueRef = useRef(0); // Saves previous final progress value
  const animationFrame = useRef<number | undefined>(undefined); // Tracks RAF
  const isAnimating = useRef(false); // Prevent overlapping animations

  /* -----------------------------
     Animate Progress (Perfect!)
  ----------------------------- */
  useEffect(() => {
    if (!data) return;
    const newProgress = data.progress;

    // If same value → do NOT reanimate
    if (newProgress === lastValueRef.current) return;

    // Cancel existing animation
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    const start = lastValueRef.current;
    const end = newProgress;
    const duration = 700;
    let startTime: number | null = null;
    isAnimating.current = true;

    function animate(timestamp: number) {
      if (document.hidden) return; // never animate in background tab
      if (!startTime) startTime = timestamp;

      const t = Math.min((timestamp - startTime) / duration, 1);
      const eased = start + (end - start) * t;

      setDisplayValue(Math.floor(eased));

      if (t < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        isAnimating.current = false;
        lastValueRef.current = end; // Commit final value
      }
    }

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [data]);

  /* -----------------------------
     Compute Badge Messages
  ----------------------------- */
  const computeTexts = () => {
    if (!data) return { title: "", subtitle: "" };

    const remaining = Math.max(0, 100 - data.progress);
    const hasBadges = data.totalBadges > 0;

    const title =
      data.progress === 100
        ? "Mindfulness Champion 🎉"
        : data.nextBadge?.name ||
          (hasBadges ? "Badge Progress" : "No Badges Available");

    let subtitlePrimary = "";
    let subtitleSecondary = "";

    if (data.progress === 100) {
      subtitlePrimary = "You've earned all available badges!";
    } else if (!hasBadges) {
      subtitlePrimary = "Admins haven't created any badges yet.";
    } else {
      subtitlePrimary = `${remaining} actions away`;
      subtitleSecondary = "from earning your next badge! Keep going 🌟";
    }

    return { title, subtitlePrimary, subtitleSecondary };
  };

  const { title, subtitlePrimary, subtitleSecondary } = computeTexts();

  /* -----------------------------
     Skeleton UI
  ----------------------------- */
  if (isLoading) {
    return (
      <div className="rounded-2xl p-5 border bg-white shadow-sm w-full">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="w-full h-3 bg-gray-200 rounded-full"></div>
          <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  /* -----------------------------
     Error UI
  ----------------------------- */
  if (isError || !data) {
    return (
      <div className="rounded-2xl p-5 border bg-white shadow-sm w-full">
        <p className="text-sm text-red-500 font-medium">
          Failed to load badge progress.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Please check your connection.
        </p>
      </div>
    );
  }

  /* -----------------------------
     MAIN UI
  ----------------------------- */
  return (
    <div
      className="rounded-[16px] p-5 border-2 border-white bg-gradient-to-br 
                 from-[#b8dbf95c] via-[#e7f7ff85] to-[#b8dbf97a] drop-shadow-sm shadow-[#3F7AC90D] w-auto h-auto "
    >
      <div className="flex items-center ml-4 gap-4">
        {/* ICON BLOCK */}

        {/* CONTENT */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-[48px] h-[48px] bg-gradient-to-br 
                 from-[#4193FF] to-[#4A8FE9] rounded-[9px] flex items-center justify-center shadow-md"
            >
              <Star className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-[20px] -mt-5 font-semibold text-[#2F3D43]">
              Badge Progress
            </h3>
            <div className="text-xs -mt-3.5 text-gray-500">
              ({data.earnedBadges}/{data.totalBadges})
            </div>
          </div>
          <p className="text-[16px] text-[#767676] -mt-6 ml-14 mb-2">{title}</p>

          {/* PROGRESS BAR */}
          <div className="w-[485px] bg-[#C6DDFC] rounded-full h-[14px] overflow-hidden mt-8 mb-2">
            <div
              className={`h-full ${
                displayValue === 100 ? "bg-green-500" : "bg-[#4293FE]"
              }`}
              style={{ width: `${displayValue}%` }}
            />
          </div>

          <div className="text-[16px] mt-4 ml-1">
            <span className="text-[#2F80ED] font-medium">
              {subtitlePrimary}
            </span>
            {subtitleSecondary && (
              <span className="text-[#7C7C7C]"> {subtitleSecondary}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
