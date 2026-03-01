"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { ChevronLeft, Heart, Play, Clock, User } from "lucide-react";
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

/* -----------------------------------------------------
   UPDATED MUSIC CARD — MATCHES JOURNAL UI PERFECTLY
------------------------------------------------------ */
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
  onPlay,
}: CardProps) {
  return (
    <div
      className="
        bg-white rounded-3xl p-4 border border-slate-100 
        shadow-sm hover:shadow-lg hover:shadow-blue-500/5 
        transition-all cursor-pointer group
      "
    >
      {/* Thumbnail */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Play overlay */}
        <div
          onClick={() =>
            onPlay({
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
              categories,
            })
          }
          className="
            absolute inset-0 bg-black/0 group-hover:bg-black/30 
            transition-all flex items-center justify-center
          "
        >
          <div
            className="
            w-12 h-12 rounded-full bg-white shadow-md opacity-0 
            group-hover:opacity-100 flex items-center justify-center 
            transition-all
          "
          >
            <Play className="w-6 h-6 text-blue-500 ml-1" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>

          <p className="text-sm text-slate-500 mb-2 line-clamp-2">
            {description}
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{duration}</span>
            </div>

            <span className="text-slate-400">{tracks}</span>
          </div>

          {artist && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <User className="w-3 h-3" />
              <span>{artist}</span>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={() => onToggleSave(id)}
          className={`
            p-2 rounded-xl transition-all 
            ${isSaved ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"}
          `}
        >
          <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>
    </div>
  );
}

/* -----------------------------------------------------
   MAIN PAGE
------------------------------------------------------ */
export default function SavedMusicPage() {
  const [selectedCard, setSelectedCard] = useState<MusicResource | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const { toast } = useToast();

  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data: savedRes, isLoading } = useSWR(
    `/api/student/saved-music?studentId=${getStudentId()}`,
    fetcher
  );

  const savedMusic: MusicResource[] = savedRes?.data || [];

  /* ----- Toggle Saved Status ----- */
  const toggleSave = async (musicId: string) => {
    try {
      const studentId = getStudentId();
      const res = await fetch("/api/student/saved-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicId, studentId }),
      });
      const result = await res.json();

      toast({
        title: result.isSaved
          ? "Added to saved music"
          : "Removed from saved music",
      });
    } catch (err) {
      toast({ title: "Unable to update item", variant: "destructive" });
    }
  };

  const handleCardClick = (music: MusicResource) => {
    setSelectedCard(music);
    setShowPlayer(true);
  };

  const formatDuration = (seconds: number) =>
    `${Math.floor(seconds / 60)} mins`;

  const goBack = () => window.history.back();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <button
            onClick={goBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-900">
            Saved Music
          </h1>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Music Cards Grid */}
        {savedMusic.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedMusic.map((m) => (
              <SavedMusicCard
                key={m.id}
                id={m.id}
                title={m.title}
                description={m.description}
                url={m.url}
                duration={formatDuration(m.duration || 0)}
                tracks={`${Math.floor(Math.random() * 20) + 8} Tracks`}
                image={m.coverImage || "https://picsum.photos/seed/music/400/400"}
                artist={m.artist}
                album={m.album}
                categories={m.categories}
                isSaved={m.isSaved}
                onToggleSave={toggleSave}
                onPlay={handleCardClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No saved music
            </h3>
            <p className="text-gray-600 mb-6">
              Start saving music to build your personal collection.
            </p>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedCard.title}
                  </h2>
                  <p className="text-gray-600">{selectedCard.description}</p>
                </div>
                <button
                  onClick={() => setShowPlayer(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                <audio src={selectedCard.url} controls className="w-full h-full" />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{formatDuration(selectedCard.duration)}</span>
                {selectedCard.artist && <span>Artist: {selectedCard.artist}</span>}
                <button
                  onClick={() => toggleSave(selectedCard.id)}
                  className={`
                    p-2 rounded-xl transition-colors 
                    ${selectedCard.isSaved ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"}
                  `}
                >
                  <Heart className={`w-5 h-5 ${selectedCard.isSaved ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}