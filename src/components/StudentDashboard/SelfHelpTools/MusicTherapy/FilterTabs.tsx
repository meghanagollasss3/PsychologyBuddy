'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FilterTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  categories?: string[];
  goals?: string[];
}

export default function FilterTabs({ activeTab, onTabChange, categories = [], goals = [] }: FilterTabsProps) {
  const tabs = ['Recommended', ...categories, ...goals];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth);
    }
  };

  React.useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      return () => container.removeEventListener('scroll', checkScrollability);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200; // Adjust scroll distance as needed
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative w-full">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:shadow-lg transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:shadow-lg transition-all"
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      )}

      {/* Tabs Container */}
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-2 scrollbar-hide"
        onScroll={checkScrollability}
      >
        <div className="flex items-center gap-2 min-w-max px-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`h-8 px-3 sm:h-10 sm:px-4 md:h-12 md:px-4 lg:h-14 lg:px-6 rounded-lg sm:rounded-xl md:rounded-[16px] flex items-center justify-center font-medium transition-all shadow-sm border text-xs sm:text-sm md:text-sm lg:text-base whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#1C76DC] text-white border-[#1C76DC]' 
                  : 'bg-white text-slate-600 border-slate-200 hover:shadow-md hover:border-slate-300'
              }`}
            >
              {tab}
              
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
