import React, { useState, useEffect } from "react";
import { BookOpen, Music, Sparkles, Plus } from "lucide-react";
import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/src/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import JournalingTools from "./SelfHelpTools/JournalingTools";
import MusicTools from "./SelfHelpTools/MusicTools";
import MeditationTools from "./SelfHelpTools/MeditationTools";
import { ApiResponse } from "./SelfHelpTools/types";

export default function SelfHelpTools() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("journaling");
  const [searchQuery, setSearchQuery] = useState("");
  
  
  // School filter state with localStorage persistence
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-selected-school');
      return saved || 'all';
    }
    return 'all';
  });
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  
  // Modal states for meditation
  const [isAddMeditationOpen, setIsAddMeditationOpen] = useState(false);
  const [isAddMeditationCategoryModalOpen, setIsAddMeditationCategoryModalOpen] = useState(false);
  
  // Modal states for journaling
  const [isAddJournalingPromptOpen, setIsAddJournalingPromptOpen] = useState(false);
  const [isAddJournalingCategoryOpen, setIsAddJournalingCategoryOpen] = useState(false);
  
  // Modal states for music
  const [isAddMusicTrackOpen, setIsAddMusicTrackOpen] = useState(false);
  const [isAddMusicCategoryOpen, setIsAddMusicCategoryOpen] = useState(false);
  
  // Check if user is super admin - more robust detection with validation
  console.log('User role:', user?.role, 'Role name:', user?.role?.name);
  const isSuperAdmin = user?.role?.name === 'SUPER_ADMIN' || 
                         user?.role?.name === 'SUPERADMIN' ||
                         user?.role?.name?.toLowerCase() === 'super_admin' ||
                         user?.role?.name?.toLowerCase() === 'superadmin';
  console.log('Calculated isSuperAdmin:', isSuperAdmin);
  const showSchoolFilter = isSuperAdmin;
  
  // Save selected school to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-selected-school', selectedSchool);
    }
  }, [selectedSchool]);
  
  // Load schools on component mount and when authentication is complete
  useEffect(() => {
    if (!authLoading && user) {
      fetchSchools();
    }
  }, [isSuperAdmin, authLoading, user]);
  
  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }
  
  // Validate user is properly authenticated
  if (!user || !user.role) {
    console.error('User authentication error: User or role is undefined');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">Authentication Error</div>
          <p className="text-gray-600">Unable to determine user role. Please refresh the page or contact support.</p>
        </div>
      </div>
    );
  }
  
  // Fetch schools for super admin
  const fetchSchools = async () => {
    if (!isSuperAdmin) {
      setIsLoadingSchools(false);
      return;
    }

    // Validate user is available before making API calls
    if (!user?.id) {
      console.error('User ID not available for schools API call');
      setIsLoadingSchools(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/schools', {
        headers: {
          "x-user-id": user.id,
        },
      });
      const data = await response.json();
      
      // Handle both direct array response and wrapped response formats
      if (Array.isArray(data)) {
        setSchools(data);
      } else if (data.success && data.data) {
        setSchools(data.data);
      } else {
        console.error('Schools API returned unexpected response format:', data);
        toast({ 
          title: "Error", 
          description: "Failed to load schools data", 
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch schools. Please check your connection.", 
        variant: "destructive"
      });
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const renderActions = () => {
    // Show different Add buttons based on active tab
    if (activeTab === "meditation") {
      return (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddMeditationCategoryModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
          <Button onClick={() => setIsAddMeditationOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Meditation
          </Button>
        </div>
      );
    } else if (activeTab === "journaling") {
      return (
        <div className="flex gap-2">
          
          <Button onClick={() => setIsAddJournalingPromptOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Prompt
          </Button>
        </div>
      );
    } else if (activeTab === "music") {
      return (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddMusicCategoryOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
          <Button onClick={() => setIsAddMusicTrackOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Track
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      <AdminHeader
              title="Self-help Tools" 
        subtitle="Manage interactive wellness tools for learners"
              showSchoolFilter={isSuperAdmin}
              schoolFilterValue={selectedSchool}
              onSchoolFilterChange={setSelectedSchool}
              schools={schools}
              actions={renderActions()}
            />
      <div className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="journaling" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Journaling
            </TabsTrigger>
            <TabsTrigger value="music" className="gap-2">
              <Music className="h-4 w-4" />
              Music Therapy
            </TabsTrigger>
            <TabsTrigger value="meditation" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Meditation
            </TabsTrigger>
          </TabsList>

          {/* Journaling Tab */}
          <TabsContent value="journaling">
            <JournalingTools 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery}
              isAddJournalingPromptOpen={isAddJournalingPromptOpen}
              setIsAddJournalingPromptOpen={setIsAddJournalingPromptOpen}
              isAddJournalingCategoryOpen={isAddJournalingCategoryOpen}
              setIsAddJournalingCategoryOpen={setIsAddJournalingCategoryOpen}
              selectedSchool={selectedSchool}
              isSuperAdmin={isSuperAdmin}
              schools={schools}
            />
          </TabsContent>

          {/* Music Therapy Tab */}
          <TabsContent value="music">
            <MusicTools 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery}
              isAddMusicTrackOpen={isAddMusicTrackOpen}
              setIsAddMusicTrackOpen={setIsAddMusicTrackOpen}
              isAddMusicCategoryOpen={isAddMusicCategoryOpen}
              setIsAddMusicCategoryOpen={setIsAddMusicCategoryOpen}
              selectedSchool={selectedSchool}
              isSuperAdmin={isSuperAdmin}
              schools={schools}
            />
          </TabsContent>

          {/* Meditation Tab */}
          <TabsContent value="meditation">
            <MeditationTools 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery}
              isAddMeditationOpen={isAddMeditationOpen}
              setIsAddMeditationOpen={setIsAddMeditationOpen}
              isAddMeditationCategoryModalOpen={isAddMeditationCategoryModalOpen}
              setIsAddMeditationCategoryModalOpen={setIsAddMeditationCategoryModalOpen}
              selectedSchool={selectedSchool}
              isSuperAdmin={isSuperAdmin}
              schools={schools}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
