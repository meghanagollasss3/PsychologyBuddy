import { useUserPermissions } from "@/src/hooks/useUserPermissions";
import { useRole } from "@/src/hooks/useRole";
import { MODULES, ACTIONS } from "@/src/config/permission";

interface ProtectedProps {
  children: React.ReactNode;
  module?: keyof typeof MODULES;
  action?: keyof typeof ACTIONS;
  role?: string[];
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export function Protected({
  children,
  module,
  action = "VIEW",
  role,
  fallback = <div className="p-4 text-center text-red-600">Access Denied</div>,
  requireAuth = true,
}: ProtectedProps) {
  const { loading: permsLoading, can } = useUserPermissions();
  const { loading: roleLoading, isSuperAdmin, isAdmin, isSchoolSuperAdmin, isStudent } = useRole();

  // Show loading state
  if (permsLoading || roleLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  // Check authentication requirement
  if (requireAuth && (!isSuperAdmin && !isAdmin && !isSchoolSuperAdmin && !isStudent)) {
    return fallback;
  }

  // Check role-based access
  if (role && role.length > 0) {
    const userRole = isSuperAdmin ? 'SUPERADMIN' : isAdmin ? 'ADMIN' : isSchoolSuperAdmin ? 'SCHOOL_SUPERADMIN' : isStudent ? 'STUDENT' : null;
    if (!userRole || !role.includes(userRole)) {
      return fallback;
    }
  }

  // Check permission-based access
  if (module) {
    const requiredPermission = `${MODULES[module]}.${ACTIONS[action]}`;
    if (!can(requiredPermission)) {
      return fallback;
    }
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function SuperAdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Protected role={["SUPERADMIN"]} fallback={fallback}>
      {children}
    </Protected>
  );
}

export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Protected role={["SUPERADMIN", "ADMIN", "SCHOOL_SUPERADMIN"]} fallback={fallback}>
      {children}
    </Protected>
  );
}

export function StudentOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Protected role={["STUDENT"]} fallback={fallback}>
      {children}
    </Protected>
  );
}

export function CanView({
  module,
  children,
  fallback,
}: {
  module: keyof typeof MODULES;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Protected module={module} action="VIEW" fallback={fallback}>
      {children}
    </Protected>
  );
}

export function CanCreate({
  module,
  children,
  fallback,
}: {
  module: keyof typeof MODULES;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Protected module={module} action="CREATE" fallback={fallback}>
      {children}
    </Protected>
  );
}

export function CanUpdate({
  module,
  children,
  fallback,
}: {
  module: keyof typeof MODULES;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Protected module={module} action="UPDATE" fallback={fallback}>
      {children}
    </Protected>
  );
}

export function CanDelete({
  module,
  children,
  fallback,
}: {
  module: keyof typeof MODULES;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Protected module={module} action="DELETE" fallback={fallback}>
      {children}
    </Protected>
  );
}
