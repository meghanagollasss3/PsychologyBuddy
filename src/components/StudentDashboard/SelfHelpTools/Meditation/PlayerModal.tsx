'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { CardProps } from './MeditationCard';

interface PlayerModalProps {
  card: CardProps;
  onClose: () => void;
}

export const PlayerModal = ({ card, onClose }: PlayerModalProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState(0);
  const [tracks, setTracks] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // ---------------------------------------------------------
  // 1. Fetch meditation resources in the same category
  // ---------------------------------------------------------
  const loadSameCategoryTracks = async () => {
    try {
      const res = await fetch('/api/student/meditation?limit=50');
      const result = await res.json();

      if (!result.success) return [];

      const allResources = result.data || [];

      const currentCategoryNames =
        card.categories?.map((c: any) => c.category?.name).filter(Boolean) || [];

      const relatedTracks = allResources.filter((item: any) => {
        if (item.id === card.id) return false;

        return item.categories?.some((cat: any) =>
          currentCategoryNames.includes(cat.category?.name)
        );
      });

      const formatted = relatedTracks.map((med: any) => ({
        id: med.id,
        title: med.title,
        artist: med.instructor || 'Meditation Instructor',
        duration: med.durationSec
          ? `${Math.floor(med.durationSec / 60)} mins`
          : '5 mins',
        url: med.audioUrl || med.videoUrl,
        image: med.thumbnailUrl || med.coverImage || card.image,
      }));

      return [
        {
          id: card.id,
          title: card.title,
          artist: card.instructor || 'Meditation Instructor',
          duration: card.duration,
          url: card.url,
          image: card.image,
        },
        ...formatted,
      ];
    } catch (err) {
      console.error('Error fetching meditation tracks', err);
      return [];
    }
  };

  // ---------------------------------------------------------
  // 2. Load final track list
  // ---------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      const relatedTracks = await loadSameCategoryTracks();
      if (relatedTracks.length > 0) setTracks(relatedTracks);
    };
    load();
  }, []);

  const currentTrack = tracks[activeTrack];

  // ---------------------------------------------------------
  // 3. Audio listeners
  // ---------------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onMetadata = () => setDuration(audio.duration);
    const onEnded = () => handleNext();
    const onError = () => {
      console.warn("Track error — skipping.");
      handleNext();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [activeTrack]);

  // ---------------------------------------------------------
  // 4. Controls
  // ---------------------------------------------------------
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.url) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleTrackSelect = (index: number) => {
    setActiveTrack(index);
    setIsPlaying(true);

    const audio = audioRef.current;
    if (!audio) return;

    audio.src = tracks[index].url;
    audio.load();
    audio.play().catch(() => setIsPlaying(false));
  };

  const handleNext = () => {
    const next = (activeTrack + 1) % tracks.length;
    handleTrackSelect(next);
  };

  const handlePrev = () => {
    const prev = activeTrack === 0 ? tracks.length - 1 : activeTrack - 1;
    handleTrackSelect(prev);
  };

  const handleSeek = (e: any) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
    setProgress(percent * 100);
  };

  const formatTime = (time: number) =>
    `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}`;

  // ---------------------------------------------------------
  // 5. FULL UI BELOW (Unchanged)
  // ---------------------------------------------------------

  return (
    <>
      <audio ref={audioRef} src={currentTrack?.url} preload="metadata" />

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[90vh] lg:h-[750px] animate-in fade-in zoom-in-95 duration-300">

          {/* Left: Playlist */}
          <div className="w-full lg:w-[380px] bg-slate-50 flex flex-col border-r border-slate-100">
            <div className="p-8 pb-4">
              <div className="flex items-center gap-2 mb-4 text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Icons.Headphones className="w-3 h-3" />
                Playlist
              </div>
              <h2 className="text-xl font-bold text-slate-800 line-clamp-1">
                {card.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {tracks.length} tracks in this session
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 custom-scrollbar">
              {tracks.map((track, idx) => (
                <button
                  key={track.id + idx}
                  onClick={() => handleTrackSelect(idx)}
                  className={`w-full flex items-center p-3 rounded-2xl transition-all ${
                    activeTrack === idx
                      ? "bg-white shadow-lg shadow-blue-500/5 border border-blue-100"
                      : "hover:bg-white/50 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                      activeTrack === idx
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {activeTrack === idx && isPlaying ? (
                      <span className="flex gap-0.5 items-end h-3">
                        <span className="w-0.5 bg-white animate-pulse h-2" />
                        <span className="w-0.5 bg-white animate-pulse h-3" />
                        <span className="w-0.5 bg-white animate-pulse h-1.5" />
                      </span>
                    ) : (
                      <Icons.Play className="w-3 h-3 fill-current ml-0.5" />
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        activeTrack === idx
                          ? "text-blue-600"
                          : "text-slate-700"
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      {track.artist}
                    </p>
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 ml-2">
                    {track.duration}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex-1 bg-white flex flex-col p-8 lg:p-12">
            <div className="flex justify-end mb-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <Icons.X />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10 group">
                <img
                  src={currentTrack?.image}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="Cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              <div className="mt-8 text-center max-w-md">
                <h3 className="text-2xl font-extrabold text-slate-900 line-clamp-1">
                  {currentTrack?.title}
                </h3>
                <p className="text-blue-500 font-semibold text-sm mt-1 uppercase tracking-widest">
                  {currentTrack?.artist}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-8 max-w-2xl mx-auto w-full">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-3 tracking-tighter">
                <span>{formatTime(currentTime)}</span>
                <span>
                  {duration > 0
                    ? formatTime(duration)
                    : currentTrack?.duration}
                </span>
              </div>

              <div
                className="h-2 bg-slate-100 rounded-full overflow-hidden cursor-pointer group relative"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-blue-600 transition-all duration-100 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-center gap-10 mt-10">
                <button
                  onClick={handlePrev}
                  className="text-slate-300 hover:text-blue-600 transition-colors"
                >
                  <Icons.SkipBack className="w-8 h-8" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-200 hover:scale-110 hover:bg-blue-700 transition-all active:scale-95"
                >
                  {isPlaying ? (
                    <Icons.Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Icons.Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="text-slate-300 hover:text-blue-600 transition-colors"
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
