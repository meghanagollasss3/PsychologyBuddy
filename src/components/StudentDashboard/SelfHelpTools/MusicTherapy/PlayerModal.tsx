"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icons } from "./Icons";
import { CardProps } from "./MusicCard";

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

  const audioRef = useRef<HTMLAudioElement>(null);

  /* -----------------------------------------------------------------------
   FETCHING TRACKS LOGIC (same as your code, unchanged)
  -------------------------------------------------------------------------*/
  const [tracks, setTracks] = useState([
    {
      title: card.title,
      artist: card.artist || "Unknown Artist",
      duration: card.duration,
      url: card.url,
    },
  ]);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const res = await fetch("/api/student/music/resources?limit=40");
        const json = await res.json();

        if (!json.success) return;

        const allMusic = json.data.resources || [];

        const categoryNames =
          card.categories?.map((c: any) => c.category?.name).filter(Boolean) ||
          [];

        const sameCategory = allMusic.filter((m: any) => {
          if (m.id === card.id) return false;
          return m.categories?.some((cat: any) =>
            categoryNames.includes(cat.category?.name)
          );
        });

        const mapped = sameCategory.map((m: any) => ({
          title: m.title,
          artist: m.artist,
          duration: `${Math.floor(m.duration / 60)}:${String(
            m.duration % 60
          ).padStart(2, "0")}`,
          url: m.url,
        }));

        setTracks([
          {
            title: card.title,
            artist: card.artist,
            duration: card.duration,
            url: card.url,
          },
          ...mapped,
        ]);
      } catch (err) {
        console.log("Error:", err);
      }
    };

    loadTracks();
  }, []);

  /* -----------------------------------------------------------------------
   AUDIO EVENTS
  -------------------------------------------------------------------------*/
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => handleNextTrack();

    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [activeTrack]);

  /* -----------------------------------------------------------------------
   PLAYER CONTROLS
  -------------------------------------------------------------------------*/
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    isPlaying ? audio.pause() : audio.play();
    setIsPlaying(!isPlaying);
  };

  const handleTrackSelect = (i: number) => {
    setActiveTrack(i);
    const audio = audioRef.current;

    if (audio && tracks[i]?.url) {
      audio.src = tracks[i].url;
      audio.load();
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    handleTrackSelect((activeTrack + 1) % tracks.length);
  };

  const handlePrevTrack = () => {
    handleTrackSelect(
      activeTrack === 0 ? tracks.length - 1 : activeTrack - 1
    );
  };

  const scrub = (e: any) => {
    const bar = e.target.getBoundingClientRect();
    const clickX = e.clientX - bar.left;
    const percent = clickX / bar.width;

    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = percent * audio.duration;
      setProgress(percent * 100);
    }
  };

  const format = (t: number) =>
    `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  /* -----------------------------------------------------------------------
   UI STARTS HERE — ALL NEW DESIGN
  -------------------------------------------------------------------------*/

  return (
    <>
      <audio ref={audioRef} src={tracks[activeTrack].url}></audio>

      {/* Modal Background */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-6">

        {/* Modal Container */}
        <div className="bg-white w-full max-w-6xl rounded-[32px] shadow-2xl flex overflow-hidden animate-fadeIn scale-100">

          {/* LEFT — PLAYLIST */}
          <div className="w-[360px] bg-[#F8FAFF] border-r flex flex-col">
            <div className="p-6 border-b">
              <h1 className="text-xl font-bold text-[#223344]">{card.title}</h1>
              <p className="text-sm text-[#778395] mt-1">
                Gentle melodies to reduce stress and anxiety
              </p>

              <p className="text-xs text-[#99A3B3] mt-4">
                🎵 {tracks.length} Tracks
              </p>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {tracks.map((t, i) => (
                <div
                  key={i}
                  onClick={() => handleTrackSelect(i)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all 
                    ${
                      activeTrack === i
                        ? "bg-white shadow border border-[#D5E5FF]"
                        : "hover:bg-white/60"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-blue-600 border 
                        ${
                          activeTrack === i
                            ? "bg-blue-600 text-white"
                            : "border-[#D8E1F3]"
                        }`}
                    >
                      {activeTrack === i ? (
                        <Icons.Pause className="w-4 h-4" />
                      ) : (
                        <Icons.Play className="w-4 h-4 ml-[2px]" />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-[#223344] text-sm">
                        {t.title}
                      </p>
                      <p className="text-xs text-[#8C97A8]">{t.artist}</p>
                    </div>
                  </div>

                  <span className="text-xs text-[#7D8899]">{t.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — MAIN PLAYER */}
          <div className="flex-1 p-8 relative flex flex-col">

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              <Icons.X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden shadow-lg w-full max-h-[320px]">
              <img
                src={card.coverImage || card.thumbnailUrl}
                className="w-full h-full object-cover"
                alt="cover"
              />
            </div>

            {/* Title/Description */}
            <div className="mt-6">
              <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-semibold">
                Now Playing
              </span>

              <h2 className="text-3xl font-bold text-[#222] mt-3">
                {tracks[activeTrack].title}
              </h2>

              <p className="text-[#556070] mt-1 text-sm">
                Perfect for your meditation experience
              </p>
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-[#778395] mb-1">
                <span>{format(currentTime)}</span>
                <span>{tracks[activeTrack].duration}</span>
              </div>

              <div
                className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
                onClick={scrub}
              >
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-8 mt-10">
              <button
                onClick={handlePrevTrack}
                className="p-4 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Icons.SkipBack className="w-6 h-6 text-[#667085]" />
              </button>

              {/* Play Button */}
              <button
                onClick={togglePlayPause}
                className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition"
              >
                {isPlaying ? (
                  <Icons.Pause className="w-8 h-8 text-white" />
                ) : (
                  <Icons.Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>

              <button
                onClick={handleNextTrack}
                className="p-4 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Icons.SkipForward className="w-6 h-6 text-[#667085]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};