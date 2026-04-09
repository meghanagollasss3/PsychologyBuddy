"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import SchoolLocationsSection from "@/src/components/admin/sections/SchoolLocationsSection";
import { usePermissions } from "@/src/hooks/usePermissions";

export default function LocationsPage() {
  const searchParams = useSearchParams();
  const permissions = usePermissions();
  const schoolId = searchParams.get("school");

  // Access Control
  if (!permissions.canUpdateOrgs) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900">
            Access Denied
          </h3>
          <p className="text-red-700 mt-1">
            You don't have permission to manage school locations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* <AdminHeader
        title="School Locations"
        subtitle="Manage branches and campuses for schools"
        showSchoolFilter={false}
        actions={[]}
      /> */}
      
      <div>
        <SchoolLocationsSection />
      </div>
    </div>
  );
}
