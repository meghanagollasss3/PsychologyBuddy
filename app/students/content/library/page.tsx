'use client';

import React, { useState } from 'react';
import LibraryHeader from '@/src/components/StudentDashboard/Content/Library/LibraryHeader';
import CategoryTabs from '@/src/components/StudentDashboard/Content/Library/CategoryTabs';
import CourseGrid from '@/src/components/StudentDashboard/Content/Library/CourseGrid';
import StudentLayout from '@/src/components/StudentDashboard/Layout/StudentLayout';

export default function LibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSaves, setShowSaves] = useState(false);
  
  const handleShowSaves = () => {
    setShowSaves(!showSaves);
  };
   
  return (
    <div className="min-h-screen bg-[#F3F4F8]">
      <StudentLayout>
      <div className="container mx-auto px-3 sm:px-2 md:px-6 lg:px-8 py-4 sm:py-5 lg:py-3 max-w-7xl">
        {/* Header */}
        <LibraryHeader 
          onShowSaves={handleShowSaves} 
          isShowingSaves={showSaves}
        />
        
        {/* Category Tabs - Only show when not viewing saves */}
        {!showSaves && (
          <div className="mb-6 sm:mb-8">
            <CategoryTabs 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
        )}
        
        {/* Course Grid */}
        <CourseGrid 
          selectedCategory={selectedCategory}
          showSaves={showSaves}
        />
      </div>
          
      </StudentLayout>
    </div>
    
  );
}
