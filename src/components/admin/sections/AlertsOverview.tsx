"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  studentName: string;
  className: string;
  priority: "low" | "medium" | "high" | "critical";
  reason: string;
  time: string;
}

const priorityStyles = {
  low: { bg: "bg-success/10", text: "text-success", border: "border-success/30" },
  medium: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" },
  high: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" },
  critical: { bg: "bg-destructive/20", text: "text-destructive", border: "border-destructive/50" },
};

export function AlertsOverview() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/alerts');
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
    <div className="rounded-xl border border-destructive/20 bg-card">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Active Alerts</h3>
            <p className="text-sm text-muted-foreground">{alerts.length} requiring attention</p>
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
          <div className="p-8 text-center text-muted-foreground">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No active alerts.
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={cn(
                "flex items-center justify-between p-4 hover:bg-muted/30 transition-colors",
                alert.priority === "critical" && "bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.studentName}</p>
                  <p className="text-xs text-muted-foreground">Class {alert.className} • {alert.time}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs text-muted-foreground max-w-40 truncate">
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
