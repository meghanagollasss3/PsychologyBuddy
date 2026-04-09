"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  AwardIcon,
  ChevronLeft,
  Flame,
  Shield,
  Trophy,
} from "lucide-react";
import StudentLayout from "@/src/components/StudentDashboard/Layout/StudentLayout";
import BadgeUnlockedModal from "./BadgeUnlockedModal";
import BackToDashboard from "../Layout/BackToDashboard";
import Image from "next/image";


interface EarnedBadge {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  name: string;
  description: string;
  requirement: string;
  date: string;
}

interface InProgressBadge {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  name: string;
  description: string;
  requirement:string;
  progress: number;
  color: string;
}

export default function BadgesStreaksPage() {
  const router = useRouter();
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [inProgressBadges, setInProgressBadges] = useState<InProgressBadge[]>(
    []
  );
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student/badges");
      const data = await response.json();

      if (data.success) {
        setEarnedBadges(data.data.earnedBadges || []);
        setInProgressBadges(data.data.inProgressBadges || []);
        setCurrentStreak(data.data.currentStreak || 0);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-gray-700"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
      <div className="min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10">
        {/* Back Button */}
                  <BackToDashboard />
        

        {/* Page Header */}
        <div className="flex items-start gap-3 sm:gap-4 mt-3 sm:mt-5 mb-6 sm:mb-8 md:mb-10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
<Image
            src="/badge.svg"
            alt="Psychology Buddy Logo"
            width={63}
            height={63}
            className="w-[20px] h-[20px] sm:w-[25px] sm:h-[25px] md:w-[40px] md:h-[40px] lg:w-[50px] lg:h-[50px]"
          />          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-bold text-[#2F3D43]">
              Badge & Streaks
            </h1>
            <p className="text-[#686D70] text-sm sm:text-base md:text-[16px] mt-1">
              Track Progress and Celebrate consistency
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-10">
          <div className="flex-1 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-xl flex flex-col items-center">
            <Flame size={28} className="text-[#F54900]" />
            <h2 className="text-2xl sm:text-3xl font-bold mt-2">{currentStreak}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Current Streak</p>
          </div>

          <div className="flex-1 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-xl flex flex-col items-center">
            <AwardIcon size={28} className="text-[#2397E0]" />
            <h2 className="text-2xl sm:text-3xl font-bold mt-2">{earnedBadges.length}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Earned Badges</p>
          </div>
        </div>

        {/* Earned Badges */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-lg sm:text-xl md:text-[24px] font-semibold text-[#2F3D43] mb-3 sm:mb-4">
            Earned Badges ({earnedBadges.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-gray-100 text-center"
              >
                <div
  className={cn(
    "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3",
    badge.iconBg
  )}
>
  <div className="scale-150 sm:scale-200">{badge.icon}</div>
</div>
                <p className="font-semibold text-gray-800 text-sm sm:text-base md:text-[17px]">
                  {badge.name}
                </p>
                <p className="text-xs sm:text-sm md:text-[14px] text-[#686D70] mt-1">
                  {badge.requirement}
                </p>
                <p className="text-xs sm:text-sm md:text-[14px] text-[#1B9EE0] mt-1.5 sm:mt-2 font-medium">
                  {badge.date}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress Badges */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-lg sm:text-xl md:text-[24px] font-semibold text-[#2F3D43] mb-3 sm:mb-4">
            In Progress ({inProgressBadges.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {inProgressBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white p-4 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div
  className={cn(
    "w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0",
    badge.iconBg
  )}
>
  <div className="scale-200 sm:scale-250">{badge.icon}</div>
</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start sm:items-center">
                      <p className="font-semibold text-[#2F3D43] text-sm sm:text-base md:text-[18px] truncate">
                        {badge.name}
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-500 flex-shrink-0">
                        {badge.progress}%
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm md:text-[14px] text-[#686D70] mt-1">
                      {badge.requirement}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 sm:h-2 bg-gray-100 rounded-full mt-2 sm:mt-3 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          badge.color
                        )}
                        style={{ width: `${badge.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </StudentLayout>
  );
}