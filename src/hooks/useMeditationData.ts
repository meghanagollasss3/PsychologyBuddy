import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/src/hooks/use-toast';

export interface MeditationResource {
  id: string;
  title: string;
  description: string;
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSec?: number;
  instructor?: string;
  type?: string;
  format?: string;
  status?: string;
  categories?: {
    category: {
      id: string;
      name: string;
      description?: string;
    };
  }[];
  goals?: {
    goal: {
      id: string;
      name: string;
      description?: string;
    };
  }[];
  school?: {
    id: string;
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export const useMeditationData = () => {
  const { toast } = useToast();
  const [meditationResources, setMeditationResources] = useState<MeditationResource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/students/meditation/categories');
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data || []);
      } else {
        toast({ title: result.message || 'Failed to fetch categories', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to fetch categories', variant: 'destructive' });
    }
  }, [toast]);

  // Fetch saved meditations
  const fetchSavedItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/student/saved-meditations`);
      const result = await response.json();
      
      if (result.success) {
        const savedIds: Set<string> = new Set(result.data.map((item: { id: string }) => item.id));
        setSavedItems(savedIds);
      } else {
        toast({ title: result.message || 'Failed to fetch saved items', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to fetch saved items', variant: 'destructive' });
    }
  }, [toast]);

  // Initialize data on mount
  const initializeData = useCallback(async () => {
    await Promise.all([
      fetchCategories(),
      fetchSavedItems()
    ]);
  }, [fetchCategories, fetchSavedItems]);

  // Fetch meditation resources
  const fetchMeditationResources = useCallback(async (categoryId?: string | null, search?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (search && search.trim()) {
        params.append('search', search.trim());
        const response = await fetch(`/api/students/meditation/search?${params.toString()}`);
        const result = await response.json();
        
        if (result.success) {
          setMeditationResources(result.data || []);
        } else {
          toast({ title: result.message || 'Failed to search meditation', variant: 'destructive' });
        }
      } else {
        if (categoryId) {
          params.append('categoryId', categoryId);
        }
        
        const response = await fetch(`/api/students/meditation?${params.toString()}`);
        const result = await response.json();
        
        if (result.success) {
          setMeditationResources(result.data || []);
        } else {
          toast({ title: result.message || 'Failed to fetch meditation resources', variant: 'destructive' });
        }
      }
    } catch (error) {
      toast({ title: 'Failed to fetch meditation resources', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Toggle save item
  const toggleSave = useCallback(async (meditationId: string) => {
    try {
      const response = await fetch('/api/student/saved-meditations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meditationId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSavedItems(prev => {
          const newSet = new Set(prev);
          if (result.isSaved) {
            newSet.add(meditationId);
            toast({ title: 'Added to saved items' });
          } else {
            newSet.delete(meditationId);
            toast({ title: 'Removed from saved items' });
          }
          return newSet;
        });
      } else {
        toast({ title: result.message || 'Failed to save meditation', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to save meditation', variant: 'destructive' });
    }
  }, [toast]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    meditationResources,
    categories,
    loading,
    savedItems,
    fetchCategories,
    fetchSavedItems,
    fetchMeditationResources,
    toggleSave,
    initializeData,
    searchTimeoutRef
  };
};
