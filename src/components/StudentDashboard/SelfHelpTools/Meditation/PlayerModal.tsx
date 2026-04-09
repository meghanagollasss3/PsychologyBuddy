"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icons } from "./Icons";
import { CardProps } from "./MeditationCard";

interface PlayerModalProps {
  card: CardProps;
  onClose: () => void;
}

export const PlayerModal = ({ card, onClose }: PlayerModalProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = card.type === 'video' ? videoRef : audioRef;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  /* --------------------------------------------
    MEDIA EVENTS (AUDIO/VIDEO)
  -------------------------------------------- */
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateProgress = () => {
      setCurrentTime(media.currentTime);
      if (media.duration) {
        setProgress((media.currentTime / media.duration) * 100);
      }
    };
    const loadMeta = () => setDuration(media.duration);

    media.addEventListener("timeupdate", updateProgress);
    media.addEventListener("loadedmetadata", loadMeta);

    return () => {
      media.removeEventListener("timeupdate", updateProgress);
      media.removeEventListener("loadedmetadata", loadMeta);
    };
  }, [card.type]);

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
      setIsPlaying(false);
    } else {
      media.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: any) => {
    const media = mediaRef.current;
    if (!media || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    media.currentTime = percent * duration;
    setProgress(percent * 100);
  };

  const format = (time: number) =>
    `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}`;

  /* --------------------------------------------
    FINAL UI — EXACT LIKE YOUR SCREENSHOT
  -------------------------------------------- */

  return (
    <>
      {card.type === 'video' ? (
        <video 
          src={card.url} 
          ref={videoRef} 
          preload="metadata"
          className="hidden"
        />
      ) : (
        <audio src={card.url} ref={audioRef} preload="metadata" />
      )}

      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6">
        
        {/* MODAL */}
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[16px] sm:rounded-[20px] md:rounded-[2.5rem] shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">

          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 bg-white shadow-md hover:bg-gray-100 p-1.5 sm:p-2 rounded-full z-10"
          >
            <Icons.X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>

          {/* IMAGE OR VIDEO */}
          <div className="w-full rounded-[12px] sm:rounded-[16px] md:rounded-[2rem] overflow-hidden shadow-lg relative">
            {card.type === 'video' ? (
              <>
                <video
                  src={card.url}
                  ref={videoRef}
                  controls={false}
                  preload="metadata"
                  className="w-full h-[180px] sm:h-[240px] md:h-[320px] lg:h-[360px] object-cover rounded-[12px] sm:rounded-[16px] md:rounded-[2rem]"
                  onClick={togglePlayPause}
                />
                {/* Video Play Button Overlay */}
                {!isPlaying && (
                  <div 
                    className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer rounded-[12px] sm:rounded-[16px] md:rounded-[2rem]"
                    onClick={togglePlayPause}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                      <Icons.Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600 ml-1" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-[180px] sm:h-[240px] md:h-[320px] lg:h-[360px] object-cover rounded-[12px] sm:rounded-[16px] md:rounded-[2rem]"
              />
            )}
          </div>

          {/* NOW PLAYING */}
          <div className="mt-4 sm:mt-6">
            <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
              Now Playing
            </span>
          </div>

          {/* TITLE + DESCRIPTION */}
          <div className="mt-2 sm:mt-3">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              {card.title}
            </h2>
            <p className="text-gray-500 mt-1 text-xs sm:text-sm">
              {card.type === 'video' ? 'Video meditation' : 'Perfect for your first meditation experience'}
            </p>
          </div>

          {/* TIMER */}
          <div className="mt-4 sm:mt-6 flex justify-between text-xs font-semibold text-gray-500">
            <span>{format(currentTime)}</span>
            <span>{duration ? format(duration) : card.duration}</span>
          </div>

          {/* PROGRESS BAR */}
          <div
            className="w-full bg-gray-200 h-1.5 sm:h-2 rounded-full mt-1.5 sm:mt-2 cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="bg-blue-500 h-full rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 sm:-right-2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-6 sm:gap-8 md:gap-10">
            
            {/* PREV */}
            <button className="p-3 sm:p-4 rounded-full hover:bg-gray-100 text-gray-500">
              <Icons.SkipBack className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </button>

            {/* PLAY / PAUSE */}
            <button
              onClick={togglePlayPause}
              className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition"
            >
              {isPlaying ? (
                <Icons.Pause className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              ) : (
                <Icons.Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white ml-1" />
              )}
            </button>

            {/* NEXT */}
            <button className="p-3 sm:p-4 rounded-full hover:bg-gray-100 text-gray-500">
              <Icons.SkipForward className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};