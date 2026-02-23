"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ChevronLeft, Heart, Play, Search, Loader2, Music, Clock } from "lucide-react";
import { useToast } from "@/src/hooks/use-toast";
import Image from "next/image";

// Components
import { PlayerModal } from "@/src/components/StudentDashboard/SelfHelpTools/Meditation/PlayerModal";
import InstructionsDisplay from "@/src/components/StudentDashboard/SelfHelpTools/Meditation/InstructionsDisplay";
import { useDebounce } from "@/src/hooks/useDebounce";
import { getStudentId } from "@/src/utils/auth";
import BackToDashboard from "@/src/components/StudentDashboard/Layout/BackToDashboard";
import SearchHeader from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/SearchHeader";
import FilterTabs from "@/src/components/StudentDashboard/SelfHelpTools/MusicTherapy/FilterTabs";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MeditationPage() {
  const router = useRouter();
  const { toast } = useToast();

  // --- UI & Player State ---
  const [activeTab, setActiveTab] = useState("Recommended");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  // Instructions state
  const [meditationInstructions, setMeditationInstructions] =
    useState<any>(null);

  // Modal State
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // --- Search Optimization ---
  const debouncedSearch = useDebounce(searchTerm, 400);

  // --- Data Fetching: Saved Items (load on mount) ---
  const { data: savedRes, mutate: mutateSavedItems } = useSWR(
    "/api/student/saved-meditations?studentId=" + getStudentId(),
    fetcher,
  );
  const initialSavedItems: Set<string> = useMemo(() => {
    const ids = (savedRes?.data || []).map((item: any) => item.id as string);
    return new Set(ids);
  }, [savedRes]);

  // Sync saved items state with API response
  useEffect(() => {
    if (initialSavedItems.size > 0) {
      setSavedItems(initialSavedItems);
    }
  }, [initialSavedItems]);

  // --- Data Fetching: Categories ---
  const { data: catRes } = useSWR(
    "/api/student/meditation/categories",
    fetcher,
  );
  const categories = useMemo(() => catRes?.data || [], [catRes]);

  // --- Data Fetching: Instructions ---
  const { data: instructionsRes, error: instructionsError } = useSWR(
    "/api/admin/meditation/instructions",
    fetcher,
  );
  const instructions = useMemo(() => {
    console.log("Instructions API response:", instructionsRes);
    console.log("Instructions API error:", instructionsError);

    if (instructionsRes?.success && instructionsRes?.data) {
      const instruction = Array.isArray(instructionsRes.data)
        ? instructionsRes.data[0]
        : instructionsRes.data;
      if (instruction) {
        const processedData = {
          title: instruction.title,
          points: instruction.steps?.map((step: any) => step.description) || [],
          proTip: instruction.proTip || undefined,
          difficulty: instruction.difficulty || undefined,
        };
        console.log("Processed instructions data:", processedData);
        return processedData;
      }
    }
    console.log("No instructions data found");
    return {
      title: undefined,
      points: [],
      proTip: undefined,
      difficulty: undefined,
    };
  }, [instructionsRes, instructionsError]);

  console.log("Final meditationInstructions state:", instructions);

  // FIX: deduplicate tabs
  const tabList = useMemo(() => {
    const names = categories.map((cat: any) => cat.name);
    return Array.from(new Set(["Recommended", ...names]));
  }, [categories]);

  const activeCategoryId = useMemo(() => {
    if (activeTab === "Recommended") return null;
    return categories.find((c: any) => c.name === activeTab)?.id;
  }, [activeTab, categories]);

  // --- Data Fetching: Resources ---
  const queryParams = new URLSearchParams({
    limit: "20",
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(activeCategoryId && { categoryId: activeCategoryId }),
  }).toString();

  const endpoint = debouncedSearch
    ? `/api/student/meditation/search?${queryParams}`
    : `/api/student/meditation?${queryParams}`;

  const { data: resData, isLoading } = useSWR(endpoint, fetcher, {
    keepPreviousData: true,
  });

  const meditationResources = resData?.data || [];

  // --- Player Initialization ---
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
      instructor: meditation.instructor,
      categories: meditation.categories || [],
    });
    setShowPlayer(true);
  };

  // --- Save Logic (Optimistic UI) ---
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
      // Revalidate cache to update other components
      mutateSavedItems();
    } catch (error) {
      // Revert if failed
      setSavedItems((prev) => {
        const next = new Set(prev);
        wasSaved ? next.add(id) : next.delete(id);
        return next;
      });
      toast({
        title: "Failed to sync favorites",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-black"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="ml-2 font-medium">Back to Tools</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-2 md:px-6 lg:px-8 py-4 sm:py-5 lg:py-3 max-w-7xl">
        <div className="max-w-7xl my-[2px] sm:my-[10px] mx-[-10px] pt-2 sm:pt-3 lg:pt-5 sm:px-3 lg:px-4">
          <BackToDashboard />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6">
          <div className="flex mb-[15px] sm:mb-[20px] items-start gap-3 sm:gap-4 w-full sm:w-[510px]">
            <Image
              src="/selfhelptools/music/Music.svg"
              alt="Music Logo"
              width={63}
              height={63}
              className="w-[25px] h-[25px] sm:w-[40px] sm:h-[40px] md:w-[50px] md:h-[50px] lg:w-[63px] lg:h-[63px]"
            />
            <div className="ml-[3px] sm:ml-[5px] flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-bold text-slate-900 mb-1 sm:mb-2">
                Music Therapy
              </h1>
              <p className="text-[#686D70] text-sm sm:text-base md:text-[16px] font-light hidden xs:block sm:block">
                Curated playlists designed to support your emotional wellbeing.
              </p>
              <p className="text-[#686D70] text-xs sm:text-sm font-light block xs:hidden sm:hidden">
                Explore More Music for emotional wellbeing
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full lg:w-auto mb-[30px] sm:mb-[55px]">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <SearchHeader
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
              />
              <button
                onClick={() =>
                  router.push("/students/selfhelptools/meditation/saved")
                }
                className="h-10 sm:h-[47px] px-4 sm:px-6 rounded-full border font-base transition-colors flex items-center gap-2 whitespace-nowrap text-sm sm:text-base border-[#A5C3FF] bg-[#A5C3FF]/10 text-[#5982D4] hover:bg-blue-100"
              >
                <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                Saved Items ({savedItems.size})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Categories Tabs */}
        <div className="mb-6 sm:mb-8 sm:-mt-6">
          <FilterTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            categories={categories.map((c: any) => c.name)}
          />
        </div>

        {/* Results Grid */}
        {isLoading && !meditationResources.length ? (
          <div className="flex flex-col items-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500">Preparing your peace...</p>
          </div>
        ) : meditationResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {meditationResources.map((med: any) => (
              <MeditationCardItem
                key={med.id}
                meditation={med}
                isSaved={savedItems.has(med.id)}
                onSave={() => toggleSave(med.id)}
                onClick={() => handleCardClick(med)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              No results found for your search.
            </p>
          </div>
        )}
      </div>

      {/* Meditation Instructions Section */}
      {(() => {
        console.log("Checking instructions:", instructions);
        if (instructions && instructions.title) {
          return (
            <div className="mb-6 mt-8">
              <InstructionsDisplay
                title={instructions.title}
                points={instructions.points}
                proTip={instructions.proTip}
                // difficulty={instructions.difficulty}
              />
            </div>
          );
        }
        return null;
      })()}

      {/* Modal - Passing allResources allows the modal to build the playlist */}
      {showPlayer && selectedCard && (
        <PlayerModal card={selectedCard} onClose={() => setShowPlayer(false)} />
      )}
    </div>
  );
}

// Sub-component for individual card logic
function MeditationCardItem({ meditation, isSaved, onSave, onClick }: any) {
  const durationMin = Math.floor((meditation.durationSec || 0) / 60);

  return (
    <div
      onClick={onClick}
      className="group w-auto sm:w-[399px] bg-white rounded-[14px] hover:shadow-xl hover:shadow-[#15A0EA33]/20 transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="relative aspect-square h-[149px]">
        <img
          src={
            meditation.thumbnailUrl || "https://picsum.photos/seed/med/400/300"
          }
          alt={meditation.title}
          className="w-full h-full object-cover opacity-90 rounded-tl-[13px] rounded-tr-[14px]"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center scale-90 group-hover:scale-100 transition-all shadow-lg">
            <Play className="w-5 h-5 text-blue-600 fill-current ml-1" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 text-[20px] truncate flex-1">
            {meditation.title}
          </h3>
          <button
            onClick={onSave}
            className={`p-2 rounded-full w-[36px] h-[35px] border border-[#D4D4D4] ${isSaved ? "bg-red-50 text-red-500" : "bg-gray-50 text-[#666666]"}`}
          >
            <Heart
              className={`w-[18px] h-[18px] ${isSaved ? "fill-current" : ""}`}
            />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {meditation.artist || "Therapeutic Artist"}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-[14px] h-[14px] -mr-1 text-[#686D70]"></Clock>
          <span className="text-[13px] text-[#686D70] -mb-0.5 -ml-0.5 rounded">
            {Math.floor(meditation.duration / 60)} mins
          </span>
          {meditation.category && (
            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {meditation.category}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded tracking-wider uppercase">
            {durationMin} MINS
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevents opening the modal when clicking favorite
              onSave();
            }}
            className={`p-2 rounded-full transition-colors ${
              isSaved
                ? "text-red-500 bg-red-50"
                : "text-gray-400 hover:bg-gray-100 hover:text-red-400"
            }`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
