'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { CardProps } from './MusicCard';

interface PlayerModalProps {
  card: CardProps;
  onClose: () => void;
  categories: any[];
}

export const PlayerModal = ({ card, onClose, categories }: PlayerModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTrack, setActiveTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);


  // Get tracks from the same category
  const getTracksFromSameCategory = async () => {
    try {
      // Get current music resources to find other tracks in same category
      const response = await fetch('/api/student/music/resources?limit=50');
      const result = await response.json();
      
      if (result.success) {
        const allMusic = result.data.resources || [];
        
        // Get the category names from the current card
        const currentCategoryNames = card.categories?.map((cat: any) => cat.category?.name).filter(Boolean) || [];
        
        // Find tracks that share the same category as the current card
        const sameCategoryTracks = allMusic.filter((music: { categories: any[]; id: string; }) => {
          // Skip the current track
          if (music.id === card.id) return false;
          
          // Check if music has categories and if any match the current card's categories
          return music.categories && music.categories.some(musicCat => 
            currentCategoryNames.includes(musicCat.category?.name)
          );
        });
        
        // Transform the tracks to the expected format
        const transformedTracks = sameCategoryTracks.map((music: any) => ({
          title: music.title,
          artist: music.artist || 'Unknown Artist',
          duration: `${Math.floor(music.duration / 60)}:${(music.duration % 60).toString().padStart(2, '0')}`,
          url: music.url
        }));
        
        // Combine current track with other tracks from same category
        const tracks = [
          { title: card.title, artist: card.artist || 'Unknown Artist', duration: card.duration, url: card.url }, 
          ...transformedTracks
        ];
        return tracks;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  };

  const [tracks, setTracks] = useState([
    { title: card.title, artist: card.artist || 'Unknown Artist', duration: card.duration, url: card.url }
  ]);


  // Load tracks from same category when component mounts
  useEffect(() => {
    const loadRelatedTracks = async () => {
      const relatedTracks = await getTracksFromSameCategory();
      if (relatedTracks.length > 1) {
        setTracks(relatedTracks);
      }
    };
    
    loadRelatedTracks();
  }, []);

  // Handle time updates and metadata loading
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      handleNextTrack();
    };

    const handleError = (e: any) => {
      const audio = audioRef.current;
      
      // Try to play next track if current track fails
      if (tracks.length > 1) {
        handleNextTrack();
      }
    };

    const handleCanPlay = () => {
      // Audio can play
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [activeTrack]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !tracks[activeTrack]?.url) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error, 'Track:', tracks[activeTrack]);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleTrackSelect = (index: number) => {
    if (!tracks[index]?.url) {
      console.error('Invalid track URL at index:', index, tracks[index]);
      return;
    }
    
    setActiveTrack(index);
    setIsPlaying(true);
    
    const audio = audioRef.current;
    if (audio && tracks[index].url !== audio.src) {
      audio.src = tracks[index].url;
      audio.load();
      audio.play().catch(error => {
        console.error('Error playing track:', error, 'Track:', tracks[index]);
        setIsPlaying(false);
      });
    }
  };

  const handleNextTrack = () => {
    const nextIndex = (activeTrack + 1) % tracks.length;
    if (!tracks[nextIndex]?.url) {
      console.error('Invalid next track URL at index:', nextIndex, tracks[nextIndex]);
      return;
    }
    
    setActiveTrack(nextIndex);
    setIsPlaying(true);
    
    const audio = audioRef.current;
    if (audio && tracks[nextIndex].url !== audio.src) {
      audio.src = tracks[nextIndex].url;
      audio.load();
      audio.play().catch(error => {
        console.error('Error playing next track:', error, 'Track:', tracks[nextIndex]);
        setIsPlaying(false);
      });
    }
  };

  const handlePreviousTrack = () => {
    const prevIndex = activeTrack === 0 ? tracks.length - 1 : activeTrack - 1;
    if (!tracks[prevIndex]?.url) {
      console.error('Invalid previous track URL at index:', prevIndex, tracks[prevIndex]);
      return;
    }
    
    setActiveTrack(prevIndex);
    setIsPlaying(true);
    
    const audio = audioRef.current;
    if (audio && tracks[prevIndex].url !== audio.src) {
      audio.src = tracks[prevIndex].url;
      audio.load();
      audio.play().catch(error => {
        console.error('Error playing previous track:', error, 'Track:', tracks[prevIndex]);
        setIsPlaying(false);
      });
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;

    audio.currentTime = newTime;
    setProgress(clickPercent * 100);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={tracks[activeTrack].url}
        preload="metadata"
      />
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500"
          onClick={onClose}
        />

        <div className="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[90vh] lg:h-[800px] animate-in fade-in zoom-in-95 duration-300">
          
          <button 
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 z-50 p-2 bg-white/50 backdrop-blur rounded-full"
          >
            <Icons.X className="w-6 h-6 text-slate-800" />
          </button>

          {/* Left Side: Playlist */}
          <div className="w-full lg:w-[400px] bg-slate-50/50 flex flex-col border-r border-slate-100">
            <div className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-6 text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Icons.Headphones className="w-4 h-4" />
                Playlist
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">{card.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{card.description}</p>
              
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                <Icons.Music className="w-3 h-3" />
                <span>{tracks.length} Tracks</span>
                <span className="mx-2">•</span>
                <span>{card.duration} Total</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 custom-scrollbar">
              {tracks.map((track, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleTrackSelect(idx)}
                  className={`group flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                    activeTrack === idx 
                      ? 'bg-white shadow-lg shadow-blue-500/10 border border-blue-100 scale-100' 
                      : 'hover:bg-white hover:shadow-md border border-transparent scale-[0.98] hover:scale-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-colors ${
                    activeTrack === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                  }`}>
                    {activeTrack === idx && isPlaying ? (
                      <div className="flex gap-0.5 h-3 items-end">
                        <div className="w-0.5 bg-white animate-[bounce_1s_infinite] h-2"></div>
                        <div className="w-0.5 bg-white animate-[bounce_1.2s_infinite] h-3"></div>
                        <div className="w-0.5 bg-white animate-[bounce_0.8s_infinite] h-1.5"></div>
                      </div>
                    ) : (
                      <Icons.Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${activeTrack === idx ? 'text-blue-900' : 'text-slate-700'}`}>
                      {track.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white relative flex flex-col p-8 lg:p-12">
            <div className="hidden lg:flex justify-end mb-8">
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-800">
                <Icons.X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center relative mb-8">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20 pointer-events-none z-10" />
               
               {/* Dynamic Background Blur Image */}
               {(card.coverImage || card.thumbnailUrl) && (
                  <div className="absolute inset-0 overflow-hidden rounded-[3rem]">
                     <img 
                       src={card.coverImage || card.thumbnailUrl} 
                       className="w-full h-full object-cover blur-3xl opacity-30 scale-150 animate-pulse-slow" 
                       alt="bg"
                     />
                  </div>
               )}

               <div className="relative z-20 w-full max-w-2xl aspect-video rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-900/20 group">
                  {card.coverImage ? (
                    <img 
                      src={card.coverImage} 
                      alt="Now Playing" 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s]"
                    />
                  ) : card.thumbnailUrl ? (
                    <img 
                      src={card.thumbnailUrl} 
                      alt="Now Playing" 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                       <div className="text-center text-white">
                         <Icons.Music className="w-24 h-24 mx-auto mb-4 opacity-80" />
                         <div className="text-lg font-medium opacity-90">Now Playing</div>
                         <div className="text-sm opacity-70 mt-1">{card.title}</div>
                       </div>
                    </div>
                  )}
                  
                  {/* Now Playing Badge */}
                  <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                    Now Playing
                  </div>
               </div>
            </div>

            <div className="relative z-20 max-w-3xl mx-auto w-full">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-1">{tracks[activeTrack].title}</h2>
                  <p className="text-slate-500 font-medium">Perfect for your music experience</p>
                </div>
                <div className="flex gap-2">
                   <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Icons.Volume2 className="w-5 h-5" /></button>
                   <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Icons.Repeat className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="mb-2 flex justify-between text-xs font-semibold text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{tracks[activeTrack].duration}</span>
              </div>
              <div 
                className="h-1.5 bg-slate-100 rounded-full mb-10 overflow-hidden cursor-pointer group/progress"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full relative" 
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-10">
                <button 
                  className="p-4 text-slate-300 hover:text-slate-800 transition-colors hover:bg-slate-50 rounded-full"
                  onClick={handlePreviousTrack}
                >
                  <Icons.SkipBack className="w-8 h-8" />
                </button>

                <button 
                  onClick={togglePlayPause}
                  className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40 hover:scale-110 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95"
                >
                  {isPlaying ? (
                    <Icons.Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Icons.Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </button>

                <button 
                  className="p-4 text-slate-300 hover:text-slate-800 transition-colors hover:bg-slate-50 rounded-full"
                  onClick={handleNextTrack}
                >
                  <Icons.SkipForward className="w-8 h-8" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
