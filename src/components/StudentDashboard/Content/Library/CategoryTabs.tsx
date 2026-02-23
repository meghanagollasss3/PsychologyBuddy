'use client';

import React, { useState, useEffect } from 'react';
import { Smile, Frown, TrendingUp, Users, Coffee, Bookmark } from 'lucide-react';
// import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const defaultIconMap: Record<string, any> = {
  'Emotional Intelligence': Smile,
  'Stress Management': Frown,
  'Growth': TrendingUp, 
  'Wellness': Coffee,
  'Social Skill': Users,
};

export default function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/library/metadata');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setCategories(result.data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Use fallback categories if API fails
        setCategories([
          { id: 'eq', name: 'Emotional Intelligence', color: null },
          { id: 'stress', name: 'Stress Management', color: null },
          { id: 'growth', name: 'Growth', color: null },
          { id: 'wellness', name: 'Wellness', color: null },
          { id: 'social', name: 'Social Skill', color: null },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Prepare categories list with "All" option only
  const allCategories = [
    { id: 'all', name: 'All', color: null },
    ...categories
  ];

  if (loading) {
    return (
      <div className="w-full overflow-x-auto pb-2 sm:pb-4 scrollbar-hide">
        <div className="flex items-center gap-2 sm:gap-3 min-w-max">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-10 sm:h-12 lg:h-14 px-3 sm:px-4 lg:px-6 rounded-xl sm:rounded-2xl bg-gray-200 animate-pulse w-20 sm:w-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full ml-[2px] overflow-x-auto pb-2 sm:pb-4 scrollbar-hide">
      <div className="flex items-center gap-2 sm:gap-3 min-w-max h-10 sm:h-12 lg:h-[66px]">
        {allCategories.map((cat) => {
          const Icon = defaultIconMap[cat.name];
          const isActive = selectedCategory === cat.id;
          
          return (
            <button
              key={cat.id}
              
              onClick={() => onCategoryChange(cat.id)}
              className={`
                h-10 sm:h-12 lg:h-14 px-3 sm:px-4 lg:px-6 rounded-xl sm:rounded-[16px] flex items-center gap-2 sm:gap-3 font-base transition-all shadow-sm border text-xs sm:text-sm lg:text-base
                ${isActive 
                  ? 'bg-[#1C76DC] text-white' 
                  : 'bg-white text-slate-600 border-slate-200 hover:shadow-md'
                }
              `}
            >
              {Icon && <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
              <span className="hidden xs:block sm:block">{cat.name}</span>
              <span className="block xs:hidden sm:hidden text-xs">{cat.name.length > 10 ? cat.name.substring(0, 8) + '...' : cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
