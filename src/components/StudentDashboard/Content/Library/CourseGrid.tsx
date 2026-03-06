'use client';

import React, { useState, useEffect } from 'react';
import CourseCard from './CourseCard';
import Pagination from './Pagination';

interface Article {
  id: string;
  title: string;
  description: string;
  readTime: string | null;
  thumbnailUrl: string | null;
  status: string;
  categories: Array<{
    category: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
  admin: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CourseGridProps {
  selectedCategory?: string;
  showSaves?: boolean;
}

export default function CourseGrid({ selectedCategory = 'all', showSaves = false }: CourseGridProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchArticles = async (page: number = 1) => {
      try {
        setLoading(true);
        let response;
        
        // Fetch saved articles if showSaves is true
        if (showSaves) {
          const studentId = localStorage.getItem('studentId') || null;
          response = await fetch(`/api/student/saved-articles?studentId=${studentId}&page=${page}&limit=9`);
        } else {
          response = await fetch(`/api/student/library?page=${page}&limit=9`);
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }
        
        const result = await response.json();
        
        if (result.success) {
          let filteredArticles = result.data;
          
          // Only sort and filter if not showing saved articles
          if (!showSaves) {
            // Sort by rating (highest first)
            filteredArticles.sort((a: any, b: any) => {
              // If articles have rating data, sort by rating
              if (a.averageRating !== undefined && b.averageRating !== undefined) {
                return b.averageRating - a.averageRating;
              }
              // Fallback: sort by creation date (newest first)
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            
            // Filter by selected category if not "all"
            if (selectedCategory !== 'all') {
              filteredArticles = filteredArticles.filter((article: Article) => 
                article.categories.some((cat: any) => 
                  cat.category.name.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                  cat.category.id === selectedCategory
                )
              );
            }
          }
          
          setArticles(filteredArticles);
          if (result.pagination) {
            setPagination(result.pagination);
          }
        } else {
          setError(result.message || 'Failed to load articles');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error fetching articles:', err);
        
        if (errorMessage.includes('Authentication required')) {
          setError('Please log in to view articles.');
        } else if (errorMessage.includes('403') || errorMessage.includes('permission')) {
          setError('You do not have permission to view articles.');
        } else {
          setError('Failed to load articles. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticles(currentPage);
  }, [selectedCategory, showSaves, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Transform article data to match CourseCard props
  const transformArticleToCourse = (article: Article, index: number) => {
    // Get first category name or use a default
    const category = article.categories.length > 0 
      ? article.categories[0].category.name 
      : 'General';
    
    // Map category to color (you can enhance this mapping)
    const colorMap: Record<string, string> = {
      'Stress Management': 'purple',
      'Emotional Intelligence': 'pink',
      'Mindfulness': 'blue',
      'Self-Growth': 'green',
      'Wellness': 'indigo',
      'Social Skill': 'orange',
      'Resilience': 'teal',
      'Communication': 'red',
    };
    
    const color = colorMap[category] || 'blue';
    
    return {
      id: article.id,
      title: article.title,
      category,
      time: article.readTime ? `${article.readTime} mins` : '5 mins',
      description: article.description,
      color,
      image: article.thumbnailUrl || `https://picsum.photos/400/300?random=${index + 1}`,
      delay: index,
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 h-32 sm:h-40 lg:h-48 rounded-t-2xl sm:rounded-t-3xl"></div>
            <div className="bg-white p-4 sm:p-6 rounded-b-2xl sm:rounded-b-3xl border border-slate-100">
              <div className="h-3 sm:h-4 bg-gray-200 rounded mb-3 sm:mb-4 w-1/2"></div>
              <div className="h-5 sm:h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded mb-3 sm:mb-4"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="text-red-500 mb-4 text-sm sm:text-base">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="text-gray-500 mb-4 text-sm sm:text-base">
          {showSaves 
            ? 'No saved articles yet. Start exploring and save articles you like!' 
            : 'No articles available at the moment.'
          }
        </div>
        <p className="text-gray-400 text-xs sm:text-sm">
          {showSaves 
            ? 'Articles you save will appear here for easy access.' 
            : 'Check back later for new content!'
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {articles.map((article, index) => (
          <CourseCard 
            key={article.id} 
            {...transformArticleToCourse(article, index)} 
          />
        ))}
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
        />
      )}
    </>
  );
}
