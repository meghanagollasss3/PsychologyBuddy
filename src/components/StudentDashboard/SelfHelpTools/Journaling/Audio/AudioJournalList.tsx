'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioJournal {
  id: string;
  title: string | null;
  audioUrl: string;
  duration: number;
  createdAt: string;
}

interface AudioJournalListProps {
  journals: AudioJournal[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

export default function AudioJournalList({ journals, onDelete, loading }: AudioJournalListProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} mins`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const togglePlayPause = (journalId: string) => {
    const audio = audioRefs.current[journalId];
    if (!audio) return;

    if (playingId === journalId) {
      audio.pause();
      setPlayingId(null);
    } else {
      // Stop any currently playing audio
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId]?.pause();
      }
      audio.play();
      setPlayingId(journalId);
    }
  };

  const setAudioRef = (journalId: string, element: HTMLAudioElement | null) => {
    audioRefs.current[journalId] = element;
  };

  // Cleanup audio refs when journals change
  useEffect(() => {
    return () => {
      // Stop all playing audio when component unmounts
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
        }
      });
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-6 sm:py-8">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-cyan-500 mx-auto"></div>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Loading audio journals...</p>
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8">
        <p className="text-slate-500 text-sm sm:text-base mb-2">No audio journals yet</p>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">Start recording to see your entries here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Your Journals</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {journals.map((journal) => (
          <div 
            key={journal.id} 
            className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            {/* Play Button Overlay */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
              <button
                onClick={() => togglePlayPause(journal.id)}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg opacity-90 hover:opacity-100"
              >
                {playingId === journal.id ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                )}
              </button>
            </div>

            {/* Journal Content */}
            <div className="pr-12 sm:pr-16">
              <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">
                {journal.title || 'Audio Entry'}
              </h4>
              
              <div className="space-y-1 text-xs sm:text-sm text-slate-500">
                <div>
                  {formatDate(journal.createdAt)}, {formatTime(journal.createdAt)}
                </div>
                <div className="font-medium">
                  {formatDuration(journal.duration)}
                </div>
              </div>
            </div>

            {/* Hidden Audio Element */}
            <audio
              ref={(el) => setAudioRef(journal.id, el)}
              src={journal.audioUrl}
              onEnded={() => setPlayingId(null)}
              className="hidden"
            />

            {/* Delete Button */}
            <button
              onClick={() => onDelete(journal.id)}
              className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all p-2 hover:bg-red-50 rounded-xl"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
