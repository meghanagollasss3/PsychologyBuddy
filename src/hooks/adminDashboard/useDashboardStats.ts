import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "./useQueryParams";

export function useDashboardStats(selectedSchoolId: string, isSuperAdmin: boolean, user: any) {
  const { buildParams } = useQueryParams(selectedSchoolId, isSuperAdmin, user);

  return useQuery({
    queryKey: ["dashboard-stats", selectedSchoolId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/metrics?${buildParams()}`, { credentials: "include" });
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });
}