// components/dashboard/SchoolInfo.tsx
"use client";
import React from "react";
import { School, Users, Award, LucideIcon } from "lucide-react";

interface SchoolInfoProps {
  school: {
    id: string;
    name: string;
    address?: string;
    email?: string;
  };
  stats: {
    totalStudents: number;
  };
}

interface InfoCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
}

export default function SchoolInfo({ school, stats }: SchoolInfoProps) {
  if (!school) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">School Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard icon={School} label="School Name" value={school.name} color="blue" />
        <InfoCard icon={Users} label="Total Students" value={stats.totalStudents} color="green" />
        <InfoCard icon={Award} label="Status" value="Active" color="purple" />
      </div>

      <div className="mt-4 border-t pt-4 text-sm">
        <p><strong>School ID:</strong> {school.id}</p>
        {school.address && <p><strong>Address:</strong> {school.address}</p>}
        {school.email && <p><strong>Email:</strong> {school.email}</p>}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color }: InfoCardProps) {
  return (
    <div className="text-center">
      <div className={`w-12 h-12 mx-auto rounded-lg bg-${color}-100 flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <h3 className="font-medium">{value}</h3>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}