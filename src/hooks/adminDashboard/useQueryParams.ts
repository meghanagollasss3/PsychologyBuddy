// hooks/useQueryParams.ts
export function useQueryParams(selectedSchoolId: string, isSuperAdmin: boolean, user: any, timeFilter?: string, dateRange?: { start: Date; end: Date }) {
  const buildParams = () => {
    const params = new URLSearchParams();
    
    // School filtering
    if (isSuperAdmin && selectedSchoolId !== 'all') {
      params.append("schoolId", selectedSchoolId);
    } else if (!isSuperAdmin && user?.school?.id) {
      // Handle both ADMIN and SCHOOL_SUPERADMIN
      params.append("schoolId", user.school.id);
    }
    
    // Time filtering
    if (timeFilter) {
      params.append("timeRange", timeFilter);
    }
    
    if (dateRange) {
      params.append("startDate", dateRange.start.toISOString());
      params.append("endDate", dateRange.end.toISOString());
    }
    
    return params.toString();
  };

  return { buildParams };
}