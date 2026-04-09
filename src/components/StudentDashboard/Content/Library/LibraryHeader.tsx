'use client';

import React, { useState } from 'react';
import { ArrowLeft, Search, Heart, ChevronDown, BarChart2, Bookmark } from 'lucide-react';
import BackToDashboard from '../../Layout/BackToDashboard';
import Image from "next/image";

interface LibraryHeaderProps {
  onShowSaves?: () => void;
  isShowingSaves?: boolean;
} 

export default function LibraryHeader({ onShowSaves, isShowingSaves = false }: LibraryHeaderProps) {
  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
      {/* Breadcrumb */}
      <div className="max-w-7xl my-[2px] sm:my-[5px] md:my-[10px] mx-[-10px] pt-2 sm:pt-3 lg:pt-5 sm:px-3 lg:px-4">
              <BackToDashboard />
            </div>

      {/* Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6">
        <div className="flex mb-[10px] sm:mb-[15px] md:mb-[20px] items-start gap-2 sm:gap-3 md:gap-4 w-full">
          <Image 
                        src="/Content/Library.svg" 
                        alt="Psychology Buddy Logo" 
                        width={63}
                        height={63}
                        className="w-[20px] h-[20px] sm:w-[25px] sm:h-[25px] md:w-[40px] md:h-[40px] lg:w-[63px] lg:h-[63px]"
                      />
          <div className='ml-[2px] sm:ml-[3px] flex-1'>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-[32px] font-bold text-slate-900 mb-1 sm:mb-2">
              Psychoeducation Library
            </h1>
            <p className="text-[#686D70] text-xs sm:text-sm md:text-[16px] font-light hidden sm:block">
              Explore microlearning content to support your emotional wellbeing
            </p>
            <p className="text-[#686D70] text-xs font-light block sm:hidden">
              Explore content for emotional wellbeing
            </p>
          </div>
        </div> 

        {/* Action Bar */}
        <div className="flex flex-col gap-2 sm:gap-3 w-full lg:w-auto mb-[20px] sm:mb-[30px] md:mb-[55px]">
          {/* Search and Filter Row */}
          <div className="flex gap-2 sm:gap-3 w-full">
            <div className="relative flex-1 h-9 sm:h-10 md:h-12">
              <Search className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search here" 
                className="w-full h-8 sm:h-9 md:h-10 lg:h-12 pl-2 sm:pl-3 md:pl-4 pr-6 sm:pr-8 md:pr-10 rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 transition-all text-xs sm:text-sm md:text-base"
              />
            </div>
            
            <button 
              onClick={onShowSaves}
              className={`h-8 sm:h-9 md:h-10 lg:h-12 px-3 sm:px-4 md:px-6 rounded-full border font-base transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap text-xs sm:text-sm md:text-base flex-shrink-0 ${
                isShowingSaves 
                  ? 'border-[#5982D4] bg-[#5982D4] text-white' 
                  : 'border-[#A5C3FF] bg-[#A5C3FF]/10 text-[#5982D4] hover:bg-blue-100'
              }`}
            >
              <Bookmark className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4" />
              <span className="hidden xs:block sm:block">{isShowingSaves ? 'All Articles' : 'Show Saves'}</span>
              <span className="block xs:hidden sm:hidden">{isShowingSaves ? 'All' : 'Saved'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
