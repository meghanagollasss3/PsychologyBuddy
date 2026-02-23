'use client';
import React from 'react';
import { Smile, Frown, Meh, CloudRain, Zap, AlertCircle } from 'lucide-react';

interface MoodSelectorProps {
  selectedMood: string | null;
  onMoodSelect: (mood: string | null) => void;
}

export default function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {

  const moods = [
    { id: 'happy', label: 'Happy', emoji: '/Summary/Happy.svg', color: 'bg-yellow-100' },
    { id: 'sad', label: 'Sad', emoji: '/Summary/Sad.svg', color: 'bg-blue-100' },
    { id: 'okay', label: 'Okay', emoji: '/Summary/Okay.svg', color: 'bg-gray-100' },
    { id: 'anxious', label: 'Anxious', emoji: '/Summary/Angry.svg', color: 'bg-orange-100' },
    { id: 'tired', label: 'Tired', emoji: '/Summary/Worry.svg', color: 'bg-purple-100' },
    { id: 'worried', label: 'Worried', emoji: '/Summary/Nervous.svg', color: 'bg-red-100' },
  ];

  return (
    <div className="bg-white h-auto rounded-[25px] sm:rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 mb-6 sm:mb-8">
      <h3 className="text-[#686D70] mb-2 sm:mb-4 ml-2 sm:ml-4 text-[12px] sm:text-[16px] font-medium">How are you feeling right now?</h3>
      <div className="flex items-center px-2 sm:px-4 gap-2 sm:gap-12">
        {moods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onMoodSelect(mood.id)}
            className={`flex flex-col items-center transition-all duration-200  ${
              selectedMood === mood.id ? 'transform scale-110' : 'hover:scale-105'
            }`}
          >
            <div className={`w-10 h-10 sm:w-16 sm:h-15 ${mood.color} rounded-[10px] flex items-center justify-center text-2xl sm:text-3xl shadow-sm group-hover:shadow-md transition-all`}>
              <img src={mood.emoji} alt={mood.label} className={`w-6 h-6 sm:w-10 sm:h-10 ${mood.id === 'happy' ? 'w-8 h-8 sm:w-[55px] sm:h-[55px] mt-2 sm:mt-4 sm:ml-1' : ''}`} />
            </div>
            <span className={`text-[9px] sm:text-[12px] mt-2 font-medium ${selectedMood === mood.id ? 'text-gray-900' : 'text-gray-400'}`}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
