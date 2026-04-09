"use client";

import React, { useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { Brain, Lightbulb, Smile, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Center text plugin (for pie/doughnut)
const centerTextPlugin = {
  id: "centerText",
  afterDraw: (chart: any) => {
    if (chart.config.type !== "pie" && chart.config.type !== "doughnut") return;

    const { ctx, chartArea } = chart;

    const dataset = chart.data.datasets[0];
    const labels = chart.data.labels;

    if (!dataset || !labels) return;

    // Find max value
    let maxIndex = 0;
    let maxValue = 0;

    dataset.data.forEach((val: number, i: number) => {
      if (val > maxValue) {
        maxValue = val;
        maxIndex = i;
      }
    });

    const percentageText = `${maxValue}%`;
    const labelText = labels[maxIndex];

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#686D70"; // ⭐ NOW COLOR WORKS

    // Main value
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText(percentageText, centerX, centerY - 5);

    // Label name
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(labelText, centerX, centerY + 15);

    ctx.restore();
  },
};

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  centerTextPlugin
);

interface EmotionalPatternData {
  trigger: string;
  count: number;
  percentage: number;
}

interface EmotionalPatternsResponse {
  triggerPatterns: EmotionalPatternData[];
  insights: {
    primary: string;
    secondary: string;
    recommendation: string;
  };
}

// API
async function fetchEmotionalPatterns(
  timeRange: string
): Promise<EmotionalPatternsResponse> {
  const res = await fetch(
    `/api/student/emotional-patterns?timeRange=${timeRange}`
  );
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch emotional patterns");
  return json.data;
}

export default function EmotionalPatterns() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["emotionalPatterns", "month"],
    queryFn: () => fetchEmotionalPatterns("month"),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl p-4 sm:p-5 border bg-white shadow-sm w-full animate-pulse h-[380px] sm:h-[420px]" />
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl p-4 sm:p-5 border bg-white shadow-sm">
        <p className="text-sm text-gray-500">Failed to load emotional patterns.</p>
      </div>
    );
  }

  if (data.triggerPatterns.length === 0) {
    return (
      <div className="rounded-2xl p-4 sm:p-5 border bg-white shadow-sm">
        <p className="text-sm text-gray-500 mb-3">No emotional trigger data.</p>
      </div>
    );
  }

  // Chart Data
  const triggerChartData = {
    labels: data.triggerPatterns.map((p) => p.trigger),
    datasets: [
      {
        label: "Triggers",
        data: data.triggerPatterns.map((p) => p.percentage),
        backgroundColor: [
          "#62A6FF",
          "#A078E4",
          "#45CB88",
          "#FE9A35",
          "#ABABAB",
          "#d75858ff",
          "#adf451ff",
          "#1d56a1ff",
        ],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  // Disable default legend
  const triggerChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="rounded-[12px] sm:rounded-[14px] md:rounded-[16px] p-6 sm:p-8 md:p-10 border-2 border-white bg-gradient-to-r from-[#FDFCFF] to-[#F6F1FF] shadow-sm w-full max-w-[600px] mx-auto md:max-w-full lg:max-w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 sm:mb-7 md:mb-9">
        <Smile className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-[#2F3D43]" />
        <h3 className="text-[16px] sm:text-[18px] md:text-[20px] font-semibold text-[#2F3D43]">
          Emotional Patterns
        </h3>
      </div>

      {/* PIE + LEGEND (SIDE BY SIDE) */}
      <div className="flex items-center justify-between gap-4 sm:gap-6 md:gap-8 mb-6">
        {/* PIE CHART */}
        <div className="h-[180px] w-[180px] sm:h-[200px] sm:w-[200px] md:h-[220px] md:w-[220px] lg:h-[234px] lg:w-[234px] flex-shrink-0">
          <Pie data={triggerChartData} options={triggerChartOptions} />
        </div>

        {/* CUSTOM LEGEND */}
        <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-w-0">
          {data.triggerPatterns.map((item, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3">
              {/* Color dot */}
              <div
                className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    triggerChartData.datasets[0].backgroundColor[i],
                }}
              ></div>

              <span className="text-[13px] sm:text-[14px] md:text-[15px] text-[#686D70] flex-1 min-w-0 truncate">
                {item.trigger}
              </span>

              <span className="text-[13px] sm:text-[14px] md:text-[15px] text-[#686D70] font-medium flex-shrink-0">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* INSIGHTS */}
      <div className="rounded-[10px] sm:rounded-[12px] p-3 sm:p-4 border border-[#B3EEC0] shadow-sm bg-gradient-to-l from-[#EAFFF2] to-[#DCFFE9]">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-[#3A3A3A]" />
          <h3 className="text-[13px] sm:text-[14px] md:text-[16px] font-semibold text-[#3A3A3A]">Monthly Insight</h3>
        </div>

        <p className="text-[11px] sm:text-xs md:text-sm text-gray-700 leading-relaxed">
          {data.insights.primary}
        </p>

        {data.insights.secondary && (
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-700 leading-relaxed mt-1">
            {data.insights.secondary}
          </p>
        )}

        <div className="mt-3 border-t border-green-200 pt-2">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-green-600 mt-0.5" />
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-700 leading-relaxed">
              <span className="font-medium">Recommendation:</span>{" "}
              {data.insights.recommendation}
            </p>
          </div>
        </div>

        <p className="text-[9px] sm:text-xs text-gray-500 mt-2">
          Based on your monthly check-ins
        </p>
      </div>
    </div>
  );
}