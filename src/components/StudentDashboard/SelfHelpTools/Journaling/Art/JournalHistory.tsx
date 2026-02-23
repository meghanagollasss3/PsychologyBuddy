'use client';
import * as React from 'react';
import { Clock, Trash2, Smile } from 'lucide-react';

interface ArtJournal {
  id: string;
  imageUrl: string;
  createdAt: string;
}

interface JournalHistoryProps {
  journals: ArtJournal[];
  onDelete: (id: string) => void;
  loading: boolean;
}

export default function JournalHistory({ journals, onDelete, loading }: JournalHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="mt-8 sm:mt-12">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 6.477 2 12s4.477 10 10z"/><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74-9.94M9.69 12"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">Your Journals</h3>
          <p className="text-gray-500 text-sm sm:text-base">See Your Latest Journals</p>
        </div>
      </div>

      {journals.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm sm:text-base mb-2">No art journals yet. Start creating your first masterpiece!</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Your drawings will be saved privately and securely</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {journals.map((journal, idx) => (
            <div key={journal.id} className="relative group cursor-pointer">
              <div className={`h-32 sm:h-40 w-full bg-white rounded-2xl border ${idx === 0 ? 'border-gray-400 shadow-lg' : 'border-blue-200'} overflow-hidden relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                <img 
                  src={journal.imageUrl} 
                  alt="Art journal entry" 
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay for Active/First Item */}
                {idx === 0 && (
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4">
                      <div className="flex items-center justify-between text-white/90 text-xs font-medium">
                         <div>
                            {formatDate(journal.createdAt)}, {formatTime(journal.createdAt)}
                         </div>
                         <button 
                           onClick={() => onDelete(journal.id)}
                           disabled={loading}
                           className="hover:text-red-400 transition-colors disabled:opacity-50"
                         >
                           <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                         </button>
                      </div>
                   </div>
                )}
              </div>

              {/* Delete button for other items */}
              {idx !== 0 && (
                <button 
                  onClick={() => onDelete(journal.id)}
                  disabled={loading}
                  className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all p-2 hover:bg-red-50 rounded-xl"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
