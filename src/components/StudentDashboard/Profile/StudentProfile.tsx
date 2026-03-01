"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  User,
  Phone,
  HelpCircle,
  ChevronRight,
  BookOpen,
  Activity,
  FileText,
  Wind,
  Users,
  Award,
  X,
  Check,
  AlertTriangle,
  GraduationCap,
  CalendarDays,
  MessageCircleWarning
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";
import StudentLayout from "@/src/components/StudentDashboard/Layout/StudentLayout";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import BackToDashboard from "../Layout/BackToDashboard";

/* ----------------------------------------------------------------------
   API FETCHER
------------------------------------------------------------------------*/
async function fetchStudentProfile(id: string) {
  const res = await fetch(`/api/students/${id}/profile`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to fetch");
  return json.data;
}

/* ----------------------------------------------------------------------
   PAGE COMPONENT
------------------------------------------------------------------------*/
export default function StudentProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: () => fetchStudentProfile(user!.id),
    enabled: !!user?.id,
  });

  const handleSavePhoto = async (photo: File) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify({}));
      formData.append('photo', photo);

      const response = await fetch('/api/students/profile', {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update photo');
      }
      
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been successfully updated."
      });
      setSelectedPhoto(null);
      // Refetch profile data to show updated photo
      refetch();
      // Refresh user context to update header avatar
      await refreshUser();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (isError || !data) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load profile</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const { student, sessions, activities, badges } = data;

  return (
    <StudentLayout>
      <div className="w-full max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* Back Link */}
 <BackToDashboard />
        {/* HEADER CARD */}
        <HeaderCard 
          student={student} 
          selectedPhoto={selectedPhoto}
          setSelectedPhoto={setSelectedPhoto}
          isSaving={isSaving}
          onSavePhoto={handleSavePhoto}
        />

        {/* GRID: PROFILE INFO + SUPPORT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProfileInfo student={student} />
          <SupportSection />
        </div>

        {/* GRID: SESSIONS + ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SessionsSection 
            sessions={sessions} 
            setSelectedSession={setSelectedSession}
            setIsModalOpen={setIsModalOpen}
          />
          <ActivitySection activities={activities} />
        </div>

        {/* BADGES */}
        {badges.length > 0 && <BadgesSection badges={badges} />}

        {/* SESSION DETAILS MODAL */}
        {isModalOpen && selectedSession && (
          <SessionDetailsModal 
            session={selectedSession} 
            onClose={() => {
              setIsModalOpen(false);
              setSelectedSession(null);
            }} 
          />
        )}

      </div>
    </StudentLayout>
  );
}

/* ----------------------------------------------------------------------
   COMPONENTS
------------------------------------------------------------------------*/

