 'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, BookOpen, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface WritingJournal {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  mood?: string;
}

export default function JournalViewPage() {
  const params = useParams();
  const router = useRouter();
  const [journal, setJournal] = useState<WritingJournal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const journalId = params.id as string;

  useEffect(() => {
    fetchJournal();
  }, [journalId]);

  const fetchJournal = async () => {
    try {
      setLoading(true);
      // Since we don't have a get by ID endpoint, we'll fetch all and filter
      const response = await fetch('/api/student/journals/writing');
      const result = await response.json();
      
      if (result.success) {
        const foundJournal = result.data.find((j: WritingJournal) => j.id === journalId);
        if (foundJournal) {
          setJournal(foundJournal);
          setEditTitle(foundJournal.title || '');
          setEditContent(foundJournal.content);
        } else {
          toast.error('Journal not found');
          router.push('/students/journaling');
        }
      } else {
        toast.error('Failed to fetch journal');
      }
    } catch (error) {
      console.error('Error fetching journal:', error);
      toast.error('Error loading journal');
    } finally {
      setLoading(false);
    }
  };

  const deleteJournal = async () => {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/student/journals/writing/${journalId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Journal deleted successfully');
        router.push('/students/selfhelptools/journaling/all');
      } else {
        toast.error(result.error?.message || 'Failed to delete journal');
      }
    } catch (error) {
      console.error('Error deleting journal:', error);
      toast.error('Error deleting journal');
    }
  };

  const saveEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    try {
      // Note: You'll need to implement an update endpoint in the API
      toast.info('Update functionality coming soon');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating journal:', error);
      toast.error('Error updating journal');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditTitle(journal?.title || '');
    setEditContent(journal?.content || '');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="text-slate-500 mt-4 ml-4">Loading journal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Journal Not Found</h2>
            <p className="text-slate-500 mb-6">The journal you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/students/journaling')}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-colors"
            >
              Back to Journals
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/students/selfhelptools/journaling/all')}
            className="flex items-center gap-2 text-[#73829A] hover:text-[#1a9bcc] transition-colors group mb-6"
          >
            <ArrowLeft className="w-4 h-5" />
            <span className="text-[13px] sm:text-[16px]">Back to your Journals</span>
          </button>

          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-2xl font-bold text-slate-900 bg-transparent border-b-2 border-blue-300 outline-none"
                      placeholder="Enter title..."
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-slate-900">
                      {journal.title || 'Untitled Entry'}
                    </h1>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(journal.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-cyan-500 hover:bg-cyan-50 rounded-xl transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={deleteJournal}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="border-t border-slate-100 pt-6">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[400px] p-4 border border-slate-200 rounded-xl outline-none focus:border-blue-300 resize-none text-slate-700 leading-relaxed"
                  placeholder="Start writing here..."
                />
              ) : (
                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-lg">
                    {journal.content}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 italic">
                  Your words are safe and private
                </p>
                <div className="text-sm text-slate-400">
                  {journal.content.length} characters
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
