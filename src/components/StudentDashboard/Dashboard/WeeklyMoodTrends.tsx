"use client";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useMemo, useState } from "react";
import { Smile } from "lucide-react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend);

/* -------------------------
   TYPES
------------------------- */
interface MoodData {
  day: string;
  moodScore: number;
  hasData: boolean;
}

interface MoodTrendsResponse {
  weeklyData: MoodData[];
  totalCheckins: number;
  averageMood: number;
}

/* -------------------------
   API FETCHER
------------------------- */
async function fetchMoodTrends(): Promise<MoodTrendsResponse> {
  const res = await fetch("/api/student/mood-trends");
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch mood trends");
  return json.data;
}

/* -------------------------
   EMOJI HELPERS
------------------------- */
function getMoodEmoji(score: number) {
  const map: any = {
    1: { img: "/Summary/Angry.svg" },
    2: { img: "/Summary/Sad.svg" },
    3: { img: "/Summary/Worry.svg" },
    4: { img: "/Summary/Okay.svg" },
    5: { img: "/Summary/Happy1.svg" },
  };
  return map[score] || map[3];
}

function getMoodName(score: number) {
  return ["Unknown", "Anxious", "Sad", "Okay", "Tired", "Happy"][score] || "Unknown";
}

/* -------------------------
   STABLE GRADIENT PLUGIN
------------------------- */
const blueGradientPlugin = {
  id: "blueGradient",
  beforeDatasetsDraw(chart: any) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    if (!chart._blueGradient) {
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

      // ⭐ 3-COLOR GRADIENT: #68A1FD → #A6C8FF → white
      gradient.addColorStop(0, "rgba(104,161,253,1)");    // #68A1FD
      gradient.addColorStop(0.5, "rgba(166,200,255,1)");  // #A6C8FF (middle)
      gradient.addColorStop(1, "rgba(255,255,255,1)");    // white (bottom)

      chart._blueGradient = gradient;
    }

    const dataset = chart.data.datasets[0];
    const flags: boolean[] = dataset.hasDataFlags || [];

    dataset.backgroundColor = dataset.data.map((_: any, i: number) =>
      flags[i] ? chart._blueGradient : "rgba(229,231,235,0.35)"
    );
  },
};





/* -------------------------
   NO TEXT PLUGIN
------------------------- */
const noTextPlugin = {
  id: "noText",
  beforeDraw(chart: any) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
  afterDraw(chart: any) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.restore();
  }
};