/* ---------------------- HEADER CARD ---------------------- */
function HeaderCard({ student, selectedPhoto, setSelectedPhoto, isSaving, onSavePhoto }: any) {
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const { toast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive"
        });
        return;
      }
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = () => {
    if (selectedPhoto) {
      onSavePhoto(selectedPhoto);
      setPhotoPreview("");
    }
  };

  return (
    <div className="rounded-[32px] p-15 bg-gradient-to-r from-[#8AB1ED]/50 via-[#C3C5FF]/50 to-[#CBB5FF]/50 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="relative">
          <div className="w-[140px] h-[140px] rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
            {photoPreview ? (
              <img 
                src={photoPreview} 
                alt="Profile" 
                className="w-full h-full  rounded-full object-cover"
              />
            ) : student.profileImage ? (
              <img 
                src={student.profileImage} 
                alt="Profile" 
                className="w-full h-full border-4 border-white rounded-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = student.firstName[0];
                }}
              />
            ) : (
              student.firstName[0]
            )}
          </div>
          <label className="absolute bottom-0 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center cursor-pointer ">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <span className="text-gray-500 text-[32px] mb-1">+</span>
          </label>
        </div>

        <div className="flex-1 text-center sm:text-left mt-4 space-y-1">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <h1 className="text-[32px] font-semibold text-[#2F3D43]">{student.fullName}</h1>

            <span className="px-3 py-1 rounded-full bg-[#B4E5C6] border border-[#02A63C] text-[#06772F] text-[12px] font-regular">
              {student.status}
            </span>
          </div>

          <p className="text-[#8585A4] text-[14px]">Member since {student.memberSince}</p>

          <div className="flex flex-wrap gap-4 mt-2 text-[16px] text-[#5F5F75] justify-center sm:justify-start">
            <span>Student ID : {student.studentId || "N/A"}</span>
            <span className="text-[#5F5F75] w-[8px] h-[8px] ">•</span>
            <span>{student.grade}</span>
          </div>
          
          {photoPreview && (
            <div className="mt-3 text-center sm:text-left">
              <p className="text-xs text-gray-400 mb-2">Click Save to update your photo</p>
              <button
                onClick={handleSavePhoto}
                disabled={isSaving}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Photo"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------- PROFILE INFO CARD ---------------------- */
function ProfileInfo({ student }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState(student);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleEdit = () => {
    setEditedStudent(student);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedStudent(student);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(editedStudent));

      const response = await fetch('/api/students/profile', {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
      setIsEditing(false);
      // Refetch profile data to show updated information
      window.location.reload();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[17px] shadow-sm p-6  space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Profile Information</h2>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="text-[#1E86FD] hover:text-blue-800 text-sm font-medium"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <InfoItem 
          icon={<GraduationCap className="w-4 h-4 text-[#1E86FD]" />} 
          label="Full Name" 
          value={isEditing ? (
            <input
              type="text"
              value={editedStudent.firstName || ""}
              onChange={(e) => setEditedStudent({...editedStudent, firstName: e.target.value})}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="First Name"
            />
          ) : student.fullName} 
        />

        <InfoItem 
          icon={<Phone className="w-4 h-4 text-[#1E86FD]" />} 
          label="Phone" 
          value={isEditing ? (
            <input
              type="tel"
              value={editedStudent.phone || ""}
              onChange={(e) => setEditedStudent({...editedStudent, phone: e.target.value})}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Phone Number"
            />
          ) : student.phone || "Not provided"} 
        />

        <InfoItem
          icon={<CalendarDays className="w-4 h-4 text-[#1E86FD]" />}
          label="Date of Birth"
          value={isEditing ? (
            <input
              type="date"
              value={editedStudent.dateOfBirth ? new Date(editedStudent.dateOfBirth).toISOString().split('T')[0] : ""}
              onChange={(e) => setEditedStudent({...editedStudent, dateOfBirth: e.target.value})}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          ) : student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "Not provided"}
        />

        <InfoItem 
          icon={<GraduationCap className="w-4 h-4 text-[#1E86FD]" />} 
          label="Grade" 
          value={isEditing ? (
            <select
              value={editedStudent.grade || ""}
              onChange={(e) => setEditedStudent({...editedStudent, grade: e.target.value})}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="">Select Grade</option>
              <option value="9th Grade">9th Grade</option>
              <option value="10th Grade">10th Grade</option>
              <option value="11th Grade">11th Grade</option>
              <option value="12th Grade">12th Grade</option>
            </select>
          ) : student.grade} 
        />

        <InfoItem
          icon={<MessageCircleWarning className="w-4 h-4 text-[#1E86FD]" />}
          label="Emergency Contact"
          value={isEditing ? (
            <input
              type="tel"
              value={editedStudent.emergencyContact?.phone || ""}
              onChange={(e) => setEditedStudent({
                ...editedStudent, 
                emergencyContact: {...editedStudent.emergencyContact, phone: e.target.value}
              })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Emergency Contact Phone"
            />
          ) : student.emergencyContact?.phone}
          full
        />
      </div>
    </div>
  );
}

/* Info Item Component */
function InfoItem({ icon, label, value, full }: any) {
  return (
    <div
      className={`p-4 rounded-lg bg-[#F6F8FA]  flex items-center gap-3 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-[#E1ECFA] shadow flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[12px] text-[#979CA2]">{label}</p>
        <p className="text-[12px] font-medium text-[#35334C]">{value}</p>
      </div>
    </div>
  );
}

/* ---------------------- SUPPORT SECTION ---------------------- */
function SupportSection() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 space-y-2">
      <h2 className="text-lg font-semibold text-gray-800">Support & Settings</h2>

      <SupportItem icon={<HelpCircle className="w-5 h-5 text-blue-500" />} label="Help/FAQs" />
      <SupportItem icon={<Phone className="w-5 h-5 text-purple-500" />} label="Contact Support" />
      <SupportItem icon={<Users className="w-5 h-5 text-gray-600" />} label="Emergency Contacts" />
    </div>
  );
}

function SupportItem({ icon, label }: any) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">{icon}</div>
        <span className="text-sm font-medium text-gray-800">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  );
}

/* ---------------------- SESSIONS ---------------------- */
function SessionsSection({ sessions, setSelectedSession, setIsModalOpen }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800">My Sessions</h2>

      {sessions.length === 0 && (
        <p className="text-gray-500 py-8 text-center">No sessions yet</p>
      )}

      {sessions.map((s: any) => (
        <SessionCard 
          key={s.id} 
          session={s} 
          setSelectedSession={setSelectedSession}
          setIsModalOpen={setIsModalOpen}
        />
      ))}
    </div>
  );
}

function SessionCard({ session, setSelectedSession, setIsModalOpen }: any) {
  const handleViewClick = () => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  // Determine styling based on session status
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'Completed':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-700'
        };
      case 'In Progress':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-700'
        };
      case 'Scheduled':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          badge: 'bg-yellow-100 text-yellow-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const styling = getStatusStyling(session.status);

  return (
    <div className={`p-4 rounded-lg border flex flex-col gap-2 ${styling.bg} ${styling.border} mt-3`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full ${styling.badge} w-fit font-medium`}>
          {session.status}
        </span>
        {session.hasHighAlerts && session.highAlertsResolved && (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 w-fit font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            High Alerts Resolved
          </span>
        )}
      </div>

      <p className="font-medium text-gray-800">{session.type}</p>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {session.date}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {session.time}
        </span>
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" /> {session.doctor}
        </span>
      </div>

      <button 
        onClick={handleViewClick}
        className="self-end text-sm text-blue-600 hover:text-blue-800"
      >
        View →
      </button>
    </div>
  );
}

/* ---------------------- ACTIVITY ---------------------- */
function ActivitySection({ activities }: any) {
  const [filter, setFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const getIcon = (type: string) => {
    if (type === "journaling") return <FileText className="w-5 h-5 text-purple-500" />;
    if (type === "meditation") return <Wind className="w-5 h-5 text-green-500" />;
    if (type === "checkin") return <Activity className="w-5 h-5 text-green-500" />;
    if (type === "reading") return <BookOpen className="w-5 h-5 text-blue-500" />;
    return <Activity className="w-5 h-5 text-blue-500" />;
  };

  const filteredActivities = activities.filter((activity: any) => {
    if (filter === "All") return true;
    if (filter === "Journaling" && activity.type === "journaling") return true;
    if (filter === "Meditation" && activity.type === "meditation") return true;
    if (filter === "Mood Check-ins" && activity.type === "checkin") return true;
    if (filter === "Articles" && activity.type === "reading") return true;
    if (filter === "Tools" && activity.type === "tool") return true;
    return false;
  });

  // Sort activities by date (most recent first)
  const sortedActivities = filteredActivities.sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Limit to 6 activities initially
  const displayedActivities = showAll ? sortedActivities : sortedActivities.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
        
      </div>

      {displayedActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No {filter === "All" ? "activities" : filter.toLowerCase()} yet</p>
          <p className="text-sm text-gray-400 mt-2">
            {filter === "All" 
              ? "Start using journaling or self-help tools to see your activity here"
              : `Try some ${filter.toLowerCase()} activities to see them here`
            }
          </p>
        </div>
      ) : (
        <div className="mt-4 max-h-96 overflow-y-auto space-y-4 border-l-2 border-gray-200 pl-4">
          {displayedActivities.map((a: any) => (
            <div key={a.id} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                {getIcon(a.type)}
              </div>

              <div className="flex-1">
                <p className="font-medium text-gray-800">{a.title}</p>
                <p className="text-sm text-gray-500">{a.time}</p>
                {a.details && (
                  <p className="text-xs text-gray-400 mt-1">{a.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View More Button */}
      {sortedActivities.length > 6 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAll ? 'View Less' : `View More (${sortedActivities.length - 6} more)`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------- BADGES ---------------------- */
function BadgesSection({ badges }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-yellow-500" />
        My Badges ({badges.length})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge: any) => (
          <div key={badge.id} className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{badge.name}</h4>
              <p className="text-sm text-gray-500">
                Earned {new Date(badge.earnedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------- SESSION DETAILS MODAL ---------------------- */
function SessionDetailsModal({ session, onClose }: any) {
  const [reflection, setReflection] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveReflection = async () => {
    setIsSaving(true);
    // TODO: Save reflection to API
    setTimeout(() => {
      setIsSaving(false);
      // Show success toast
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Session Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
              {session.status}
            </span>
            <span className="text-gray-600">{session.date}</span>
            <span className="text-gray-600">{session.time}</span>
            <span className="text-gray-600">45 minutes</span>
            <span className="text-gray-800 font-medium">{session.doctor}</span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Session Notes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-gray-800">Session Notes</h3>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                Only you can see
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
              We discussed strategies for managing stress during exam periods. Alex showed great insight into recognizing early signs of anxiety.
            </div>
          </div>

          {/* Your Reflection */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Your Reflection</h3>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What stood out to you from this session?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 text-sm"
            />
            <button
              onClick={handleSaveReflection}
              disabled={isSaving || !reflection.trim()}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Note"}
            </button>
          </div>

          {/* Recommended for You */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Recommended for You</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-800">5 Quick Grounding Techniques</p>
                    <p className="text-sm text-gray-500">Article • 3 min read</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Wind className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-800">Box Breathing Practice</p>
                    <p className="text-sm text-gray-500">Exercise • 5 min</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-800">Self-Reflection: My Stress Signal</p>
                    <p className="text-sm text-gray-500">Prompt • 10 min</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* After This Session */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3">After This Session</h3>
            <p className="text-sm text-gray-600 mb-4">
              You tried 2 activities after this session. That's a positive step.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700">Breathing exercise completed</span>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700">Journaling entry added</span>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                <span className="text-sm text-gray-500">Grounding technique tried</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}