import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "./useQueryParams";

export function useClassData(selectedSchoolId: string, isSuperAdmin: boolean, user: any) {
  const { buildParams } = useQueryParams(selectedSchoolId, isSuperAdmin, user);

  return useQuery({
    queryKey: ["class-data", selectedSchoolId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/class-wellness?${buildParams()}`, {
        credentials: "include",
      });
      return (await res.json()).data;
    },
  });
}