"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { SearchParamsUtils } from "@/src/lib/ai/search-params";
import { getAuthHeaders } from "@/src/utils";
import BackToDashboard from "../Layout/BackToDashboard";
import { useServerAuth } from "@/src/hooks";

type Mood = "Happy" | "Okay" | "Sad" | "Anxious" | "Tired" | null;
type Factor = "friends" | "exams" | "family" | "social" | "sleep" | "school" | "health" | "others";

interface MoodOption {
  emoji: string;
  label: Mood;
}

interface FactorOption {
  id: Factor;
  label: string;
}

const moodOptions: MoodOption[] = [
  { emoji: "/Emojis/Happy.png", label: "Happy" },
  { emoji: "/Emojis/Okay1.png", label: "Okay" },
  { emoji: "/Emojis/Sad.png", label: "Sad" },
  { emoji: "/Emojis/Angry.png", label: "Anxious" },
  { emoji: "/Emojis/Tired1.png", label: "Tired" },
];

const factorOptions: FactorOption[] = [
  { id: "friends", label: "Friends" },
  { id: "exams", label: "Exams" },
  { id: "family", label: "Family" },
  { id: "social", label: "Social pressure" },
  { id: "sleep", label: "Sleep" },
  { id: "school", label: "School work" },
  { id: "health", label: "Health" },
  { id: "others", label: "Others" },
];

