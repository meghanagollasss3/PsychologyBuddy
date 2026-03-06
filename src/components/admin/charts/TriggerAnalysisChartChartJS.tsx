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
        titleColor: '#ffffff',
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
    labels: cleaned.map(item => item.trigger),
    datasets: [
      {
        data: cleaned.map(item => item.count),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  // Empty state when no data
  if (!hasValid) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">Emotional Triggers</h3>
          <p className="text-sm text-muted-foreground">
            Most common triggers this {timeRange}
          </p>
        </div>

        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground mb-2">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">No trigger data available</p>
            <p className="text-muted-foreground text-xs mt-1">
              Students haven't reported any emotional triggers in this time period
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Emotional Triggers</h3>
        <p className="text-sm text-muted-foreground">
          Most common triggers this {timeRange}
          {totalReports > 0 && ` (${totalReports} reports)`}
        </p>
      </div>

      <div className="h-80">
        <Bar options={options} data={chartDataFormatted} />
      </div>
    </div>
  );
}
