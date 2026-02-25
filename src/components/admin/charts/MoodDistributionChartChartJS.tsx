"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Margarine } from 'next/font/google';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MoodData {
  name: string;
  value: number;
  color: string;
  count: number;
}

interface MoodDistributionChartProps {
  data: MoodData[];
  totalCheckins: number;
  dominantMood: MoodData | null;
}

export function MoodDistributionChart({
  data,
  totalCheckins,
  dominantMood,
}: MoodDistributionChartProps) {
  // Sanitize incoming data
  const cleaned = (data ?? []).map((item) => {
    const name = typeof item?.name === "string" && item.name.trim() !== ""
      ? item.name : "Unknown";
    
    // Map mood names to consistent colors
    const colorMap: { [key: string]: string } = {
      "Happy": "hsl(142, 71%, 45%)",
      "Okay": "hsl(217, 91%, 60%)", 
      "Sad": "hsl(262, 83%, 58%)",
      "Anxious": "hsl(38, 92%, 50%)",
      "Tired": "hsl(0, 84%, 60%)"
    };
    
    return {
      name,
      value: isFinite(Number(item?.value)) && !isNaN(Number(item?.value))
        ? Number(item?.value) : 0,
      color: colorMap[name] || item?.color || "hsl(0, 0%, 50%)",
      count: isFinite(Number(item?.count)) && !isNaN(Number(item?.count))
        ? Number(item?.count) : 0,
    };
  });

  const hasValid = cleaned.length > 0 && cleaned.some((d) => d.value > 0);

  const fallback: MoodData[] = [
    { name: "Happy", value: 35, color: "#10b981", count: 12 },
    { name: "Okay", value: 25, color: "#3b82f6", count: 8 },
    { name: "Sad", value: 15, color: "#8b5cf6", count: 5 },
    { name: "Anxious", value: 15, color: "#f59e0b", count: 5 },
    { name: "Tired", value: 10, color: "#ef4444", count: 3 }
  ];

  const chartData = hasValid ? cleaned : fallback;
  const currentDominant = hasValid && dominantMood ? dominantMood : chartData[0];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1,
    
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#000000',
          font: {
            size: 14,
            weight: 500,
          },
          padding: 20,
          
          usePointStyle: true,
          pointStyle: 'rect' as const,
        },
        title: {
        display: true,
        text: " ",
        margin: { top: 30 }, // adjust 20–60 depending how low you want it
      },
      },
      
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#333333',
        bodyColor: '#333333',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 10,
        },
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}% (${chartData[context.dataIndex].count} check-ins)`;
          },
        },
      },
    },
    cutout: '47%',
    elements: {
      arc: {
        borderWidth: 6,
        borderColor: '#ffffff',
      },
    },
  };

  const chartDataFormatted = {
    labels: chartData.map(item => item.name),
    datasets: [
      {
        data: chartData.map(item => item.value),
        backgroundColor: chartData.map(item => item.color),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div className="rounded-xl border border-border bg-[#fffff] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Mood Distribution</h3>
        <p className="text-sm text-[#666666]">
          Today's emotional breakdown
          {/* {hasValid && totalCheckins > 0 ? ` (${totalCheckins} check-ins)` : ""}
          {!hasValid && <span className="text-xs ml-2">(Sample data)</span>} */}
        </p>
      </div>

      <div className="relative w-full h-71 mt-8">
        <Doughnut options={options} data={chartDataFormatted} />

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center mb-10 pointer-events-none">
          <div className="text-xl font-bold text-[#333333] mb-1">
            {currentDominant.name}
          </div>
          <div className="text-sm text-[#666666] font-medium">
            {currentDominant.value}%
          </div>
          {/* {hasValid && currentDominant.count > 0 && (
            <div className="text-xs text-[#666666] mt-1">
              {currentDominant.count} check-ins
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
