'use client'
import React from 'react';
import Link from 'next/link';
// import Header from '@/components/StudentDashboard/Layout/Header';
// import StudentLayout from '@/components/StudentDashboard/Layout/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Smile, BookOpen, Award, Trophy, ArrowLeft } from 'lucide-react';
import StudentLayout from '@/src/components/StudentDashboard/Layout/StudentLayout';
import router from 'next/router';

export default function DashboardStats() {
  const stats = [
    {
      icon: Flame,
      value: '07',
      label: 'Days',
      subtitle: 'Current Streaks',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500',
      iconBgColor: 'bg-orange-100'
    },
    {
      icon: Smile,
      value: '42',
      label: 'Total',
      subtitle: 'Check-ins',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500',
      iconBgColor: 'bg-purple-100'
    },
    {
      icon: BookOpen,
      value: '15',
      label: 'Accessed',
      subtitle: 'Resources Used',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500',
      iconBgColor: 'bg-green-100'
    },
    {
      icon: Award,
      value: '08',
      label: 'Unlocked',
      subtitle: 'Badges Earned',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
      iconBgColor: 'bg-blue-100'
    }
  ];

  return (
    <StudentLayout>
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      {/* <button
            onClick={() => router.push('/students/content/library')}
            // className={`flex items-center gap-2 text-[#73829A] hover:text-[#1a9bcc] transition-colors p-2 ${className}`}
          >
            <ArrowLeft className="w-4 h-5" />
            <span className="text-[13px] sm:text-[16px]">Back to Dashboard</span>
          </button> */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
          Hi Ananya 👋
        </h1>
        <p className="text-gray-500 mt-1">How are you feeling today?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={`${stat.bgColor} border-none shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <CardContent className="p-6 space-y-4">
              {/* Icon */}
              <div className={`${stat.iconBgColor} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>

              {/* Value and Label */}
              <div>
                <div className="text-4xl font-bold text-gray-800">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mt-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {stat.subtitle}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Badges Card */}
        <Link href="/students/selfhelptools/journaling                           ">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-none shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
            <CardContent className="p-6 space-y-4">
              {/* Icon */}
              <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-500" />
              </div>

              {/* Value and Label */}
              <div>
                <div className="text-lg font-bold text-gray-800">
                  View All
                </div>
                <div className="text-sm font-medium text-gray-700 mt-1">
                  Badges & Streaks
                </div>
                <div className="text-sm text-purple-600 mt-0.5">
                  Track your progress →
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
    </StudentLayout>
  );
}