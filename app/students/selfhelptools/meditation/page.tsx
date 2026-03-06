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
import { useToast } from "@/src/hooks/use-toast";
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
        <div className="max-w-7xl mx-auto px-6 py-14">
          {/* Back Button */}
          <button
            onClick={() => router.push("/students/selfhelptools")}
            className="flex items-center gap-2 text-[#73829A] hover:text-[#1a9bcc]"
          >
            <ArrowLeft className="w-4 h-5" />
            Back to SelfHelpTools
          </button>

          {/* Header */}
          <div className="flex justify-between mt-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Image
                src="/Content/Library.svg"
                alt="Meditation"
                width={60}
                height={60}
              />
              <div>
                <h1 className="text-3xl font-bold">Meditation</h1>
                <p className="text-gray-500">
                  Find the perfect practice for your needs
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <SearchHeader
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
              />

              <button
                onClick={() => setShowSavedOnly((prev) => !prev)}
                className={`h-[47px] px-6 rounded-full border flex items-center gap-2
                ${
                  showSavedOnly
                    ? "bg-red-100 text-red-600 border-red-300"
                    : "border-[#A5C3FF] bg-[#A5C3FF]/10 text-[#5982D4]"
                }`}
              >
                <Heart className="w-4 h-4" />
                {showSavedOnly
                  ? "Showing Saved"
                  : `Saved Items (${savedItems.size})`}
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          {!showSavedOnly && (
            <div className="mt-8">
              <FilterTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                categories={categories.map((c: any) => c.name)}
              />
            </div>
          )}

          {/* Meditation Grid */}
          <div className="mt-8">
            {isLoading && !filteredMeditations.length ? (
              <div className="flex flex-col items-center py-24">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                Preparing your peace...
              </div>
            ) : filteredMeditations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                {showSavedOnly
                  ? "You haven't saved any meditations yet."
                  : "No results found for your search."}
              </div>
            )}
          </div>

          {/* Instructions */}
          {instructions?.title && (
            <div className="mt-12">
              <InstructionsDisplay
                title={instructions.title}
                points={instructions.points}
                proTip={instructions.proTip}
              />
            </div>
          )}
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
  const durationMin = Math.max(
    1,
    Math.floor(
      (meditation.durationSec ||
        meditation.duration_seconds ||
        meditation.duration ||
        meditation.length ||
        0) / 60
    )
  );

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-[14px] hover:shadow-xl transition-all cursor-pointer"
    >
      <div className="relative h-[149px]">
        <img
          src={meditation.thumbnailUrl || "https://picsum.photos/400"}
          alt={meditation.title}
          className="w-full h-full object-cover rounded-t-[14px]"
        />
      </div>

      <div className="p-4">
        <div className="flex justify-between">
          <h3 className="font-bold text-[20px] truncate">
            {meditation.title}
          </h3>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className={`p-3 rounded-full border-[1.5px] ${
              isSaved ? "bg-red-50 text-red-500" : "bg-white text-[#D4D4D4]"
            }`}
          >
            <Heart className={`w-[21px] h-[20px] ${isSaved ? "fill-current" : "text-[#666666]"}`} />
          </button>
        </div>

        <p className="text-[16px] text-[#686D70] mb-2">
          {meditation.description || "Meditation Session"}
        </p>

        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
          <Clock className="w-4 h-4" />
          {durationMin} mins
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full h-[52px] border-2 border-[#1C76DC] rounded-full flex text-[#1C76DC] items-center justify-center gap-2 hover:bg-[#1C76DC] hover:text-white transition"
        >
          <PlayIcon className="w-4 h-4" />
          <span className="text-[#1C76DC] group-hover:text-white ml-2 font-medium text-[16px]">
            Play
          </span>
        </button>
      </div>
    </div>
  );
}
