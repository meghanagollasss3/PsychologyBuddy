"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import {
  ChevronLeft,
  Heart,
  Play,
  Loader2,
  Music,
  Bookmark,
  Clock,
  PlayIcon,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/src/hooks/use-toast";

import SearchHeader from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/SearchHeader";
import FilterTabs from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/FilterTabs";
import { PlayerModal } from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/PlayerModal";
import InstructionsDisplay from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/InstructionsDisplay";
import { useDebounce } from "@/src/hooks/useDebounce";
import { getStudentId } from "@/src/utils/auth";
import StudentLayout from "@/src/components/StudentDashboard/Layout/StudentLayout";
import BackToDashboard from "@/src/components/StudentDashboard/Layout/BackToDashboard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OptimizedMusicPage() {
  const router = useRouter();
  const { toast } = useToast();

  // --- UI State ---
  const [activeTab, setActiveTab] = useState("Recommended");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  // ⭐ NEW STATE FOR TOGGLE
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // --- Data Fetching ---

  const { data: savedRes, mutate: mutateSavedItems } = useSWR(
    "/api/student/saved-music?studentId=" + getStudentId(),
    fetcher
  );

  const initialSavedItems: Set<string> = useMemo(() => {
    const ids = (savedRes?.data || []).map((item: any) => item.id as string);
    return new Set(ids);
  }, [savedRes]);

  useEffect(() => {
    if (initialSavedItems.size >= 0) {
      setSavedItems(initialSavedItems);
    }
  }, [initialSavedItems]);

  const { data: catRes } = useSWR("/api/student/music/categories", fetcher);
  const categories = useMemo(() => catRes?.data || [], [catRes]);

  const { data: instRes } = useSWR("/api/admin/music/instructions", fetcher);
  const instructions = useMemo(() => {
    const raw = Array.isArray(instRes?.data) ? instRes?.data[0] : instRes?.data;
    if (!raw) return null;
    return {
      title: raw.title,
      points: raw.steps?.map((s: any) => s.description) || [],
      proTip: raw.proTip,
    };
  }, [instRes]);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) {
      params.append("query", debouncedSearch);
      return `/api/student/music/search?${params.toString()}`;
    }

    if (activeTab !== "Recommended") {
      params.append("category", activeTab);
      return `/api/student/music/category?${params.toString()}`;
    }

    return `/api/student/music/resources?limit=20`;
  }, [debouncedSearch, activeTab]);

  const { data: musicRes, isLoading } = useSWR(endpoint, fetcher, {
    keepPreviousData: true,
  });

  const musicResources = musicRes?.data?.resources || [];

  // ⭐ FILTERED LIST BASED ON SHOW SAVED
  const filteredMusicResources = useMemo(() => {
    if (showSavedOnly) {
      return musicResources.filter((m: any) => savedItems.has(m.id));
    }
    return musicResources;
  }, [showSavedOnly, musicResources, savedItems]);

  // --- Save Handler ---
  const handleToggleSave = async (musicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/student/saved-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicId, studentId: getStudentId() }),
      });
      const result = await res.json();

      if (result.success) {
        setSavedItems((prev) => {
          const next = new Set(prev);
          result.isSaved ? next.add(musicId) : next.delete(musicId);
          return next;
        });

        toast({
          title: result.isSaved ? "Saved" : "Removed",
        });

        mutateSavedItems();
      }
    } catch {
      toast({
        title: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentLayout>
        <div className="container mx-auto px-3 sm:px-2 md:px-6 lg:px-8 py-4 sm:py-5 max-w-7xl">

          <div className="max-w-7xl my-[2px] mb-4 mx-[-10px] pt-2 sm:pt-3 lg:pt-5 sm:px-3 lg:px-4">
            <button
              onClick={() => router.push("/students/selfhelptools")}
              className="flex items-center gap-2 text-[#73829A] hover:text-[#1a9bcc] transition-colors p-2"
            >
              <ArrowLeft className="w-4 h-5" />
              <span className="text-[13px] sm:text-[16px]">Back to SelfHelpTools</span>
            </button>
          </div>

          {/* HEADER ROW */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6">

            {/* TITLE */}
            <div className="flex items-start gap-3 w-full sm:w-[510px] mb-[15px] sm:mb-[20px]">
              <Image
                src="/selfhelptools/music/Music.svg"
                alt="Music Logo"
                width={63}
                height={63}
                className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] lg:w-[63px] lg:h-[63px]"
              />
              <div className="ml-2 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-bold text-slate-900">
                  Music Therapy
                </h1>
                <p className="text-[#686D70] text-sm sm:text-base">
                  Curated playlists designed to support your emotional wellbeing.
                </p>
              </div>
            </div>

            {/* SEARCH + SHOW SAVED TOGGLE */}
            <div className="flex flex-col gap-3 w-full lg:w-auto mb-[20px]">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <SearchHeader
                  searchQuery={searchTerm}
                  onSearchChange={setSearchTerm}
                />

                {/* ⭐ NEW SHOW SAVED ONLY BUTTON */}
                <button
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  className={`h-10 sm:h-[47px] px-4 sm:px-6 rounded-full border transition-colors flex items-center gap-2 whitespace-nowrap text-sm sm:text-base 
                    ${showSavedOnly 
                      ? "border-red-400 bg-red-50 text-red-500" 
                      : "border-[#A5C3FF] bg-[#A5C3FF]/10 text-[#5982D4] hover:bg-blue-100"
                    }`}
                >
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                  {showSavedOnly ? "Show All" : `Saved Items (${savedItems.size})`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN PAGE CONTENT */}
        <main className="max-w-7xl mx-auto px-4 py-8">

          {/* TABS */}
          <div className="mb-8 sm:-mt-6">
            <FilterTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              categories={categories.map((c: any) => c.name)}
            />
          </div>

          {/* GRID */}
          {isLoading ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500">Tuning the instruments...</p>
            </div>
          ) : filteredMusicResources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMusicResources.map((music: any) => (
                <MusicCard
                  key={music.id}
                  music={music}
                  isSaved={savedItems.has(music.id)}
                  onSave={(e: React.MouseEvent) => handleToggleSave(music.id, e)}
                  onPlay={() => {
                    setSelectedCard({ ...music, url: music.url });
                    setShowPlayer(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
              <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tracks found.</p>
            </div>
          )}

          {/* Instructions */}
          {instructions && (
            <div className="mb-10 mt-5">
              <InstructionsDisplay {...instructions} />
            </div>
          )}
        </main>

        {showPlayer && selectedCard && (
          <PlayerModal
            card={selectedCard}
            categories={categories}
            onClose={() => setShowPlayer(false)}
          />
        )}
      </StudentLayout>
    </div>
  );
}

/* MUSIC CARD COMPONENT */

function MusicCard({ music, isSaved, onSave, onPlay }: any) {
  return (
    <div
      onClick={onPlay}
      className="group w-auto sm:w-[399px] bg-white rounded-[14px] hover:shadow-xl hover:shadow-[#15A0EA33]/20 transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="relative aspect-square h-[149px]">
        {music.coverImage ? (
          <img
            src={music.coverImage}
            className="w-full h-full object-cover opacity-90 rounded-tl-[13px] rounded-tr-[14px]"
            alt=""
          />
        ) : music.thumbnailUrl ? (
          <img
            src={music.thumbnailUrl}
            className="w-full h-full object-cover opacity-90 rounded-tl-[14px] rounded-tr-[14px]"
            alt=""
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Music className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 text-[20px] truncate flex-1">{music.title}</h3>
          <button
            onClick={onSave}
            className={`p-2 rounded-full w-[36px] h-[35px] border border-[#D4D4D4] ${
              isSaved ? "bg-red-50 text-red-500" : "bg-gray-50 text-[#666666]"
            }`}
          >
            <Heart className={`w-[18px] h-[18px] ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          {music.artist || "Therapeutic Artist"}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-[14px] h-[14px] text-[#686D70]" />
          <span className="text-[13px] text-[#686D70]">
            {Math.floor(music.duration / 60)} mins
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="group w-full h-[52px] border-2 border-[#1C76DC] bg-white 
            group-hover:bg-[#1C76DC] rounded-full flex items-center justify-center transition-colors"
        >
          <PlayIcon className="w-[16px] h-[17px] text-[#1C76DC] group-hover:text-white transition-colors" />
          <span className="text-[#1C76DC] group-hover:text-white ml-2 font-medium text-[16px]">
            Play
          </span>
        </button>
      </div>
    </div>
  );
}