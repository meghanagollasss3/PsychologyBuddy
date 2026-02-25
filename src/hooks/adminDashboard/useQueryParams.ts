// hooks/useQueryParams.ts
export function useQueryParams(selectedSchoolId: string, isSuperAdmin: boolean, user: any) {
  const buildParams = () => {
    const params = new URLSearchParams();
    if (isSuperAdmin && selectedSchoolId !== 'all') {
      params.append("schoolId", selectedSchoolId);
    } else if (!isSuperAdmin && user?.school?.id) {
      params.append("schoolId", user.school.id);
    }
    return params.toString();
  };

  return { buildParams };
}