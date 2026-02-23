'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import JournalHeader from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/Writing/JournalHeader';
import JournalEditor from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/Writing/JournalEditor';
import MoodSelector from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/MoodSelector';
import PastEntries from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/Writing/PastEntries';
import WritingPrompts from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/Writing/WritingPrompts';
import AudioRecorder from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/Audio/AudioRecorder';
import AudioJournalList from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/Audio/AudioJournalList';
// import ArtCanvas from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/Art/ArtCanvas';
// import ArtJournalList from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/Art/ArtJournalList';
import { Book, BookOpen, ChevronLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import JournalTabs from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/JournalTabs';
import DrawingCanvas from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/Art/DrawingCanvas';
import JournalHistory from '@/src/components/StudentDashboard/SelfHelpTools/Journaling/Art/JournalHistory';
import StudentLayout from '@/src/components/StudentDashboard/Layout/StudentLayout';

interface WritingJournal {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  mood?: string;
}

interface AudioJournal {
  id: string;
  title: string | null;
  audioUrl: string;
  duration: number;
  createdAt: string;
}

interface ArtJournal {
  id: string;
  imageUrl: string;
  createdAt: string;
}

export default function JournalingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'writing' | 'audio' | 'art'>('writing');
  const [writingJournals, setWritingJournals] = useState<WritingJournal[]>([]);
  const [audioJournals, setAudioJournals] = useState<AudioJournal[]>([]);
  const [artJournals, setArtJournals] = useState<ArtJournal[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [artMood, setArtMood] = useState<string | null>(null);
  
  // Admin configuration state
  const [journalingConfig, setJournalingConfig] = useState<{
    writingEnabled: boolean;
    audioEnabled: boolean;
    artEnabled: boolean;
    maxAudioDuration?: number;
    enableUndo?: boolean;
    enableRedo?: boolean;
    enableClearCanvas?: boolean;
  } | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Load color palette setting from localStorage
  const loadColorPaletteFromStorage = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('artColorPaletteEnabled');
      return saved !== null ? JSON.parse(saved) : true; // Default to true
    }
    return true;
  };

  // Fetch journaling configuration for student's school
  const fetchJournalingConfig = async () => {
    try {
      const response = await fetch('/api/student/journaling/config', {
        headers: {
          "x-user-id": "student", // This will be replaced by actual user ID
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const config = {
          writingEnabled: data.data.enableWriting || false,
          audioEnabled: data.data.enableAudio || false,
          artEnabled: data.data.enableArt || false,
          maxAudioDuration: data.data.maxAudioDuration,
          enableUndo: data.data.enableUndo,
          enableRedo: data.data.enableRedo,
          enableClearCanvas: data.data.enableClearCanvas,
          enableColorPalette: loadColorPaletteFromStorage(), // Load from localStorage
        };
        
        setJournalingConfig(config);
        
        // Set default tab to first enabled type
        if (data.data.enableWriting) {
          setActiveTab('writing');
        } else if (data.data.enableAudio) {
          setActiveTab('audio');
        } else if (data.data.enableArt) {
          setActiveTab('art');
        }
      } else {
        console.error('Failed to load journaling configuration:', data);
      }
    } catch (error) {
      console.error('Failed to fetch journaling config:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  // Load configuration on mount
  useEffect(() => {
    fetchJournalingConfig();
  }, []);

  // Fetch journals on component mount and tab change
  useEffect(() => {
    if (activeTab === 'writing') {
      fetchWritingJournals();
    } else if (activeTab === 'audio') {
      fetchAudioJournals();
    } else if (activeTab === 'art') {
      fetchArtJournals();
    }
  }, [activeTab]);

  const fetchWritingJournals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/journals/writing');
      const result = await response.json();
      
      if (result.success) {
        setWritingJournals(result.data);
      } else {
        toast.error('Failed to fetch writing journals');
      }
    } catch (error) {
      console.error('Error fetching writing journals:', error);
      toast.error('Error loading writing journals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAudioJournals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/journals/audio');
      const result = await response.json();
      
      if (result.success) {
        setAudioJournals(result.data);
      } else {
        toast.error('Failed to fetch audio journals');
      }
    } catch (error) {
      console.error('Error fetching audio journals:', error);
      toast.error('Error loading audio journals');
    } finally {
      setLoading(false);
    }
  };

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

  const handlePromptSelect = (prompt: string) => {
    setContent(prev => prev ? `${prev}\n\n${prompt}` : prompt);
  };

  const viewAllJournals = () => {
    router.push('/students/selfhelptools/journaling/all');
  };

  const viewAllArtJournals = () => {
    router.push('/students/selfhelptools/journaling/art-gallery');
  };

  const saveJournal = async () => {
    if (!content.trim()) {
      toast.error('Please write something before saving');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/student/journals/writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || 'Untitled Journal',
          content: content.trim(),
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Journal saved successfully!');
        setTitle('');
        setContent('');
        setSelectedMood(null);
        fetchWritingJournals(); // Refresh the list
      } else {
        toast.error(result.error?.message || 'Failed to save journal');
      }
    } catch (error) {
      console.error('Error saving journal:', error);
      toast.error('Error saving journal');
    } finally {
      setLoading(false);
    }
  };

  const deleteJournal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/student/journals/writing/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Journal deleted successfully');
        fetchWritingJournals(); // Refresh the list
      } else {
        toast.error(result.error?.message || 'Failed to delete journal');
      }
    } catch (error) {
      console.error('Error deleting journal:', error);
      toast.error('Error deleting journal');
    } finally {
      setLoading(false);
    }
  };

  const saveAudioJournal = async (audioBlob: Blob, duration: number, title?: string) => {
    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration', duration.toString());
      formData.append('title', title || '');

      const response = await fetch('/api/student/journals/audio', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Audio journal saved successfully!');
        fetchAudioJournals(); // Refresh the list
      } else {
        toast.error(result.error?.message || 'Failed to save audio journal');
      }
    } catch (error) {
      console.error('Error saving audio journal:', error);
      toast.error('Error saving audio journal');
    } finally {
      setLoading(false);
    }
  };

  const deleteAudioJournal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audio journal entry?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/student/journals/audio/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Audio journal deleted successfully');
        fetchAudioJournals(); // Refresh the list
      } else {
        toast.error(result.error?.message || 'Failed to delete audio journal');
      }
    } catch (error) {
      console.error('Error deleting audio journal:', error);
      toast.error('Error deleting audio journal');
    } finally {
      setLoading(false);
    }
  };

  const saveArtJournal = async (imageDataUrl: string) => {
    try {
      setLoading(true);
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', blob, 'art-journal.png');

      const uploadResponse = await fetch('/api/student/journals/art', {
        method: 'POST',
        body: formData,
      });

      const result = await uploadResponse.json();
      
      if (result.success) {
        toast.success('Art journal saved successfully!');
        fetchArtJournals(); // Refresh the list
      } else {
        toast.error(result.error?.message || 'Failed to save art journal');
      }
    } catch (error) {
      console.error('Error saving art journal:', error);
      toast.error('Error saving art journal');
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
        fetchArtJournals(); // Refresh the list
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

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#F3F6F8] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {configLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading journaling configuration...</p>
            </div>
          </div>
        ) : journalingConfig && !journalingConfig.writingEnabled && !journalingConfig.audioEnabled && !journalingConfig.artEnabled ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Journaling Not Available</h3>
              <p className="text-gray-600">Journaling tools are not currently enabled for your school. Please contact your administrator for more information.</p>
            </div>
          </div>
        ) : (
          <>
            <JournalHeader activeTab={activeTab} onTabChange={setActiveTab} viewAllJournals={viewAllJournals} viewAllArtJournals={viewAllArtJournals} />
            <JournalTabs activeTab={activeTab} setActiveTab={setActiveTab} config={journalingConfig || undefined} />
            <div className="mt-8">
              {activeTab === 'writing' ? (
                <div>
                  <MoodSelector selectedMood={selectedMood} onMoodSelect={setSelectedMood} />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <JournalEditor
                        title={title}
                        content={content}
                        onTitleChange={setTitle}
                        onContentChange={setContent}
                        onSave={saveJournal}
                        onClear={() => {
                          setTitle('');
                          setContent('');
                          setSelectedMood(null);
                        }}
                        loading={loading}
                      />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                      <div id="writing-prompts">
                        <WritingPrompts onPromptSelect={handlePromptSelect} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'audio' ? (
                <div className="space-y-8">
                  <div className="max-w-4xl mx-auto">
                    <AudioRecorder onRecordingComplete={saveAudioJournal} />
                  </div>
                  <div className="max-w-4xl mx-auto">
                    <AudioJournalList 
                      journals={audioJournals} 
                      onDelete={deleteAudioJournal}
                      loading={loading}
                    />
                  </div>
                </div>
              ) : (
                <div className="min-h-screen bg-[#F3F6F8] font-sans selection:bg-cyan-200 selection:text-cyan-900 pb-20">
                  {/* <main className="max-w-6xl mx-auto px-6 pt-8"> */}
                    <MoodSelector selectedMood={artMood} onMoodSelect={setArtMood} />
                    <div className="bg-[#FFF5EC] sm:h-[79px] border border-[#FF7A1E] rounded-[20px] sm:rounded-[32px] sm:p-6 p-3 -mt-3 mb-8 flex items-center justify-between shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                      <h3 className="text-[#BF570F] font-base sm:pl-5 text-[13px] sm:text-[20px] z-10">Create Waves that Carry your feelings away ?</h3>
                      <button className="bg-[#FCEEDD] hover:bg-[#FFCC80] text-[#E65100] px-3 py-1 sm:px-6 sm:py-2 rounded-[12px] font-semibold text-sm flex items-center gap-2 transition-all shadow-sm z-10">
                        <Sparkles className="w-4 h-4" />
                        New
                      </button>
                    </div>
                    {/* {artJournals.length > 0 && (
                      <div className="flex justify-center mt-8 mb-8">
                        <Link 
                          href="/students/selfhelptools/journaling/art-gallery"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                        >
                          <span>🎨</span>
                          <span>View All Art Journals</span>
                        </Link>
                      </div>
                    )} */}
                    <DrawingCanvas onSave={saveArtJournal} loading={loading} config={journalingConfig || undefined} />
                    <div className="flex justify-center mt-10">
                      <button 
                        onClick={() => {
                          const canvas = document.querySelector('canvas');
                          if (canvas) {
                            const imageDataUrl = canvas.toDataURL('image/png');
                            saveArtJournal(imageDataUrl);
                          }
                        }}
                        disabled={loading}
                        className="bg-gradient-to-b from-[#67CCFF] to-[#1B9EE0]  disabled:bg-gray-400 text-white px-16 py-4 rounded-[24px] font-bold text-lg shadow-lg shadow-blue-400/30 hover:shadow-xl hover:shadow-blue-400/40 hover:-translate-y-1 transition-all duration-300 w-full md:w-auto "
                      >
                        {loading ? 'Saving...' : 'Save Journal'}
                      </button>
                    </div>
                  {/* </main> */}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  </StudentLayout>
  );
}
