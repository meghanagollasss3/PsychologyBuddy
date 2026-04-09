import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "./useQueryParams";

export function useMoodData(selectedSchoolId: string, isSuperAdmin: boolean, user: any, timeFilter?: string, dateRange?: { start: Date; end: Date }) {
  const { buildParams } = useQueryParams(selectedSchoolId, isSuperAdmin, user, timeFilter, dateRange);

  return useQuery({
    queryKey: ["mood-data", selectedSchoolId, timeFilter, dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/mood-distribution?${buildParams()}`, {
        credentials: "include",
      });
      return (await res.json()).data;
    },
  });
}