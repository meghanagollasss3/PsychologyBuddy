import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Power, 
  BookOpen, 
  Sparkles, 
  Mic, 
  Palette, 
  Shield, 
  Clock, 
  Undo, 
  Redo, 
  Trash, 
  PenTool, 
  Loader2, 
  School, 
  Users, 
  UserCheck, 
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAdminLoading, AdminActions } from "@/src/contexts/AdminLoadingContext";
import { LoadingButton } from "@/src/components/admin/ui/AdminLoader";
import { 
  JournalPrompt, 
  JournalingConfig, 
  AudioJournalingConfig, 
  ArtJournalingConfig, 
  ApiResponse,
  journalPrompts,
  defaultJournalMoods
} from "./types";

interface JournalingToolsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAddJournalingPromptOpen?: boolean;
  setIsAddJournalingPromptOpen?: (open: boolean) => void;
  isAddJournalingCategoryOpen?: boolean;
  setIsAddJournalingCategoryOpen?: (open: boolean) => void;
  selectedSchool?: string;
  isSuperAdmin?: boolean;
  schools?: Array<{ id: string; name: string }>;
}

export default function JournalingTools({ 
  searchQuery, 
  setSearchQuery, 
  isAddJournalingPromptOpen = false, 
  setIsAddJournalingPromptOpen,
  isAddJournalingCategoryOpen = false, 
  setIsAddJournalingCategoryOpen,
  selectedSchool = "all",
  isSuperAdmin = false,
  schools = []
}: JournalingToolsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { executeWithLoading, setLoading } = useAdminLoading();
  
  // Helper function to extract error messages
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    return "An unknown error occurred";
  };
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false); // Track when saving is in progress
  
  // Load color palette setting from localStorage
  const loadColorPaletteFromStorage = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('artColorPaletteEnabled');
      return saved !== null ? JSON.parse(saved) : true; // Default to true
    }
    return true;
  };

  // Save color palette setting to localStorage
  const saveColorPaletteToStorage = (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('artColorPaletteEnabled', JSON.stringify(enabled));
    }
  };

  // Data states
  const [journalPrompts, setJournalPrompts] = useState<JournalPrompt[]>([]);
  
  // Configuration states
  const [journalingConfig, setJournalingConfig] = useState<JournalingConfig>({
    writingEnabled: true,
    audioEnabled: true,
    artEnabled: true,
  });
  
  const [audioConfig, setAudioConfig] = useState<AudioJournalingConfig>({
    maxRecordingDuration: 180,
    autoDeleteBehavior: "manual",
  });
  
  const [artConfig, setArtConfig] = useState<ArtJournalingConfig>({
    undoRedoEnabled: true,
    colorPaletteEnabled: loadColorPaletteFromStorage(), // Load from localStorage
    clearCanvasEnabled: true,
  });

  // Lists management
  const [journalMoods, setJournalMoods] = useState<string[]>(defaultJournalMoods);
  
  // Form states
  const [journalForm, setJournalForm] = useState({ 
    text: "", 
    moodIds: [] as string[]
  });
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  
  // Dialog states - use props instead of local state
  // const [isAddJournalingPromptOpen, setIsAddJournalingPromptOpen] = useState(false);

  // API Functions
  const fetchJournalingConfig = async () => {
    try {
      let url = '/api/admin/journaling/config';
      
      // Add schoolId parameter if a specific school is selected
      if (selectedSchool !== "all") {
        url += `?schoolId=${selectedSchool}`;
      }
      // For regular admins, always use their school
      else if (user?.school?.id && !isSuperAdmin) {
        url += `?schoolId=${user.school.id}`;
      }
      // If super admin selects "all", fetch global configuration
      else if (selectedSchool === "all" && isSuperAdmin) {
        // For super admins with "all schools", fetch the global configuration
        // This will show the actual saved settings for all schools
        url += '?schoolId=all';
      }
      // If we reach here, user doesn't have a school assigned and shouldn't be fetching config
      else {
        toast({ 
          title: "Configuration Error", 
          description: "Unable to determine school for configuration. Please contact system administrator.", 
          variant: "destructive" 
        });
        return;
      }
      
      const response = await fetch(url, {
        headers: {
          "x-user-id": user?.id || "admin@calmpath.ai",
          ...(selectedSchool !== "all" && { "x-school-id": selectedSchool }),
          ...(user?.school?.id && !isSuperAdmin && { "x-school-id": user.school.id }),
        },
      });
      const data: ApiResponse<any> = await response.json();
      
      console.log('Fetch response:', data);
      
      if (data.success && data.data) {
        
        // Update the config state with fetched data
        console.log('Updating state with data:', data.data);
        const newJournalingConfig = { ...journalingConfig };
        const newAudioConfig = { ...audioConfig };
        const newArtConfig = { ...artConfig };
        
        if (data.data.enableWriting !== undefined) {
          console.log('Setting writingEnabled to:', data.data.enableWriting);
          newJournalingConfig.writingEnabled = data.data.enableWriting;
        }
        if (data.data.enableAudio !== undefined) {
          console.log('Setting audioEnabled to:', data.data.enableAudio);
          newJournalingConfig.audioEnabled = data.data.enableAudio;
        }
        if (data.data.enableArt !== undefined) {
          console.log('Setting artEnabled to:', data.data.enableArt);
          newJournalingConfig.artEnabled = data.data.enableArt;
        }
        if (data.data.maxAudioDuration !== undefined) {
          console.log('Setting maxRecordingDuration to:', data.data.maxAudioDuration);
          newAudioConfig.maxRecordingDuration = data.data.maxAudioDuration;
        }
        if (data.data.autoSaveAudio !== undefined) {
          console.log('Setting autoDeleteBehavior to:', data.data.autoSaveAudio ? '7days' : 'manual');
          newAudioConfig.autoDeleteBehavior = data.data.autoSaveAudio ? '7days' : 'manual';
        }
        if (data.data.enableUndo !== undefined) {
          console.log('Setting undoRedoEnabled to:', data.data.enableUndo);
          newArtConfig.undoRedoEnabled = data.data.enableUndo;
        }
        if (data.data.enableRedo !== undefined) {
          console.log('Setting undoRedoEnabled to:', data.data.enableRedo);
          newArtConfig.undoRedoEnabled = data.data.enableRedo;
        }
        if (data.data.enableClearCanvas !== undefined) {
          console.log('Setting clearCanvasEnabled to:', data.data.enableClearCanvas);
          newArtConfig.clearCanvasEnabled = data.data.enableClearCanvas;
        }
        // enableColorPalette is not stored in DB yet, so we don't load it from backend
        // if (data.data.enableColorPalette !== undefined) {
        //   newArtConfig.colorPaletteEnabled = data.data.enableColorPalette;
        // }
        
        // Preserve the colorPaletteEnabled setting from localStorage
        newArtConfig.colorPaletteEnabled = loadColorPaletteFromStorage();
        
        console.log('Final state before setting:', {
          journaling: newJournalingConfig,
          audio: newAudioConfig,
          art: newArtConfig
        });
        
        setJournalingConfig(newJournalingConfig);
        setAudioConfig(newAudioConfig);
        setArtConfig(newArtConfig);
        
        console.log('State after setting:', {
          journaling: journalingConfig,
          audio: audioConfig,
          art: artConfig
        });
      } else {
        // Set default values if no config exists
        setJournalingConfig({
          writingEnabled: true,
          audioEnabled: true,
          artEnabled: true,
        });
        setAudioConfig({
          maxRecordingDuration: 180,
          autoDeleteBehavior: "manual",
        });
        setArtConfig({
          undoRedoEnabled: true,
          colorPaletteEnabled: true,
          clearCanvasEnabled: true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch journaling config:', error);
      toast({ title: "Error", description: "Failed to fetch journaling config", variant: "destructive" });
    }
  };

  const fetchJournalPrompts = async () => {
    try {
      const url = selectedSchool === "all" 
        ? '/api/admin/journaling/prompts'
        : `/api/admin/journaling/prompts?schoolId=${selectedSchool}`;
      
      const response = await fetch(url, {
        headers: {
          "x-user-id": user?.id || "admin@calmpath.ai",
          ...(selectedSchool !== "all" && { "x-school-id": selectedSchool }),
        },
      });
      const data: ApiResponse<JournalPrompt[]> = await response.json();
      if (data.success && data.data) {
        setJournalPrompts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch journal prompts:', error);
      toast({ title: "Error", description: "Failed to fetch journal prompts", variant: "destructive" });
    }
  };

  const fetchJournalMoods = async () => {
    try {
      const response = await fetch('/api/labels/moods', {
        headers: {
          "x-user-id": user?.id || "admin@calmpath.ai",
          ...(user?.school?.id && { "x-school-id": user.school.id }),
        },
      });
      const data: ApiResponse<any[]> = await response.json();
      if (data.success && data.data) {
        const moodNames = data.data.map((mood: any) => mood.name);
        setJournalMoods(moodNames);
      }
    } catch (error) {
      console.error('Failed to fetch journal moods:', error);
      toast({ title: "Error", description: "Failed to fetch journal moods", variant: "destructive" });
    }
  };

  const createJournalPrompt = async () => {
    setIsSubmitting(true);
    try {
      // Validate all required fields
      const validationErrors: string[] = [];
      
      // Check prompt text
      if (!journalForm.text.trim()) {
        validationErrors.push("Prompt is required");
      }
      
      // Check moods
      if (!journalForm.moodIds || journalForm.moodIds.length === 0) {
        validationErrors.push("At least one mood is required");
      }
      
      // If there are validation errors, show them and return
      if (validationErrors.length > 0) {
        toast({ 
          title: "Required", 
          description: validationErrors.join(", "), 
          variant: "destructive" 
        });
        setIsSubmitting(false);
        return;
      }
      
      const payload: any = {
        text: journalForm.text,
        moodIds: journalForm.moodIds,
      };

      let response;
      if (editingPrompt) {
        // Update existing prompt
        response = await fetch(`/api/admin/journaling/prompts/${editingPrompt}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            "x-user-id": user?.id || "admin@calmpath.ai",
            ...(user?.school?.id && { "x-school-id": user.school.id }),
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new prompt
        response = await fetch('/api/admin/journaling/prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "x-user-id": user?.id || "admin@calmpath.ai",
            ...(user?.school?.id && { "x-school-id": user.school.id }),
          },
          body: JSON.stringify(payload)
        });
      }

      const data: ApiResponse<JournalPrompt> = await response.json();
      if (data.success) {
        toast({ title: "Success", description: editingPrompt ? "Journal prompt updated successfully" : "Journal prompt created successfully" });
        setJournalForm({ text: "", moodIds: [] });
        setEditingPrompt(null);
        setIsAddJournalingPromptOpen?.(false);
        await fetchJournalPrompts();
      } else {
        const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  return "An unknown error occurred";
};

toast({ title: "Error", description: getErrorMessage(data.error) || "Failed to create prompt", variant: "destructive" });
      }
    } catch (error) {
      console.error('Failed to create journal prompt:', error);
      toast({ title: "Error", description: "Failed to create journal prompt", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const editJournalPrompt = async (prompt: JournalPrompt) => {
    setJournalForm({
      text: prompt.text,
      moodIds: prompt.moodIds
    });
    setEditingPrompt(prompt.id);
    setIsAddJournalingPromptOpen?.(true);
  };

  const updateJournalPromptStatus = async (id: string, isEnabled: boolean) => {
    await executeWithLoading(
      AdminActions.EDIT_JOURNALING_RESOURCE,
      (async () => {
        try {
          const response = await fetch(`/api/admin/journaling/prompts/${id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              "x-user-id": user?.id || "admin@calmpath.ai",
              ...(user?.school?.id && { "x-school-id": user.school.id }),
            },
            body: JSON.stringify({ isEnabled })
          });
          const data: ApiResponse<JournalPrompt> = await response.json();
          if (data.success) {
            toast({ 
              title: isEnabled ? "Prompt Enabled" : "Prompt Disabled",
              description: `Journal prompt has been ${isEnabled ? "enabled" : "disabled"} for students.`
            });
            await fetchJournalPrompts();
          } else {
            toast({ title: "Error", description: getErrorMessage(data.error) || "Failed to update prompt status", variant: "destructive" });
          }
        } catch (error) {
          console.error('Failed to update journal prompt status:', error);
          toast({ title: "Error", description: "Failed to update prompt status", variant: "destructive" });
        }
      })(),
      `${isEnabled ? 'Enabling' : 'Disabling'} prompt...`
    );
  };

  const deleteJournalPrompt = async (id: string) => {
    await executeWithLoading(
      AdminActions.DELETE_JOURNALING_RESOURCE,
      (async () => {
        try {
          const response = await fetch(`/api/admin/journaling/prompts/${id}`, {
            method: 'DELETE',
            headers: {
              "x-user-id": user?.id || "admin@calmpath.ai",
              ...(user?.school?.id && { "x-school-id": user.school.id }),
            }
          });
          const data: ApiResponse<null> = await response.json();
          if (data.success) {
            toast({ title: "Success", description: "Journal prompt deleted successfully" });
            await fetchJournalPrompts();
          } else {
            toast({ title: "Error", description: getErrorMessage(data.error) || "Failed to delete prompt", variant: "destructive" });
          }
        } catch (error) {
          console.error('Failed to delete journal prompt:', error);
          toast({ title: "Error", description: "Failed to delete prompt", variant: "destructive" });
        }
      })(),
      'Deleting journal prompt...'
    );
  };

  const saveJournalingConfig = async (updatedConfig?: JournalingConfig, updatedArtConfig?: ArtJournalingConfig, updatedAudioConfig?: AudioJournalingConfig) => {
    // Prevent multiple simultaneous saves
    if (isSavingConfig) {
      console.log('Save already in progress, skipping...');
      return;
    }
    
    try {
      setIsSavingConfig(true);
      
      // Use the provided updated config or fall back to current state
      const configToSave = updatedConfig || journalingConfig;
      const artConfigToUse = updatedArtConfig || artConfig;
      const audioConfigToUse = updatedAudioConfig || audioConfig;
      
      const payload: any = {
        enableWriting: configToSave.writingEnabled,
        enableAudio: configToSave.audioEnabled,
        enableArt: configToSave.artEnabled,
        maxAudioDuration: audioConfigToUse.maxRecordingDuration,
        autoSaveAudio: audioConfigToUse.autoDeleteBehavior !== 'manual', // Convert any non-manual value to true
        enableUndo: artConfigToUse.undoRedoEnabled,
        enableRedo: artConfigToUse.undoRedoEnabled,
        enableClearCanvas: artConfigToUse.clearCanvasEnabled,
        // enableColorPalette: artConfigToUse.colorPaletteEnabled, // Field doesn't exist in database schema
      };

      // Add schoolId based on selection
      if (selectedSchool !== "all") {
        payload.schoolId = selectedSchool;
      }
      // For regular admins, always use their school
      else if (user?.school?.id && !isSuperAdmin) {
        payload.schoolId = user.school.id;
      }
      // Super admins with "all schools" selected - can do global update
      else if (selectedSchool === "all" && isSuperAdmin) {
        payload.schoolId = 'all'; // Global update
      }
      // If we reach here, user doesn't have a school assigned
      else {
        toast({ 
          title: "Configuration Error", 
          description: "Unable to determine school for configuration. Please contact system administrator.", 
          variant: "destructive" 
        });
        setIsSavingConfig(false);
        return;
      }

      console.log('Saving payload:', payload);
      console.log('Selected school:', selectedSchool, 'Is super admin:', isSuperAdmin);

      const response = await fetch('/api/admin/journaling/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "x-user-id": user?.id || "admin@calmpath.ai",
          ...(selectedSchool !== "all" && { "x-school-id": selectedSchool }),
          ...(user?.school?.id && !isSuperAdmin && { "x-school-id": user.school.id }),
        },
        body: JSON.stringify(payload)
      });
      const data: ApiResponse<any> = await response.json();
      
      console.log('Server response:', data);
      
      const isGlobalUpdate = selectedSchool === "all" && isSuperAdmin;
      
      if (data.success) {
        console.log('Save successful, refetching data...', data);
        
        // Refetch data to get latest state from server
        console.log('Starting refetch...');
        await Promise.all([
          fetchJournalingConfig(),
          fetchJournalPrompts(),
          fetchJournalMoods()
        ]);
        console.log('Refetch completed');
        
        toast({ title: "Success", description: isGlobalUpdate ? "Configuration saved for all schools" : "Configuration saved successfully" });
      } else {
        console.error('Save failed:', data);
        toast({ title: "Error", description: getErrorMessage(data.error) || "Failed to save configuration", variant: "destructive" });
      }
    } catch (error) {
      console.error('Failed to save journaling config:', error);
      toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Load data on component mount and school change
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoading(AdminActions.FETCH_JOURNALING_RESOURCES, true, "Loading journaling data...");
      try {
        await Promise.all([
          fetchJournalingConfig(),
          fetchJournalPrompts(),
          fetchJournalMoods()
        ]);
      } finally {
        setIsLoading(false);
        setLoading(AdminActions.FETCH_JOURNALING_RESOURCES, false);
      }
    };
    loadData();
  }, [selectedSchool]); // Only refetch when school selection changes

  // Handlers
  const handleJournalingConfigChange = async (key: keyof JournalingConfig, value: boolean) => {
    // Update local state immediately for UI feedback
    const newConfig = { ...journalingConfig, [key]: value };
    setJournalingConfig(newConfig);
    
    // Pass all current configs to save
    await saveJournalingConfig(newConfig, artConfig, audioConfig);
    
    toast({
      title: value ? "Enabled" : "Disabled",
      description: `${key.replace("Enabled", "")} journaling has been ${value ? "enabled" : "disabled"} for students.`,
    });
  };

  const handleAudioConfigChange = async <K extends keyof AudioJournalingConfig>(key: K, value: AudioJournalingConfig[K]) => {
    const newAudioConfig = { ...audioConfig, [key]: value };
    setAudioConfig(newAudioConfig);
    
    // Pass all current configs to save
    await saveJournalingConfig(journalingConfig, artConfig, newAudioConfig);
    toast({ title: "Settings Updated", description: "Audio journaling configuration has been saved." });
  };

  const handleArtConfigChange = async (key: keyof ArtJournalingConfig, value: boolean) => {
    const newArtConfig = { ...artConfig, [key]: value };
    setArtConfig(newArtConfig);
    
    // Save color palette to localStorage if that's what changed
    if (key === 'colorPaletteEnabled') {
      saveColorPaletteToStorage(value);
    }
    
    // Pass all current configs to save
    await saveJournalingConfig(journalingConfig, newArtConfig, audioConfig);
    
    toast({ title: "Settings Updated", description: "Art journaling configuration has been saved." });
  };

  const handleSaveJournal = async () => {
    await createJournalPrompt();
  };

  const handleDeletePrompt = (id: string) => {
    setPromptToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePrompt = async () => {
    if (promptToDelete) {
      await deleteJournalPrompt(promptToDelete);
      setIsDeleteModalOpen(false);
      setPromptToDelete(null);
    }
  };

  // Role-based permission helpers
  const canManageAllSchools = isSuperAdmin;
  const userSchoolName = user?.school?.name || 'Unknown School';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAutoDeleteLabel = (value: string) => {
    switch (value) {
      case "manual": return "Manual only";
      case "7days": return "After 7 days";
      case "14days": return "After 14 days";
      case "30days": return "After 30 days";
      case "90days": return "After 90 days";
      default: return "Manual only";
    }
  };

  const filteredPrompts = journalPrompts.filter(p => 
    (p.text && p.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.moodIds && p.moodIds.some((m: string) => m && m.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  
  return (
    <div className="space-y-6">
      {/* Role-based Permission Banner */}
      {/* <div className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        isSuperAdmin 
          ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900" 
          : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
      )}>
        {isSuperAdmin ? (
          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
        ) : (
          <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {isSuperAdmin ? "Super Admin Access" : "School Admin Access"}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {isSuperAdmin 
              ? selectedSchool === "all" 
                ? "You are configuring journaling settings for ALL schools. Changes will apply globally."
                : `You are currently managing journaling settings for: ${schools.find((s: { id: string; name: string }) => s.id === selectedSchool)?.name || selectedSchool}`
              : `You can manage journaling settings for ${userSchoolName} only.`
            }
          </p>
        </div>
      </div> */}

      {/* Show warning when all schools is selected */}
      {/* {isSuperAdmin && selectedSchool === "all" && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Global Configuration Mode
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You are configuring settings for ALL schools. Changes will be applied to every school in the system. To configure individual schools, select a specific school from the dropdown.
            </p>
          </div>
        </div>
      )} */}

      {/* Privacy Notice */}
      <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4">
        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Privacy Protected</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Journaling content is private to students and is not accessible or reviewed by administrators.
          </p>
        </div>
      </div>

      {/* Journaling Types Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#3B82F6]" />
            Journaling Types
          </CardTitle>
          <CardDescription>Enable or disable journaling modes for students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                  <PenTool className="h-5 w-5 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="font-medium text-sm">Writing</p>
                  <p className="text-xs text-muted-foreground">Text-based journaling</p>
                </div>
              </div>
              <Switch 
                checked={journalingConfig.writingEnabled}
                onCheckedChange={(v) => handleJournalingConfigChange("writingEnabled", v)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                  <Mic className="h-5 w-5 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="font-medium text-sm">Audio</p>
                  <p className="text-xs text-muted-foreground">Voice recordings</p>
                </div>
              </div>
              <Switch 
                checked={journalingConfig.audioEnabled}
                onCheckedChange={(v) => handleJournalingConfigChange("audioEnabled", v)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="font-medium text-sm">Art-Based</p>
                  <p className="text-xs text-[#64748B]">Drawing & visual art</p>
                </div>
              </div>
              <Switch 
                checked={journalingConfig.artEnabled}
                onCheckedChange={(v) => handleJournalingConfigChange("artEnabled", v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Journaling Configuration */}
      {journalingConfig.audioEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mic className="h-5 w-5 text-[#3B82F6]" />
              Audio Journaling Settings
            </CardTitle>
            <CardDescription>Configure audio recording parameters (content is never accessible to admins)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#64748B]" />
                  Maximum Recording Duration
                </Label>
                <Select 
                  value={audioConfig.maxRecordingDuration.toString()} 
                  onValueChange={(v) => handleAudioConfigChange("maxRecordingDuration", parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue>{formatDuration(audioConfig.maxRecordingDuration)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1:00 (1 minute)</SelectItem>
                    <SelectItem value="120">2:00 (2 minutes)</SelectItem>
                    <SelectItem value="180">3:00 (3 minutes)</SelectItem>
                    <SelectItem value="300">5:00 (5 minutes)</SelectItem>
                    <SelectItem value="600">10:00 (10 minutes)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#64748B]">Maximum length for each audio recording</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Trash className="h-4 w-4 text-[#64748B]" />
                  Auto-Delete Behavior
                </Label>
                <Select 
                  value={audioConfig.autoDeleteBehavior} 
                  onValueChange={(v: AudioJournalingConfig["autoDeleteBehavior"]) => handleAudioConfigChange("autoDeleteBehavior", v)}
                >
                  <SelectTrigger>
                    <SelectValue>{getAutoDeleteLabel(audioConfig.autoDeleteBehavior)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual only (student deletes)</SelectItem>
                    <SelectItem value="7days">Auto-delete after 7 days</SelectItem>
                    <SelectItem value="14days">Auto-delete after 14 days</SelectItem>
                    <SelectItem value="30days">Auto-delete after 30 days</SelectItem>
                    <SelectItem value="90days">Auto-delete after 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">When audio recordings are automatically removed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Art Journaling Configuration */}
      {journalingConfig.artEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#3B82F6]" />
              Art Journaling Settings
            </CardTitle>
            <CardDescription>Configure canvas tools for art journaling (drawings are never visible to admins)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enable or disable canvas tools globally</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Undo className="h-4 w-4 text-[#64748B]" />
                    <span className="text-sm">Undo / Redo</span>
                  </div>
                  <Switch 
                    checked={artConfig.undoRedoEnabled}
                    onCheckedChange={(v) => {
                      handleArtConfigChange("undoRedoEnabled", v);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-[#64748B]" />
                    <span className="text-sm">Color Palette</span>
                  </div>
                  <Switch 
                    checked={artConfig.colorPaletteEnabled}
                    onCheckedChange={(v) => {
                      handleArtConfigChange("colorPaletteEnabled", v);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-[#64748B]" />
                    <span className="text-sm">Clear Canvas</span>
                  </div>
                  <Switch 
                    checked={artConfig.clearCanvasEnabled}
                    onCheckedChange={(v) => {
                      handleArtConfigChange("clearCanvasEnabled", v);
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Mood-Based Prompts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Mood-Based Prompts</h3>
            <p className="text-sm text-muted-foreground">
              Manage prompts for writing and art journaling. Prompts can be reused across journaling types.
            </p>
          </div>
        </div>
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
          <Input 
            placeholder="Search prompts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-wrap gap-1">
                    {prompt.moodIds.map((mood: string) => (
                      <Badge key={mood} variant="outline" className="text-xs">{mood}</Badge>
                    ))}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => editJournalPrompt(prompt)}>
                      <Edit className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 text-destructive" 
                        onClick={() => handleDeletePrompt(prompt.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground mb-3">{prompt.text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <PenTool className="h-3 w-3" />
                      Writing
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={prompt.isEnabled}
                      onCheckedChange={(checked) => updateJournalPromptStatus(prompt.id, checked)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {prompt.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
  </div>
</div>

{/* Add Journal Prompt Dialog */}
<Dialog open={isAddJournalingPromptOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingPrompt(null);
          setJournalForm({ text: "", moodIds: [] });
        }
        setIsAddJournalingPromptOpen?.(open);
      }}>
  <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
    <DialogHeader>
      <DialogTitle>{editingPrompt ? "Edit Journal Prompt" : "Add Journal Prompt"}</DialogTitle>
      <DialogDescription>{editingPrompt ? "Edit an existing prompt for student journaling." : "Create a new prompt for student journaling. Prompts can be used across writing and art journaling."}</DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label>Prompt <span className="text-red-500">*</span></Label>
        <Textarea 
          placeholder="Enter the journal prompt..."
          value={journalForm.text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJournalForm((prev: any) => ({ ...prev, text: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="grid gap-2">
        <Label>Mood(s) <span className="text-red-500">*</span></Label>
        <div className="flex flex-wrap gap-2">
          {journalMoods.map((mood) => (
            <Button
              key={mood}
              variant={journalForm.moodIds.includes(mood) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (journalForm.moodIds.includes(mood)) {
                  setJournalForm((prev: any) => ({ ...prev, moodIds: prev.moodIds.filter((m: string) => m !== mood) }));
                } else {
                  setJournalForm((prev: any) => ({ ...prev, moodIds: [...prev.moodIds, mood] }));
                }
              }}
            >
              {mood}
            </Button>
          ))}
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsAddJournalingPromptOpen?.(false)}>Cancel</Button>
      <LoadingButton 
              onClick={createJournalPrompt} 
              disabled={isSubmitting}
              isLoading={isSubmitting}
              loadingText="Saving..."
            >
              {editingPrompt ? "Update" : "Create"}
            </LoadingButton>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDeleteModalOpen(false);
          setPromptToDelete(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Journal Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this journal prompt? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeletePrompt}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
</div>
  );
}
