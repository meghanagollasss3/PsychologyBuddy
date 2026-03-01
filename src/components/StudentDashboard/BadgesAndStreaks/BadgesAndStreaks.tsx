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
  date: string;
}

interface InProgressBadge {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  name: string;
  description: string;
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
      <div className="min-h-screen px-6 py-10">
        {/* Back Button */}
                  <BackToDashboard />
        

        {/* Page Header */}
        <div className="flex items-center gap-4 mt-5 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
<Image
            src="/badge.svg"
            alt="Psychology Buddy Logo"
            width={63}
            height={63}
            className="w-[25px] h-[25px] sm:w-[40px] sm:h-[40px] md:w-[50px] md:h-[50px] lg:w-[63px] lg:h-[63px]"
          />          </div>
          <div>
            <h1 className="text-[32px] font-bold text-[#2F3D43]">
              Badge & Streaks
            </h1>
            <p className="text-[#686D70] text-[16px]">
              Track Progress and Celebrate consistency
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-6 mb-10">
          <div className="flex-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-xl flex flex-col items-center">
            <Flame size={32} className="text-[#F54900]" />
            <h2 className="text-3xl font-bold mt-2">{currentStreak}</h2>
            <p className="text-sm text-gray-500 mt-1">Current Streak</p>
          </div>

          <div className="flex-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-xl flex flex-col items-center">
            <AwardIcon size={32} className="text-[#2397E0]" />
            <h2 className="text-3xl font-bold mt-2">{earnedBadges.length}</h2>
            <p className="text-sm text-gray-500 mt-1">Earned Badges</p>
          </div>
        </div>

        {/* Earned Badges */}
        <div className="mb-10">
          <h2 className="text-[24px] font-semibold text-[#2F3D43] mb-4">
            Earned Badges ({earnedBadges.length})
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2",
                    badge.iconBg
                  )}
                >
                  {badge.icon}
                </div>
                <p className="font-semibold text-gray-800 text-[17px]">
                  {badge.name}
                </p>
                <p className="text-[14px] text-[#686D70] mt-1">
                  {badge.description}
                </p>
                <p className="text-[14px] text-[#1B9EE0] mt-2 font-medium">
                  {badge.date}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress Badges */}
        <div className="mb-10">
          <h2 className="text-[24px] font-semibold text-[#2F3D43] mb-4">
            In Progress ({inProgressBadges.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {inProgressBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-[69px] h-[69px] rounded-xl flex items-center justify-center",
                      badge.iconBg
                    )}
                  >
                    {badge.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-semibold text-[#2F3D43] text-[18px]">
                        {badge.name}
                      </p>
                      <p className="text-sm font-semibold text-gray-500">
                        {badge.progress}%
                      </p>
                    </div>

                    <p className="text-[14px] text-[#686D70] mt-1">
                      {badge.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-500",
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