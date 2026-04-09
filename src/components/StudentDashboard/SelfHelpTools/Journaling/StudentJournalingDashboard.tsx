'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import JournalTabs from './JournalTabs';
import WritingJournalEditor from './Writing/JournalEditor';
import WritingPrompts from './Writing/WritingPrompts';
import PastEntries from './Writing/PastEntries';
import AudioRecorder from './Audio/AudioRecorder';
import AudioJournalList from './Audio/AudioJournalList';
import DrawingCanvas from './Art/DrawingCanvas';
import JournalHistory from './Art/JournalHistory';
import MoodSelector from './MoodSelector';
import Header from './Header';

interface JournalingConfig {
  writingEnabled: boolean;
  audioEnabled: boolean;
  artEnabled: boolean;
  maxAudioDuration?: number;
  enableUndo?: boolean;
  enableRedo?: boolean;
  enableClearCanvas?: boolean;
  enableColorPalette?: boolean;
}

export default function StudentJournalingDashboard() {
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'writing' | 'audio' | 'art'>('writing');
  const [config, setConfig] = useState<JournalingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  
  // Writing journal state
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  
  // Fetch journaling configuration for student's school
  const fetchJournalingConfig = async () => {
    console.log('=== STUDENT CONFIG FETCH START ===');
    console.log('Student user:', user);
    
    try {
      const response = await fetch('/api/student/journaling/config', {
        headers: {
          "x-user-id": user?.id || "",
        },
      });
      
      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.success && data.data) {
        const newConfig = {
          writingEnabled: data.data.enableWriting || false,
          audioEnabled: data.data.enableAudio || false,
          artEnabled: data.data.enableArt || false,
          maxAudioDuration: data.data.maxAudioDuration,
          enableUndo: data.data.enableUndo,
          enableRedo: data.data.enableRedo,
          enableClearCanvas: data.data.enableClearCanvas,
          enableColorPalette: data.data.enableColorPalette,
        };
        
        console.log('Setting config to:', newConfig);
        setConfig(newConfig);
        
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
      setLoading(false);
      console.log('=== STUDENT CONFIG FETCH END ===');
    }
  };
  
  // Handle prompt selection
  const handlePromptSelect = (prompt: string) => {
    console.log('Dashboard - handlePromptSelect called with:', prompt);
    setSelectedPrompt(prompt);
    // Auto-generate title from prompt if no title exists
    if (!journalTitle.trim()) {
      // Create a shorter title from the prompt (first 50 characters)
      const titleFromPrompt = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
      setJournalTitle(titleFromPrompt);
    }
  };

  // Save writing journal
  const saveWritingJournal = async () => {
    if (!journalContent.trim()) {
      console.error('Please write something before saving');
      return;
    }
    
    setIsSavingJournal(true);
    try {
      const response = await fetch('/api/student/journals/writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          title: journalTitle || 'Untitled Entry',
          content: selectedPrompt ? `Prompt: ${selectedPrompt}\n\n${journalContent}` : journalContent,
          mood: selectedMood,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Journal entry saved successfully');
        
        // Clear form
        setJournalTitle('');
        setJournalContent('');
        setSelectedPrompt(null);
        setSelectedMood(null);
        
        // Refresh past entries
        // This would trigger a refresh of the PastEntries component
      } else {
        console.error('Failed to save journal entry:', data.error);
      }
    } catch (error) {
      console.error('Failed to save journal:', error);
    } finally {
      setIsSavingJournal(false);
    }
  };
  
  // Load configuration on mount
  useEffect(() => {
    fetchJournalingConfig();
  }, [user?.id]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading journaling tools...</p>
        </div>
      </div>
    );
  }
  
  // If no journaling types are enabled
  if (!config?.writingEnabled && !config?.audioEnabled && !config?.artEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center">
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm max-w-sm sm:max-w-md mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">📝</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Journaling Not Available</h3>
              <p className="text-sm sm:text-base text-gray-600">Journaling tools are not currently enabled for your school. Please contact your administrator for more information.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
   
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Header />
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Journal Space</h1>
          <p className="text-sm sm:text-base text-gray-600">Express yourself through writing, audio, or art</p>
        </div>
        
        {/* Journal Tabs */}
        <JournalTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          config={config || undefined}
        />
        
        {/* Mood Selector */}
        <div className="mb-6">
          <MoodSelector 
            selectedMood={selectedMood}
            onMoodSelect={setSelectedMood}
          />
        </div>
        
        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'writing' && config?.writingEnabled && (
            <div className="space-y-4 sm:space-y-6">
              <WritingPrompts onPromptSelect={handlePromptSelect} />
              <WritingJournalEditor
                title={journalTitle}
                content={journalContent}
                prompt={selectedPrompt || undefined}
                onTitleChange={setJournalTitle}
                onContentChange={setJournalContent}
                onSave={saveWritingJournal}
                onClear={() => {
                  setJournalTitle('');
                  setJournalContent('');
                  setSelectedPrompt(null);
                }}
                loading={isSavingJournal}
              />
              {/* PastEntries will be implemented with proper props later */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Past Entries</h3>
                <p className="text-sm sm:text-base text-gray-500">Your past journal entries will appear here.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'audio' && config?.audioEnabled && (
            <div className="space-y-4 sm:space-y-6">
              {/* AudioRecorder will be implemented with proper props later */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Audio Recorder</h3>
                <p className="text-sm sm:text-base text-gray-500">Audio recording will be available here.</p>
              </div>
              {/* AudioJournalList will be implemented with proper props later */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Audio Journal History</h3>
                <p className="text-sm sm:text-base text-gray-500">Your audio journal entries will appear here.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'art' && config?.artEnabled && (
            <div className="space-y-4 sm:space-y-6">
              {/* DrawingCanvas will be implemented with proper props later */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Art Canvas</h3>
                <p className="text-sm sm:text-base text-gray-500">Drawing canvas will be available here.</p>
              </div>
              {/* JournalHistory will be implemented with proper props later */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Art Journal History</h3>
                <p className="text-sm sm:text-base text-gray-500">Your art journal entries will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
