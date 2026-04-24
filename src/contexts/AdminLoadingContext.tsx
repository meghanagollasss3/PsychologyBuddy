"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { RingSpinner } from '@/src/components/ui/Spinners';

interface LoadingState {
  [key: string]: {
    isLoading: boolean;
    message?: string;
  };
}

interface AdminLoadingContextType {
  loadingStates: LoadingState;
  setLoading: (action: string, isLoading: boolean, message?: string) => void;
  isLoading: (action: string) => boolean;
  executeWithLoading: <T>(
    action: string,
    promise: Promise<T>,
    message?: string
  ) => Promise<T>;
  clearAllLoading: () => void;
}

const AdminLoadingContext = createContext<AdminLoadingContextType | undefined>(undefined);

export function AdminLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((action: string, isLoading: boolean, message?: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [action]: { isLoading, message }
    }));
  }, []);

  const isLoading = useCallback((action: string) => {
    return loadingStates[action]?.isLoading || false;
  }, [loadingStates]);

  const executeWithLoading = useCallback(async <T,>(
    action: string,
    promise: Promise<T>,
    message?: string
  ): Promise<T> => {
    setLoading(action, true, message);
    try {
      const result = await promise;
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(action, false);
    }
  }, [setLoading]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  const hasAnyLoading = Object.values(loadingStates).some(state => state.isLoading);

  return (
    <AdminLoadingContext.Provider value={{
      loadingStates,
      setLoading,
      isLoading,
      executeWithLoading,
      clearAllLoading
    }}>
      {children}
      {hasAnyLoading && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-20 flex items-center justify-center z-[9999]" style={{ pointerEvents: 'auto' }}>
          <div className="flex flex-col items-center space-y-3">
            <RingSpinner size="lg" color="blue" />
            <div className="text-center">
              <p className="text-white font-medium bg-opacity-90 px-4 py-2 rounded-lg">
                {Object.values(loadingStates).find(state => state.isLoading)?.message || 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLoadingContext.Provider>
  );
}

export function useAdminLoading() {
  const context = useContext(AdminLoadingContext);
  if (context === undefined) {
    throw new Error('useAdminLoading must be used within an AdminLoadingProvider');
  }
  return context;
}

// Action types for better organization
export const AdminActions = {
  // Student actions
  ADD_STUDENT: 'add_student',
  EDIT_STUDENT: 'edit_student',
  DELETE_STUDENT: 'delete_student',
  RESTORE_STUDENT: 'restore_student',
  FETCH_STUDENTS: 'fetch_students',
  
  // Admin actions
  ADD_ADMIN: 'add_admin',
  EDIT_ADMIN: 'edit_admin',
  DELETE_ADMIN: 'delete_admin',
  FETCH_ADMINS: 'fetch_admins',
  
  // School actions
  ADD_SCHOOL: 'add_school',
  EDIT_SCHOOL: 'edit_school',
  DELETE_SCHOOL: 'delete_school',
  FETCH_SCHOOLS: 'fetch_schools',
  
  // Class actions
  ADD_CLASS: 'add_class',
  EDIT_CLASS: 'edit_class',
  DELETE_CLASS: 'delete_class',
  FETCH_CLASSES: 'fetch_classes',
  
  // Location actions
  ADD_LOCATION: 'add_location',
  EDIT_LOCATION: 'edit_location',
  DELETE_LOCATION: 'delete_location',
  FETCH_LOCATIONS: 'fetch_locations',
  
  // Settings actions
  UPDATE_SETTINGS: 'update_settings',
  SAVE_PROFILE: 'save_profile',
  
  // Dashboard actions
  FETCH_DASHBOARD: 'fetch_dashboard',
  EXPORT_DATA: 'export_data',
  
  // Article actions
  FETCH_ARTICLES: 'fetch_articles',
  CREATE_ARTICLE: 'create_article',
  EDIT_ARTICLE: 'edit_article',
  DELETE_ARTICLE: 'delete_article',
  UPDATE_ARTICLE_STATUS: 'update_article_status',
  
  // Music resource actions
  FETCH_MUSIC_RESOURCES: 'fetch_music_resources',
  CREATE_MUSIC_RESOURCE: 'create_music_resource',
  EDIT_MUSIC_RESOURCE: 'edit_music_resource',
  DELETE_MUSIC_RESOURCE: 'delete_music_resource',
  UPDATE_MUSIC_RESOURCE_STATUS: 'update_music_resource_status',
  CREATE_MUSIC_CATEGORY: 'create_music_category',
  
  // Meditation actions
  FETCH_MEDITATION_RESOURCES: 'fetch_meditation_resources',
  CREATE_MEDITATION_RESOURCE: 'create_meditation_resource',
  EDIT_MEDITATION_RESOURCE: 'edit_meditation_resource',
  DELETE_MEDITATION_RESOURCE: 'delete_meditation_resource',
  UPDATE_MEDITATION_RESOURCE_STATUS: 'update_meditation_resource_status',
  
  // Journaling actions
  FETCH_JOURNALING_RESOURCES: 'fetch_journaling_resources',
  CREATE_JOURNALING_RESOURCE: 'create_journaling_resource',
  EDIT_JOURNALING_RESOURCE: 'edit_journaling_resource',
  DELETE_JOURNALING_RESOURCE: 'delete_journaling_resource',
  UPDATE_JOURNALING_CONFIG: 'update_journaling_config',
  
  // Organization actions
  FETCH_ORGANIZATIONS: 'fetch_organizations',
  CREATE_ORGANIZATION: 'create_organization',
  DELETE_ORGANIZATION: 'delete_organization',
  UPDATE_ORGANIZATION: 'update_organization',
  
  // Badge actions
  FETCH_BADGES: 'fetch_badges',
  CREATE_BADGE: 'create_badge',
  EDIT_BADGE: 'edit_badge',
  DELETE_BADGE: 'delete_badge',
  
  // Generic actions
  SEARCH: 'search',
  FILTER: 'filter',
  EXPORT: 'export',
  IMPORT: 'import'
} as const;
