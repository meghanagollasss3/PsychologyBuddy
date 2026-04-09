import { useEffect, useState } from "react";

export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.user?.role?.name) {
          setRole(data.data.user.role.name);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch user role:', error);
        setLoading(false);
      });
  }, []);

  return {
    role,
    loading,
    isSuperAdmin: role === 'SUPERADMIN',
    isAdmin: role === 'ADMIN',
    isSchoolSuperAdmin: role === 'SCHOOL_SUPERADMIN',
    isStudent: role === 'STUDENT',
    canManageUsers: ['SUPERADMIN', 'SCHOOL_SUPERADMIN'].includes(role || ''),
    canManageContent: ['SUPERADMIN', 'ADMIN', 'SCHOOL_SUPERADMIN'].includes(role || ''),
    canViewOnly: ['STUDENT'].includes(role || ''),
  };
}
