'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Bell, ChevronLeft, Flame, Shield, Heart, BookOpen, Trophy, Wind, PenLine, Star } from "lucide-react";
import StudentLayout from '@/src/components/StudentDashboard/Layout/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import BadgeUnlockedModal from './BadgeUnlockedModal';

// ── types ──────────────────────────────────────────────────────────
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

// ── sub-components ─────────────────────────────────────────────────────────
function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex-1 bg-white rounded-2xl px-8 py-5 flex flex-col items-center gap-1 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">
        {icon}
        <span>{value}</span>
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function EarnedBadgeCard({ badge }: { badge: EarnedBadge }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col items-center text-center gap-2 shadow-sm border border-gray-100 min-w-[148px]">
      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center", badge.iconBg)}>
        {badge.icon}
      </div>
      <p className="text-sm font-semibold text-gray-800 leading-tight">{badge.name}</p>
      <p className="text-xs text-gray-400 leading-snug">{badge.description}</p>
      <p className="text-xs font-medium text-sky-500 mt-1">{badge.date}</p>
    </div>
  );
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
      <div
        className={cn("h-1.5 rounded-full transition-all duration-500", color)}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function InProgressCard({ badge }: { badge: InProgressBadge }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", badge.iconBg)}>
          {badge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">{badge.name}</p>
            <p className="text-xs font-semibold text-gray-500 ml-2">{badge.progress}%</p>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{badge.description}</p>
          <ProgressBar progress={badge.progress} color={badge.color} />
        </div>
      </div>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────
export default function BadgesStreaksPage() {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [inProgressBadges, setInProgressBadges] = useState<InProgressBadge[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [badgeModal, setBadgeModal] = useState({
    isOpen: false,
    badge: {
      name: '',
      description: '',
      icon: 'trophy',
      level: 1,
      studentName: 'Student',
    },
  });

  useEffect(() => {
    fetchBadges();
  }, []);

  useEffect(() => {
    // Evaluate badges for new achievements
    evaluateBadges();
  }, []);

  const evaluateBadges = async () => {
    try {
      const response = await fetch('/api/student/badges/evaluate', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success && data.data.newBadges.length > 0) {
        // Show the first new badge in modal
        const newBadge = data.data.newBadges[0];
        setBadgeModal({
          isOpen: true,
          badge: {
            ...newBadge,
            studentName: 'Student', // You can get this from user session
          },
        });
        
        // Refresh badges data
        fetchBadges();
      }
    } catch (error) {
      console.error('Error evaluating badges:', error);
    }
  };

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/badges');
      const data = await response.json();
      
      if (data.success) {
        setEarnedBadges(data.data.earnedBadges || []);
        setInProgressBadges(data.data.inProgressBadges || []);
        setCurrentStreak(data.data.currentStreak || 0);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Main content */}
        <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          {/* Back */}
          <Link href="/students" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>

          {/* Page header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center">
              <Trophy size={22} className="text-sky-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Badge &amp; Streaks</h1>
              <p className="text-sm text-gray-400">Track Progress and Celebrate consistency</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-4">
            <StatCard
              icon={<Flame size={22} className="text-orange-500" />}
              value={currentStreak}
              label="Current Streak"
            />
            <StatCard
              icon={<Shield size={22} className="text-sky-500" />}
              value={earnedBadges.length}
              label="Earned Badges"
            />
          </div>

          {/* Earned badges */}
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Earned Badges ({earnedBadges.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {earnedBadges.map((badge) => (
                <EarnedBadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </section>

          {/* In progress */}
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              In Progress ({inProgressBadges.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inProgressBadges.map((badge) => (
                <InProgressCard key={badge.id} badge={badge} />
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Badge Unlocked Modal */}
      <BadgeUnlockedModal
        isOpen={badgeModal.isOpen}
        onClose={() => setBadgeModal(prev => ({ ...prev, isOpen: false }))}
        badge={badgeModal.badge}
      />
    </StudentLayout>
  );
}
