'use client';

import React from 'react';
import { Lightbulb, CheckCircle } from 'lucide-react';

interface InstructionsDisplayProps {
  title?: string;
  points?: string[];
  proTip?: string;
  difficulty?: string;
}

export default function InstructionsDisplay({ 
  title = "Meditation Instructions", 
  points = [], 
  proTip,
  difficulty 
}: InstructionsDisplayProps) {
  return (
    <div className="border-[#3B82F6]/20 bg-gradient-to-r from-[#3B82F6]/5 to-transparent rounded-lg shadow-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              {difficulty && (
                <span className="ml-2 px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                  {difficulty}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {points.length > 0 && (
          <div className="space-y-3 mb-4">
            {points.map((point, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#3B82F6] flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-semibold text-[#3B82F6]">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        )}
        
        {proTip && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-1">Pro Tip</p>
                <p className="text-xs text-amber-700 leading-relaxed">{proTip}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
