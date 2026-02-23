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
    <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Breadcrumb */}
      <div className="max-w-7xl my-[2px] sm:my-[10px] mx-[-10px] pt-2 sm:pt-3 lg:pt-5 sm:px-3 lg:px-4">
              <BackToDashboard />
            </div>

      {/* Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6">
        <div className="flex mb-[15px] sm:mb-[20px] items-start gap-3 sm:gap-4 w-full sm:w-[510px]">
          <Image 
                        src="/Content/Library.svg" 
                        alt="Psychology Buddy Logo" 
                        width={63}
                        height={63}
                        className="w-[25px] h-[25px] sm:w-[40px] sm:h-[40px] md:w-[50px] md:h-[50px] lg:w-[63px] lg:h-[63px]"
                      />
          <div className='ml-[3px] sm:ml-[5px] flex-1'>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-bold text-slate-900 mb-1 sm:mb-2">
              Psychoeducation Library
            </h1>
            <p className="text-[#686D70] text-sm sm:text-base md:text-[16px] font-light hidden xs:block sm:block">
              Explore microlearning content to support your emotional wellbeing
            </p>
            <p className="text-[#686D70] text-xs sm:text-sm font-light block xs:hidden sm:hidden">
              Explore content for emotional wellbeing
            </p>
          </div>
        </div> 

        {/* Action Bar */}
        <div className="flex flex-col gap-3 w-full lg:w-auto mb-[30px] sm:mb-[55px]">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1 sm:flex-initial sm:w-[280px] md:w-[320px] lg:w-[360px] sm:h-[47px]">
              <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search here" 
                className="w-full h-10 sm:h-12 pl-3 sm:pl-4 pr-8 sm:pr-4 rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 transition-all text-sm sm:text-base"
              />
            </div>
            
            <div className="flex gap-3">
              <button className="h-10 sm:h-12 px-4 sm:px-6 rounded-full border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 sm:gap-3 w-full sm:w-[110px] sm:h-[47px]">
                <span className='text-[#9F9F9F] text-sm sm:text-base'>All</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-[#9F9F9F]" />
              </button>

              <button 
                onClick={onShowSaves}
                className={`h-10 sm:h-[47px] px-4 sm:px-6 rounded-full border font-base transition-colors flex items-center gap-2 whitespace-nowrap text-sm sm:text-base ${
                  isShowingSaves 
                    ? 'border-[#5982D4] bg-[#5982D4] text-white' 
                    : 'border-[#A5C3FF] bg-[#A5C3FF]/10 text-[#5982D4] hover:bg-blue-100'
                }`}
              >
                <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{isShowingSaves ? 'All Articles' : 'Show Saves'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
