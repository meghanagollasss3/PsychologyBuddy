'use client';

import React from 'react';
import { ArrowLeft, Book, BookOpen, Paintbrush, PenBox, Pencil, PencilLine, PenLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface JournalHeaderProps {
  activeTab?: 'writing' | 'audio' | 'art';
  onTabChange?: (tab: 'writing' | 'audio' | 'art') => void;
  viewAllJournals?: () => void;
  viewAllArtJournals?: () => void;
}

export default function JournalHeader({ activeTab = 'writing', onTabChange, viewAllJournals, viewAllArtJournals }: JournalHeaderProps) {
  const router = useRouter();
  
  const handleBack = () => {
    router.push('/students');
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Breadcrumb */}
      <button 
        onClick={handleBack}
        className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs sm:text-sm font-medium">Back to Self-Help Tool</span>
      </button>

      {/* Header Content */}
      
      
              {/* Page Title Section */}
              <div className="flex items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#E3F2FD] rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
              <img src="/journaling/Header.svg" alt="Editor" className="w-[45px] h-[45px] sm:w-[63px] sm:h-[63px]" />
                  </div>
                  <div className="pt-1">
                     <h1 className="text-[16px] sm:text-3xl font-extrabold text-gray-800 tracking-tight mb-1">Journaling</h1>
                     <p className="text-[11px] -mt-1 sm:text-base sm:text-lg text-gray-500">Do freely in your private space</p>
                  </div>
                </div>
                
                {/* View All Journals Button - Only for Writing Tab */}
                {activeTab === 'writing' && viewAllJournals && (
                  <button 
                    onClick={viewAllJournals}
                    className="px-3 py-3 sm:px-4 sm:py-4 pr-1 sm:pr-3 sm:mt-2 bg-gradient-to-b from-[#67CCFF] to-[#1B9EE0] hover:bg-cyan-600 text-white rounded-full sm:rounded-[24px] font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer "
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="hidden sm:inline">View All Journals</span>
                    <span className="sm:hidden"/>
                  </button>
                )}
                
                {/* View All Art Journals Button - Only for Art Tab */}
                {activeTab === 'art' && viewAllArtJournals && (
                  <button 
                    onClick={viewAllArtJournals}
                    className="px-3 py-3 sm:px-4 sm:py-4 pr-1 sm:pr-3 sm:mt-2 bg-gradient-to-b from-[#67CCFF] to-[#1B9EE0] hover:bg-cyan-600 text-white rounded-full sm:rounded-[24px] font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer "
                  >
                    <Paintbrush className="w-5 h-5" />
                    <span className="hidden sm:inline">View All Art Journals</span>
                    <span className="sm:hidden"/>
                  </button>
                )}
              </div>
      
    </div>
  );
}
