"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/src/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  Eye,
  Award,
  Activity,
  TrendingUp,
  Users,
  X,
  AlertTriangle,
  MessageSquare,
  UserCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Camera,
  User,
  Edit2,
  Save,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminHeader } from "../layout/AdminHeader";
import { useSchoolFilter } from "@/src/contexts/SchoolFilterContext";
import { useAuth } from "@/src/contexts/AuthContext";

// Mock student data - replace with actual API call
const studentData = {
  id: "1",
  name: "Ananya Gupta",
  rollNumber: "10A001",
  class: "10-A",
  email: "ananya.gupta@school.edu",
  phone: "+91 98765 43210",
  guardian: {
    name: "Mrs. Savita Gupta",
    relationship: "Parent / Guardian",
    phone: "+91 98765 12345",
  },
  moodScore: 4.2,
  status: "healthy" as const,
  joinDate: "September 2023",
  lastActivity: "Today, 9:15 AM",
  totalCheckIns: 145,
  streakDays: 12,
  badges: ["Consistency Champion", "Mindful Warrior", "Wellness Star"],
  recentMoods: [
    { date: "Today", mood: "Happy", emoji: "😊", fullDate: "2025-01-06" },
    { date: "Yesterday", mood: "Calm", emoji: "😌", fullDate: "2025-01-05" },
    { date: "2 days ago", mood: "Okay", emoji: "😐", fullDate: "2025-01-04" },
    { date: "3 days ago", mood: "Happy", emoji: "😊", fullDate: "2025-01-03" },
    { date: "4 days ago", mood: "Calm", emoji: "😌", fullDate: "2025-01-02" },
    {
      date: "5 days ago",
      mood: "Anxious",
      emoji: "😰",
      fullDate: "2025-01-01",
    },
    { date: "6 days ago", mood: "Tired", emoji: "😴", fullDate: "2024-12-31" },
    { date: "7 days ago", mood: "Happy", emoji: "😊", fullDate: "2024-12-30" },
    { date: "10 days ago", mood: "Calm", emoji: "😌", fullDate: "2024-12-27" },
    { date: "14 days ago", mood: "Okay", emoji: "😐", fullDate: "2024-12-23" },
  ],
  sessions: [
    {
      id: "1",
      doctor: "Dr. Williams",
      title: "Routine check-in, student doing well",
      date: "Dec 20, 2024",
      time: "3:30 PM",
      duration: "45 min",
      status: "Completed",
      notes:
        "Student appears to be managing stress effectively. Discussed upcoming exams and coping strategies.",
      recommendations: [
        "Stress management techniques",
        "Mindfulness exercises",
        "Sleep hygiene guide",
      ],
      observations: "Student is progressing well. No immediate concerns noted.",
    },
    {
      id: "2",
      doctor: "Dr. Williams",
      title: "Discussed study strategies",
      date: "Dec 10, 2024",
      time: "2:00 PM",
      duration: "30 min",
      status: "Completed",
      notes:
        "Focused on time management and study techniques for upcoming tests.",
      recommendations: ["Time management tips", "Focus techniques"],
      observations: "Good engagement during session. Student shows motivation.",
    },
    {
      id: "3",
      doctor: "Dr. Mitchell",
      title: "Initial assessment",
      date: "Nov 28, 2024",
      time: "4:00 PM",
      duration: "60 min",
      status: "Completed",
      notes:
        "Initial wellness assessment completed. Established baseline for future sessions.",
      recommendations: ["Journaling practice", "Breathing exercises"],
      observations:
        "Baseline established. Student is cooperative and open to support.",
    },
  ],
  recentActivity: [
    {
      id: "1",
      type: "checkin" as const,
      message: "Completed morning mood check-in",
      time: "2 hours ago",
    },
    {
      id: "2",
      type: "badge" as const,
      message: "Earned 'Consistency Champion' badge",
      time: "1 day ago",
    },
    {
      id: "3",
      type: "session" as const,
      message: "Attended session with counselor",
      time: "2 days ago",
    },
    {
      id: "4",
      type: "content" as const,
      message: "Completed 'Managing Exam Stress' article",
      time: "3 days ago",
    },
    {
      id: "5",
      type: "checkin" as const,
      message: "Completed evening reflection",
      time: "4 days ago",
    },
    {
      id: "6",
      type: "alert" as const,
      message: "Triggered wellness check due to low mood",
      time: "5 days ago",
    },
  ],
};

