"use client";

import { useState, useEffect, useRef } from "react";
import { Wind, Play } from "lucide-react";

/* --------------------------------------------------
   PHASE LABELS
-------------------------------------------------- */
const phaseLabels = {
  inhale: "Inhale...",
  hold: "Hold...",
  exhale: "Exhale...",
  idle: "Take a Breath",
} as const;

type Phase = keyof typeof phaseLabels;

export default function ExerciseCard() {
  const [isBreathing, setIsBreathing] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [scale, setScale] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* --------------------------------------------------
     RUN ONE FULL 4–7–8 BREATHING CYCLE
  -------------------------------------------------- */
  const runCycle = () => {
    setPhase("inhale");
    setScale(1.18);

    timerRef.current = setTimeout(() => {
      setPhase("hold");
      timerRef.current = setTimeout(() => {
        setPhase("exhale");
        setScale(1);

        timerRef.current = setTimeout(() => {
          runCycle(); // Loop
        }, 8000);
      }, 7000);
    }, 4000);
  };

  /* --------------------------------------------------
     START / STOP
  -------------------------------------------------- */
  const handleStart = () => {
    const stop = () => {
      setIsBreathing(false);
      setPhase("idle");
      setScale(1);
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    if (isBreathing) return stop();

    setIsBreathing(true);
    runCycle();
  };

  /* --------------------------------------------------
     CLEANUP
  -------------------------------------------------- */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  return (
    <div
      className="
        w-auto 
        rounded-[16px] p-10
        bg-gradient-to-br from-[#e1caff]/50 to-[#f6efff]/50
        shadow-[0_4px_24px_rgba(120,80,220,0.10)]
        flex flex-col items-center 
        select-none
        backdrop-blur-xl
        border-2 border-white/40
      "
    >
      {/* Header */}
      <div className="w-full flex items-center gap-2 mb-6">
        <Wind className="w-5 h-5 text-[#8038B1]" />
        <span className="text-[15px] font-bold text-[#8038B1]">
          Today’s Exercise: Deep Breathing
        </span>
      </div>

      {/* Breathing Visual */}
      <div className="relative w-[239px] h-[239px] flex items-center justify-center mb-6">
        {/* Outer Glow Ring */}
        <div
          className="
            absolute rounded-full bg-[#e2d6ffb8]
            transition-transform
          "
          style={{
            width: 219,
            height: 219,
            transform: `scale(${isBreathing ? scale * 1.08 : 1})`,
            transitionDuration:
              phase === "inhale" ? "4000ms" : phase === "exhale" ? "8000ms" : "400ms",
          }}
        />

        {/* Mid Ring */}
        <div
          className="
            absolute rounded-full bg-[#DACDFF]
            transition-transform
          "
          style={{
            width: 191,
            height: 191,
            transform: `scale(${isBreathing ? scale * 1.05 : 1})`,
            transitionDuration:
              phase === "inhale" ? "4000ms" : phase === "exhale" ? "8000ms" : "400ms",
          }}
        />
        <div
          className="
            absolute rounded-full bg-gradient-to-br from-[#B475EB] to-[#7994F2]
            transition-transform
          "
          style={{
            width: 156,
            height: 156,
            transform: `scale(${isBreathing ? scale * 1.05 : 1})`,
            transitionDuration:
              phase === "inhale" ? "4000ms" : phase === "exhale" ? "8000ms" : "400ms",
          }}
        />

        {/* Main Circle */}
        <div
          className="
            absolute rounded-full
            flex items-center justify-center text-white font-semibold text-[18px]
            shadow-[0_8px_32px_rgba(139,92,246,0.45)]
            bg-gradient-to-br from-[#C97AFF] to-[#85B2FF]
            z-10 transition-transform
          "
          style={{
            width: 135,
            height: 135,
            transform: `scale(${isBreathing ? scale : 1})`,
            transitionDuration:
              phase === "inhale" ? "4000ms" : phase === "exhale" ? "8000ms" : "400ms",
          }}
        >
          {phaseLabels[phase]}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-[20px] font-semibold text-[#8038B1] tracking-wide mb-1">
        4-7-8 Breathing
      </h2>

      {/* Subtitle */}
      <p className="text-[16px] text-[#7C7C7C] text-center mb-6">
        Follow the circle's rhythm. You're doing great.
      </p>

      {/* CTA Button */}
      <button
        onClick={handleStart}
        className="
          flex items-center gap-2
          bg-gradient-to-r from-[#BC6EFF] to-[#6A8FFC]
          text-white font-medium 
          rounded-[16px] px-10 py-3 text-[15px]
          drop-shadow-[0_4px_16px_rgba(124,58,237,0.35)]
          transition active:scale-95 hover:opacity-90
        "
      >
        <Play className="w-4 h-4" />
        {isBreathing ? "Stop Breathing" : "Start Breathing"}
      </button>
    </div>
  );
}