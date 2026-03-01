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

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  /* --------------------------------------------
    AUDIO EVENTS
  -------------------------------------------- */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const loadMeta = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", loadMeta);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", loadMeta);
    };
  }, []);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: any) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    audioRef.current.currentTime = percent * duration;
    setProgress(percent * 100);
  };

  const format = (time: number) =>
    `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}`;

  /* --------------------------------------------
    FINAL UI — EXACT LIKE YOUR SCREENSHOT
  -------------------------------------------- */

  return (
    <>
      <audio src={card.url} ref={audioRef} preload="metadata" />

      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
        
        {/* MODAL */}
        <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-10">

          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 bg-white shadow-md hover:bg-gray-100 p-2 rounded-full"
          >
            <Icons.X className="w-5 h-5 text-gray-700" />
          </button>

          {/* IMAGE */}
          <div className="w-full rounded-[2rem] overflow-hidden shadow-lg">
            <img
              src={card.image}
              alt={card.title}
              className="w-full h-[320px] sm:h-[360px] object-cover rounded-[2rem]"
            />
          </div>

          {/* NOW PLAYING */}
          <div className="mt-6">
            <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
              Now Playing
            </span>
          </div>

          {/* TITLE + DESCRIPTION */}
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-gray-900">
              {card.title}
            </h2>
            <p className="text-gray-500 mt-1">
              Perfect for your first meditation experience
            </p>
          </div>

          {/* TIMER */}
          <div className="mt-6 flex justify-between text-xs font-semibold text-gray-500">
            <span>{format(currentTime)}</span>
            <span>{duration ? format(duration) : card.duration}</span>
          </div>

          {/* PROGRESS BAR */}
          <div
            className="w-full bg-gray-200 h-2 rounded-full mt-2 cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="bg-blue-500 h-full rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="mt-8 flex items-center justify-center gap-10">
            
            {/* PREV */}
            <button className="p-4 rounded-full hover:bg-gray-100 text-gray-500">
              <Icons.SkipBack className="w-7 h-7" />
            </button>

            {/* PLAY / PAUSE */}
            <button
              onClick={togglePlayPause}
              className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition"
            >
              {isPlaying ? (
                <Icons.Pause className="w-8 h-8 text-white" />
              ) : (
                <Icons.Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>

            {/* NEXT */}
            <button className="p-4 rounded-full hover:bg-gray-100 text-gray-500">
              <Icons.SkipForward className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};