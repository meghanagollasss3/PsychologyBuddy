"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSchoolFilter } from "@/src/contexts/SchoolFilterContext";
import { useAuth } from "@/src/contexts/AuthContext";

interface Alert {
  id: string;
  studentName: string;
  className: string;
  priority: "low" | "medium" | "high" | "critical";
  reason: string;
  time: string;
}

const priorityStyles = {
  low: { bg: "bg-[#10B981]/10", text: "text-[#10B981]", border: "border-[#10B981]/30" },
  medium: { bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]", border: "border-[#F59E0B]/30" },
  high: { bg: "bg-[#EF4444]/10", text: "text-[#EF4444]", border: "border-[#EF4444]/30" },
  critical: { bg: "bg-[#EF4444]/20", text: "text-[#EF4444]", border: "border-[#EF4444]/50" },
};

export function AlertsOverview() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedSchoolId, isSuperAdmin } = useSchoolFilter();
  const { user } = useAuth();

  useEffect(() => {
    fetchAlerts();
  }, [selectedSchoolId]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add school filter if applicable
      if (isSuperAdmin && selectedSchoolId && selectedSchoolId !== 'all') {
        params.append('schoolId', selectedSchoolId);
        console.log('AlertsOverview: Adding schoolId', selectedSchoolId);
      } else if (!isSuperAdmin && user?.school?.id) {
        // For Admins, we should pass their schoolId too
        const adminSchoolId = user?.school?.id;
        params.append('schoolId', adminSchoolId);
        console.log('AlertsOverview: Adding admin schoolId', adminSchoolId);
      }

      const response = await fetch(`/api/admin/alerts?${params.toString()}`);
      const result = await response.json();
      
      console.log('Alerts API Response:', result); // Debug logging
      
      if (result.success) {
        // Transform API data to match Alert interface
        const transformedAlerts = result.data.map((item: any) => {
          const severity = item.metadata?.severity || item.type;
          console.log('Processing alert:', item.id, 'severity:', severity, 'type:', typeof severity);
          
          return {
            id: item.id,
            studentName: item.studentName,
            className: item.classSection,
            priority: mapPriority(severity),
            reason: item.description,
            time: formatRelativeTime(item.timestamp)
          };
        });
        
        console.log('Transformed alerts:', transformedAlerts); // Debug logging
        setAlerts(transformedAlerts);
      } else {
        console.error('API returned error:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapPriority = (severity: any): Alert['priority'] => {
    const severityStr = typeof severity === 'string' ? severity.toLowerCase() : '';
  
    switch (severityStr) {
      case 'critical':
      case 'severe':
        return 'critical';
      case 'high':
      case 'urgent':
        return 'high';
      case 'medium':
      case 'moderate':
        return 'medium';
      case 'low':
      case 'minor':
        return 'low';
      default:
        return 'medium';
    }
  };

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="rounded-xl border border-[#EF4444]/20 bg-card">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EF4444]/10">
            <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">Active Alerts</h3>
            <p className="text-sm text-[#94A3B8]">{alerts.length} requiring attention</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.href = '/admin/alerts'}
        >
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <div className="divide-y divide-border">
        {loading && alerts.length === 0 ? (
          <div className="p-8 text-center text-[#94A3B8]">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-[#94A3B8]">
            No active alerts.
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={cn(
                "flex items-center justify-between p-4 hover:bg-[#E2E8F0]/30 transition-colors",
                alert.priority === "critical" && "bg-[#EF4444]/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E2E8F0]">
                  <User className="h-4 w-4 text-[#94A3B8]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{alert.studentName}</p>
                  <p className="text-xs text-[#94A3B8]">{alert.className} • {alert.time}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs text-[#94A3B8] max-w-40 truncate">
                  {alert.reason}
                </span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs capitalize",
                    priorityStyles[alert.priority].bg,
                    priorityStyles[alert.priority].text,
                    priorityStyles[alert.priority].border
                  )}
                >
                  {alert.priority}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
