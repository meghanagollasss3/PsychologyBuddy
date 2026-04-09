"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermissions } from '@/src/hooks/usePermissions';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  LayoutDashboard,
  Activity,
  BookOpen,
  Wrench,
  BarChart3,
  Users,
  Shield,
  AlertTriangle,
  Trophy,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Building2,
  User,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Simple cn utility function
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: number;
  permission?: string;
  role?: string[];
  children?: { label: string; href: string; icon: React.ElementType; permission?: string; role?: string[] }[];
}

interface AdminProfile {
  firstName: string;
  lastName: string;
  adminProfile?: {
    profileImageUrl?: string;
  };
}

export function AdminSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileMenuHeight, setProfileMenuHeight] = useState(0);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const permissions = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Calculate the height of the profile menu when it's open
    if (profileMenuRef.current && isProfileOpen) {
      setProfileMenuHeight(profileMenuRef.current.scrollHeight);
    }
  }, [isProfileOpen]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile fetch failed:', response.status, errorText);
        return;
      }
      
      const text = await response.text();
      if (!text) {
        console.error('Profile fetch returned empty response');
        return;
      }
      
      const result = JSON.parse(text);
      
      if (result.success) {
        setProfile(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      permission: 'dashboard.view',
    },
    {
      label: "Activity",
      icon: Activity,
      href: "/admin/activities",
      permission: 'activity.view',
    },
    {
      label: "Organizations",
      icon: Building2,
      href: "/admin/organizations",
      permission: 'organizations.view',
      role: ['SUPERADMIN'],
    },
    {
      label: "School Locations",
      icon: Building2,
      href: "/admin/locations",
      permission: 'organizations.update',
      role: ['SCHOOL_SUPERADMIN'],
    },
    {
      label: "Content Management",
      icon: BookOpen,
      children: [
        { label: "Psychoeducation Library", href: "/admin/library", icon: BookOpen, permission: 'psycho.education.view' },
        { label: "Self-help Tools", href: "/admin/selfhelptools", icon: Wrench, permission: 'selfhelp.view' },
      ],
    },
    {
      label: "Analytics & Reports",
      icon: BarChart3,
      href: "/admin/analytics",
      permission: 'analytics.view',
    },
    {
      label: "User Management",
      icon: Users,
      children: [
        { label: "Students", href: "/admin/users/students", icon: Users, permission: 'users.view', role: ['ADMIN','SUPERADMIN','SCHOOL_SUPERADMIN'] },
        { label: "Admins", href: "/admin/users/admins", icon: Shield, permission: 'users.view', role: ['SUPERADMIN','SCHOOL_SUPERADMIN'] },
      ],
    },
    {
      label: "Escalation & Alerts",
      icon: AlertTriangle,
      href: "/admin/alerts",
      permission: 'escalations.view',
      // badge: 25,
    },
    {
      label: "Badges & Streaks",
      icon: Trophy,
      href: "/admin/badges-streaks",
      permission: 'badges.view',
    },
    // {
    //   label: "Profile",
    //   icon: User,
    //   href: "/admin/profile",
    //   permission: 'settings.view',
    // },
  ];

  // Filter navigation items based on permissions
  const filterNavItems = (items: NavItem[]): NavItem[] => {
    console.log('Filtering nav items with permissions:', permissions.userPermissions);
    console.log('User role:', permissions.userRole);
    
    return items.filter(item => {
      console.log('Checking item:', item.label, 'permission:', item.permission);
      
      // Check role restrictions
      if (item.role && permissions.userRole && !item.role.includes(permissions.userRole)) {
        console.log('Filtered out by role:', item.label);
        return false;
      }
      
      // Check permission requirements
      if (item.permission && !permissions.hasPermission(item.permission)) {
        console.log('Filtered out by permission:', item.label, 'needed:', item.permission, 'has:', permissions.hasPermission(item.permission));
        return false;
      }
      
      // Filter children if they exist
      if (item.children) {
        item.children = item.children.filter(child => {
          console.log('Checking child:', child.label, 'permission:', child.permission);
          
          if (child.role && permissions.userRole && !child.role.includes(permissions.userRole)) {
            console.log('Child filtered out by role:', child.label);
            return false;
          }
          if (child.permission && !permissions.hasPermission(child.permission)) {
            console.log('Child filtered out by permission:', child.label, 'needed:', child.permission, 'has:', permissions.hasPermission(child.permission));
            return false;
          }
          return true;
        });
        
        // Only show parent if it has children after filtering
        const hasChildren = item.children.length > 0;
        console.log('Parent', item.label, 'has children after filtering:', hasChildren);
        return hasChildren;
      }
      
      return true;
    });
  };

  const visibleNavItems = filterNavItems(navItems);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const SidebarContent = () => (

    <>
    <div className="flex items-center gap-3 px-4 py-6 border-b border-sidebar-border">
        <img 
          src="/logo1.png"
          alt="Psychology Buddy" 
          className="h-12 w-auto"
        />
      </div>
      {/* <div className="flex items-center justify-between p-4 border-b"> */}
        {/* <div>
          <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-500">
            {permissions.isSuperAdmin ? 'SuperAdmin' : 'Admin'}
            {user?.school && ` - ${user.school.name}`}
          </p>
        </div> */}
      
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      {/* </div> */}

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isChildActive(item.children)
                        ? "bg-[#f3f5f7]"
                        : "text-[#65758b] hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {expandedItems.includes(item.label) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedItems.includes(item.label) && (
                    <ul className="mt-1 ml-4 space-y-1 border-l border-sidebar-border pl-3">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              isActive(child.href)
                                ? "bg-[#3c83f6] text-white"
                                : "text-[#65758b] hover:bg-gray-100 hover:text-gray-900"
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href!}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center text-[#65758b] justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(item.href!)
                      ? "bg-[#3c83f6] text-white shadow-sm"
                      : "text-[#65758b] hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section - Profile */}
      <div className="border-t border-sidebar-border mt-auto">
        {/* Expandable menu - expands upward */}
        <div
          ref={profileMenuRef}
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isProfileOpen ? `${profileMenuHeight}px` : "0px",
            opacity: isProfileOpen ? 1 : 0,
          }}
        >
          <div className="px-3 pt-2 space-y-1">
            {permissions.hasPermission('settings.view') && (
              <Link
                href="/admin/settings"
                onClick={() => { setSidebarOpen(false); setIsProfileOpen(false); }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/admin/settings"
                    ? "bg-[#3c83f6] text-white"
                    : "text-[#65758b] hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            )}
            <button
              onClick={() => { 
                handleLogout(); 
                setIsProfileOpen(false); 
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#65758b] hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Profile toggle trigger */}
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-3 transition-colors",
            "hover:bg-gray-50 active:bg-gray-100",
            isProfileOpen && "bg-gray-50"
          )}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              router.push('/admin/profile/admin');
              setSidebarOpen(false);
            }}
            className="cursor-pointer"
          >
            <Avatar className="h-9 w-9">
              {profile?.adminProfile?.profileImageUrl ? (
                <AvatarImage src={profile.adminProfile.profileImageUrl} />
              ) : null}
              <AvatarFallback className="text-xs">
                {profile ? getInitials(profile.firstName, profile.lastName) : 'AD'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 text-left min-w-0">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/admin/profile/admin');
                setSidebarOpen(false);
              }}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.firstName && profile?.lastName 
                  ? `${profile.firstName} ${profile.lastName}` 
                  : user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {permissions.isSuperAdmin ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
          <ChevronUp
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform duration-300 ease-in-out shrink-0",
              !isProfileOpen && "rotate-180"
            )}
          />
        </button>
      </div>
    </>
  );

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isChildActive = (children?: { href: string }[]) =>
    children?.some((child) => pathname === child.href);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
//65758b