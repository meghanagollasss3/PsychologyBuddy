"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

export type TimeFilter = 'all' | 'today' | 'week' | 'month';

export interface DateRange {
  start: Date;
  end: Date;
}

interface TimeFilterContextType {
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  getDateRangeForFilter: (filter: TimeFilter) => DateRange;
}

const TimeFilterContext = createContext<TimeFilterContextType | undefined>(undefined);

export function TimeFilterProvider({ children }: { children: ReactNode }) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeForFilter('all'));
  const searchParams = useSearchParams();

  // Check for time query parameter on mount and set time filter
  useEffect(() => {
    const timeParam = searchParams.get('time');
    if (timeParam && ['all', 'today', 'week', 'month'].includes(timeParam)) {
      setTimeFilter(timeParam as TimeFilter);
    }
  }, [searchParams]);

  // Update date range when time filter changes
  useEffect(() => {
    if (timeFilter !== 'all') {
      setDateRange(getDateRangeForFilter(timeFilter));
    } else {
      // For 'all', set a very wide date range
      setDateRange(getDateRangeForFilter('all'));
    }
  }, [timeFilter]);

  // Function to get date range for a specific filter
  function getDateRangeForFilter(filter: TimeFilter): DateRange {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (filter) {
      case 'all':
        // For 'all', return a very wide date range to show everything
        start.setFullYear(now.getFullYear() - 10); // 10 years ago
        start.setHours(0, 0, 0, 0);
        end.setFullYear(now.getFullYear() + 1); // 1 year in future
        end.setHours(23, 59, 59, 999);
        break;
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        // Start of current week (Sunday)
        const dayOfWeek = now.getDay();
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        // End of current week (Saturday)
        end.setDate(now.getDate() + (6 - dayOfWeek));
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // Start of current month
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        // End of current month
        end.setMonth(now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return dateRange;
    }

    return { start, end };
  }

  const contextValue: TimeFilterContextType = {
    timeFilter,
    setTimeFilter,
    dateRange,
    setDateRange,
    getDateRangeForFilter,
  };

  return (
    <TimeFilterContext.Provider value={contextValue}>
      {children}
    </TimeFilterContext.Provider>
  );
}

export function useTimeFilter() {
  const context = useContext(TimeFilterContext);
  if (context === undefined) {
    throw new Error('useTimeFilter must be used within a TimeFilterProvider');
  }
  return context;
}
