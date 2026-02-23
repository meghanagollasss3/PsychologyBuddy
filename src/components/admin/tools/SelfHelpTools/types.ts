// Shared types for Self Help Tools

export interface ListeningInstructions {
  title: string;
  points: string[];
  proTip?: string;
}

export interface JournalPrompt {
  id: string;
  text: string;
  moodIds: string[];
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MusicResource {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  coverImage?: string | null;
  categories?: { category: { name: string } }[];
  goals?: { goal: { name: string } }[];
  duration?: number;
  status: "DRAFT" | "PUBLISHED";
  isPublic?: boolean;
  learnerCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeditationResource {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  format: "AUDIO" | "VIDEO" | "TEXT";
  audioUrl?: string | null;
  videoUrl?: string | null;
  durationSec?: number | null;
  instructor?: string | null;
  type: "GUIDED" | "MUSIC" | "BREATHING" | "BODY_SCAN";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  categories?: {
    id: string;
    category: {
      id: string;
      name: string;
    }
  }[];
  moods?: {
    id: string;
    mood: {
      id: string;
      name: string;
    }
  }[];
  goals?: {
    id: string;
    goal: {
      id: string;
      name: string;
    }
  }[];
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface JournalingConfig {
  writingEnabled: boolean;
  audioEnabled: boolean;
  artEnabled: boolean;
}

export interface AudioJournalingConfig {
  maxRecordingDuration: number;
  autoDeleteBehavior: "manual" | "7days" | "14days" | "30days" | "90days";
}

export interface ArtJournalingConfig {
  undoRedoEnabled: boolean;
  colorPaletteEnabled: boolean;
  clearCanvasEnabled: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: {
    resources?: T[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
  error?: string;
}

// Default data
export const defaultMusicInstructions: ListeningInstructions = {
  title: "Listening Instructions",
  points: [
    "Find a comfortable, quiet space where you won't be disturbed",
    "Use headphones for the best experience",
    "Allow yourself to fully immerse in the sounds",
    "Breathe naturally and let the music guide your relaxation",
    "Continue listening for the full duration without interruption"
  ],
  proTip: "For best results, listen at a comfortable volume and avoid multitasking."
};

export const defaultMeditationInstructions: ListeningInstructions = {
  title: "Listening Instructions",
  points: [
    "Find a quiet, comfortable place to sit or lie down",
    "Close your eyes gently and take a deep breath",
    "Focus on your breath as it flows in and out",
    "If your mind wanders, gently bring it back",
    "Continue for the full duration without judgment"
  ],
  proTip: "It's normal for your mind to wander. Be gentle with yourself and return your focus to your breath."
};

export const journalPrompts: JournalPrompt[] = [
  { id: "1", text: "What are you grateful for today?", moodIds: [], isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", text: "Describe a challenge you overcame recently", moodIds: [], isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "3", text: "What made you smile today?", moodIds: [], isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "4", text: "Write about something you're looking forward to", moodIds: [], isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "5", text: "Draw how you're feeling right now", moodIds: [], isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "6", text: "Create an image of your happy place", moodIds: [], isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const defaultJournalMoods: string[] = [];
export const defaultMusicMoods: string[] = [];
export const defaultMeditationMoods: string[] = [];
export const defaultMusicGoals: string[] = [];
export const defaultMeditationGoals: string[] = [];
