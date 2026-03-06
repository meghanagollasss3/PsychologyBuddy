import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Upload,
  Play,
  Headphones,
  Lightbulb,
  ChevronDown,
  Loader2,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  MeditationResource,
  ApiResponse,
  PaginatedResponse,
  defaultMeditationMoods,
  defaultMeditationGoals,
} from "./types";

interface MeditationToolsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAddMeditationOpen?: boolean;
  setIsAddMeditationOpen?: (open: boolean) => void;
  isAddMeditationCategoryModalOpen?: boolean;
  setIsAddMeditationCategoryModalOpen?: (open: boolean) => void;
  selectedSchool?: string;
  isSuperAdmin?: boolean;
  schools?: Array<{ id: string; name: string }>;
}

export default function MeditationTools({
  searchQuery,
  setSearchQuery,
  isAddMeditationOpen = false,
  setIsAddMeditationOpen,
  isAddMeditationCategoryModalOpen = false,
  setIsAddMeditationCategoryModalOpen,
  selectedSchool,
  isSuperAdmin,
  schools
}: MeditationToolsProps) {
  // Get auth context
  const { user } = useAuth();
  const { toast } = useToast();

  // File input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data states
  const [meditationResources, setMeditationResources] = useState<
    MeditationResource[]
  >([]);

  // Lists management
  const [meditationCategories, setMeditationCategories] = useState<string[]>(
    [],
  );
  const [meditationCategoriesMap, setMeditationCategoriesMap] = useState<{
    [key: string]: string;
  }>({});
  const [meditationGoalsMap, setMeditationGoalsMap] = useState<{
    [key: string]: string;
  }>({});
  const [meditationMoodsMap, setMeditationMoodsMap] = useState<{
    [key: string]: string;
  }>({});
  const [meditationMoods, setMeditationMoods] = useState<string[]>(
    defaultMeditationMoods,
  );
  const [meditationGoals, setMeditationGoals] = useState<string[]>(
    defaultMeditationGoals,
  );

  // Form states
  const [meditationForm, setMeditationForm] = useState({
    id: "", // Add missing id field
    title: "",
    description: "",
    format: "AUDIO" as "AUDIO" | "VIDEO" | "TEXT",
    durationSec: "",
    category: "",
    goal: "",
    mood: "",
    instructor: "",
    thumbnailUrl: "",
    audioUrl: "",
    videoUrl: "",
    type: "GUIDED" as "GUIDED" | "MUSIC" | "BREATHING" | "BODY_SCAN",
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    supportedMoods: [] as string[],
    duration: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#3B82F6",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  // Dialog states
  const [isMeditationMoodPopoverOpen, setIsMeditationMoodPopoverOpen] =
    useState(false);
  const [isMeditationGoalPopoverOpen, setIsMeditationGoalPopoverOpen] =
    useState(false);
  const [newMood, setNewMood] = useState("");
  const [newGoal, setNewGoal] = useState("");

  // Edit states
  const [selectedMeditationResource, setSelectedMeditationResource] =
    useState<MeditationResource | null>(null);
  const [isEditMeditationOpen, setIsEditMeditationOpen] = useState(false);

  // Instructions state
  const [meditationInstructions, setMeditationInstructions] = useState<{
    title?: string;
    points?: string[];
    proTip?: string;
  } | null>(null);

  // Instructions modal state
  const [
    isEditMeditationInstructionsOpen,
    setIsEditMeditationInstructionsOpen,
  ] = useState(false);
  const [meditationInstructionsForm, setMeditationInstructionsForm] = useState({
    title: "",
    points: [""],
    proTip: "",
  });

  // API Functions
  const fetchMeditationMoods = async () => {
    try {
      const response = await fetch("/api/admin/meditation/moods");
      const data: ApiResponse<any[]> = await response.json();
      if (data.success && data.data) {
        const moodNames = data.data.map((mood: any) => mood.name);
        const moodMap: { [key: string]: string } = {};
        data.data.forEach((mood: any) => {
          moodMap[mood.name] = mood.id;
        });
        setMeditationMoods(moodNames);
        setMeditationMoodsMap(moodMap);
      }
    } catch (error) {
      console.error("Failed to fetch meditation moods:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meditation moods",
        variant: "destructive",
      });
    }
  };

  const fetchMeditationGoals = async () => {
    try {
      const response = await fetch("/api/admin/meditation/goals");
      const data: ApiResponse<any[]> = await response.json();
      if (data.success && data.data) {
        const goalNames = data.data.map((goal: any) => goal.name);
        const goalMap: { [key: string]: string } = {};
        data.data.forEach((goal: any) => {
          goalMap[goal.name] = goal.id;
        });
        setMeditationGoals(goalNames);
        setMeditationGoalsMap(goalMap);
      }
    } catch (error) {
      console.error("Failed to fetch meditation goals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meditation goals",
        variant: "destructive",
      });
    }
  };

  const fetchMeditationCategories = async () => {
    try {
      const response = await fetch("/api/admin/meditation/categories");
      const data: ApiResponse<any[]> = await response.json();
      if (data.success && data.data) {
        const categoryNames = data.data.map((category: any) => category.name);
        const categoryMap: { [key: string]: string } = {};
        data.data.forEach((category: any) => {
          categoryMap[category.name] = category.id;
        });
        setMeditationCategories(categoryNames);
        setMeditationCategoriesMap(categoryMap);
      }
    } catch (error) {
      console.error("Failed to fetch meditation categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meditation categories",
        variant: "destructive",
      });
    }
  };

  const fetchMeditationResources = async () => {
    try {
      console.log("Fetching meditation resources...");
      const url = selectedSchool && selectedSchool !== 'all' 
        ? `/api/admin/meditation/resources?page=1&limit=20&schoolId=${selectedSchool}`
        : "/api/admin/meditation/resources?page=1&limit=20";
      
      const response = await fetch(url);
      const data: ApiResponse<any> = await response.json();
      console.log("Meditation resources response:", data);
      if (data.success && data.data) {
        console.log("Setting meditation resources:", data.data);
        setMeditationResources(data.data);
      } else {
        console.log("No resources found or invalid response structure");
      }
    } catch (error) {
      console.error("Failed to fetch meditation resources:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meditation resources",
        variant: "destructive",
      });
    }
  };

  const updateMeditationResourceStatus = async (
    id: string,
    status: "PUBLISHED" | "DRAFT",
  ) => {
    try {
      // Create clean payload object
      const cleanPayload: any = {
        id,
        status,
      };

      console.log("Updating meditation status:", { id, status, cleanPayload });

      const response = await fetch(
        `/api/admin/meditation/resources/${id}?id=${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "admin@calmpath.ai", // Dynamic user ID from auth context
            ...(user?.school?.id && { "x-school-id": user.school.id }), // Dynamic school ID from auth context
          },
          body: JSON.stringify({ status }), // Only send status in body, not id
        },
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        console.error("Response not ok:", response.statusText);
        toast({
          title: "Failed to update resource: " + response.statusText,
          variant: "destructive",
        });
        return;
      }

      const data: ApiResponse<MeditationResource> = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        toast({
          title: `Meditation resource ${status.toLowerCase()} successfully`,
        });
        await fetchMeditationResources();
      } else {
        toast({
          title: data.error || "Failed to update resource",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update meditation resource:", error);
      toast({
        title: "Failed to update meditation resource",
        variant: "destructive",
      });
    }
  };

  const deleteMeditationResource = async (id: string) => {
    try {
      const response = await fetch(
        `/api/admin/meditation/resources/${id}?id=${id}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": user?.id || "admin@calmpath.ai", // Dynamic user ID from auth context
            ...(user?.school?.id && { "x-school-id": user.school.id }), // Dynamic school ID from auth context
          },
        },
      );
      const data: ApiResponse<null> = await response.json();
      if (data.success) {
        toast({ title: "Meditation resource deleted successfully" });
        await fetchMeditationResources();
      } else {
        toast({
          title: data.error || "Failed to delete resource",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete meditation resource:", error);
      toast({
        title: "Failed to delete meditation resource",
        variant: "destructive",
      });
    }
  };

  const editMeditationResource = (resource: MeditationResource) => {
    setSelectedMeditationResource(resource);
    setMeditationForm({
      id: resource.id,
      title: resource.title || "",
      description: resource.description || "",
      format: resource.format || "AUDIO",
      durationSec: resource.durationSec ? resource.durationSec.toString() : "",
      category: "",
      goal: "",
      mood: "",
      instructor: resource.instructor || "",
      thumbnailUrl: resource.thumbnailUrl || "",
      audioUrl: resource.audioUrl || "",
      videoUrl: resource.videoUrl || "",
      type: resource.type || "GUIDED",
      status: resource.status || "DRAFT",
      supportedMoods: [],
      duration: "",
    });
    setIsEditMeditationOpen(true);
  };

  const updateMeditationResource = async () => {
    if (!selectedMeditationResource) return;

    setIsSubmitting(true);
    try {
      // Build payload with conditional school ID
      const payload: any = {
        id: selectedMeditationResource.id,
        title: meditationForm.title,
        description: meditationForm.description,
        format: meditationForm.format,
        type: meditationForm.type,
        status: meditationForm.status,
      };

      // Add optional fields if provided
      if (
        meditationForm.durationSec &&
        parseInt(meditationForm.durationSec) > 0
      ) {
        payload.durationSec = parseInt(meditationForm.durationSec);
      }
      if (meditationForm.instructor.trim()) {
        payload.instructor = meditationForm.instructor;
      }
      if (meditationForm.thumbnailUrl.trim()) {
        payload.thumbnailUrl = meditationForm.thumbnailUrl;
      }
      if (meditationForm.audioUrl.trim()) {
        payload.audioUrl = meditationForm.audioUrl;
      }
      if (meditationForm.videoUrl.trim()) {
        payload.videoUrl = meditationForm.videoUrl;
      }

      // Add relations and school ID conditionally
      const relations: any = {};
      if (
        meditationForm.category &&
        meditationCategoriesMap[meditationForm.category]
      ) {
        relations.categoryIds = [
          meditationCategoriesMap[meditationForm.category],
        ];
      }
      if (meditationForm.goal && meditationGoalsMap[meditationForm.goal]) {
        relations.goalIds = [meditationGoalsMap[meditationForm.goal]];
      }
      if (meditationForm.mood && meditationMoodsMap[meditationForm.mood]) {
        relations.moodIds = [meditationMoodsMap[meditationForm.mood]];
      }

      // Only add schoolId if user has a school
      if (user?.school?.id) {
        payload.schoolId = user.school.id;
      }

      // Merge relations with payload
      Object.assign(payload, relations);

      const response = await fetch(
        `/api/admin/meditation/resources/${selectedMeditationResource.id}?id=${selectedMeditationResource.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "admin@calmpath.ai", // Dynamic user ID from auth context
            ...(user?.school?.id && { "x-school-id": user.school.id }), // Dynamic school ID from auth context
          },
          body: JSON.stringify(payload),
        },
      );
      const data: ApiResponse<MeditationResource> = await response.json();

      if (data.success) {
        toast({ title: "Meditation resource updated successfully" });
        setIsEditMeditationOpen(false);
        setSelectedMeditationResource(null);
        setMeditationForm({
          id: "",
          title: "",
          description: "",
          format: "AUDIO",
          durationSec: "",
          category: "",
          goal: "",
          mood: "",
          instructor: "",
          thumbnailUrl: "",
          audioUrl: "",
          videoUrl: "",
          type: "GUIDED",
          status: "PUBLISHED",
          supportedMoods: [],
          duration: "",
        });
        await fetchMeditationResources();
      } else {
        toast({
          title: data.error || "Failed to update meditation resource",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update meditation resource:", error);
      toast({
        title: "Failed to update meditation resource",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createMeditationResource = async () => {
    setIsSubmitting(true);
    try {
      // Build payload with conditional school ID
      const payload: any = {
        title: meditationForm.title,
        description: meditationForm.description,
        format: meditationForm.format,
        type: meditationForm.type,
        status: meditationForm.status, // Use current form status instead of hardcoded DRAFT
      };

      // Add optional fields if provided
      if (
        meditationForm.durationSec &&
        parseInt(meditationForm.durationSec) > 0
      ) {
        payload.durationSec = parseInt(meditationForm.durationSec);
      }
      if (meditationForm.instructor.trim()) {
        payload.instructor = meditationForm.instructor;
      }
      if (meditationForm.thumbnailUrl.trim()) {
        payload.thumbnailUrl = meditationForm.thumbnailUrl;
      }
      if (meditationForm.audioUrl.trim()) {
        payload.audioUrl = meditationForm.audioUrl;
      }
      if (meditationForm.videoUrl.trim()) {
        payload.videoUrl = meditationForm.videoUrl;
      }

      // Add relations and school ID conditionally
      const relations: any = {};
      if (
        meditationForm.category &&
        meditationCategoriesMap[meditationForm.category]
      ) {
        relations.categoryIds = [
          meditationCategoriesMap[meditationForm.category],
        ];
      }
      if (meditationForm.goal && meditationGoalsMap[meditationForm.goal]) {
        relations.goalIds = [meditationGoalsMap[meditationForm.goal]];
      }
      if (meditationForm.mood && meditationMoodsMap[meditationForm.mood]) {
        relations.moodIds = [meditationMoodsMap[meditationForm.mood]];
      }

      // Only add schoolId if user has a school
      if (user?.school?.id) {
        payload.schoolId = user.school.id;
      }

      // Merge relations with payload
      Object.assign(payload, relations);

      console.log(
        "Sending meditation payload:",
        JSON.stringify(payload, null, 2),
      );

      const response = await fetch("/api/admin/meditation/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "admin@calmpath.ai", // Dynamic user ID from auth context
          ...(user?.school?.id && { "x-school-id": user.school.id }), // Dynamic school ID from auth context
        },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse<MeditationResource> = await response.json();
      console.log("Create meditation response:", data);

      if (data.success) {
        toast({ title: "Meditation resource created successfully" });
        console.log(
          "Meditation created successfully, fetching updated list...",
        );
        setMeditationForm({
          id: "", // Add missing id field to reset
          title: "",
          description: "",
          format: "AUDIO",
          durationSec: "",
          category: "",
          goal: "",
          mood: "",
          instructor: "",
          thumbnailUrl: "",
          audioUrl: "",
          videoUrl: "",
          type: "GUIDED",
          status: "PUBLISHED",
          supportedMoods: [],
          duration: "",
        });
        setIsAddMeditationOpen?.(false);
        await fetchMeditationResources();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create meditation resource",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create meditation resource:", error);
      toast({
        title: "Error",
        description: "Failed to create meditation resource",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createMeditationCategory = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/meditation/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "admin@calmpath.ai", // Dynamic user ID from auth context
          ...(user?.school?.id && { "x-school-id": user.school.id }), // Dynamic school ID from auth context
        },
        body: JSON.stringify(categoryForm),
      });
      const data: ApiResponse<any> = await response.json();
      if (data.success) {
        toast({ title: "Meditation category created successfully" });
        setCategoryForm({
          name: "",
          description: "",
          icon: "",
          color: "#3B82F6",
          status: "ACTIVE",
        });
        setIsAddMeditationCategoryModalOpen?.(false);
        await fetchMeditationCategories();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create meditation category",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create meditation category:", error);
      toast({
        title: "Error",
        description: "Failed to create meditation category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbnailUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "meditation") {
          setMeditationForm((prev) => ({
            ...prev,
            thumbnailUrl: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "meditation") {
          const url = reader.result as string;

          // Get actual duration for audio files
          if (file.type.startsWith("audio/")) {
            const audio = new Audio(url);
            audio.addEventListener("loadedmetadata", () => {
              const duration = Math.floor(audio.duration);
              const minutes = Math.floor(duration / 60);
              const seconds = duration % 60;
              const durationString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

              setMeditationForm((prev) => ({
                ...prev,
                audioUrl: url,
                videoUrl: url,
                duration: durationString,
              }));
              toast({
                title: "File Uploaded",
                description: `${meditationForm.format.toLowerCase()} file "${file.name}" uploaded successfully`,
              });
            });

            audio.addEventListener("error", () => {
              // Fallback to file size estimate if audio metadata fails
              const durationString = `${Math.floor(file.size / 100000)}s`;
              setMeditationForm((prev) => ({
                ...prev,
                audioUrl: url,
                videoUrl: url,
                duration: durationString,
              }));
              toast({
                title: "File Uploaded",
                description: `${meditationForm.format.toLowerCase()} file "${file.name}" uploaded successfully`,
              });
            });
          } else {
            // For non-audio files, use file size estimate
            const durationString = `${Math.floor(file.size / 100000)}s`;
            setMeditationForm((prev) => ({
              ...prev,
              audioUrl: url,
              videoUrl: url,
              duration: durationString,
            }));
            toast({
              title: "File Uploaded",
              description: `${meditationForm.format.toLowerCase()} file "${file.name}" uploaded successfully`,
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Load data on component mount and when school filter changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchMeditationResources(),
        fetchMeditationMoods(),
        fetchMeditationGoals(),
        fetchMeditationCategories(),
        fetchMeditationInstructions(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [selectedSchool]);

  // Handler functions

  const handleEditMeditationInstructions = async (type: string) => {
    if (meditationInstructions) {
      // Populate form with existing instructions
      setMeditationInstructionsForm({
        title: meditationInstructions.title || "",
        points: meditationInstructions.points || [""],
        proTip: meditationInstructions.proTip || "",
      });
    } else {
      // Reset form for new instructions
      setMeditationInstructionsForm({
        title: "",
        points: [""],
        proTip: "",
      });
    }
    setIsEditMeditationInstructionsOpen(true);
  };

  const handleDeleteMeditationStep = async (stepIndex: number) => {
    try {
      if (!meditationInstructions) return;
      
      // Remove step from current instruction
      const updatedPoints = meditationInstructions.points?.filter((_, i) => i !== stepIndex) || [];
      
      // Update the form and save to database
      setMeditationInstructionsForm((prev) => ({
        ...prev,
        points: updatedPoints,
      }));

      // Save the updated instruction
      const steps = updatedPoints
        .filter((point) => point.trim() !== "")
        .map((point, index) => ({
          description: point,
          order: index + 1,
        }));

      const response = await fetch("/api/admin/meditation/instructions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "admin@calmpath.ai",
          ...(user?.school?.id && { "x-school-id": user.school.id }),
        },
        body: JSON.stringify({
          title: meditationInstructions.title,
          description: meditationInstructions.title,
          steps: steps,
          proTip: meditationInstructions.proTip,
          status: "PUBLISHED",
        }),
      });

      if (response.ok) {
        // Update local state
        setMeditationInstructions((prev) => ({
          ...prev!,
          points: updatedPoints,
        }));
        
        toast({
          title: "Step Deleted",
          description: "The instruction step has been removed",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete step",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete meditation step:", error);
      toast({
        title: "Error",
        description: "Failed to delete step",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMeditationInstructions = async () => {
    try {
      // Delete ALL meditation instructions from database
      const response = await fetch("/api/admin/meditation/instructions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "admin@calmpath.ai",
          ...(user?.school?.id && { "x-school-id": user.school.id }),
        },
      });

      if (response.ok) {
        setMeditationInstructions(null);
        toast({
          title: "All Instructions Deleted",
          description: "All meditation instructions have been removed",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete instructions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete meditation instructions:", error);
      toast({
        title: "Error",
        description: "Failed to delete instructions",
        variant: "destructive",
      });
    }
  };

  const addMeditationInstructionPoint = () => {
    setMeditationInstructionsForm((prev) => ({
      ...prev,
      points: [...prev.points, ""],
    }));
  };

  const removeMeditationInstructionPoint = (index: number) => {
    setMeditationInstructionsForm((prev) => ({
      ...prev,
      points: prev.points.filter((_, i) => i !== index),
    }));
  };

  const updateMeditationInstructionPoint = (index: number, value: string) => {
    setMeditationInstructionsForm((prev) => ({
      ...prev,
      points: prev.points.map((point, i) => (i === index ? value : point)),
    }));
  };

  const handleSaveMeditationInstructions = async (type: string) => {
    try {
      const steps = meditationInstructionsForm.points
        .filter((point) => point.trim() !== "")
        .map((point, index) => ({
          stepNumber: index + 1,
          title: `Step ${index + 1}`,
          description: point,
        }));

      const response = await fetch("/api/admin/meditation/instructions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "admin@calmpath.ai",
          ...(user?.school?.id && { "x-school-id": user.school.id }),
        },
        body: JSON.stringify({
          title: meditationInstructionsForm.title || "Meditation Instructions",
          description:
            meditationInstructionsForm.title ||
            "Meditation instructions for therapy sessions",
          steps,
          difficulty: "BEGINNER",
          status: "PUBLISHED",
          proTip: meditationInstructionsForm.proTip || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMeditationInstructions({
          title: data.data.title,
          points: data.data.steps.map((step: any) => step.description),
          proTip: meditationInstructionsForm.proTip || undefined,
        });

        setIsEditMeditationInstructionsOpen(false);
        toast({
          title: "Instructions Saved",
          description: "Meditation instructions have been saved",
        });
      } else {
        throw new Error(data.error || "Failed to save instructions");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save instructions",
      });
    }
  };

  const fetchMeditationInstructions = async () => {
    try {
      const response = await fetch("/api/admin/meditation/instructions");
      const data: ApiResponse<any> = await response.json();

      if (data.success && data.data) {
        // Handle both single instruction and array of instructions
        const instruction = Array.isArray(data.data) ? data.data[0] : data.data;
        if (instruction) {
          setMeditationInstructions({
            title: instruction.title,
            points:
              instruction.steps?.map((step: any) => step.description) || [],
            proTip: instruction.proTip || undefined,
          });
        } else {
          setMeditationInstructions(null);
        }
      } else {
        setMeditationInstructions(null);
      }
    } catch (error) {
      console.error("Failed to fetch meditation instructions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meditation instructions",
        variant: "destructive",
      });
    }
  };

  const filteredMeditationResources = meditationResources.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.categories?.some((c) =>
        c.category.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  console.log("Current meditation resources:", meditationResources);
  console.log("Filtered meditation resources:", filteredMeditationResources);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading meditation resources...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
        <Input
          placeholder="Search meditation..."
          className="pl-9"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeditationResources.map((resource) => (
          <Card
            key={resource.id}
            className={cn(
              "transition-all duration-200 hover:shadow-card-hover",
              resource.status === "DRAFT" && "opacity-60",
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center p-[13px] ">
                    {resource.format === "VIDEO" ? (
                      <Play className="h-6 w-6 text-[#3B82F6] " />
                    ) : (
                      <Sparkles className="h-6 w-6 text-[#3B82F6]" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {resource.title}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1">
                      {resource.description || "Meditation resource"}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Eye className="h-4 w-4" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => editMeditationResource(resource)}
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-[#EF4444]"
                      onClick={() => deleteMeditationResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {resource.categories?.map((cat) => (
                  <Badge
                    key={cat.category.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {cat.category.name}
                  </Badge>
                ))}
                {resource.moods?.map((mood) => (
                  <Badge
                    key={mood.mood.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {mood.mood.name}
                  </Badge>
                ))}
                {resource.goals?.map((goal) => (
                  <Badge
                    key={goal.goal.id}
                    variant="default"
                    className="text-xs"
                  >
                    {goal.goal.name}
                  </Badge>
                ))}
                <Badge variant="secondary" className="text-xs capitalize">
                  {resource.format}
                </Badge>
                {resource.durationSec && (
                  <span className="text-xs text-[#64748B]">
                    {Math.floor(resource.durationSec / 60)}:
                    {(resource.durationSec % 60).toString().padStart(2, "0")}
                  </span>
                )}
              </div>
              {resource.instructor && (
                <div className="text-sm text-[#64748B] mb-2">
                  Instructor: {resource.instructor}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">
                  {resource.admin?.firstName} {resource.admin?.lastName}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      resource.status === "PUBLISHED" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {resource.status.toLowerCase()}
                  </Badge>
                  <Switch
                    checked={resource.status === "PUBLISHED"}
                    onCheckedChange={() =>
                      updateMeditationResourceStatus(
                        resource.id,
                        resource.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredMeditationResources.length === 0 && (
          <div className="col-span-full text-center py-8">
            <Sparkles className="h-12 w-12 text-[#94A3B8] mx-auto mb-2" />
            <p className="text-[#94A3B8]">No meditation resources found</p>
          </div>
        )}
      </div>

      {/* Meditation Instructions Section */}
      <Card className="border-[#3B82F6]/20 bg-gradient-to-r from-[#3B82F6]/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {meditationInstructions?.title || "Meditation Instructions"}
                </CardTitle>
                <CardDescription className="text-xs">
                  Global instructions shown to all learners
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {meditationInstructions ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      handleEditMeditationInstructions("meditation")
                    }
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-[#EF4444] hover:text-[#EF4444]"
                    onClick={handleDeleteMeditationInstructions}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleEditMeditationInstructions("meditation")}
                >
                  <Plus className="h-4 w-4" />
                  Add Instructions
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {meditationInstructions && (
          <CardContent className="pt-0">
            <ul className="space-y-2 mb-3">
              {(meditationInstructions.points || []).map((point, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-2 text-sm text-[#1E293B]"
                >
                  <div className="flex items-start gap-2 flex-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] mt-2 shrink-0" />
                    {point}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                    onClick={() => handleDeleteMeditationStep(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
            {meditationInstructions.proTip && (
              <div className="flex items-start gap-2 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/30 p-3">
                <Lightbulb className="h-4 w-4 text-[#D97706] mt-0.5 shrink-0" />
                <p className="text-sm text-[#92400E]">
                  <span className="font-medium">Pro Tip:</span>{" "}
                  {meditationInstructions.proTip}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Add Meditation Modal */}
      <Dialog open={isAddMeditationOpen} onOpenChange={setIsAddMeditationOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6 border-b border-[#E2E8F0]">
            <DialogTitle className="text-xl">
              Add Meditation Resource
            </DialogTitle>
            <DialogDescription>
              Create a new meditation resource for learners.
            </DialogDescription>
          </div>
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-6 border-r border-[#E2E8F0] space-y-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                  value={meditationForm.title}
                  onChange={(e) =>
                    setMeditationForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Meditation title"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={meditationForm.description}
                  onChange={(e) =>
                    setMeditationForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the meditation..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div
                  className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-4 text-center cursor-pointer hover:border-[#3B82F6]/50"
                  onClick={() => document.getElementById("med-thumb")?.click()}
                >
                  {meditationForm.thumbnailUrl ? (
                    <img
                      src={meditationForm.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-6 w-6 mx-auto text-[#64748B]" />
                      <p className="text-xs text-[#64748B]">Upload thumbnail</p>
                      <p className="text-xs text-[#64748B]">(399 × 140)</p>
                    </div>
                  )}
                  <input
                    id="med-thumb"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleThumbnailUpload(e, "meditation")}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Format</Label>
                <Select
                  value={meditationForm.format}
                  onValueChange={(v: "AUDIO" | "VIDEO" | "TEXT") =>
                    setMeditationForm((prev) => ({ ...prev, format: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUDIO">Audio</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>
                  Upload{" "}
                  {meditationForm.format === "VIDEO"
                    ? "Video"
                    : meditationForm.format === "AUDIO"
                      ? "Audio"
                      : "Text"}
                </Label>
                <div
                  className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-4 text-center cursor-pointer hover:border-[#3B82F6]/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {meditationForm.audioUrl ? (
                    <div className="space-y-2">
                      <div className="h-6 w-6 mx-auto text-green-600">
                        <svg
                          className="w-full h-full"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8.586 9H15a1 1 0 110 2H8.586l4.707 4.707a1 1 0 001.414-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="text-xs text-green-600 font-medium">
                        File uploaded successfully
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {meditationForm.duration}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-6 w-6 mx-auto text-[#64748B]" />
                      <p className="text-xs text-[#64748B]">
                        Click to upload {meditationForm.format.toLowerCase()}{" "}
                        file
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/*,text/*"
                    className="hidden"
                    onChange={(e) => {
                      handleAudioUpload(e, "meditation");
                    }}
                  />
                </div>
                {meditationForm.audioUrl && (
                  <p className="text-xs text-[#64748B]">
                    Duration: {meditationForm.duration}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={meditationForm.category}
                    onValueChange={(v) =>
                      setMeditationForm((prev) => ({ ...prev, category: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {meditationCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={meditationForm.status}
                    onValueChange={(v: "DRAFT" | "PUBLISHED" | "ARCHIVED") =>
                      setMeditationForm((prev) => ({ ...prev, status: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Supported Moods</Label>
                  <Popover
                    open={isMeditationMoodPopoverOpen}
                    onOpenChange={setIsMeditationMoodPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <span
                          className={
                            meditationForm.supportedMoods.length > 0
                              ? ""
                              : "text-[#64748B]"
                          }
                        >
                          {meditationForm.supportedMoods.length > 0
                            ? meditationForm.supportedMoods.join(", ")
                            : "Select moods..."}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-2 border bg-[#FFFFFF] shadow-xl rounded-[6px]"
                      align="start"
                    >
                      <div className="space-y-2">
                        {meditationMoods.map((mood) => (
                          <div
                            key={mood}
                            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#F1F5F9]"
                            onClick={() => {
                              if (
                                meditationForm.supportedMoods.includes(mood)
                              ) {
                                setMeditationForm((prev) => ({
                                  ...prev,
                                  supportedMoods: prev.supportedMoods.filter(
                                    (m) => m !== mood,
                                  ),
                                }));
                              } else {
                                setMeditationForm((prev) => ({
                                  ...prev,
                                  supportedMoods: [
                                    ...prev.supportedMoods,
                                    mood,
                                  ],
                                }));
                              }
                            }}
                          >
                            <div
                              className={`h-4 w-4 border rounded flex items-center justify-center ${meditationForm.supportedMoods.includes(mood) ? "bg-[#3B82F6] border-[#3B82F6]" : "border-[#E2E8F0]"}`}
                            >
                              {meditationForm.supportedMoods.includes(mood) && (
                                <Check className="h-3 w-3 text-[#FFFFFF]" />
                              )}
                            </div>
                            <span className="text-sm">{mood}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add new mood..."
                              value={newMood}
                              onChange={(e) => setNewMood(e.target.value)}
                              className="h-8 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  newMood.trim() &&
                                  !meditationMoods.includes(newMood.trim())
                                ) {
                                  setMeditationMoods((prev) => [
                                    ...prev,
                                    newMood.trim(),
                                  ]);
                                  toast({ title: "Mood Added" });
                                  setNewMood("");
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>Goal</Label>
                  <Popover
                    open={isMeditationGoalPopoverOpen}
                    onOpenChange={setIsMeditationGoalPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <span
                          className={
                            meditationForm.goal ? "" : "text-[#64748B]"
                          }
                        >
                          {meditationForm.goal || "Select goal..."}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-2 border bg-[#FFFFFF] shadow-xl rounded-[6px]"
                      align="start"
                    >
                      <div className="space-y-2">
                        {meditationGoals.map((goal) => (
                          <div
                            key={goal}
                            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#F1F5F9]"
                            onClick={() => {
                              setMeditationForm((prev) => ({ ...prev, goal }));
                              setIsMeditationGoalPopoverOpen(false);
                            }}
                          >
                            <div
                              className={`h-4 w-4 border rounded-full flex items-center justify-center ${meditationForm.goal === goal ? "bg-[#3B82F6] border-[#3B82F6]" : "border-[#E2E8F0]"}`}
                            >
                              {meditationForm.goal === goal && (
                                <div className="h-2 w-2 rounded-full bg-[#3B82F6]-foreground" />
                              )}
                            </div>
                            <span className="text-sm">{goal}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add new goal..."
                              value={newGoal}
                              onChange={(e) => setNewGoal(e.target.value)}
                              className="h-8 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  newGoal.trim() &&
                                  !meditationGoals.includes(newGoal.trim())
                                ) {
                                  setMeditationGoals((prev) => [
                                    ...prev,
                                    newGoal.trim(),
                                  ]);
                                  toast({ title: "Goal Added" });
                                  setNewGoal("");
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <div className="p-6 bg-muted/30">
              <h3 className="text-sm font-medium text-[#64748B] uppercase mb-4">
                Live Preview
              </h3>
              <div className="bg-card rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-[#3B82F6]/20 to-[#3B82F6]/5 flex items-center justify-center relative">
                  {meditationForm.thumbnailUrl ? (
                    <img
                      src={meditationForm.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Sparkles className="h-10 w-10 text-[#3B82F6]/40" />
                  )}
                  {meditationForm.format === "VIDEO" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1E293B]/20">
                      <div className="h-12 w-12 rounded-full bg-[#3B82F6] flex items-center justify-center">
                        <Play className="h-6 w-6 text-[#FFFFFF]" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-[#1E293B]">
                    {meditationForm.title || "Meditation Title"}
                  </h4>
                  <p className="text-sm text-[#64748B] line-clamp-2">
                    {meditationForm.description || "Description"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {meditationForm.category && (
                      <Badge variant="outline" className="text-xs">
                        {meditationForm.category}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs capitalize">
                      {meditationForm.format.toLowerCase()}
                    </Badge>
                    <span className="text-xs text-[#64748B]">
                      {meditationForm.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-[#E2E8F0] flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddMeditationOpen?.(false)}
            >
              Cancel
            </Button>
            <Button onClick={createMeditationResource} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Meditation Modal */}
      <Dialog
        open={isEditMeditationOpen}
        onOpenChange={setIsEditMeditationOpen}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6 border-b border-[#E2E8F0]">
            <DialogTitle className="text-xl">
              Edit Meditation Resource
            </DialogTitle>
            <DialogDescription>
              Update the details of this meditation resource.
            </DialogDescription>
          </div>
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-6 border-r border-[#E2E8F0] space-y-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                  value={meditationForm.title}
                  onChange={(e) =>
                    setMeditationForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Meditation title"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={meditationForm.description}
                  onChange={(e) =>
                    setMeditationForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the meditation..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div
                  className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-4 text-center cursor-pointer hover:border-[#3B82F6]/50"
                  onClick={() =>
                    document.getElementById("edit-med-thumb")?.click()
                  }
                >
                  {meditationForm.thumbnailUrl ? (
                    <img
                      src={meditationForm.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-6 w-6 mx-auto text-[#64748B]" />
                      <p className="text-xs text-[#64748B]">Upload thumbnail</p>
                    </div>
                  )}
                  <input
                    id="edit-med-thumb"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleThumbnailUpload(e, "meditation")}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Format</Label>
                <Select
                  value={meditationForm.format}
                  onValueChange={(v: "AUDIO" | "VIDEO" | "TEXT") =>
                    setMeditationForm((prev) => ({ ...prev, format: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUDIO">Audio</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="TEXT">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>
                  Upload{" "}
                  {meditationForm.format === "VIDEO"
                    ? "Video"
                    : meditationForm.format === "AUDIO"
                      ? "Audio"
                      : "Text"}
                </Label>
                <div
                  className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-4 text-center cursor-pointer hover:border-[#3B82F6]/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {meditationForm.audioUrl ? (
                    <div className="space-y-2">
                      <div className="h-6 w-6 mx-auto text-green-600">
                        <svg
                          className="w-full h-full"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8.586 9H15a1 1 0 110 2H8.586l4.707 4.707a1 1 0 001.414-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="text-xs text-green-600 font-medium">
                        File uploaded successfully
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {meditationForm.duration}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-6 w-6 mx-auto text-[#64748B]" />
                      <p className="text-xs text-[#64748B]">
                        Click to upload {meditationForm.format.toLowerCase()}{" "}
                        file
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/*,text/*"
                    className="hidden"
                    onChange={(e) => {
                      handleAudioUpload(e, "meditation");
                    }}
                  />
                </div>
                {meditationForm.audioUrl && (
                  <p className="text-xs text-[#64748B]">
                    Duration: {meditationForm.duration}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={meditationForm.category}
                    onValueChange={(v) =>
                      setMeditationForm((prev) => ({ ...prev, category: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {meditationCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={meditationForm.status}
                    onValueChange={(v: "DRAFT" | "PUBLISHED" | "ARCHIVED") =>
                      setMeditationForm((prev) => ({ ...prev, status: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Supported Moods</Label>
                  <Popover
                    open={isMeditationMoodPopoverOpen}
                    onOpenChange={setIsMeditationMoodPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <span
                          className={
                            meditationForm.supportedMoods.length > 0
                              ? ""
                              : "text-[#64748B]"
                          }
                        >
                          {meditationForm.supportedMoods.length > 0
                            ? meditationForm.supportedMoods.join(", ")
                            : "Select moods..."}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-2 bg-popover"
                      align="start"
                    >
                      <div className="space-y-2">
                        {meditationMoods.map((mood) => (
                          <div
                            key={mood}
                            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted"
                            onClick={() => {
                              if (
                                meditationForm.supportedMoods.includes(mood)
                              ) {
                                setMeditationForm((prev) => ({
                                  ...prev,
                                  supportedMoods: prev.supportedMoods.filter(
                                    (m) => m !== mood,
                                  ),
                                }));
                              } else {
                                setMeditationForm((prev) => ({
                                  ...prev,
                                  supportedMoods: [
                                    ...prev.supportedMoods,
                                    mood,
                                  ],
                                }));
                              }
                            }}
                          >
                            <div
                              className={`h-4 w-4 border rounded flex items-center justify-center ${meditationForm.supportedMoods.includes(mood) ? "bg-[#3B82F6] border-[#3B82F6]" : "border-[#E2E8F0]"}`}
                            >
                              {meditationForm.supportedMoods.includes(mood) && (
                                <Check className="h-3 w-3 text-[#FFFFFF]" />
                              )}
                            </div>
                            <span className="text-sm">{mood}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add new mood..."
                              value={newMood}
                              onChange={(e) => setNewMood(e.target.value)}
                              className="h-8 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  newMood.trim() &&
                                  !meditationMoods.includes(newMood.trim())
                                ) {
                                  setMeditationMoods((prev) => [
                                    ...prev,
                                    newMood.trim(),
                                  ]);
                                  toast({ title: "Mood Added" });
                                  setNewMood("");
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>Goal</Label>
                  <Popover
                    open={isMeditationGoalPopoverOpen}
                    onOpenChange={setIsMeditationGoalPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <span
                          className={
                            meditationForm.goal ? "" : "text-[#64748B]"
                          }
                        >
                          {meditationForm.goal || "Select goal..."}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-2 bg-popover"
                      align="start"
                    >
                      <div className="space-y-2">
                        {meditationGoals.map((goal) => (
                          <div
                            key={goal}
                            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted"
                            onClick={() => {
                              setMeditationForm((prev) => ({ ...prev, goal }));
                              setIsMeditationGoalPopoverOpen(false);
                            }}
                          >
                            <div
                              className={`h-4 w-4 border rounded-full flex items-center justify-center ${meditationForm.goal === goal ? "bg-[#3B82F6] border-[#3B82F6]" : "border-[#E2E8F0]"}`}
                            >
                              {meditationForm.goal === goal && (
                                <div className="h-2 w-2 rounded-full bg-[#3B82F6]-foreground" />
                              )}
                            </div>
                            <span className="text-sm">{goal}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add new goal..."
                              value={newGoal}
                              onChange={(e) => setNewGoal(e.target.value)}
                              className="h-8 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  newGoal.trim() &&
                                  !meditationGoals.includes(newGoal.trim())
                                ) {
                                  setMeditationGoals((prev) => [
                                    ...prev,
                                    newGoal.trim(),
                                  ]);
                                  toast({ title: "Goal Added" });
                                  setNewGoal("");
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <div className="p-6 bg-muted/30">
              <h3 className="text-sm font-medium text-[#64748B] uppercase mb-4">
                Live Preview
              </h3>
              <div className="bg-card rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-[#3B82F6]/20 to-[#3B82F6]/5 flex items-center justify-center relative">
                  {meditationForm.thumbnailUrl ? (
                    <img
                      src={meditationForm.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Sparkles className="h-10 w-10 text-[#3B82F6]/40" />
                  )}
                  {meditationForm.format === "VIDEO" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1E293B]/20">
                      <div className="h-12 w-12 rounded-full bg-[#3B82F6] flex items-center justify-center">
                        <Play className="h-6 w-6 text-[#FFFFFF]" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-[#1E293B]">
                    {meditationForm.title || "Meditation Title"}
                  </h4>
                  <p className="text-sm text-[#64748B] line-clamp-2">
                    {meditationForm.description || "Description"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {meditationForm.category && (
                      <Badge variant="outline" className="text-xs">
                        {meditationForm.category}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs capitalize">
                      {meditationForm.format.toLowerCase()}
                    </Badge>
                    <span className="text-xs text-[#64748B]">
                      {meditationForm.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-[#E2E8F0] flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditMeditationOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={updateMeditationResource} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Meditation Category Modal */}
      <Dialog
        open={isAddMeditationCategoryModalOpen}
        onOpenChange={setIsAddMeditationCategoryModalOpen}
      >
        <DialogContent className="sm:max-w-md bg-[#FFFFFF]">
          <DialogHeader>
            <DialogTitle>Add Meditation Category</DialogTitle>
            <DialogDescription className="text-[#65758b]">
              Create a new category for organizing meditation resources.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g., Mindfulness"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={categoryForm.status}
                onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                  setCategoryForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddMeditationCategoryModalOpen?.(false)}
            >
              Cancel
            </Button>
            <Button onClick={createMeditationCategory} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meditation Instructions Edit Modal */}
      <Dialog
        open={isEditMeditationInstructionsOpen}
        onOpenChange={setIsEditMeditationInstructionsOpen}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {meditationInstructions ? "Edit" : "Add"} Meditation Instructions
            </DialogTitle>
            <DialogDescription>
              These instructions will be shown to all learners on Meditation
              resources.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-5 px-5">
            <div className="grid gap-2">
              <Label>Instruction Title</Label>
              <Input
                placeholder="Meditation Instructions"
                value={meditationInstructionsForm.title}
                onChange={(e) =>
                  setMeditationInstructionsForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-3">
              <Label>Instruction Points</Label>
              {meditationInstructionsForm.points.map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="h-6 w-6 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs flex items-center justify-center flex-shrink-0 mt-1">
                    {index + 1}
                  </span>
                  <Textarea
                    placeholder="Enter instruction point..."
                    value={point}
                    onChange={(e) =>
                      updateMeditationInstructionPoint(index, e.target.value)
                    }
                    rows={2}
                    className="flex-1"
                  />
                  {meditationInstructionsForm.points.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#94A3B8] hover:text-[#991B1B] flex-shrink-0"
                      onClick={() => removeMeditationInstructionPoint(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={addMeditationInstructionPoint}
              >
                <Plus className="h-4 w-4" />
                Add Point
              </Button>
            </div>
            <div className="grid gap-2">
              <Label>Pro Tip (optional)</Label>
              <Textarea
                placeholder="Add a helpful tip for learners..."
                value={meditationInstructionsForm.proTip || ""}
                onChange={(e) =>
                  setMeditationInstructionsForm((prev) => ({
                    ...prev,
                    proTip: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsEditMeditationInstructionsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveMeditationInstructions("meditation")}
            >
              Save Instructions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
