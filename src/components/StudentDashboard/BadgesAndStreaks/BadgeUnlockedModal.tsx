'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Flame, Trophy, BookOpen, Wind, PenLine, Heart, Star } from 'lucide-react';

interface BadgeUnlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: {
    name: string;
    description: string;
    icon: string;
    level?: number;
    studentName?: string;
  };
}

const getBadgeIcon = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    flame: <Flame className="w-8 h-8 text-orange-500" />,
    trophy: <Trophy className="w-8 h-8 text-yellow-500" />,
    book: <BookOpen className="w-8 h-8 text-blue-500" />,
    wind: <Wind className="w-8 h-8 text-cyan-500" />,
    pen: <PenLine className="w-8 h-8 text-purple-500" />,
    heart: <Heart className="w-8 h-8 text-red-500" />,
    star: <Star className="w-8 h-8 text-indigo-500" />,
  };
  return iconMap[iconName.toLowerCase()] || <Trophy className="w-8 h-8 text-yellow-500" />;
};

export default function BadgeUnlockedModal({ 
  isOpen, 
  onClose, 
  badge 
}: BadgeUnlockedModalProps) {
  const handleContinue = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-2xl">
        {/* Confetti background effect */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
          <div className="absolute -top-1 -right-3 w-3 h-3 bg-pink-400 rounded-full animate-pulse delay-75" />
          <div className="absolute -bottom-2 -left-3 w-5 h-5 bg-blue-400 rounded-full animate-pulse delay-150" />
          <div className="absolute -bottom-1 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse delay-300" />
          <div className="absolute top-1/4 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-500" />
          <div className="absolute top-1/3 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse delay-700" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center p-6">
          {/* Badge Icon with glow effect */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-orange-200 rounded-full blur-xl opacity-60 animate-pulse" />
            <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-orange-100">
              {getBadgeIcon(badge.icon)}
            </div>
          </div>

          {/* Congratulations text */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            New badge unlocked
          </h2>
          
          <p className="text-lg text-gray-600 mb-1">
            Congrats, {badge.studentName || 'Student'}! You just completed a {badge.name.toLowerCase()}.
          </p>

          {/* Badge details */}
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 mb-6 w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg font-semibold text-gray-800">{badge.name}</span>
              {badge.level && (
                <span className="px-2 py-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-bold rounded-full">
                  Level {badge.level}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{badge.description}</p>
          </div>

          {/* Continue button */}
          <Button 
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Continue Learning
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
