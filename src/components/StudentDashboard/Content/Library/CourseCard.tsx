'use client';

import React from 'react';
import { Clock, ArrowRight, ChevronRight } from 'lucide-react';
// import { motion } from 'framer-motion';

interface CourseCardProps {
  id: string;
  title: string;
  category: string;
  time: string;
  description: string;
  color: string;
  image: string;
  delay: number;
}

export default function CourseCard({ id, title, category, time, description, color, image, delay }: CourseCardProps) {
  // Map color strings to Tailwind classes
  // const colorMap: Record<string, { bg: string, tag: string, tagText: string }> = {
  //   purple: { bg: 'bg-purple-600', tag: 'bg-purple-100', tagText: 'text-purple-700' },
  //   pink: { bg: 'bg-pink-500', tag: 'bg-pink-100', tagText: 'text-pink-700' },
  //   blue: { bg: 'bg-blue-500', tag: 'bg-blue-100', tagText: 'text-blue-700' },
  //   green: { bg: 'bg-emerald-500', tag: 'bg-emerald-100', tagText: 'text-emerald-700' },
  //   indigo: { bg: 'bg-indigo-500', tag: 'bg-indigo-100', tagText: 'text-indigo-700' },
  //   orange: { bg: 'bg-orange-500', tag: 'bg-orange-100', tagText: 'text-orange-700' },
  //   teal: { bg: 'bg-teal-500', tag: 'bg-teal-100', tagText: 'text-teal-700' },
  //   red: { bg: 'bg-rose-500', tag: 'bg-rose-100', tagText: 'text-rose-700' },
  // };

  // const theme = colorMap[color] || colorMap.blue;

  const handleCardClick = () => {
    // Navigate to article detail page
    window.location.href = `/students/content/library/${id}`;
  };

  return (
    <div
      className="group w-full bg-white rounded-[10px] sm:rounded-[13px] hover:shadow-xl hover:shadow-[#15A0EA33]/20 transition-all duration-300 flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image Area */}
      <div className={`h-[100px] sm:h-[120px] md:h-[140px] lg:h-[160px] w-full relative`}>
        <div className="absolute bg-black/10" />
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover opacity-90 rounded-tl-[10px] sm:rounded-tl-[13px] rounded-tr-[10px] sm:rounded-tr-[13px]"
        />
        {/* Overlay gradient for text readability if needed, but we have card body below */}
      </div>

      {/* Content Body */}
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-5">
          <span className={`px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full bg-[#F2F8FF] text-[#1C76DC] text-[10px] sm:text-xs md:text-sm font-medium tracking-wide`}>
            {category}
          </span>
          <div className="flex items-center gap-1 text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium">
            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:block">{time}</span>
            <span className="block sm:hidden">{time.replace(' mins', 'm')}</span>
          </div> 
        </div>

        <h3 className="text-xs sm:text-sm md:text-base lg:text-[16px] font-bold text-slate-900 mb-1.5 sm:mb-2 md:mb-3 leading-tight transition-colors line-clamp-2">
          {title}
        </h3>
        
        <p className="text-[#767676] text-[10px] sm:text-xs md:text-sm lg:text-[13px] leading-relaxed mb-3 sm:mb-4 md:mb-6 line-clamp-2">
          {description}
        </p>

        <div className="mt-auto">
          <button className="flex items-center gap-1.5 sm:gap-2 text-[#1C76DC] text-[10px] sm:text-xs md:text-sm lg:text-[13px] font-bold group/btn hover:gap-2.5 sm:hover:gap-3 transition-all">
            <span className="hidden sm:block">Start Learning</span>
            <span className="block sm:hidden">Start</span>
            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
