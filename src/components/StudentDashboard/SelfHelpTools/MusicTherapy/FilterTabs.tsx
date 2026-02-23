'use client';

import React from 'react';

interface FilterTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  categories?: string[];
  goals?: string[];
}

export default function FilterTabs({ activeTab, onTabChange, categories = [], goals = [] }: FilterTabsProps) {
  const tabs = ['Recommended', ...categories, ...goals];

  return (
    <div className="w-full ml-[2px] overflow-x-auto pb-2 sm:pb-4 scrollbar-hide">
    <div className="flex items-center gap-2 sm:gap-3 min-w-max h-10 sm:h-12 lg:h-[66px]">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`h-10 sm:h-12 lg:h-14 px-3 sm:px-4 lg:px-6 rounded-xl sm:rounded-[16px] flex items-center gap-2 sm:gap-3 font-base transition-all shadow-sm border text-xs sm:text-sm lg:text-base ${
            activeTab === tab
              ? 'bg-[#1C76DC] text-white' 
              : 'bg-white text-slate-600 border-slate-200 hover:shadow-md'
          }`}
        >
          {tab}
          
        </button>
      ))}
    </div>
    </div>
  );
}
