import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "./useQueryParams";

export function useTriggerData(selectedSchoolId: string, isSuperAdmin: boolean, user: any) {
  const { buildParams } = useQueryParams(selectedSchoolId, isSuperAdmin, user);

  return useQuery({
    queryKey: ["trigger-data", selectedSchoolId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/emotional-triggers?${buildParams()}`, {
        credentials: "include",
      });
      return (await res.json()).data;
    },
  });
}