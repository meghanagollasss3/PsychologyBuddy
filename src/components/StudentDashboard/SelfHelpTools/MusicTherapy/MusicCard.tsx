'use client';

import React from 'react';
import { Play, Clock, Music } from 'lucide-react';

export interface MusicCardProps {
  id: string;
  title: string;
  description: string; 
  url: string;
  duration: number;
  artist?: string;
  album?: string;
  coverImage?: string;
  onClick?: () => void;
}

export interface CardProps {
  categories: any;
  id: string;
  title: string;
  description: string;
  duration: string;
  tracks: string;
  image?: string;
  coverImage?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  coverArt?: string;
  url: string;
  artist?: string;
  album?: string;
  type?: 'music' | 'meditation';
}

export default function MusicCard({
  id,
  title,
  description,
  url,
  duration,
  artist,
  album,
  coverImage,
  onClick
}: MusicCardProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClick}
      className="group w-auto sm:w-[399px] bg-white rounded-[13px] hover:shadow-xl hover:shadow-[#15A0EA33]/20 transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="h-[120px] sm:h-[140px] lg:h-[160px] w-full relative">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover opacity-90 rounded-tl-[13px] rounded-tr-[13px]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play className="w-6 h-6 text-blue-500 ml-1" />
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(duration)}</span>
          </div>
          {artist && (
            <div className="truncate max-w-[120px]">
              {artist}
            </div>
          )}
        </div>
        
        {album && (
          <div className="text-xs text-gray-500 mt-1 truncate">
            {album}
          </div>
        )}
      </div>
    </div>
  );
}
