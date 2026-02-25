// components/dashboard/ClassHeatmap.tsx
"use client";

import React, { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClassDataItem {
  className: string;
  studentCount: number;
  alertCount: number;
}

interface ClassHeatmapProps {
  classData: ClassDataItem[];
}

function ClassHeatmap({ classData }: ClassHeatmapProps) {
  const router = useRouter();
//   if (!classData?.length)
//     return <div className="text-center py-6 text-muted-foreground">No classes found.</div>;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-base font-semibold mb-4">Class-wise Wellness Heatmap</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {classData.map((cls) => (
          <button
            key={cls.className}
            onClick={() => router.push(`/admin/users/students?class=${cls.className}`)}
            className={`rounded-lg p-4 border ${
              cls.alertCount > 0 ? "border-red-500" : "border-green-500"
            }`}
          >
            <span className="text-lg font-semibold">{cls.className}</span>
            <span className="block text-xs text-muted-foreground">{cls.studentCount} students</span>

            {cls.alertCount > 0 && (
              <div className="flex items-center gap-1 text-red-500 mt-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">{cls.alertCount} alerts</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(ClassHeatmap);