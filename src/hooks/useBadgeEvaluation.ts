'use client';

import { useState, useCallback } from 'react';

interface Badge {
  name: string;
  description: string;
  icon: string;
  level?: number;
  studentName?: string;
}

interface UseBadgeEvaluationReturn {
  evaluateBadges: () => Promise<void>;
  newBadge: Badge | null;
  isModalOpen: boolean;
  closeModal: () => void;
}

export function useBadgeEvaluation(): UseBadgeEvaluationReturn {
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const evaluateBadges = useCallback(async () => {
    try {
      const response = await fetch('/api/student/badges/evaluate', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success && data.data.newBadges.length > 0) {
        // Show the first new badge
        const badge = data.data.newBadges[0];
        setNewBadge({
          ...badge,
          studentName: 'Student', // You can get this from user context/session
        });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error evaluating badges:', error);
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setNewBadge(null);
  }, []);

  return {
    evaluateBadges,
    newBadge,
    isModalOpen,
    closeModal,
  };
}
