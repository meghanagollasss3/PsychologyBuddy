'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';

interface JournalPrompt {
  id: string;
  text: string;
  moodIds: string[];
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WritingPromptsProps {
  onPromptSelect?: (prompt: string) => void;
}

export default function WritingPrompts({ onPromptSelect }: WritingPromptsProps) {
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('/api/admin/journaling/prompts');
        const data = await response.json();
        if (data.success && data.data) {
          setPrompts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  const handlePromptClick = (prompt: JournalPrompt) => {
    console.log('WritingPrompts - prompt clicked:', prompt.text);
    onPromptSelect?.(prompt.text);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 w-full sm:w-[437px] shadow-sm h-[400px] sm:h-[567px] flex flex-col">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-2 sm:p-2.5 bg-yellow-50 rounded-xl">
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">Writing Prompts</h3>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6 pl-8 sm:pl-12">
          Not sure what to write? Try one of these:
        </p>
        <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[300px] sm:max-h-[500px] pr-2 custom-scrollbar">
          {prompts.map((prompt, index) => (
            <div 
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className="p-3 sm:p-4 rounded-2xl border border-slate-100 text-slate-600 text-xs sm:text-sm transition-all cursor-pointer hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            >
              {prompt.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] p-4 sm:p-6 lg:p-8 border border-slate-100 w-full sm:w-auto shadow-sm h-auto sm:h-[655px] flex flex-col -mt-2.5">
      <div className="flex items-center gap-2 sm:gap-3 mb-2">
        <div className="p-0.5 sm:-p-2 rounded-xl">
<img src="/journaling/Prompt.svg" alt="Editor" className="w-[45px] h-[45px] sm:w-[63px] sm:h-[63px]" />        </div>
        <h3 className="font-bold text-slate-900 text-base sm:text-[24px]">Writing Prompts</h3>
      </div>
      <p className="text-slate-500 text-[12px] sm:text-[16px] mb-4 sm:mb-6 pl-8 sm:pl-12">
        Not sure what to write? Try one of these:
      </p>
      <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[300px] sm:max-h-[500px] pr-2 custom-scrollbar">
        {prompts.map((prompt, index) => (
          <div 
            key={index}
            onClick={() => handlePromptClick(prompt)}
            className="p-3 sm:p-4 rounded-[16px] border border-[#EFEFEF] text-slate-600 text-xs sm:text-sm transition-all cursor-pointer hover:border-slate-300 hover:bg-[#EEF5FF] hover:text-slate-700"
          >
            {prompt.text}
          </div>
        ))}
      </div>
    </div>
  );
}
