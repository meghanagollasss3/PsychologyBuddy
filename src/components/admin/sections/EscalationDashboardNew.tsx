'use client'

import { useState, useEffect } from "react";
import { 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  ChevronRight,
  X,
  Calendar,
  BookOpen,
  Lightbulb,
  Dumbbell,
  Music,
  Heart,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/src/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { usePermissions } from "@/src/hooks/usePermissions";

interface EscalationAlert {
  id: string
  studentId: string
  studentName: string
  studentClass?: string
  studentEmail: string
  sessionId: string
  category: string
  level: string
  severity: number
  confidence: number
  detectedPhrases: string[]
  context: string
  recommendation: string
  description: string
  detectionMethod: string
  messageContent: string
  messageTimestamp: string
  requiresImmediateAction: boolean
  status: string
  priority: string
  assignedTo?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const priorityStyles = {
  low: { bg: "bg-green-400/10", text: "text-green-600", border: "border-green-600/30", label: "Low" },
  medium: { bg: "bg-yellow-400/10", text: "text-yellow-600", border: "border-yellow-600/30", label: "Medium" },
  high: { bg: "bg-orange-400/10", text: "text-orange-600", border: "border-orange-600/30", label: "High" },
  critical: { bg: "bg-red-400/10", text: "text-red-600", border: "border-red-600/30", label: "Critical" },
};

const statusStyles = {
  open: { bg: "bg-yellow-400/10", text: "text-yellow-600", label: "Open" },
  resolved: { bg: "bg-green-400/10", text: "text-green-600", label: "Resolved" },
  reviewed: { bg: "bg-blue-400/10", text: "text-blue-600", label: "Reviewed" },
  false_positive: { bg: "bg-gray-400/10", text: "text-gray-600", label: "False Positive" },
};

const resourceIcons = {
  book: BookOpen,
  exercise: Dumbbell,
  prompt: Lightbulb,
};

const resourceTypes = [
  { id: "articles", label: "Articles", icon: BookOpen },
  { id: "meditation", label: "Meditation", icon: Heart },
  { id: "music", label: "Music Therapy", icon: Music },
  { id: "exercises", label: "Exercises", icon: Dumbbell },
];

// Mock resource data - in production this would come from the database
const availableResourcesByType: Record<string, { id: string; name: string; duration: string }[]> = {
  articles: [
    { id: "a1", name: "Understanding Anxiety", duration: "5 min read" },
    { id: "a2", name: "Breathing Techniques for Calm", duration: "3 min read" },
    { id: "a3", name: "Managing Exam Stress", duration: "7 min read" },
    { id: "a4", name: "Building Resilience", duration: "6 min read" },
    { id: "a5", name: "Mindfulness Basics", duration: "4 min read" },
  ],
  meditation: [
    { id: "m1", name: "5-Minute Breathing Exercise", duration: "5 min" },
    { id: "m2", name: "Body Scan Meditation", duration: "10 min" },
    { id: "m3", name: "Guided Relaxation", duration: "15 min" },
    { id: "m4", name: "Morning Calm", duration: "8 min" },
  ],
  music: [
    { id: "mu1", name: "Calm Piano Collection", duration: "30 min" },
    { id: "mu2", name: "Nature Sounds", duration: "20 min" },
    { id: "mu3", name: "Sleep Therapy Mix", duration: "45 min" },
  ],
  exercises: [
    { id: "e1", name: "Box Breathing Practice", duration: "5 min" },
    { id: "e2", name: "Grounding Techniques", duration: "10 min" },
    { id: "e3", name: "Progressive Muscle Relaxation", duration: "15 min" },
    { id: "e4", name: "Journaling Prompts", duration: "10 min" },
  ],
};

interface AlertDetailModalProps {
  alert: EscalationAlert | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (alertId: string, status: string, notes?: string) => void
}

function AlertDetailModal({ alert, isOpen, onClose, onUpdateStatus }: AlertDetailModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState(alert?.notes || '');
  const [selectedResourceType, setSelectedResourceType] = useState<string>("");
  const [resourceSearchQuery, setResourceSearchQuery] = useState("");
  const [selectedResources, setSelectedResources] = useState<{ id: string; name: string; type: string; duration: string }[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !alert) return null;

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  const dateTime = formatDateTime(alert.createdAt);

  const handleCloseAlert = async () => {
    if (!resolutionNotes.trim()) {
      toast({
        title: "Resolution Notes Required",
        description: "Please add resolution notes before closing the alert.",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmation(true);
  };

  const confirmCloseAlert = async () => {
    setUpdating(true);
    await onUpdateStatus(alert.id, 'resolved', resolutionNotes);
    setUpdating(false);
    setShowConfirmation(false);
    onClose();
    toast({
      title: "Alert Closed",
      description: "The alert has been marked as resolved.",
    });
    setResolutionNotes("");
    setSelectedResourceType("");
    setResourceSearchQuery("");
    setSelectedResources([]);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-0 gap-0 max-h-[90vh] flex flex-col">
          {/* Gradient Header - Sticky */}
          <div className="bg-gradient-to-r from-violet-100 via-purple-50 to-blue-100 px-6 py-5 relative flex-shrink-0">
            {/* <button 
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors z-10"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button> */}
            
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs mb-3",
                statusStyles[alert.status as keyof typeof statusStyles]?.bg, 
                statusStyles[alert.status as keyof typeof statusStyles]?.text
              )}
            >
              {statusStyles[alert.status as keyof typeof statusStyles]?.label}
            </Badge>
            
            <DialogTitle className="text-xl font-semibold text-[#1E293B] mb-2">
              Alert Details
            </DialogTitle>
            
            <div className="flex items-center gap-4 text-sm text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{dateTime.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{dateTime.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]" />
                <span>{alert.detectionMethod}</span>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="px-6 py-5 space-y-6 bg-white overflow-y-auto flex-1 scroll-smooth">
            {/* Student Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#3B82F6]/10 text-[#3B82F6] text-sm">
                  {alert.studentName.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-[#1E293B]">{alert.studentName}</p>
                <p className="text-sm text-[#64748B]"> {alert.studentClass}</p>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs ml-auto", 
                  priorityStyles[alert.priority as keyof typeof priorityStyles]?.bg, 
                  priorityStyles[alert.priority as keyof typeof priorityStyles]?.text,
                  priorityStyles[alert.priority as keyof typeof priorityStyles]?.border
                )}
              >
                {priorityStyles[alert.priority as keyof typeof priorityStyles]?.label} Priority
              </Badge>
            </div>

            {/* Alert Summary */}
            <div>
              <p className="text-sm font-medium text-[#64748B] mb-2">Alert Summary</p>
              <div className="rounded-lg bg-[#E2E8F0]/30 p-4">
                <p className="text-sm text-[#1E293B] leading-relaxed">{alert.description}</p>
              </div>
            </div>

            {/* Detection Details */}
            <div>
              <p className="text-sm font-medium text-[#64748B] mb-2">Detection Details</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">Category:</span>
                  <span className="text-sm font-medium">{alert.category.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">Severity:</span>
                  <span className="text-sm font-medium">{alert.severity}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">Confidence:</span>
                  <span className="text-sm font-medium">{Math.round(alert.confidence * 100)}%</span>
                </div>
                {alert.detectedPhrases.length > 0 && (
                  <div>
                    <span className="text-sm text-[#64748B]">Detected Phrases:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {alert.detectedPhrases.map((phrase, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {phrase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Original Message */}
            <div>
              <p className="text-sm font-medium text-[#64748B] mb-2">Original Message</p>
              <div className="rounded-lg bg-[#E2E8F0]/30 p-4">
                <p className="text-sm text-[#1E293B] italic">"{alert.messageContent}"</p>
              </div>
            </div>

            {/* Close Alert Form (for open alerts) */}
            {alert.status === 'open' && (
              <div className="space-y-4 pt-2 border-t border-border">
                {/* Resolution Notes */}
                <div>
                  <Label className="text-sm font-medium text-[#64748B] mb-2 block">
                    Resolution Notes <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    placeholder="Enter observations, offline counselling notes, follow-up context..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                {/* Recommended Resources */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-[#64748B] block">
                    Recommended Resources (optional)
                  </Label>
                  
                  {/* Step 1: Select Resource Type */}
                  <Select value={selectedResourceType} onValueChange={(value) => {
                    setSelectedResourceType(value);
                    setResourceSearchQuery("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Step 2: Select Specific Resource */}
                  {selectedResourceType && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Search resources..."
                        value={resourceSearchQuery}
                        onChange={(e) => setResourceSearchQuery(e.target.value)}
                        className="text-sm"
                      />
                      <div className="max-h-32 overflow-y-auto border rounded-lg divide-y">
                        {availableResourcesByType[selectedResourceType]
                          ?.filter(r => r.name.toLowerCase().includes(resourceSearchQuery.toLowerCase()))
                          .map((resource) => {
                            const isAlreadySelected = selectedResources.some(sr => sr.id === resource.id);
                            return (
                              <div
                                key={resource.id}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors",
                                  isAlreadySelected 
                                    ? "bg-[#E2E8F0]/50 text-[#64748B]" 
                                    : "hover:bg-[#E2E8F0]/30"
                                )}
                                onClick={() => {
                                  if (!isAlreadySelected) {
                                    const typeLabel = resourceTypes.find(t => t.id === selectedResourceType)?.label || selectedResourceType;
                                    setSelectedResources([...selectedResources, {
                                      id: resource.id,
                                      name: resource.name,
                                      type: typeLabel,
                                      duration: resource.duration
                                    }]);
                                  }
                                }}
                              >
                                <span>{resource.name}</span>
                                <span className="text-xs text-[#64748B]">{resource.duration}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Selected Resources Display */}
                  {selectedResources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#64748B]">Selected resources:</p>
                      <div className="space-y-1">
                        {selectedResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{resource.name}</p>
                              <p className="text-xs text-[#64748B]">{resource.type} • {resource.duration}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => setSelectedResources(selectedResources.filter(r => r.id !== resource.id))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Close Alert Button */}
                <Button 
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleCloseAlert}
                  disabled={updating}
                >
                  <CheckCircle className="h-4 w-4" />
                  {updating ? "Closing..." : "Close Alert"}
                </Button>
              </div>
            )}

            {/* Resolution Info (for resolved alerts) */}
            {alert.status !== 'open' && alert.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Resolution Notes</p>
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-sm text-foreground leading-relaxed">{alert.notes}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this alert? This action will mark the alert as resolved and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={confirmCloseAlert}
              disabled={updating}
            >
              Confirm Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function EscalationDashboardNew() {
  const [alerts, setAlerts] = useState<EscalationAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<EscalationAlert | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([])
  const [selectedSchool, setSelectedSchool] = useState('all')
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  const { isSuperAdmin, userSchoolId } = usePermissions()

  // Set initial school based on permissions
  useEffect(() => {
    if (!isSuperAdmin && userSchoolId) {
      setSelectedSchool(userSchoolId)
    }
  }, [isSuperAdmin, userSchoolId])

  // Fetch schools if super admin
  useEffect(() => {
    console.log('useEffect triggered - isSuperAdmin:', isSuperAdmin)
    if (isSuperAdmin) {
      console.log('User is super admin, fetching schools...')
      fetchSchools()
    }
  }, [isSuperAdmin])

  // Fetch alerts and schools
  useEffect(() => {
    fetchAlerts()
  }, [selectedSchool, statusFilter])

  const fetchSchools = async () => {
    try {
      console.log('Fetching schools for super admin...')
      const schoolsResponse = await fetch('/api/admin/schools')
      const schoolsResult = await schoolsResponse.json()
      
      console.log('Schools API response:', schoolsResult)
      
      // API returns schools directly, not wrapped in success/data structure
      if (Array.isArray(schoolsResult)) {
        console.log('Schools fetched successfully:', schoolsResult)
        setSchools(schoolsResult)
      } else {
        console.error('Unexpected schools API response format:', schoolsResult)
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error)
    }
  }

  // Fetch alerts from real API
  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        status: statusFilter,
        limit: '100'
      })
      
      // Add school filter if not super admin or if specific school is selected
      if (selectedSchool !== 'all') {
        params.append('schoolId', selectedSchool)
      }

      const response = await fetch(`/api/students/escalations?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }
      
      const data = await response.json()
      
      // Filter by search term and priority
      const filteredAlerts = data.alerts.filter((alert: EscalationAlert) => {
        const studentName = alert.studentName || '';
        const studentEmail = alert.studentEmail || '';
        const description = alert.description || '';
        
        const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            description.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter
        
        return matchesSearch && matchesPriority
      })

      setAlerts(filteredAlerts)

    } catch (error) {
      console.error('Error fetching escalation data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [statusFilter, priorityFilter, searchTerm, selectedSchool])

  // Update alert status using real API
  const updateAlertStatus = async (alertId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/students/escalations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          status,
          notes: notes || ''
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update alert status')
      }

      // Refresh alerts after update
      await fetchAlerts()

      console.log(`Alert ${alertId} updated to status: ${status}`)
      
      // Close modal if open
      if (isModalOpen) {
        setIsModalOpen(false)
        setSelectedAlert(null)
      }

    } catch (error) {
      console.error('Error updating alert status:', error)
      setError(error instanceof Error ? error.message : 'Failed to update alert')
    }
  }

  // Open alert detail modal
  const openAlertDetail = (alert: EscalationAlert) => {
    setSelectedAlert(alert)
    setIsModalOpen(true)
  }

  // Close alert detail modal
  const closeAlertDetail = () => {
    setIsModalOpen(false)
    setSelectedAlert(null)
  }

  // Run behavioral monitoring
  const runBehavioralMonitoring = async () => {
    try {
      setIsMonitoring(true)
      
      const response = await fetch('/api/admin/behavioral-monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to run behavioral monitoring')
      }

      const result = await response.json()

      toast({
        title: "Behavioral Monitoring Completed",
        description: result.message,
      })

      // Refresh alerts to show any new behavioral escalations
      await fetchAlerts()

    } catch (error) {
      console.error('[EscalationDashboard] Error running behavioral monitoring:', error)
      toast({
        title: "Monitoring Failed",
        description: "Failed to run behavioral monitoring. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMonitoring(false)
    }
  }

  // Get unique classes from alerts
  const uniqueClasses = Array.from(new Set(alerts.map(a => a.studentClass).filter((cls): cls is string => Boolean(cls)))).sort();

  // Calculate stats
  const openCount = alerts.filter(a => a.status === 'open').length;
  const highCount = alerts.filter(a => a.priority === 'high' && a.status !== 'resolved').length;
  const criticalCount = alerts.filter(a => a.priority === 'resolved' && a.status !== 'resolved').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
  
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">Error loading alerts</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={fetchAlerts} className="mt-2">Retry</Button>
        </div>
      </div>
    )
  }

  // Debug logging
  console.log('School Filter Show:', isSuperAdmin, 'Is Super Admin:', isSuperAdmin)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Admin Header */}
      <AdminHeader 
        title="Escalation & Alerts"
        subtitle={`${openCount} open alerts, ${highCount + criticalCount} high priority`}
        showTimeFilter={false}
        showSchoolFilter={isSuperAdmin}
        schoolFilterValue={selectedSchool}
        onSchoolFilterChange={setSelectedSchool}
        schools={schools}
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-[#64748B]">Open</p>
            <p className="text-2xl font-semibold text-[#F59E0B]">{openCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-[#64748B]">High Priority</p>
            <p className="text-2xl font-semibold text-[#EF4444]">{highCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-[#64748B]">Resolved</p>
            <p className="text-2xl font-semibold text-[#10B981]">{resolvedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <Input 
              placeholder="Search by student name..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={priorityFilter} onValueChange={(value: string) => setPriorityFilter(value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              {/* <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="false_positive">False Positive</SelectItem> */}
            </SelectContent>
          </Select>
          {/* <Button 
            variant="outline" 
            onClick={runBehavioralMonitoring}
            disabled={isMonitoring}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isMonitoring ? 'animate-spin' : ''}`} />
            {isMonitoring ? "Monitoring..." : "Run Behavioral Check"}
          </Button> */}
        </div>

        {/* Alert List */}
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No alerts found
            </div>
          ) : (
            alerts.map((alert, index) => {
              return (
                <div 
                  key={alert.id}
                  onClick={() => openAlertDetail(alert)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border bg-card p-4 cursor-pointer transition-all hover:shadow-md",
                    alert.priority === "critical" && "border-red-600/30 bg-red-50",
                    alert.priority === "high" && "border-orange-600/30 bg-orange-50",
                    
                  )}
                >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  priorityStyles[alert.priority as keyof typeof priorityStyles]?.bg
                )}>
                  <AlertTriangle className={cn("h-5 w-5", priorityStyles[alert.priority as keyof typeof priorityStyles]?.text)} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{alert.studentName}</p>
                    <span className="text-xs text-[#64748B]"> {alert.studentClass}</span>
                  </div>
                  <p className="text-sm text-[#64748B] line-clamp-1">{alert.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-xs text-[#64748B]">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(alert.createdAt)}
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.detectionMethod}</span>
                </div>
                
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", priorityStyles[alert.priority as keyof typeof priorityStyles]?.bg, priorityStyles[alert.priority as keyof typeof priorityStyles]?.text, priorityStyles[alert.priority as keyof typeof priorityStyles]?.border)}
                >
                  {priorityStyles[alert.priority as keyof typeof priorityStyles]?.label}
                </Badge>
                
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", statusStyles[alert.status as keyof typeof statusStyles]?.bg, statusStyles[alert.status as keyof typeof statusStyles]?.text)}
                >
                  {statusStyles[alert.status as keyof typeof statusStyles]?.label}
                </Badge>
                
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
              );
            })
          )}
        </div>
      </div>

      {/* Alert Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={closeAlertDetail}
        onUpdateStatus={updateAlertStatus}
      />
    </div>
  );
}

        
