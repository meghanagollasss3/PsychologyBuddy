"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface School {
  id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

interface SchoolSearchProps {
  onSchoolSelect: (school: School | null) => void;
  placeholder?: string;
  className?: string;
}

export function SchoolSearch({ onSchoolSelect, placeholder = "Search schools...", className = "" }: SchoolSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchSchools(searchQuery);
      }, 300);
    } else {
      setSchools([]);
      setIsOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const searchSchools = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/schools?search=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSchools(data.data);
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Error searching schools:', error);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setSearchQuery(school.name);
    setIsOpen(false);
    onSchoolSelect(school);
  };

  const handleClear = () => {
    setSelectedSchool(null);
    setSearchQuery('');
    setSchools([]);
    setIsOpen(false);
    onSchoolSelect(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (selectedSchool && value !== selectedSchool.name) {
      setSelectedSchool(null);
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
          onFocus={() => schools.length > 0 && setIsOpen(true)}
        />
        {loading && (
          <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
        {!loading && searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {isOpen && schools.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {schools.map((school) => (
            <div
              key={school.id}
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSchoolSelect(school)}
            >
              <div className="font-medium text-gray-900">{school.name}</div>
              {school.address && (
                <div className="text-sm text-gray-500 truncate">{school.address}</div>
              )}
              {school.email && (
                <div className="text-xs text-gray-400 truncate">{school.email}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {isOpen && !loading && schools.length === 0 && searchQuery.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-3 py-2 text-sm text-gray-500">No schools found</div>
        </div>
      )}
    </div>
  );
}
