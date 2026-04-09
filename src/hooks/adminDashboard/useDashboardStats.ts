import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "./useQueryParams";

export function useDashboardStats(selectedSchoolId: string, isSuperAdmin: boolean, user: any, timeFilter?: string, dateRange?: { start: Date; end: Date }) {
  const { buildParams } = useQueryParams(selectedSchoolId, isSuperAdmin, user, timeFilter, dateRange);

  return useQuery({
    queryKey: ["dashboard-stats", selectedSchoolId, timeFilter, dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/metrics?${buildParams()}`, { credentials: "include" });
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });
}