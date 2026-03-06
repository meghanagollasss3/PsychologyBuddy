"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bell, Settings, Building2, X } from 'lucide-react';
import { useAdminNotifications } from '@/src/hooks/use-admin-notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  showTimeFilter?: boolean;
  showSchoolFilter?: boolean;
  schoolFilterValue?: string;
  onSchoolFilterChange?: (value: string) => void;
  schools?: Array<{ id: string; name: string }>;
  actions?: React.ReactNode;
}

interface AdminProfile {
  firstName: string;
  lastName: string;
  adminProfile?: {
    profileImageUrl?: string;
  };
}

export function AdminHeader({ 
  title, 
  subtitle, 
  showTimeFilter = true, 
  showSchoolFilter = true, 
  schoolFilterValue,
  onSchoolFilterChange,
  schools,
  actions 
}: AdminHeaderProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    clearAll 
  } = useAdminNotifications();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile');
      const result = await response.json();
      
      if (result.success) {
        setProfile(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin profile for header:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    markAsRead(notification.id);
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-4 border-b border-border bg-white backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-[#65758b] text-muted-foreground">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-4">
          {showSchoolFilter && (
            <Select value={schoolFilterValue} onValueChange={onSchoolFilterChange}>
              <SelectTrigger className="w-44 h-9 bg-white focus:ring-2 focus:ring-[#3c83f6] ">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#65758b] text-muted-foreground " />
                  <SelectValue placeholder="Select School" />
                </div>
              </SelectTrigger>
              <SelectContent className='bg-white'>
                <SelectItem value="all">All Schools</SelectItem>
                {schools && schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showTimeFilter && (
            <Select defaultValue="week">
              <SelectTrigger className="w-32 h-9 bg-white focus:ring-2 focus:ring-[#3c83f6] ">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          )}

          {actions}

          {/* Notifications Dropdown */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold">Notifications</h3>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearAll()}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification: any, index: number) => (
                    <DropdownMenuItem
                      key={notification.id || `notification-${index}`}
                      className="flex flex-col items-start p-3 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                          notification.severity === 'critical' ? 'bg-red-500' :
                          notification.severity === 'high' ? 'bg-orange-500' :
                          notification.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-medium truncate ${
                              notification.severity === 'critical' ? 'text-red-700' :
                              notification.severity === 'high' ? 'text-orange-700' :
                              notification.severity === 'medium' ? 'text-yellow-700' :
                              'text-blue-700'
                            }`}>
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          {notification.escalationAlert && (
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.escalationAlert.studentName} • {notification.escalationAlert.studentClass}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              
              {notifications.length > 5 && (
                <div className="p-2 border-t text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/admin/notifications')}
                    className="w-full"
                  >
                    View All ({notifications.length - 5} more)
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => router.push('/admin/profile/admin')}
            className="rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
              {profile?.adminProfile?.profileImageUrl ? (
                <AvatarImage src={profile.adminProfile.profileImageUrl} />
              ) : null}
              <AvatarFallback className="text-sm">
                {profile ? getInitials(profile.firstName, profile.lastName) : 'AD'}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </header>
  );
}