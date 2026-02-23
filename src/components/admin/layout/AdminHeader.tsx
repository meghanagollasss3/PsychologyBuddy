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
import { Bell, Settings, Building2 } from 'lucide-react';

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

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          <button
            onClick={() => router.push('/admin/profile')}
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
