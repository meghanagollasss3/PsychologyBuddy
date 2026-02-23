"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface School {
  id: string;
  name: string;
  location?: string;
  studentCount?: number;
  alertCount?: number;
  checkInsToday?: number;
  address?: string;
  phone?: string;
  email?: string;
  _count?: {
    users: number;
    classes: number;
  };
}

interface SchoolFilterContextType {
  selectedSchoolId: string;
  setSelectedSchoolId: (id: string) => void;
  schools: School[];
  setSchools: (schools: School[]) => void;
  isSuperAdmin: boolean;
  setIsSuperAdmin: (isSuperAdmin: boolean) => void;
}

const SchoolFilterContext = createContext<SchoolFilterContextType | undefined>(undefined);

export function SchoolFilterProvider({ children }: { children: ReactNode }) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [schools, setSchools] = useState<School[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  console.log('SchoolFilterContext state:', { selectedSchoolId, schoolsCount: schools.length, isSuperAdmin });

  // Fetch schools and check user role on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check user role first
        const meResponse = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (!meResponse.ok) {
          console.error('Auth request failed:', meResponse.statusText);
          return;
        }
        
        const meData = await meResponse.json();
        
        if (meData.success && meData.data?.user) {
          const userRole = meData.data.user.role?.name || meData.data.user.role;
          
          // Check for various possible super admin role names
          const isSuper = userRole === 'SUPERADMIN' || 
                         userRole === 'SUPER_ADMIN' || 
                         userRole === 'SUPER-ADMIN' ||
                         userRole === 'ADMIN' ||
                         userRole?.toLowerCase().includes('super');
          
          setIsSuperAdmin(isSuper);
          
          // Only fetch schools if super admin
          if (isSuper) {
            const schoolsResponse = await fetch('/api/schools', {
              credentials: 'include'
            });
            const schoolsData = await schoolsResponse.json();
            
            if (schoolsData.success) {
              console.log('Schools API response:', schoolsData);
              let schoolsList = schoolsData.data;
              
              // Map API response to expected interface
              schoolsList = schoolsList.map((school: any) => ({
                ...school,
                location: school.address || 'Unknown Location',
                studentCount: school._count?.users || 0,
                alertCount: 0,
                checkInsToday: 0,
              }));
              
              setSchools(schoolsList);
              console.log('Schools set:', schoolsList);
            } else {
              console.error('Schools API error:', schoolsData);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing school filter:', error);
      }
    };

    initializeData();
  }, []);

  return (
    <SchoolFilterContext.Provider
      value={{
        selectedSchoolId,
        setSelectedSchoolId,
        schools,
        setSchools,
        isSuperAdmin,
        setIsSuperAdmin,
      }}
    >
      {children}
    </SchoolFilterContext.Provider>
  );
}

export function useSchoolFilter() {
  const context = useContext(SchoolFilterContext);
  if (context === undefined) {
    throw new Error('useSchoolFilter must be used within a SchoolFilterProvider');
  }
  return context;
}
