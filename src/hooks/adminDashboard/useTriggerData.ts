import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "./useQueryParams";

export function useTriggerData(selectedSchoolId: string, isSuperAdmin: boolean, user: any, timeFilter?: string, dateRange?: { start: Date; end: Date }) {
  const { buildParams } = useQueryParams(selectedSchoolId, isSuperAdmin, user, timeFilter, dateRange);

  return useQuery({
    queryKey: ["trigger-data", selectedSchoolId, timeFilter, dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/emotional-triggers?${buildParams()}`, {
        credentials: "include",
      });
      return (await res.json()).data;
    },
  });
}