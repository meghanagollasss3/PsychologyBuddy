'use client';

import React from 'react';
import { Save, Trash2, PenLine, Lightbulb } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface JournalEditorProps {
  title: string;
  content: string;
  prompt?: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onClear: () => void;
  loading?: boolean;
}

export default function JournalEditor({ 
  title, 
  content, 
  prompt,
  onTitleChange, 
  onContentChange, 
  onSave, 
  onClear, 
  loading = false 
}: JournalEditorProps) {
  const { toast } = useToast();
  console.log('JournalEditor - prompt:', prompt);
  
  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Please write something before saving",
        variant: "destructive"
      });
      return;
    }
    
    // Call the original save function
    onSave();
    
    // Show success toast (assuming save was successful)
    toast({
      title: "Journal entry saved successfully!",
      description: "Your thoughts have been safely recorded."
    });
  };
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title Input */}
      <div className="bg-white p-2 sm:p-3 rounded-[32px] -mt-3 border border-slate-100 shadow-sm">
        <input 
          type="text" 
          placeholder="Give your entry a title (optional)" 
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full h-10 sm:h-12 px-4 sm:px-6 rounded-[32px] bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-sm sm:text-base"
        />
      </div>

      {/* Main Editor Card */}
      <div className="bg-white rounded-[32px] -mt-2 sm:-mt-3 p-2 sm:p-2 lg:p-6 border border-slate-100 shadow-sm h-full flex flex-col mb-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl">
              <img src="/selfhelptools/journaling/Editor.svg" alt="Editor" className="w-[45px] h-[45px] sm:w-[63px] sm:h-[63px]" />
            </div>
            <div>
              <h3 className="font-bold text-[#2F3D43] text-sm sm:text-[24px]">Today's Entry</h3>
              <p className="text-[10px] sm:text-[16px] text-[#686D70] font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          {/* Mobile Only - Scroll to Prompts Button */}
          <button 
            onClick={() => {
              const promptsElement = document.getElementById('writing-prompts');
              if (promptsElement) {
                promptsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="sm:hidden px-3 py-2 bg-blue-100 text-slate-500 rounded-lg font-medium transition-all flex items-center justify-center gap-1 shadow-md"
          >
            <Lightbulb className="w-4 h-4" />
            <span className="text-xs">Prompts</span>
          </button>
        </div>

        {/* Prompt Heading */}
        {prompt && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-1">Today's Prompt:</h4>
            <p className="text-xs sm:text-sm text-blue-700 italic">{prompt}</p>
          </div>
        )}

        <div className="flex-1 min-h-[250px] sm:min-h-[300px] mb-2 sm:mb-4">
          <textarea 
            className="w-full h-[300px] border border-[#C3BEBE] rounded-[16px] resize-none outline-none text-slate-600 placeholder:text-[#3A3A3A73] leading-relaxed text-[12px] sm:text-[16px] p-3 sm:p-4 custom-scrollbar-large"
            placeholder={prompt ? "Start writing your response here..." : "Start writing here...This is your Private space."}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            // style={{
            //   scrollbarWidth: 'thick',
            //   scrollbarColor: '#cbd5e1 #f1f5f9'
            // }}
          ></textarea>
          <style jsx>{`
            .custom-scrollbar-large::-webkit-scrollbar {
              width: 12px;
            }
            .custom-scrollbar-large::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 6px;
            }
            .custom-scrollbar-large::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 6px;
              border: 2px solid #f1f5f9;
            }
            .custom-scrollbar-large::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `}</style>
        </div>

        <div className="flex items-center justify-between pt-2 pr-3 pl-3 sm:pt-2 border-t border-slate-50">
          <span className="text-[10px] sm:text-[14px] text-slate-400 font-medium">{content.length} characters</span>
          <span className="text-[10px] sm:text-[14px] text-slate-400 italic">Your words are safe and private</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex-1 h-12 sm:h-[67px] bg-gradient-to-l from-[#67CCFF] to-[#1B9EE0] hover:bg-cyan-600 disabled:bg-slate-300 text-white rounded-[24px] font-base text-base sm:text-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Save className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-[20px]">{loading ? 'Saving...' : 'Save Entry'}</span>
        </button>
        <button 
          onClick={onClear}
          className="w-12 h-12 sm:w-[82px] sm:h-[67px] bg-white border border-red-100 text-red-500 rounded-[32px] -ml-2 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