export default function MoodCheckIn() {
  const router = useRouter();
  const { user } = useServerAuth(); // Use proper authentication
  const [selectedMood, setSelectedMood] = useState<Mood>(null);
  const [selectedFactors, setSelectedFactors] = useState<Factor[]>([]);
  const [notes, setNotes] = useState("");
  const [showAdditionalQuestions, setShowAdditionalQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    setShowAdditionalQuestions(true);
    
    // Smooth scroll to additional questions
    setTimeout(() => {
      const element = document.getElementById("additional-questions");
      element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  const handleFactorToggle = (factor: Factor) => {
    setSelectedFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor]
    );
    
    // Smooth scroll to submit button after selecting first factor
    if (selectedFactors.length === 0) {
      setTimeout(() => {
        const element = document.getElementById("submit-section");
        element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      setError("Please select your mood before submitting.");
      return;
    }

    if (!user) {
      setError("User authentication required. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Submitting mood checkin with data:", {
        mood: selectedMood,
        triggers: selectedFactors,
        notes: notes.trim() || undefined,
      });

      const response = await fetch('/api/students/mood/checkin', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          mood: selectedMood,
          triggers: selectedFactors,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorData = {};
        }
        
        console.error("API Error Response:", errorData);
        console.error("Response status:", response.status, response.statusText);
        
        // Handle specific status codes even if response body is empty
        if (response.status === 409) {
          throw new Error('You have already checked in today. Please try again tomorrow.');
        }
        
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to perform this action.');
        }
        
        if (response.status === 404) {
          throw new Error('The requested resource was not found.');
        }
        
        const errorMessage = errorData?.message || errorData?.error || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Check-in submitted successfully:", result);

      // Show success message and navigate to chat with mood data
      alert("Thank you for checking in! Your mood has been recorded.");
      
      // Navigate to chat with mood and trigger data using utility
      const params = SearchParamsUtils.createChatParams({
        mood: selectedMood,
        triggers: selectedFactors,
        notes: notes.trim() || undefined,
      })
      router.push(`/students/chat${params ? `?${params}` : ''}`)
    } catch (err) {
      console.error("Error submitting mood check-in:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#e8eef3]">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Back Button */}
        <BackToDashboard />

        {/* Card */}
        <div className="bg-white rounded-[24px] shadow-sm max-w-7xl mx-auto p-5 sm:p-8 lg:p-12 xl:p-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[38px] font-semibold text-[#2F3D43] mb-3">
              Daily Mood Check-in
            </h2>
            <p className="text-sm sm:text-[20px] text-[#686D70]">
              Take a moment to reflect on how you're feeling
            </p>
          </div>

          {/* Mood Selection */}
          <div className="mb-9">
            <p className="text-sm sm:text-[20px] text-[#2c3e50] font-medium mb-4 sm:mb-6">
              How are you feeling today?
            </p>

            <div className="flex justify-center gap-3 sm:gap-4 lg:gap-6 flex-wrap">
              {moodOptions.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => handleMoodSelect(mood.label)}
                  className="transition-transform hover:-translate-y-1"
                >
                  <div
                    className={`w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] lg:w-[157px] lg:h-[135px] xl:w-[194px] xl:h-[170px] rounded-xl lg:rounded-4xl flex flex-col items-center justify-center transition-all duration-300 transform ${
                      selectedMood === mood.label
                        ? "bg-linear-to-t from-[#1B9EE0] to-[#4FC1F9] inset-shadow-sm inset-shadow-[#D9E8FF26] scale-105 shadow-[0px_8.36px_16.71px_0px_#00000026]"
                        : "bg-[#F5F8FA] hover:bg-[#e8eef3] scale-100"
                    }`}
                  >
                    <img
                      src={mood.emoji}
                      className={`w-[40px] h-[40px] sm:w-[55px] sm:h-[55px] lg:w-[70px] lg:h-[102px] xl:w-[80px] xl:h-[115px] object-contain mb-1 lg:mb-0 transition-all duration-300 ${
                        selectedMood === mood.label ? "scale-110" : "scale-100"
                      }`}
                    />
                    <span
                      className={`text-xs sm:text-sm lg:text-[18px] font-medium ${
                        selectedMood === mood.label
                          ? "text-white"
                          : "text-[#5a6c7d]"
                      }`}
                    >
                      {mood.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Streak Info */}
          {!selectedMood && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-[#5a6c7d] text-xs sm:text-sm mb-6 sm:mb-8 lg:mb-10">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a9bcc]" />
              <span className="text-center">
                You've checked in{" "}
                <span className="text-[#1a9bcc] font-semibold">7 days</span> in a
                row! 🎉
              </span>
            </div>
          )}

          {/* Additional Questions */}
          {showAdditionalQuestions && (
            <div
              id="additional-questions"
              className="space-y-8"
            >
              {/* What's affecting your mood */}
              <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
                <p className="text-sm sm:text-[20px] text-[#2c3e50] font-medium mb-4 sm:mb-6">
                  What's affecting your mood?
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  {factorOptions.slice(0, 4).map((factor, index) => (
                    <button
                      key={factor.id}
                      onClick={() => handleFactorToggle(factor.id)}
                      className={`w-[135px] h-[50px] sm:w-[255px] sm:h-[63px] lg:w-[255px] lg:h-[63px] py-3 sm:py-4 px-3 sm:px-4 lg:px-5 rounded-[14px] sm:rounded-[23px] text-xs sm:text-[18px] font-medium transition-all duration-300 transform opacity-100 animate-[fadeInUp_0.5s_ease-out_${0.4 + index * 0.1}s_forwards] ${
                        selectedFactors.includes(factor.id)
                          ? "bg-linear-to-t from-[#1B9EE0] to-[#4FC1F9] text-white scale-105 shadow-[0px_8px_16px_0px_#00000026]"
                          : "bg-[#F5F8FA] text-[#5a6c7d] hover:bg-[#e8eef3] scale-100"
                      }`}
                      style={{
                        animationDelay: `${0.4 + index * 0.1}s`
                      }}
                    >
                      {factor.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {factorOptions.slice(4).map((factor, index) => (
                    <button
                      key={factor.id}
                      onClick={() => handleFactorToggle(factor.id)}
                      className={`w-[135px] h-[50px] sm:w-[255px] sm:h-[63px] lg:w-[255px] lg:h-[63px] py-3 sm:py-4 px-3 sm:px-4 lg:px-5 rounded-[14px] sm:rounded-[23px] text-xs sm:text-[18px] font-medium transition-all duration-300 transform opacity-90 animate-[fadeInUp_0.5s_ease-out_${0.8 + index * 0.1}s_forwards] ${
                        selectedFactors.includes(factor.id)
                          ? "bg-linear-to-t from-[#1B9EE0] to-[#4FC1F9] text-white scale-105 shadow-[0px_8px_16px_0px_#00000026]"
                          : "bg-[#F5F8FA] text-[#5a6c7d] hover:bg-[#e8eef3] scale-100"
                      }`}
                    >
                      {factor.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional notes */}
              <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_1.3s_forwards]">
                <p className="text-sm sm:text-[20px] text-[#2c3e50] font-medium mb-4 sm:mb-6">
                  Would you like to share more? (Optional)
                </p>

                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us more about how you're feeling...."
                  className="min-h-[100px] sm:min-h-[180px] w-full resize-none rounded-xl border-2 border-[#E8EEF3] focus:border-[#3db9e8] active:border-[#3db9e8] text-[14px] sm:text-[18px] text-[#2c3e50] placeholder:text-[#9ca8b4] bg-[#F5F8FA] focus:bg-white transition-all duration-300 px-6 py-4 outline-none"
                />
              </div>

              {/* Error Display - Moved near submit button */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00016zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {selectedFactors.length > 0 && (
                <div
                  id="submit-section"
                  className="text-center pt-4 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]"
                >
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="sm:w-[299px] sm:h-[66px] w-[250px] h-[60px] bg-linear-to-t from-[#1B9EE0] to-[#4FC1F9] hover:from-[#1B9EE0] hover:to-[#4FC1F9] text-white font-semibold text-[18px] rounded-[24px] transition-all duration-300 transform hover:scale-105 active:scale-[0.98] shadow-[0px_8.36px_16.71px_0px_#00000026] border-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? "Submitting..." : "Submit check-in"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}