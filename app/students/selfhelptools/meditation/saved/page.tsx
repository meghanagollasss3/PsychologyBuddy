'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Heart, Play, Clock, User } from 'lucide-react';
import { useToast } from "@/src/hooks/use-toast";
import { getStudentId } from "@/src/utils/auth";

interface MeditationResource {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  audioUrl: string;
  videoUrl: string;
  durationSec: number;
  instructor?: string;
  type: 'audio' | 'video';
  status: string;
  categories: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  goals: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  moods: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  savedAt: string;
  isSaved: boolean;
}

interface CardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'audio' | 'video';
  image: string;
  url: string;
  instructor?: string;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onPlay: (meditation: MeditationResource) => void;
}

function SavedMeditationCard({
  id,
  title,
  description,
  duration,
  type,
  image,
  url,
  instructor,
  isSaved,
  onToggleSave,
  onPlay
}: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-blue-500 ml-1" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play className="w-6 h-6 text-blue-500 ml-1" />
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{duration}</span>
          </div>
          <span className="capitalize">{type}</span>
        </div>
        
        {instructor && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <User className="w-3 h-3" />
            <span>{instructor}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onPlay({
              id,
              title,
              description,
              thumbnailUrl: image,
              audioUrl: url,
              videoUrl: url,
              durationSec: 0,
              instructor,
              type,
              status: 'PUBLISHED',
              categories: [],
              goals: [],
              moods: [],
              savedAt: new Date().toISOString(),
              isSaved
            })}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Play
          </button>
          <button
            onClick={() => onToggleSave(id)}
            className={`p-2 rounded-lg transition-colors ${
              isSaved
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SavedMeditationsPage() {
  const [savedMeditations, setSavedMeditations] = useState<MeditationResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CardProps | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const { toast } = useToast();

  // Fetch saved meditations on component mount
  useEffect(() => {
    fetchSavedMeditations();
  }, []);

  const fetchSavedMeditations = async () => {
    try {
      setLoading(true);
      const studentId = getStudentId();
      const response = await fetch(`/api/student/saved-meditations?studentId=${studentId}`);
      const result = await response.json();
      
      if (result.success) {
        setSavedMeditations(result.data);
        console.log('📚 Loaded saved meditations:', result.data.length);
      } else {
        toast({
          title: result.message || 'Failed to fetch saved meditations',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching saved meditations:', error);
      toast({
        title: 'Failed to fetch saved meditations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (meditationId: string) => {
    try {
      const studentId = getStudentId();
      
      const response = await fetch('/api/student/saved-meditations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meditationId,
          studentId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        if (result.isSaved) {
          toast({
            title: 'Added to saved items'
          });
        } else {
          setSavedMeditations(prev => prev.filter(m => m.id !== meditationId));
          toast({
            title: 'Removed from saved items'
          });
        }
      } else {
        toast({
          title: result.message || 'Failed to save meditation',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: 'Failed to save meditation',
        variant: 'destructive'
      });
    }
  };

  const handleCardClick = (meditation: MeditationResource) => {
    const mediaUrl = meditation.type === 'audio' ? meditation.audioUrl : meditation.videoUrl;
    
    setSelectedCard({
      id: meditation.id,
      title: meditation.title,
      description: meditation.description,
      url: mediaUrl,
      duration: formatDuration(meditation.durationSec || 0),
      type: meditation.type,
      image: meditation.thumbnailUrl || "https://picsum.photos/seed/meditation/400/400",
      instructor: meditation.instructor,
      isSaved: meditation.isSaved,
      onToggleSave: toggleSave,
      onPlay: handleCardClick
    });
    setShowPlayer(true);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} mins`;
  };

  const goBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading saved meditations...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Saved Meditations Grid */}
        {savedMeditations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedMeditations.map((meditation) => (
              <SavedMeditationCard
                key={meditation.id}
                id={meditation.id}
                title={meditation.title}
                description={meditation.description}
                duration={formatDuration(meditation.durationSec || 0)}
                type={meditation.type}
                image={meditation.thumbnailUrl || "https://picsum.photos/seed/meditation/400/400"}
                url={meditation.type === 'audio' ? meditation.audioUrl : meditation.videoUrl}
                instructor={meditation.instructor}
                isSaved={meditation.isSaved}
                onToggleSave={toggleSave}
                onPlay={handleCardClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved meditations</h3>
            <p className="text-gray-600 mb-6">Start saving meditations to build your personal collection</p>
            <button
              onClick={goBack}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse Meditations
            </button>
          </div>
        )}

        {/* Player Modal */}
        {showPlayer && selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedCard.title}</h2>
                    <p className="text-gray-600">{selectedCard.description}</p>
                  </div>
                  <button
                    onClick={() => setShowPlayer(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                
                {selectedCard.url && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                    {selectedCard.type === 'audio' ? (
                      <audio
                        src={selectedCard.url}
                        controls
                        className="w-full h-full"
                      />
                    ) : (
                      <video
                        src={selectedCard.url}
                        controls
                        className="w-full h-full"
                      />
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span>{selectedCard.duration}</span>
                    {selectedCard.instructor && (
                      <span className="ml-4">Instructor: {selectedCard.instructor}</span>
                    )}
                  </div>
                  <button
                    onClick={() => selectedCard.onToggleSave(selectedCard.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedCard.isSaved
                        ? 'bg-red-50 text-red-500 hover:bg-red-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${selectedCard.isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