const statusBadgeStyles = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-amber-100 text-amber-700 border-amber-200",
  SUSPENDED: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

const activityIconMap = {
  alert: AlertTriangle,
  session: MessageSquare,
  badge: Award,
  checkin: UserCheck,
  content: FileText,
} as const;

type ActivityType = keyof typeof activityIconMap;

interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  time: string;
}

const activityStyleMap = {
  alert: "bg-destructive/10 text-destructive",
  session: "bg-blue-100 text-blue-600",
  badge: "bg-amber-100 text-amber-600",
  checkin: "bg-green-100 text-green-600",
  content: "bg-primary/10 text-primary",
};

type SessionType = (typeof studentData.sessions)[0];

export default function StudentProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedSchoolId, setSelectedSchoolId, schools, isSuperAdmin } =
    useSchoolFilter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(
    null,
  );
  const [moodPageIndex, setMoodPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Define proper types for student profile data
  type StudentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

  interface StudentProfile {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    studentId: string;
    status: StudentStatus;
    classRef?: {
      id: string;
      name: string;
    };
    studentProfile?: {
      joinDate?: string;
      averageMood?: number;
      streakDays?: number;
      profileImage?: string;
    };
    _count?: {
      moodCheckins?: number;
    };
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
    recentMoods?: any[];
    sessions?: any[];
    recentActivity?: Activity[];
    badges?: string[];
    profileImage?: string;
    joinDate?: string;
    lastActivity?: string;
    totalCheckIns?: number;
  }

  const [profileData, setProfileData] = useState<StudentProfile | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const moodsPerPage = 5;

  useEffect(() => {
    const studentId = searchParams.get("id");
    if (studentId) {
      fetchProfileData(studentId);
    }
  }, [searchParams]);

  const fetchProfileData = async (studentId: string) => {
    try {
      setIsLoading(true);

      // Fetch student data from admin API
      const response = await fetch(`/api/admin/students/${studentId}/profile`, {
        credentials: "include",
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        console.error(
          "API response not ok:",
          response.status,
          response.statusText,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content
      const text = await response.text();
      if (!text) {
        console.error("Empty response from API");
        throw new Error("Empty response from API");
      }

      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", text);
        throw new Error("Invalid JSON response from API");
      }

      if (result.success && result.data) {
        setProfileData(result.data);
        setFormData({
          firstName: result.data.firstName || "",
          lastName: result.data.lastName || "",
          phone: result.data.phone || "",
        });
      } else {
        // Show error and navigate back
        console.error("API response error:", result);
        toast({
          title: "Error",
          description:
            result.error?.message || "Failed to load student profile",
          variant: "destructive",
        });
        router.back();
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast({
        title: "Error",
        description: "Failed to load student profile",
        variant: "destructive",
      });
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const studentId = searchParams.get("id");
      if (!studentId || !profileData) return;

      const response = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        console.error(
          "API response not ok:",
          response.status,
          response.statusText,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from API");
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", text);
        throw new Error("Invalid JSON response from API");
      }

      if (result.success) {
        setProfileData(result.data);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Student profile updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        phone: profileData.phone || "",
      });
    }
    setIsEditing(false);
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const studentId = searchParams.get("id");
      if (!studentId) throw new Error("Student ID not found");

      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/admin/students/${studentId}/photo`, {
        method: 'POST',
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.profileImage) {
        // Update the profile data with new image
        setProfileData(prev => prev ? {
          ...prev,
          studentProfile: {
            ...prev.studentProfile,
            profileImage: result.data.profileImage
          }
        } : null);
        
        toast({
          title: "Success",
          description: "Profile photo updated successfully",
        });
      } else {
        throw new Error(result.error?.message || "Failed to upload photo");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "ST";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  // Create dynamic recent activity with admin name
  const getRecentActivity = () => {
    const baseActivity = [
      {
        id: "1",
        type: "checkin" as const,
        message: "Completed morning mood check-in",
        time: "2 hours ago",
      },
      {
        id: "2",
        type: "badge" as const,
        message: "Earned 'Consistency Champion' badge",
        time: "1 day ago",
      },
      {
        id: "4",
        type: "content" as const,
        message: "Completed 'Managing Exam Stress' article",
        time: "3 days ago",
      },
      {
        id: "5",
        type: "checkin" as const,
        message: "Completed evening reflection",
        time: "4 days ago",
      },
      {
        id: "6",
        type: "alert" as const,
        message: "Triggered wellness check due to low mood",
        time: "5 days ago",
      },
    ];

    // Insert the session activity with admin name
    const sessionActivity = {
      id: "3",
      type: "session" as const,
      message: user?.firstName && user?.lastName 
        ? `Attended session with ${user.firstName} ${user.lastName}`
        : user?.email 
        ? `Attended session with ${user.email}`
        : "Attended session with Admin",
      time: "2 days ago",
    };

    return [
      ...baseActivity.slice(0, 2),
      sessionActivity,
      ...baseActivity.slice(2)
    ];
  };

  // Get moods for current page
  const totalMoodPages = Math.ceil(
    (profileData?.recentMoods?.length || 0) / moodsPerPage,
  );
  const displayedMoods = (profileData?.recentMoods || []).slice(
    moodPageIndex * moodsPerPage,
    (moodPageIndex + 1) * moodsPerPage,
  );

  const goToPreviousMoods = () => {
    if (moodPageIndex > 0) setMoodPageIndex(moodPageIndex - 1);
  };

  const goToNextMoods = () => {
    if (moodPageIndex < totalMoodPages - 1) setMoodPageIndex(moodPageIndex + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Student profile not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <AdminHeader
        title="Student Profile"
        subtitle={`Viewing profile for ${profileData.firstName} ${profileData.lastName}`}
        actions={
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
        showSchoolFilter={isSuperAdmin}
        schoolFilterValue={selectedSchoolId}
        onSchoolFilterChange={setSelectedSchoolId}
        schools={schools}
      />
      {/* <div className="bg-white border-b border-border/40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Student Profile
              </h1>
              <p className="text-sm text-muted-foreground">
                Viewing profile for {profileData.firstName}{" "}
                {profileData.lastName}
              </p>
            </div>
          </div>
        </div>
      </div> */}

      <div className="flex-1 overflow-auto p-6 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Profile Header Card */}
          <Card className="p-6 bg-white border border-border/40 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                  <AvatarImage src={profileData.studentProfile?.profileImage || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(profileData.firstName, profileData.lastName)}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 cursor-pointer"
                >
                  <div className="bg-blue-600 rounded-full p-1 text-white hover:bg-blue-700">
                    <Camera className="h-4 w-4" />
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-foreground">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <Badge
                    variant="outline"
                    className={`${statusBadgeStyles[profileData.status]} font-medium text-xs px-2.5 py-0.5`}
                  >
                    {statusLabels[profileData.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  {profileData.classRef?.name || "No class"} • Student ID:{" "}
                  {profileData.studentId}
                </p>
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profileData.email || "No email"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {profileData.phone || "No phone"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {profileData.studentProfile?.joinDate || "Unknown"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  {" "}
                  {profileData.studentProfile?.averageMood?.toFixed(1) || "-"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg. Mood Score
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 bg-white border border-border/40 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#f0f4ff] flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {profileData._count?.moodCheckins || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Check-ins
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border border-border/40 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#fff8e6] flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {profileData.studentProfile?.streakDays || 0} days
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current Streak
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border border-border/40 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#fff4e6] flex items-center justify-center">
                  <Award className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {profileData.badges?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Badges Earned</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border border-border/40 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#e8f4ff] flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {profileData.sessions?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Left Column - 2/3 width */}
            <div className="col-span-2 space-y-5">
              {/* Personal Information Card */}
              <Card className="p-5 bg-white border border-border/40 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-foreground">
                    Personal Information
                  </h3>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{profileData.firstName}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{profileData.lastName}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{profileData.email || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{profileData.phone || "Not provided"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Recent Moods with Arrow Navigation */}
              <Card className="p-5 bg-white border border-border/40 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-foreground">
                    Recent Mood History
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={goToPreviousMoods}
                      disabled={moodPageIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={goToNextMoods}
                      disabled={moodPageIndex >= totalMoodPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {displayedMoods.map((entry, index) => (
                    <div
                      key={index}
                      className="rounded-xl p-4 text-center bg-[#f0f7ff] border border-[#d6e8ff]"
                    >
                      <p className="text-2xl mb-2">{entry.emoji}</p>
                      <p className="font-medium text-sm text-primary">
                        {entry.mood}
                      </p>
                      <p className="text-xs text-primary/60 mt-1">
                        {entry.date}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Support Sessions */}
              <Card className="p-5 bg-white border border-border/40 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-4">
                  Support Sessions
                </h3>
                <div className="space-y-3">
                  {profileData.sessions?.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-[#f8f9fb]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0ff] shrink-0">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-foreground text-sm">
                            {user?.firstName && user?.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user?.email || 'Admin'
                            }
                          </p>
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs px-2 py-0.5 font-medium">
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {session.date} • {session.time} • {session.duration}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-2 text-sm"
                        onClick={() => setSelectedSession(session)}
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-5">
              {/* Full Activity List */}
              <Card className="p-5 bg-white border border-border/40 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-4">
                  Activity
                </h3>
                <div className="space-y-3">
                  {getRecentActivity().map((activity: Activity) => {
                    const Icon = activityIconMap[activity.type];
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            activityStyleMap[activity.type],
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-snug">
                            {activity.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Badges */}
              <Card className="p-5 bg-white border border-border/40 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-4">
                  Earned Badges
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.badges?.map((badge: any) => (
                    <Badge
                      key={badge}
                      variant="outline"
                      className="bg-[#e8f4ff] text-primary border-[#c5e0ff] py-1.5 px-3 gap-1.5 font-medium text-xs"
                    >
                      <Award className="h-3 w-3" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Guardian Info */}
              <Card className="p-5 bg-white border border-border/40 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-4">
                  Guardian Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#E2E8F0] text-[#64748B] text-sm font-medium">
                        {getInitials(profileData.emergencyContact?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {profileData.emergencyContact?.name || "Not provided"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profileData.emergencyContact?.relationship ||
                          "Not specified"}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {profileData.emergencyContact?.phone || "Not provided"}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      <Dialog
        open={!!selectedSession}
        onOpenChange={() => setSelectedSession(null)}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-0 gap-0 max-h-[90vh] flex flex-col">
          {selectedSession && (
            <>
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-100 px-6 py-5 relative flex-shrink-0">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors z-10"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>

                <Badge
                  variant="secondary"
                  className="text-xs mb-3 bg-green-100 text-green-700"
                >
                  {selectedSession.status}
                </Badge>

                <DialogTitle className="text-xl font-semibold text-foreground mb-2">
                  Session Details
                </DialogTitle>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{selectedSession.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{selectedSession.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    <span>{selectedSession.duration}</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="px-6 py-5 space-y-6 bg-white overflow-y-auto flex-1 scroll-smooth">
                {/* Counselor Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {selectedSession.doctor
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedSession.doctor}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      School Counselor
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Session Notes */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Session Notes
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedSession.notes}
                  </p>
                </div>

                {/* Recommended Resources */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Recommended Resources
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {selectedSession.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Admin Observations */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Counselor Observations
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedSession.observations}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
