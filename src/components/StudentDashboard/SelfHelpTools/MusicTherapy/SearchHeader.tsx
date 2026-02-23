'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick?: () => void;
}

export default function SearchHeader({ searchQuery, onSearchChange, onFilterClick }: SearchHeaderProps) {
  return (
    <div className="relative flex-1 sm:flex-initial sm:w-[280px] md:w-[320px] lg:w-[360px] sm:h-[47px]">
      <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
      <input
        type="text"
        placeholder="Search music..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full h-10 sm:h-12 pl-3 sm:pl-4 pr-8 sm:pr-4 rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 transition-all text-sm sm:text-base"
      />
    </div>
  );
}
