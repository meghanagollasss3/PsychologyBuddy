"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Heart,
  Loader2,
  Music,
  Clock,
  PlayIcon,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

import { PlayerModal } from "@/src/components/StudentDashboard/SelfHelpTools/Meditation/PlayerModal";
import InstructionsDisplay from "@/src/components/StudentDashboard/SelfHelpTools/Meditation/InstructionsDisplay";
import { useDebounce } from "@/src/hooks/useDebounce";
import { getStudentId } from "@/src/utils/auth";
import SearchHeader from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/SearchHeader";
import FilterTabs from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/FilterTabs";
import StudentLayout from "@/src/components/StudentDashboard/Layout/StudentLayout";
import Pagination from "@/src/components/StudentDashboard/Content/Library/Pagination";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MeditationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("Recommended");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // -----------------------------
  // Saved Items
  // -----------------------------
  const { data: savedRes, mutate: mutateSavedItems } = useSWR(
    "/api/student/saved-meditations?studentId=" + getStudentId(),
    fetcher,
  );

  const initialSavedItems: Set<string> = useMemo(() => {
    const ids = (savedRes?.data || []).map((item: any) => item.id as string);
    return new Set(ids);
  }, [savedRes]);

  useEffect(() => {
    if (initialSavedItems.size > 0) {
      setSavedItems(initialSavedItems);
    }
  }, [initialSavedItems]);

  // -----------------------------
  // Categories
  // -----------------------------
  const { data: catRes } = useSWR(
    "/api/student/meditation/categories",
    fetcher,
  );
  const categories = useMemo(() => catRes?.data || [], [catRes]);

  const tabList = useMemo(() => {
    const names = categories.map((cat: any) => cat.name);
    return Array.from(new Set(["Recommended", ...names]));
  }, [categories]);

  const activeCategoryId = useMemo(() => {
    if (activeTab === "Recommended") return null;
    return categories.find((c: any) => c.name === activeTab)?.id;
  }, [activeTab, categories]);

  // -----------------------------
  // Instructions
  // -----------------------------
  const { data: instructionsRes } = useSWR(
    "/api/admin/meditation/instructions",
    fetcher,
  );

  const instructions = useMemo(() => {
    if (instructionsRes?.success && instructionsRes?.data) {
      const instruction = Array.isArray(instructionsRes.data)
        ? instructionsRes.data[0]
        : instructionsRes.data;

      if (instruction) {
        return {
          title: instruction.title,
          points: instruction.steps?.map((s: any) => s.description) || [],
          proTip: instruction.proTip,
        };
      }
    }

    return { title: undefined, points: [], proTip: undefined };
  }, [instructionsRes]);

  // -----------------------------
  // Meditation API
  // -----------------------------
  const queryParams = new URLSearchParams({
    limit: "9",
    page: currentPage.toString(),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(activeCategoryId && { categoryId: activeCategoryId }),
  }).toString();

  const endpoint = `/api/student/meditation?${queryParams}`;

  const { data: resData, isLoading } = useSWR(endpoint, fetcher, {
    keepPreviousData: true,
  });

  const meditationResources = resData?.data || [];
  const pagination = resData?.pagination || null;

  // -----------------------------
  // Saved Filter
  // -----------------------------
  const filteredMeditations = useMemo(() => {
    if (showSavedOnly) {
      return meditationResources.filter((med: any) => savedItems.has(med.id));
    }
    return meditationResources;
  }, [showSavedOnly, meditationResources, savedItems]);

  // -----------------------------
  // Player
  // -----------------------------
  const handleCardClick = (meditation: any) => {
    const mediaUrl = meditation.audioUrl || meditation.videoUrl || null;

    if (!mediaUrl) {
      toast({
        title: "No media file available for this session.",
        variant: "destructive",
      });
      return;
    }

    setSelectedCard({
      id: meditation.id,
      title: meditation.title,
      description: meditation.description,
      url: mediaUrl,
      duration: `${Math.floor((meditation.durationSec || 0) / 60)} mins`,
      type: meditation.videoUrl ? "video" : "audio",
      image:
        meditation.thumbnailUrl ||
        "https://picsum.photos/seed/meditation/400/400",
    });

    setShowPlayer(true);
  };

  // -----------------------------
  // Page Change Handler
  // -----------------------------
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // -----------------------------
  // Save Logic
  // -----------------------------
  const toggleSave = async (id: string) => {
    const wasSaved = savedItems.has(id);

    setSavedItems((prev) => {
      const next = new Set(prev);
      wasSaved ? next.delete(id) : next.add(id);
      return next;
    });

    try {
      const res = await fetch("/api/student/saved-meditations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meditationId: id, studentId: getStudentId() }),
      });

      if (!res.ok) throw new Error();

      toast({
        title: wasSaved ? "Removed from favorites" : "Saved to favorites",
      });

      mutateSavedItems();
    } catch {
      toast({
        title: "Failed to sync favorites",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentLayout>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 max-w-7xl">
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

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4 lg:gap-6">
            <div className="flex items-start gap-2 sm:gap-3 w-full mb-3 sm:mb-4">
              <Image
                src="/Content/Library.svg"
                alt="Meditation"
                width={60}
                height={60}
                className="w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] md:w-[50px] md:h-[50px] lg:w-[60px] lg:h-[60px]"
              />
              <div className="ml-1 sm:ml-2 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">
                  Meditation
                </h1>
                <p className="text-[#686D70] text-xs sm:text-sm md:text-base mt-1">
                  Find the perfect practice for your needs
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 w-full lg:w-auto mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 w-full">
                <div className="flex-1 min-w-0">
                  <SearchHeader
                    searchQuery={searchTerm}
                    onSearchChange={setSearchTerm}
                  />
                </div>

                <button
                  onClick={() => setShowSavedOnly((prev) => !prev)}
                  className={`h-9 sm:h-10 md:h-[47px] px-3 sm:px-4 md:px-6 rounded-full border transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm md:text-base flex-shrink-0
                  ${
                    showSavedOnly
                      ? "border-red-400 bg-red-50 text-red-500"
                      : "border-[#A5C3FF] bg-[#A5C3FF]/10 text-[#5982D4] hover:bg-blue-100"
                  }`}
                >
                  <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                  {showSavedOnly
                    ? "Showing Saved"
                    : `Saved Items (${savedItems.size})`}
                </button>
              </div>
            </div>
          </div>

        {/* MAIN PAGE CONTENT */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Category Tabs */}
          {!showSavedOnly && (
            <div className="mb-6 sm:mb-8 -mt-2 sm:-mt-6">
              <FilterTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                categories={categories.map((c: any) => c.name)}
              />
            </div>
          )}

          {/* Meditation Grid */}
          <div className="mt-4 sm:mt-6 md:mt-8">
            {isLoading && !filteredMeditations.length ? (
              <div className="flex flex-col items-center py-16 sm:py-20">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-500 mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">Preparing your peace...</p>
              </div>
            ) : filteredMeditations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredMeditations.map((med: any) => (
                    <MeditationCardItem
                      key={med.id}
                      meditation={med}
                      isSaved={savedItems.has(med.id)}
                      onSave={() => toggleSave(med.id)}
                      onClick={() => handleCardClick(med)}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    hasNextPage={pagination.hasNextPage}
                    hasPreviousPage={pagination.hasPreviousPage}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-16 sm:py-20 md:py-24 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-gray-200">
                <Music className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">
                  {showSavedOnly
                    ? "You haven't saved any meditations yet."
                    : "No results found for your search."}
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          {instructions?.title && (
            <div className="mt-8 sm:mt-10 md:mt-12">
              <InstructionsDisplay
                title={instructions.title}
                points={instructions.points}
                proTip={instructions.proTip}
              />
            </div>
          )}
        </main>
        </div>

        {showPlayer && selectedCard && (
          <PlayerModal
            card={selectedCard}
            onClose={() => setShowPlayer(false)}
          />
        )}
      </StudentLayout>
    </div>
  );
}

// -------------------------------------
// Meditation Card
// -------------------------------------
function MeditationCardItem({ meditation, isSaved, onSave, onClick }: any) {
  const [liveDuration, setLiveDuration] = useState<string | null>(null);

  useEffect(() => {
    // If we already have a duration from the database > 0, don't sniff
    const dbDuration = meditation.durationSec || meditation.duration || 0;
    if (dbDuration > 0) {
      const mins = Math.floor(dbDuration / 60);
      const secs = dbDuration % 60;
      setLiveDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
      return;
    }

    // SNIFFING LOGIC: If DB shows 0, check the actual file metadata
    const mediaUrl = meditation.videoUrl || meditation.audioUrl;
    if (mediaUrl) {
      const media = meditation.videoUrl 
        ? document.createElement("video") 
        : document.createElement("audio");
      
      media.src = mediaUrl;
      media.onloadedmetadata = () => {
        const totalSeconds = Math.floor(media.duration);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        setLiveDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
      };
    }
  }, [meditation]);

  return (
    <div
      onClick={onClick}
      className="group w-full bg-white rounded-[10px] sm:rounded-[12px] md:rounded-[14px] hover:shadow-xl transition-all cursor-pointer"
    >
      <div className="relative h-[120px] sm:h-[140px] md:h-[149px]">
        <img
          src={meditation.thumbnailUrl || "https://picsum.photos/400"}
          alt={meditation.title}
          className="w-full h-full object-cover rounded-t-[10px] sm:rounded-t-[12px] md:rounded-t-[14px]"
        />
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg md:text-[20px] truncate flex-1">
            {meditation.title}
          </h3>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className={`p-1.5 sm:p-2 rounded-full w-[30px] h-[30px] sm:w-[36px] sm:h-[35px] border border-[#D4D4D4] flex-shrink-0 ${
              isSaved ? "bg-red-50 text-red-500" : "bg-white text-[#D4D4D4]"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] ${isSaved ? "fill-current" : "text-[#666666]"}`} />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#686D70] mb-1.5 sm:mb-2">
          {meditation.description || "Meditation Session"}
        </p>

        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-[13px] text-[#686D70]">
            {/* Show live duration if sniffed, otherwise show 'Loading...' or '1 min' */}
            {liveDuration ? liveDuration : "Loading..."}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
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
