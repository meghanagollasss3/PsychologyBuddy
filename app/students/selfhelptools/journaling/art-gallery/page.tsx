'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Trash2, Download, Eye, Grid, List } from 'lucide-react';
import { toast } from 'sonner';
import StudentLayout from '@/src/components/StudentDashboard/Layout/StudentLayout';
import Link from 'next/link';

interface ArtJournal {
  id: string;
  imageUrl: string;
  createdAt: string;
}

export default function ArtGalleryPage() {
  const [artJournals, setArtJournals] = useState<ArtJournal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<ArtJournal | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchArtJournals();
  }, []);

  const fetchArtJournals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/journals/art');
      const result = await response.json();
      
      if (result.success) {
        setArtJournals(result.data);
      } else {
        toast.error('Failed to fetch art journals');
      }
    } catch (error) {
      console.error('Error fetching art journals:', error);
      toast.error('Error loading art journals');
    } finally {
      setLoading(false);
    }
  };

  const deleteArtJournal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this art journal entry?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/student/journals/art/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Art journal deleted successfully');
        fetchArtJournals();
        if (selectedJournal?.id === id) {
          setSelectedJournal(null);
        }
      } else {
        toast.error(result.error?.message || 'Failed to delete art journal');
      }
    } catch (error) {
      console.error('Error deleting art journal:', error);
      toast.error('Error deleting art journal');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#F3F6F8] p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/students/selfhelptools/journaling"
                className="flex items-center gap-2 text-[#73829A] hover:text-[#1a9bcc] transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[16px]">Back to Journaling</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-1 flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Page Title */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/selfhelptools/journaling/paint.svg"
                  alt="Editor"
                  className="w-[45px] h-[45px] sm:w-[63px] sm:h-[63px]"
                />

                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Your Journals
                  </h1>
                  <p className="text-slate-500 text-sm">
                    View and manage all your journal entries
                  </p>
                </div>
              </div>

            
            </div>
          </div>

          {loading && artJournals.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : artJournals.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Art Journals Yet</h3>
              <p className="text-gray-500 mb-6">Start creating your first masterpiece in the journaling section!</p>
              <Link 
                href="/students/journaling"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                <span>Create Your First Art Journal</span>
              </Link>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid h-[291px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {artJournals.map((journal) => (
                <div 
                  key={journal.id} 
                  className={`bg-white rounded-[24px] border border-[#1C76DC] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group ${
                    viewMode === 'list' ? 'flex gap-4 p-4' : ''
                  }`}
                >
                  <div className={viewMode === 'grid' ? 'aspect-square relative' : 'w-32 h-32 flex-shrink-0 relative'}>
                    <img 
                      src={journal.imageUrl} 
                      alt="Art journal entry" 
                      className={`w-full h-[191px] object-contain ${viewMode === 'grid' ? 'cursor-pointer hover:scale-105 transition-transform' : 'rounded-xl'}`}
                      onClick={() => viewMode === 'grid' && setSelectedJournal(journal)}
                    />
                    
                    {/* Overlay Actions */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 pointer-events-none ${
                      viewMode === 'grid' ? '' : 'opacity-100'
                    }`}>
                      <div className="text-white text-xs">
                        {formatDate(journal.createdAt)}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJournal(journal);
                          }}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors pointer-events-auto"
                          title="View full size"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(journal.imageUrl, `art-journal-${journal.id}.png`);
                          }}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors pointer-events-auto"
                          title="Download image"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteArtJournal(journal.id);
                          }}
                          disabled={loading}
                          className="p-2 bg-red-500/80 backdrop-blur-sm rounded-full text-white hover:bg-red-600 transition-colors disabled:opacity-50 pointer-events-auto"
                          title="Delete artwork"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {viewMode === 'list' && (
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{formatDate(journal.createdAt)}</p>
                        <p className="text-xs text-gray-400 mt-1">Art Journal Entry</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedJournal(journal)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View full size"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadImage(journal.imageUrl, `art-journal-${journal.id}.png`)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download image"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteArtJournal(journal.id)}
                          disabled={loading}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete artwork"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full Size Image Modal */}
        {selectedJournal && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedJournal(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Art Journal Entry</h3>
                  <p className="text-sm text-gray-600">{formatDate(selectedJournal.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadImage(selectedJournal.imageUrl, `art-journal-${selectedJournal.id}.png`)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download image"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      deleteArtJournal(selectedJournal.id);
                      setSelectedJournal(null);
                    }}
                    disabled={loading}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete artwork"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedJournal(null)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <img 
                  src={selectedJournal.imageUrl} 
                  alt="Art journal entry full size" 
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
