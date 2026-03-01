"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Eye,
  Trash2,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import StudentLayout from "@/src/components/StudentDashboard/Layout/StudentLayout";

interface WritingJournal {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  mood?: string;
}

export default function AllJournalsPage() {
  const router = useRouter();
  const [journals, setJournals] = useState<WritingJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student/journals/writing");
      const result = await response.json();

      if (result.success) {
        setJournals(result.data);
      } else {
        toast.error("Failed to fetch journals");
      }
    } catch (error) {
      console.error("Error fetching journals:", error);
      toast.error("Error loading journals");
    } finally {
      setLoading(false);
    }
  };

  const deleteJournal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) {
      return;
    }

    try {
      const response = await fetch(`/api/student/journals/writing/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setJournals((prev) => prev.filter((journal) => journal.id !== id));
        toast.success("Journal deleted successfully");
      } else {
        toast.error(result.error?.message || "Failed to delete journal");
      }
    } catch (error) {
      console.error("Error deleting journal:", error);
      toast.error("Error deleting journal");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const filteredAndSortedJournals = journals
    .filter(
      (journal) =>
        journal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.content.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        return (a.title || "").localeCompare(b.title || "");
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="text-slate-500 mt-4">Loading journals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/students/selfhelptools/journaling")}
              className={`flex items-center gap-2 text-[#73829A] hover:text-[#1a9bcc] transition-colors p-2 mb-5`}
            >
              <ArrowLeft className="w-4 h-5" />
              <span className="text-[13px] sm:text-[16px]">
                Back to Journaling
              </span>
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/selfhelptools/journaling/write.svg"
                  alt="Editor"
                  className="w-[45px] h-[45px] sm:w-[63px] sm:h-[63px]"
                />

                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Your Journals
                  </h1>
                  <p className="text-slate-500 text-sm">
                    View and manage all your journal entries
                  </p>
                </div>
              </div>

            
            </div>
          </div>

          {/* Journals Grid */}
          {filteredAndSortedJournals.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                No journals found
              </h2>
              <p className="text-slate-500">
                {searchTerm
                  ? "No journals match your search."
                  : "Start writing to see your entries here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedJournals.map((journal) => (
                <div
                  key={journal.id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-cyan-500/5 transition-all cursor-pointer group"
                  onClick={() =>
                    router.push(`/students/journaling/${journal.id}`)
                  }
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
                        {journal.title || "Untitled Entry"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(journal.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/students/selfhelptools/journaling/${journal.id}`,
                          );
                        }}
                        className="text-cyan-500 hover:text-cyan-600 transition-colors p-2 hover:bg-cyan-50 rounded-xl"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteJournal(journal.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all p-2 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                    {journal.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
