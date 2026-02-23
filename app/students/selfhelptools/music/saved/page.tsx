'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { ChevronLeft, Heart, Play, Clock, User } from 'lucide-react';
import { useToast } from "@/src/hooks/use-toast";
import { getStudentId } from "@/src/utils/auth";

interface MusicResource {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number;
  artist?: string;
  album?: string;
  coverImage?: string;
  savedAt: string;
  isSaved: boolean;
  categories: any[];
}

interface CardProps {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: string;
  tracks: string;
  image: string;
  artist?: string;
  album?: string;
  categories: any[];
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onPlay: (music: MusicResource) => void;
}

function SavedMusicCard({
  id,
  title,
  description,
  url,
  duration,
  tracks,
  image,
  artist,
  album,
  categories,
  isSaved,
  onToggleSave,
  onPlay
}: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 relative">
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
        
        {/* Play Button Overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center cursor-pointer"
          onClick={() => onPlay({
            id,
            title,
            description,
            url,
            duration: 0,
            artist,
            album,
            coverImage: image,
            savedAt: new Date().toISOString(),
            isSaved,
            categories
          })}
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play className="w-6 h-6 text-blue-500 ml-1" />
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{duration}</span>
          </div>
          <span>{tracks}</span>
        </div>
        
        {artist && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <User className="w-3 h-3" />
            <span>{artist}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onPlay({
              id,
              title,
              description,
              url,
              duration: 0,
              artist,
              album,
              coverImage: image,
              savedAt: new Date().toISOString(),
              isSaved,
              categories
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

export default function SavedMusicPage() {
  const [selectedCard, setSelectedCard] = useState<CardProps | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const { toast } = useToast();

  // Use SWR for data fetching
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data: savedRes, error, isLoading } = useSWR(
    `/api/student/saved-music?studentId=${getStudentId()}`,
    fetcher
  );
  
  const savedMusic = savedRes?.data || [];

  const toggleSave = async (musicId: string) => {
    try {
      const studentId = getStudentId();
      
      const response = await fetch('/api/student/saved-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          musicId,
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
          toast({
            title: 'Removed from saved items'
          });
        }
      } else {
        toast({
          title: result.message || 'Failed to save music',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: 'Failed to save music',
        variant: 'destructive'
      });
    }
  };

  const handleCardClick = (music: MusicResource) => {
    setSelectedCard({
      id: music.id,
      title: music.title,
      description: music.description,
      url: music.url,
      duration: formatDuration(music.duration || 0),
      tracks: `${Math.floor(Math.random() * 20) + 8} Tracks`,
      image: music.coverImage || "https://picsum.photos/seed/music/400/400",
      artist: music.artist,
      album: music.album,
      categories: music.categories,
      isSaved: music.isSaved,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading saved music...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={goBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">Saved Music</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Saved Music Grid */}
        {savedMusic.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedMusic.map((music: MusicResource) => (
              <SavedMusicCard
                key={music.id}
                id={music.id}
                title={music.title}
                description={music.description}
                url={music.url}
                duration={formatDuration(music.duration || 0)}
                tracks={`${Math.floor(Math.random() * 20) + 8} Tracks`}
                image={music.coverImage || "https://picsum.photos/seed/music/400/400"}
                artist={music.artist}
                album={music.album}
                categories={music.categories}
                isSaved={music.isSaved}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved music</h3>
            <p className="text-gray-600 mb-6">Start saving music to build your personal collection</p>
            <button
              onClick={goBack}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse Music
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
                    <audio
                      src={selectedCard.url}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span>{selectedCard.duration}</span>
                    {selectedCard.artist && (
                      <span className="ml-4">Artist: {selectedCard.artist}</span>
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
