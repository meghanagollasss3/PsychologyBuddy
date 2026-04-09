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
import { useToast } from "@/components/ui/use-toast";

import SearchHeader from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/SearchHeader";
import FilterTabs from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/FilterTabs";
import { PlayerModal } from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/PlayerModal";
import InstructionsDisplay from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/InstructionsDisplay";
import { useDebounce } from "@/src/hooks/useDebounce";
import { getStudentId } from "@/src/utils/auth";
import StudentLayout from "@/src/components/StudentDashboard/Layout/StudentLayout";
import BackToDashboard from "@/src/components/StudentDashboard/Layout/BackToDashboard";
import Pagination from "@/src/components/StudentDashboard/Content/Library/Pagination";

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
  const [currentPage, setCurrentPage] = useState(1);

  // ⭐ NEW STATE FOR TOGGLE
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // --- Data Fetching ---

  const { data: savedRes, mutate: mutateSavedItems } = useSWR(
    "/api/student/saved-music?studentId=" + getStudentId(),
    fetcher,
  );

  const initialSavedItems: Set<string> = useMemo(() => {
    const ids = (savedRes?.data || []).map((item: any) => item.id as string);
    return new Set(ids);
  }, [savedRes]);

  useEffect(() => {
    if (initialSavedItems) {
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
      return `/api/student/music/search?page=${currentPage}&limit=9&${params.toString()}`;
    }

    if (activeTab !== "Recommended") {
      params.append("category", activeTab);
      return `/api/student/music/category?page=${currentPage}&limit=9&${params.toString()}`;
    }

    return `/api/student/music/resources?page=${currentPage}&limit=9`;
  }, [debouncedSearch, activeTab, currentPage]);

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
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 max-w-7xl">
          <div className="max-w-7xl my-[2px] mb-3 sm:mb-4 mx-[-10px] pt-2 sm:pt-3 lg:pt-5 sm:px-3 lg:px-4">
            <button
              onClick={() => router.push("/students/selfhelptools")}
              className="flex items-center gap-2 text-[#73829A] hover:text-[#1a9bcc] transition-colors p-2"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="text-[11px] sm:text-[13px] md:text-[16px]">
                Back to SelfHelpTools
              </span>
            </button>
          </div>

          {/* HEADER ROW */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4 lg:gap-6">
            {/* TITLE */}
            <div className="flex items-start gap-2 sm:gap-3 w-full mb-3 sm:mb-4">
              <Image
                src="/selfhelptools/music/Music.svg"
                alt="Music Logo"
                width={63}
                height={63}
                className="w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] md:w-[50px] md:h-[50px] lg:w-[63px] lg:h-[63px]"
              />
              <div className="ml-1 sm:ml-2 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-[32px] font-bold text-slate-900">
                  Music Therapy
                </h1>
                <p className="text-[#686D70] text-xs sm:text-sm md:text-base mt-1">
                  Curated playlists designed to support your emotional
                  wellbeing.
                </p>
              </div>
            </div>

            {/* SEARCH + SHOW SAVED TOGGLE */}
            <div className="flex flex-col gap-2 sm:gap-3 w-full lg:w-auto mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 w-full">
                <div className="flex-1 min-w-0">
                  <SearchHeader
                    searchQuery={searchTerm}
                    onSearchChange={setSearchTerm}
                  />
                </div>

                {/* ⭐ NEW SHOW SAVED ONLY BUTTON */}
                <button
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  className={`h-9 sm:h-10 md:h-[47px] px-3 sm:px-4 md:px-6 rounded-full border transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm md:text-base flex-shrink-0
                    ${
                      showSavedOnly
                        ? "border-red-400 bg-red-50 text-red-500"
                        : "border-[#A5C3FF] bg-[#A5C3FF]/10 text-[#5982D4] hover:bg-blue-100"
                    }`}
                >
                  <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                  {showSavedOnly
                    ? "Show All"
                    : `Saved Items (${savedItems.size})`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN PAGE CONTENT */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* TABS */}
          {!showSavedOnly && (
            <div className="mb-6 sm:mb-8 -mt-2 sm:-mt-6">
              <FilterTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                categories={categories.map((c: any) => c.name)}
              />
            </div>
          )}

          {/* GRID */}
          {isLoading ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500">Tuning instruments...</p>
            </div>
          ) : filteredMusicResources.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredMusicResources.map((music: any) => (
                  <MusicCard
                    key={music.id}
                    music={music}
                    isSaved={savedItems.has(music.id)}
                    onSave={(e: React.MouseEvent) =>
                      handleToggleSave(music.id, e)
                    }
                    onPlay={() => {
                      setSelectedCard({ ...music, url: music.url });
                      setShowPlayer(true);
                    }}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {musicRes?.pagination && musicRes.pagination.totalPages > 1 && (
                <Pagination
                  currentPage={musicRes.pagination.currentPage}
                  totalPages={musicRes.pagination.totalPages}
                  onPageChange={setCurrentPage}
                  hasNextPage={musicRes.pagination.hasNextPage}
                  hasPreviousPage={musicRes.pagination.hasPreviousPage}
                />
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
              <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {showSavedOnly
                  ? "You haven't saved any tracks yet."
                  : "No tracks found."}
              </p>
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
      className="group w-full bg-white rounded-[10px] sm:rounded-[12px] md:rounded-[14px] hover:shadow-xl hover:shadow-[#15A0EA33]/20 transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="relative aspect-square h-[120px] sm:h-[140px] md:h-[149px]">
        {music.coverImage ? (
          <img
            src={music.coverImage}
            className="w-full h-full object-cover opacity-90 rounded-tl-[10px] sm:rounded-tl-[12px] md:rounded-tl-[13px] rounded-tr-[10px] sm:rounded-tr-[12px] md:rounded-tr-[14px]"
            alt=""
          />
        ) : music.thumbnailUrl ? (
          <img
            src={music.thumbnailUrl}
            className="w-full h-full object-cover opacity-90 rounded-tl-[10px] sm:rounded-tl-[12px] md:rounded-tl-[14px] rounded-tr-[10px] sm:rounded-tr-[12px] md:rounded-tr-[14px]"
            alt=""
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Music className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-400" />
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg md:text-[20px] truncate flex-1">
            {music.title}
          </h3>
          <button
            onClick={onSave}
            className={`p-1.5 sm:p-2 rounded-full w-[30px] h-[30px] sm:w-[36px] sm:h-[35px] border border-[#D4D4D4] ${
              isSaved ? "bg-red-50 text-red-500" : "bg-gray-50 text-[#666666]"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] ${isSaved ? "fill-current" : ""}`}
            />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
          {music.description || "Therapeutic Artist"}
        </p>

        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <Clock className="w-3 h-3 sm:w-[14px] sm:h-[14px] text-[#686D70]" />
          <span className="text-xs sm:text-[13px] text-[#686D70]">
            {Math.max(
              1,
              Math.floor(
                (music.durationSec ||
                  music.duration_seconds ||
                  music.duration ||
                  0) / 60,
              ),
            )}{" "}
            mins
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="group w-full h-10 sm:h-[52px] border-2 border-[#1C76DC] bg-white 
            group-hover:bg-[#1C76DC] rounded-full flex items-center justify-center transition-colors"
        >
          <PlayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[16px] md:h-[17px] text-[#1C76DC] group-hover:text-white transition-colors" />
          <span className="text-[#1C76DC] group-hover:text-white ml-1.5 sm:ml-2 font-medium text-sm sm:text-base md:text-[16px]">
            Play
          </span>
        </button>
      </div>
    </div>
  );
}
