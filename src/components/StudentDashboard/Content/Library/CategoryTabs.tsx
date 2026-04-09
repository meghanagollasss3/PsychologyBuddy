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
        const response = await fetch('/api/student/library/metadata');
        
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
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-max">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-8 sm:h-10 md:h-12 lg:h-14 px-2 sm:px-3 md:px-4 lg:px-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gray-200 animate-pulse w-16 sm:w-20 md:w-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full ml-[2px] overflow-x-auto pb-2 sm:pb-4 scrollbar-hide">
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-max h-8 sm:h-10 md:h-12 lg:h-14">
        {allCategories.map((cat) => {
          const Icon = defaultIconMap[cat.name];
          const isActive = selectedCategory === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`
                h-7 sm:h-9 md:h-11 lg:h-14 px-2 sm:px-3 md:px-4 lg:px-6 rounded-lg sm:rounded-xl md:rounded-[16px] flex items-center gap-1.5 sm:gap-2 md:gap-3 font-base transition-all shadow-sm border text-xs sm:text-sm md:text-base lg:text-base flex-shrink-0
                ${isActive 
                  ? 'bg-[#1C76DC] text-white' 
                  : 'bg-white text-slate-600 border-slate-200 hover:shadow-md'
                }
              `}
            >
              {Icon && <Icon className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
              <span className="hidden sm:block">{cat.name}</span>
              <span className="block sm:hidden text-xs">
                {cat.name.length > 8 ? cat.name.substring(0, 6) + '...' : cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
