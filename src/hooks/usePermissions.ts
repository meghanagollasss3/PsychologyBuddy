import { useAuth } from '@/src/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/src/config/permission';

export function usePermissions() {
  const { user } = useAuth();
  
  if (!user) {
    return {
      // Default to no permissions when not authenticated
      canCreateArticle: false,
      canManageOrgs: false,
      canManageUsers: false,
      canManageStudents: false,
      canManagePsychoEducation: false,
      canManageSelfHelp: false,
      canViewAnalytics: false,
      canManageAccessControl: false,
      canManageSettings: false,
      isSuperAdmin: false,
      isAdmin: false,
      isStudent: false,
      hasPermission: () => false,
      userSchoolId: null,
    };
  }

  const userRole = user.role.name;
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];
  
  // For ADMIN and SCHOOL_SUPERADMIN users, combine individual permissions with role permissions
  // Individual permissions are used for default features, role permissions for management functions
  let userPermissions = [...rolePermissions];
  if ((userRole === 'ADMIN' || userRole === 'SCHOOL_SUPERADMIN') && user.adminProfile?.adminPermissions) {
    const adminPermissions = user.adminProfile.adminPermissions.map((ap: any) => ap.permission?.name).filter(Boolean);
    // Combine individual permissions with role permissions
    // Individual permissions control default features, role permissions provide management capabilities
    userPermissions = [...new Set([...adminPermissions, ...rolePermissions])];
  } else if (userRole === 'ADMIN' || userRole === 'SCHOOL_SUPERADMIN') {
    console.log(`${userRole} user - no individual permissions found, using role permissions`);
  }
  
  const userSchoolId = user.school?.id || null;

  const hasPermission = (permission: string) => {
    return userPermissions.includes(permission);
  };

  return {
    // Psycho-Education permissions
    canCreateArticle: hasPermission('psycho.education.create'),
    canUpdateArticle: hasPermission('psycho.education.update'),
    canDeleteArticle: hasPermission('psycho.education.delete'),
    canViewArticles: hasPermission('psycho.education.view'),
    
    // Self-Help permissions
    canManageJournaling: hasPermission('selfhelp.journaling.update'),
    canManageMusic: hasPermission('selfhelp.music.update'),
    canManageMeditation: hasPermission('selfhelp.meditation.update'),
    canViewSelfHelp: hasPermission('selfhelp.view'),
    
    // User Management permissions
    canManageUsers: hasPermission('users.create'),
    canUpdateUsers: hasPermission('users.update'),
    canDeleteUsers: hasPermission('users.delete'),
    canViewUsers: hasPermission('users.view'),
    
    // Student Management (for admins and superadmins)
    canManageStudents: (() => {
      const hasCreatePerm = hasPermission('users.create');
      const roleCheck = userRole === 'ADMIN' || userRole === 'SUPERADMIN' || userRole === 'SCHOOL_SUPERADMIN';
      const result = hasCreatePerm && roleCheck;
      
      console.log('usePermissions - Student Management Debug:');
      console.log('- userRole:', userRole);
      console.log('- hasPermission(users.create):', hasCreatePerm);
      console.log('- roleCheck (ADMIN || SUPERADMIN || SCHOOL_SUPERADMIN):', roleCheck);
      console.log('- final canManageStudents:', result);
      console.log('- userPermissions:', userPermissions);
      console.log('- rolePermissions:', rolePermissions);
      
      return result;
    })(),
    canViewStudents: hasPermission('users.view') && (userRole === 'ADMIN' || userRole === 'SUPERADMIN' || userRole === 'SCHOOL_SUPERADMIN'),
    
    // Organization permissions (SuperAdmin only)
    canManageOrgs: hasPermission('organizations.create'),
    canUpdateOrgs: hasPermission('organizations.update'),
    canDeleteOrgs: hasPermission('organizations.delete'),
    canViewOrgs: hasPermission('organizations.view'),
    
    // Analytics permissions
    canViewAnalytics: hasPermission('analytics.view'),
    
    // Access Control (SuperAdmin only)
    canManageAccessControl: hasPermission('access.control.manage'),
    
    // Settings permissions
    canManageSettings: hasPermission('settings.update'),
    canViewSettings: hasPermission('settings.view'),
    
    // Role checks
    isSuperAdmin: userRole === 'SUPERADMIN',
    isAdmin: userRole === 'ADMIN',
    isStudent: userRole === 'STUDENT',
    
    // Utility functions
    hasPermission,
    userSchoolId,
    userRole,
    userPermissions, // This should now be the correct value
  };
}