/* -------------------------
   MAIN COMPONENT
------------------------- */
export default function WeeklyMoodTrends() {
  const chartRef = useRef<any>(null);
  const [positions, setPositions] = useState<
    { x: number; y: number; img: string; key: string }[]
  >([]);
  const [barThickness, setBarThickness] = useState(40);

  // Update bar thickness based on screen size
  useEffect(() => {
    const updateThickness = () => {
      const width = window.innerWidth;
      const thickness = width < 640 ? 30 : width < 1024 ? 35 : 45;
      setBarThickness(thickness);
    };

    updateThickness();
    window.addEventListener('resize', updateThickness);
    
    return () => {
      window.removeEventListener('resize', updateThickness);
    };
  }, []);

  /* Query */
  const { data, isLoading, isError } = useQuery({
    queryKey: ["moodTrends"],
    queryFn: fetchMoodTrends,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  /* -------------------------
     UPDATE EMOJI POSITIONS
  ------------------------- */
  const updateEmojiPositions = () => {
    const chart = chartRef.current;
    if (!chart || !data) return;

    const meta = chart.getDatasetMeta(0);
    const next: any[] = [];

    data.weeklyData.forEach((d, i) => {
      if (!d.hasData || d.moodScore === 0) return;
      const bar = meta.data[i];
      if (!bar) return;

      next.push({
        x: bar.x,
        y: bar.y,
        img: getMoodEmoji(d.moodScore).img,
        key: `${i}-${d.moodScore}`,
      });
    });

    setPositions(next);
  };

  /* Delay-to-layout fix (prevents wrong coords) */
  useEffect(() => {
    if (!data) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(updateEmojiPositions); // 2-frame layout stabilization
    });
  }, [data]);

  /* -------------------------
     CHART DATA
  ------------------------- */
  const chartData = useMemo(
    () => ({
      labels:
        data?.weeklyData.map((d) => d.day) || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      datasets: [
        {
          data: data?.weeklyData.map((d) => d.moodScore) || Array(7).fill(0),
          hasDataFlags: data?.weeklyData.map((d) => d.hasData) || Array(7).fill(false),
          borderRadius: 24,

          borderWidth:2,
          borderColor:"#ffffff",
          
          barThickness: barThickness,
          borderSkipped: "bottom" as const,
        } as any,
      ],
    }),
    [data, barThickness]
  );

  /* -------------------------
     CHART OPTIONS (Optimized)
  ------------------------- */
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 0,

      // parsing disabled - not needed for this chart
      animation: {
        onComplete: updateEmojiPositions,
      },

      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          ticks: { display: false },
          grid: { display: false },
          border: { display: false },
        },
        x: {
          type: 'category' as const,
          offset: true, // prevents overlap with bars
          ticks: {
            padding: 6,
            font: { size: 10, family: 'Inter' },
            color: "#585858",
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
          },
          grid: { display: false },
          border: { display: false },
        },
      },

      plugins: {
        legend: { display: false },
        title: { display: false },
        subtitle: { display: false },
        datalabels: { display: false },
        tooltip: {
          enabled: false,
        },
      },
      // Ensure consistent sizing
      onResize: (chart: any) => {
        chart.update('none');
      },
    } as any), // Type assertion to bypass strict Chart.js typing
    [updateEmojiPositions]
  );

  /* -------------------------
     LOADING UI
  ------------------------- */
  if (isLoading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white shadow-sm border h-[240px] sm:h-[280px] animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-[200px] bg-gray-100 rounded-xl" />
      </div>
    );
  }

  /* -------------------------
     ERROR UI
  ------------------------- */
  if (isError || !data) {
    return (
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white shadow-sm border h-[240px] sm:h-[280px] flex items-center justify-center">
        <p className="text-sm text-gray-500">Failed to load mood trends</p>
      </div>
    );
  }

  /* -------------------------
     MAIN UI
  ------------------------- */
  return (
    <div className="relative rounded-[12px] sm:rounded-[15px] p-4 sm:p-6 bg-white drop-shadow-sm drop-shadow-[#65656514] shadow-inner-xl border border-[#ffffff] h-auto w-full max-w-[600px] mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <Smile className="h-[16px] w-[16px] sm:h-[20px] sm:w-[20px] text-[#1C76DC]" />
          <span className="text-[16px] sm:text-[18px] md:text-[20px] font-semibold text-[#2F3D43]">
            Weekly Mood Trends
          </span>
        </div>
        <div className="text-[10px] sm:text-xs text-gray-400">
          {data.totalCheckins} check-ins • Avg: {data.averageMood.toFixed(1)}/5
        </div>
      </div>

      {/* Chart + emoji */}
      <div className="relative h-[180px] sm:h-[220px] md:h-[250px] lg:h-[285px]">
        <Bar 
          key={`mood-chart-${data?.weeklyData.length || 0}`}
          ref={chartRef} 
          data={chartData} 
          options={options} 
          plugins={[blueGradientPlugin]} 
        />

        {/* Emoji overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {positions.map((p) => (
            <img
              key={p.key}
              src={p.img}
              className="absolute w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] md:w-[28px] md:h-[28px] lg:w-[32px] lg:h-[32px] select-none"
              style={{
                left: p.x,
                top: p.y,
                transform: "translate(-50%, 30%)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}