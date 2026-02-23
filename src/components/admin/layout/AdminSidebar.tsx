"use client";

import React, { useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

export function AdminSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user, logout } = useAuth();
  const permissions = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

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
      href: "/activity",
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
      href: "/analytics",
      permission: 'analytics.view',
    },
    {
      label: "User Management",
      icon: Users,
      children: [
        { label: "Students", href: "/admin/users/students", icon: Users, permission: 'users.view', role: ['ADMIN','SUPERADMIN'] },
        { label: "Admins", href: "/admin/users/admins", icon: Shield, permission: 'users.view', role: ['SUPERADMIN'] },
      ],
    },
    {
      label: "Escalation & Alerts",
      icon: AlertTriangle,
      href: "/alerts",
      permission: 'escalations.view',
      badge: 25,
    },
    {
      label: "Badges & Streaks",
      icon: Trophy,
      href: "/admin/badges-streaks",
      permission: 'badges.view',
    },
    {
      label: "Profile",
      icon: User,
      href: "/admin/profile",
      permission: 'settings.view',
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/admin/settings",
      permission: 'settings.view',
    },
    {
      label: "Logout",
      icon: LogOut,
      href: "/login",
    },
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
                  onClick={() => {
                    if (item.label === "Logout") {
                      handleLogout();
                    } else {
                      setSidebarOpen(false);
                    }
                  }}
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

      {/* User Info & Logout */}
      {/* <div className="p-4 border-t">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </div> */}
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