"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bell, Settings, Building2, X, MapPin } from 'lucide-react';
import { useAdminNotifications } from '@/src/hooks/use-admin-notifications';
import { useTimeFilter } from '@/src/contexts/TimeFilterContext';
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
  showLocationFilter?: boolean;
  locationFilterValue?: string;
  onLocationFilterChange?: (value: string) => void;
  locations?: Array<{ id: string; name: string }>;
  actions?: React.ReactNode;
}

export function AdminHeader({ 
  title, 
  subtitle, 
  showTimeFilter = true, 
  showSchoolFilter = true, 
  schoolFilterValue,
  onSchoolFilterChange,
  schools,
  showLocationFilter = false,
  locationFilterValue,
  onLocationFilterChange,
  locations,
  actions 
}: AdminHeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const { timeFilter, setTimeFilter } = useTimeFilter();
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    clearAll 
  } = useAdminNotifications();

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
              <SelectContent className='bg-white max-h-50 overflow-y-auto'>
                <SelectItem value="all">All Schools</SelectItem>
                {schools && schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showLocationFilter && (
            <Select value={locationFilterValue} onValueChange={onLocationFilterChange}>
              <SelectTrigger className="w-44 h-9 bg-white focus:ring-2 focus:ring-[#3c83f6] ">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#65758b] text-muted-foreground " />
                  <SelectValue placeholder="Select Location" />
                </div>
              </SelectTrigger>
              <SelectContent className='bg-white'>
                <SelectItem value="all">All Locations</SelectItem>
                {locations && locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showTimeFilter && (
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32 h-9 bg-white focus:ring-2 focus:ring-[#3c83f6] ">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
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
        </div>
      </div>
    </header>
  );
}