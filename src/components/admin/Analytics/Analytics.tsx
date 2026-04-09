"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/src/hooks/use-toast";
import { useAuth } from "@/src/contexts/AuthContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// -------------------- Chart.js Setup --------------------
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// -------------------- Dynamic Chart Loader --------------------
const LineChart = dynamic(() => import("react-chartjs-2").then((m) => m.Line), { ssr: false });
const BarChart = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), { ssr: false });
const DoughnutChart = dynamic(() => import("react-chartjs-2").then((m) => m.Doughnut), { ssr: false });

// -------------------- Main Page --------------------
export default function Analytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const analyticsRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Schools dropdown
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSchool, setSelectedSchool] = useState("all");

  // Data States
  const [weeklyMoodData, setWeeklyMoodData] = useState<Array<{ class: string; happy: number; okay: number; sad: number; anxious: number; tired: number; }>>([]);
  const [toolUsageData, setToolUsageData] = useState<Array<{ month: string; journaling: number; meditation: number; music: number; }>>([]);
  const [badgesStreaksData, setBadgesStreaksData] = useState<Array<{ week: string; badgesEarned: number; activeStreaks: number; }>>([]);
  const [sessionEngagementData, setSessionEngagementData] = useState<Array<{ month: string; sessions: number; checkIns: number; }>>([]);
  const [alertFrequencyData, setAlertFrequencyData] = useState<Array<{ week: string; healthy: number; alerts: number; }>>([]);
  const [error, setError] = useState("");

  // Mount Fix (Chart.js requires client-only)
  useEffect(() => setMounted(true), []);

  // -------------------- Fetch Schools --------------------
  const fetchSchools = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/schools");
      const data = await res.json();

      if (Array.isArray(data)) setSchools(data);
    } catch {
      setSchools([]);
    }
  }, []);

  // -------------------- Fetch Weekly Mood --------------------
  const fetchWeeklyMood = useCallback(async () => {
    try {
      setLoading(true);

      const schoolId =
        user?.role?.name === "ADMIN" || user?.role?.name === "SCHOOL_SUPERADMIN"
          ? user.school?.id
          : selectedSchool !== "all"
          ? selectedSchool
          : undefined;

      const url = schoolId
        ? `/api/admin/analytics/weekly-mood-distribution?weeks=4&schoolId=${schoolId}`
        : `/api/admin/analytics/weekly-mood-distribution?weeks=4`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) throw new Error();

      // fallback sample if empty
      if (!data.data.weeklyMoodData?.length) {
        setWeeklyMoodData([
          { class: "10-A", happy: 12, okay: 10, sad: 4, anxious: 5, tired: 2 },
          { class: "10-B", happy: 15, okay: 11, sad: 6, anxious: 4, tired: 3 },
          { class: "11-A", happy: 19, okay: 14, sad: 7, anxious: 6, tired: 4 },
        ]);
      } else setWeeklyMoodData(data.data.weeklyMoodData);

      setError("");
    } catch {
      setError("Failed to load mood data");
      toast({
        title: "Error",
        description: "Could not load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSchool, user]);

  // -------------------- Fetch Tool Usage --------------------
  const fetchToolUsage = useCallback(async () => {
    try {
      const schoolId =
        user?.role?.name === "ADMIN" || user?.role?.name === "SCHOOL_SUPERADMIN"
          ? user.school?.id
          : selectedSchool !== "all"
          ? selectedSchool
          : undefined;

      const url = schoolId
        ? `/api/admin/analytics/tool-usage?months=6&schoolId=${schoolId}`
        : `/api/admin/analytics/tool-usage?months=6`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.data.toolUsage) {
        setToolUsageData(data.data.toolUsage);
      }
    } catch {
      // Keep existing data or set to empty
      setToolUsageData([]);
    }
  }, [selectedSchool, user]);

  // -------------------- Fetch Badges & Streaks --------------------
  const fetchBadgesStreaks = useCallback(async () => {
    try {
      const schoolId =
        user?.role?.name === "ADMIN" || user?.role?.name === "SCHOOL_SUPERADMIN"
          ? user.school?.id
          : selectedSchool !== "all"
          ? selectedSchool
          : undefined;

      const url = schoolId
        ? `/api/admin/analytics/badges-streaks?weeks=6&schoolId=${schoolId}`
        : `/api/admin/analytics/badges-streaks?weeks=6`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.data.badgesStreaks) {
        setBadgesStreaksData(data.data.badgesStreaks);
      }
    } catch {
      // Keep existing data or set to empty
      setBadgesStreaksData([]);
    }
  }, [selectedSchool, user]);

  // -------------------- Fetch Session Engagement --------------------
  const fetchSessionEngagement = useCallback(async () => {
    try {
      const schoolId =
        user?.role?.name === "ADMIN" || user?.role?.name === "SCHOOL_SUPERADMIN"
          ? user.school?.id
          : selectedSchool !== "all"
          ? selectedSchool
          : undefined;

      const url = schoolId
        ? `/api/admin/analytics/session-engagement?months=6&schoolId=${schoolId}`
        : `/api/admin/analytics/session-engagement?months=6`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.data.sessionEngagement) {
        setSessionEngagementData(data.data.sessionEngagement);
      }
    } catch {
      // Keep existing data or set to empty
      setSessionEngagementData([]);
    }
  }, [selectedSchool, user]);

  // -------------------- Fetch Alert Frequency --------------------
  const fetchAlertFrequency = useCallback(async () => {
    try {
      const schoolId =
        user?.role?.name === "ADMIN" || user?.role?.name === "SCHOOL_SUPERADMIN"
          ? user.school?.id
          : selectedSchool !== "all"
          ? selectedSchool
          : undefined;

      const url = schoolId
        ? `/api/admin/analytics/alert-frequency?weeks=4&schoolId=${schoolId}`
        : `/api/admin/analytics/alert-frequency?weeks=4`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.data.alertFrequency) {
        setAlertFrequencyData(data.data.alertFrequency);
      }
    } catch {
      // Keep existing data or set to empty
      setAlertFrequencyData([]);
    }
  }, [selectedSchool, user]);

  // -------------------- Export Function --------------------
  const handleExport = async () => {
    if (!analyticsRef.current) {
      toast({
        title: "Error",
        description: "Unable to export analytics. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);
      
      // Capture the analytics content
      const canvas = await html2canvas(analyticsRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add title
      pdf.setFontSize(20);
      pdf.text('Analytics & Reports', 20, 20);
      
      // Add subtitle with date
      pdf.setFontSize(12);
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      pdf.text(`Generated on ${currentDate}`, 20, 30);
      
      // Add school filter info if applicable
      if (selectedSchool !== 'all' && schools.length > 0) {
        const schoolName = schools.find(s => s.id === selectedSchool)?.name || selectedSchool;
        pdf.text(`School: ${schoolName}`, 20, 40);
      }

      // Calculate image dimensions to fit PDF
      const pdfWidth = pdf.internal.pageSize.getWidth() - 40; // 20mm margin on each side
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 20, 50, pdfWidth, pdfHeight);
      
      // Save the PDF
      const fileName = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Success",
        description: "Analytics report exported successfully!",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // -------------------- Fetch Once --------------------
  useEffect(() => {
    if (!user) return;
    fetchSchools();
    fetchWeeklyMood();
    fetchToolUsage();
    fetchBadgesStreaks();
    fetchSessionEngagement();
    fetchAlertFrequency();
  }, [user, fetchSchools, fetchWeeklyMood, fetchToolUsage, fetchBadgesStreaks, fetchSessionEngagement, fetchAlertFrequency]);

  // -------------------- Memoized Chart Configs --------------------

  const weeklyMoodChart = useMemo(
    () => ({
      labels: weeklyMoodData.map((d) => d.class),
      datasets: [
        { label: "Happy", data: weeklyMoodData.map((d) => d.happy), backgroundColor: "#22c55e" },
        { label: "Okay", data: weeklyMoodData.map((d) => d.okay), backgroundColor: "#3c83f6" },
        { label: "Sad", data: weeklyMoodData.map((d) => d.sad), backgroundColor: "#7c3bed" },
        { label: "Anxious", data: weeklyMoodData.map((d) => d.anxious), backgroundColor: "#f59f0a" },
        { label: "Tired", data: weeklyMoodData.map((d) => d.tired), backgroundColor: "#ef4343" },
      ],
    }),
    [weeklyMoodData]
  );

  const toolUsageChart = useMemo(
    () => ({
      labels: toolUsageData.map((d) => {
        // Convert YYYY-MM to readable month format
        const date = new Date(d.month + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        { label: "Journaling", data: toolUsageData.map((d) => d.journaling), borderColor: "#3b82f6", tension: 0.4 },
        { label: "Meditation", data: toolUsageData.map((d) => d.meditation), borderColor: "#16a34a", tension: 0.4 },
        { label: "Music", data: toolUsageData.map((d) => d.music), borderColor: "#a855f7", tension: 0.4 },
      ],
    }),
    [toolUsageData]
  );

  const badgesChart = useMemo(
    () => ({
      labels: badgesStreaksData.map((d) => d.week),
      datasets: [
        {
          label: "Badges Earned",
          data: badgesStreaksData.map((d) => d.badgesEarned),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.3)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Active Streaks",
          data: badgesStreaksData.map((d) => d.activeStreaks),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.3)",
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    [badgesStreaksData]
  );

  const sessionChart = useMemo(
    () => ({
      labels: sessionEngagementData.map((d) => {
        // Convert YYYY-MM to readable month format
        const date = new Date(d.month + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        { label: "Sessions", data: sessionEngagementData.map((d) => d.sessions), borderColor: "#3b82f6", tension: 0.4, yAxisID: "y" },
        { label: "Check-ins", data: sessionEngagementData.map((d) => d.checkIns), borderColor: "#16a34a", tension: 0.4, yAxisID: "y1" },
      ],
    }),
    [sessionEngagementData]
  );

  const alertChart = useMemo(
    () => ({
      labels: alertFrequencyData.map((d) => d.week),
      datasets: [
        { label: "Healthy", data: alertFrequencyData.map((d) => d.healthy), backgroundColor: "#16a34a" },
        { label: "Alerts", data: alertFrequencyData.map((d) => d.alerts), backgroundColor: "#ef4444" },
      ],
    }),
    [alertFrequencyData]
  );

  // Early return for mount check
  if (!mounted) return null;

  // -------------------- UI --------------------
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Analytics & Reports"
        subtitle="Wellness insights and trends"
        showSchoolFilter={user?.role?.name === "SUPERADMIN"}
        schoolFilterValue={selectedSchool}
        showTimeFilter={true}
        onSchoolFilterChange={setSelectedSchool}
        schools={schools}
        actions={
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleExport}
            disabled={isExporting || loading}
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        }
      />

      <div ref={analyticsRef} className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">

        {/* Mood Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Mood Distribution</CardTitle>
            <CardDescription>Last 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading...
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  {error}
                </div>
              ) : (
                <BarChart
                  data={weeklyMoodChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { 
                      y: { 
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                          color: '#64748b',
                          font: {
                            size: 12
                          }
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: '#64748b',
                          font: {
                            size: 12
                          }
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          usePointStyle: false,
                          padding: 20,
                          color: '#475569',
                          font: {
                            size: 12
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: {
                          size: 14
                        },
                        bodyFont: {
                          size: 12
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tool Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Tool Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <LineChart
                data={toolUsageChart}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        color: '#64748b',
                        font: {
                          size: 12
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: '#64748b',
                        font: {
                          size: 12
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        color: '#475569',
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      cornerRadius: 8,
                      titleFont: {
                        size: 14
                      },
                      bodyFont: {
                        size: 12
                      }
                    }
                  },
                  elements: {
                    line: {
                      tension: 0.4,
                      borderWidth: 2
                    },
                    point: {
                      radius: 4,
                      hoverRadius: 6
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges & Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <LineChart
                data={badgesChart}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        color: '#64748b',
                        font: {
                          size: 12
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: '#64748b',
                        font: {
                          size: 12
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        color: '#475569',
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      cornerRadius: 8,
                      titleFont: {
                        size: 14
                      },
                      bodyFont: {
                        size: 12
                      }
                    }
                  },
                  elements: {
                    line: {
                      tension: 0.4,
                      borderWidth: 2
                    },
                    point: {
                      radius: 4,
                      hoverRadius: 6
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Session Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <LineChart
                data={sessionChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { 
                      beginAtZero: true, 
                      type: "linear", 
                      position: "left",
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        color: '#64748b',
                        font: {
                          size: 12
                        }
                      }
                    },
                    y1: {
                      beginAtZero: true,
                      type: "linear",
                      position: "right",
                      grid: { drawOnChartArea: false },
                      ticks: {
                        color: '#64748b',
                        font: {
                          size: 12
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: '#64748b',
                        font: {
                          size: 12
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        color: '#475569',
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      cornerRadius: 8,
                      titleFont: {
                        size: 14
                      },
                      bodyFont: {
                        size: 12
                      }
                    }
                  },
                  elements: {
                    line: {
                      tension: 0.4,
                      borderWidth: 2
                    },
                    point: {
                      radius: 4,
                      hoverRadius: 6
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <BarChart
                data={alertChart}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        color: '#64748b',
                        font: {
                          size: 12
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: '#64748b',
                        font: {
                          size: 12
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        color: '#475569',
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      cornerRadius: 8,
                      titleFont: {
                        size: 14
                      },
                      bodyFont: {
                        size: 12
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
