"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TriggerData {
  trigger: string;
  count: number;
}

interface TriggerAnalysisChartProps {
  data: TriggerData[];
  totalReports: number;
  timeRange: string;
}

export function TriggerAnalysisChart({
  data,
  totalReports,
  timeRange,
}: TriggerAnalysisChartProps) {
  // Sanitize incoming data
  const cleaned = (data ?? []).map((item) => {
    const count = Number(item?.count);
    return {
      trigger: typeof item?.trigger === "string" && item.trigger.trim() !== ""
        ? item.trigger : "Unknown",
      count: isFinite(count) && !isNaN(count) ? count : 0,
    };
  });

  const hasValid = cleaned.length > 0 && cleaned.some((d) => d.count > 0);

  const fallback: TriggerData[] = [
    { trigger: "Friends", count: 145 },
    { trigger: "Exams", count: 124 },
    { trigger: "Family & Social", count: 98 },
    { trigger: "Sleep", count: 89 },
    { trigger: "School Work", count: 76 },
    { trigger: "Others", count: 45 },
  ];

  const chartData = hasValid ? cleaned : fallback;

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(var(--card))',
        titleColor: 'hsl(var(--foreground))',
        bodyColor: 'hsl(var(--foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: (context: any) => context[0].label,
          label: (context: any) => `${context.parsed.x} Reports`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 160,
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.2)',
          drawBorder: false,
          borderDash: [2, 4],
        },
        ticks: {
          color: '#333333',
          font: {
            size: 12,
          },
          padding: 8,
          stepSize: 40,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#333333',
          font: {
            size: 12,
            weight: 500,
          },
          padding: 8,
        },
      },
    },
  };

  const chartDataFormatted = {
    labels: chartData.map(item => item.trigger),
    datasets: [
      {
        data: chartData.map(item => item.count),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Emotional Triggers</h3>
        <p className="text-sm text-muted-foreground">
          Most common triggers this {timeRange}
          {hasValid && totalReports > 0 ? ` (${totalReports} reports)` : ""}
          {!hasValid && <span className="text-xs ml-2">(Sample data)</span>}
        </p>
      </div>

      <div className="h-80">
        <Bar options={options} data={chartDataFormatted} />
      </div>
    </div>
  );
}
