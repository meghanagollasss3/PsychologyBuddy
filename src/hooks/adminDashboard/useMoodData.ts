import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "./useQueryParams";

export function useMoodData(selectedSchoolId: string, isSuperAdmin: boolean, user: any) {
  const { buildParams } = useQueryParams(selectedSchoolId, isSuperAdmin, user);

  return useQuery({
    queryKey: ["mood-data", selectedSchoolId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/mood-distribution?${buildParams()}`, {
        credentials: "include",
      });
      return (await res.json()).data;
    },
  });
}