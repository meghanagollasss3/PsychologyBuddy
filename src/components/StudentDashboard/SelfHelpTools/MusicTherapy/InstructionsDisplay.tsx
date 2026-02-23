'use client';

import React from 'react';
import { Lightbulb, CheckCircle, Sparkle, Sparkles } from 'lucide-react';

interface InstructionsDisplayProps {
  title?: string;
  points?: string[];
  proTip?: string;
  difficulty?: string;
}

export default function InstructionsDisplay({ 
  title = "Music Instructions", 
  points = [], 
  proTip,
  difficulty 
}: InstructionsDisplayProps) {
  return (
    <div className=" bg-white rounded-[14px] shadow-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[41px] bg-[#ECF3FF] rounded-[8px] flex items-center justify-center">
              <Sparkles className="w-[16px] h-[17px] text-[#2D7EDE]" />
            </div>
            <div>
              <h3 className="text-[20px] font-semibold text-black">{title}</h3>
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
              <div key={index} className="flex items-start gap-3 ml-13">
                <div className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0 mt-2 text-[#767676]"></div>
                <p className="text-[14px] text-[#767676] leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        )}
        
        {proTip && (
          <div className="">
            <div className="flex items-start gap-3">
              <Sparkles className="w-[16px] h-[17px] text-[#2D7EDE] flex-shrink-0 mt-1 ml-2" />
              <p className="text-sm leading-relaxed">
                <span className="font-medium text-[#2D7EDE] text-[16px] -ml-1.5">Pro Tip:</span> 
                <span className="text-[#767676] ml-2">{proTip}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
