"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

/* ── Badge data ── */
const badges = [
  {
    id: 1,
    title: "Calm Champion",
    description: '" Earn it by practicing calming exercises regularly "',
    bg: "linear-gradient(145deg, #5ce65c, #22c022)",
    shadow: "rgba(72,210,72,0.45)",
    
    // Replace with your image path
    imageSrc: "/Wellness/1.svg",
    imageAlt: "Calm Champion badge",
  },
  {
    id: 2,
    title: "Expressive Mind",
    description: '" Unlock it by sharing your feelings through mood check-ins "',
    bg: "linear-gradient(145deg, #8b5cf6, #6d28d9)",
    shadow: "rgba(139,92,246,0.45)",
    imageSrc: "/Wellness/2.svg",
    imageAlt: "Expressive Mind badge",
  },
  {
    id: 3,
    title: "Mindful Learner",
    description: '" Achieve it by exploring tools and learning resources "',
    bg: "linear-gradient(145deg, #60a5fa, #3b82f6)",
    shadow: "rgba(96,165,250,0.45)",
    imageSrc: "/Wellness/3.svg",
    imageAlt: "Mindful Learner badge",
  },
  {
    id: 4,
    title: "Consistency King",
    description: '" Earn it by checking in daily and keeping your streak "',
    bg: "linear-gradient(145deg, #f472b6, #db2777)",
    shadow: "rgba(244,114,182,0.45)",
    imageSrc: "/Wellness/4.svg",
    imageAlt: "Consistency King badge",
  },
];

/* ── Sparkle icon for CTA ── */
const SparkleIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 mx-auto mb-4">
    <path d="M20 4 L22 16 L34 18 L22 20 L20 32 L18 20 L6 18 L18 16 Z" fill="white" opacity="0.9" />
    <path d="M32 6 L33 11 L38 12 L33 13 L32 18 L31 13 L26 12 L31 11 Z" fill="white" opacity="0.65" />
  </svg>
);

export default function WellnessSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "linear-gradient(160deg, #eef4ff 0%, #e8f0ff 50%, #dde8ff 100%)" }}
    >
      {/* ── Top heading ── */}
      <div
        className="text-center mb-14"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity .7s ease, transform .7s ease",
        }}
      >
        <h2
          className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3"
        >
          Wellness is a Journey - Let&apos;s Make It Fun.
        </h2>
        <p className="text-slate-500 text-sm sm:text-base">
          Earn badges and rewards for self-awareness and consistency
        </p>
      </div>

      {/* ── Badge grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 mb-20 w-full max-w-5xl">
        {badges.map((badge, i) => (
          <BadgeCard key={badge.id} badge={badge} visible={visible} delay={i * 120} />
        ))}
      </div>

      {/* ── CTA banner ── */}
      <div
        className="w-full max-w-7xl rounded-[24px] px-8 py-14 text-center relative overflow-hidden bg-gradient-to-r
      from-[#0BA0EA]
      via-[#48C2FF]
      to-[#0BA0EA] "
        style={{
          // background: "linear-gradient(135deg, #38c8f0 0%, #22aaee 40%, #2090e8 100%)",
          boxShadow: "0 20px 60px rgba(34,170,238,0.35)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(32px)",
          transition: "opacity .9s ease .4s, transform .9s ease .4s",
        }}
      >
        {/* decorative circles */}
        
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #ffffff, transparent)" }} />
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #ffffff, transparent)" }} />
        <div className="absolute bottom-4 left-6 w-6 h-6 rounded-full opacity-20 bg-white" />
        <div className="absolute top-8 right-10 w-4 h-4 rounded-full opacity-20 bg-white" />
        
        <SparkleIcon/>

        <h3
          className="text-2xl sm:text-[32px] font-semibold text-white mb-4"
        >
          Start Your Wellness Journey Today
        </h3>
        <p className="text-white text-sm sm:text-[16px] mb-2 max-w-3xl mx-auto leading-relaxed">
          Every check-in, every lesson, every moment of reflection counts towards a healthier, happier you.
        </p>
        <p className="text-white text-sm sm:text-[16px] mb-8">
          Let&apos;s unlock your potential together.
        </p>

        <button className="bg-white text-sky-500 font-medium px-8 py-3 rounded-[24px] text-sm sm:text-[16px] drop-shadow-xl drop-shadow-[#096DB24A] hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
          Explore Now
        </button>
      </div>
    </section>
  );
}

/* ── Badge card ── */
function BadgeCard({
  badge,
  visible,
  delay,
}: {
  badge: (typeof badges)[0];
  visible: boolean;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col items-center text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`,
      }}
    >
      {/* Icon tile with image */}
      <div
        className="w-[100px] h-[100px] sm:w-[200px] sm:h-[176px] rounded-[24px] flex items-center justify-center mb-4 cursor-pointer relative overflow-hidden"
        style={{
          // background: badge.bg,
          // boxShadow: hovered
          //   ? `0 16px 36px ${badge.shadow}, 0 2px 8px rgba(0,0,0,.1)`
          //   : `0 6px 20px ${badge.shadow}`,
          transform: hovered ? "translateY(-6px) scale(1.06)" : "translateY(0) scale(1)",
          transition: "box-shadow .3s ease, transform .3s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Image
          src={badge.imageSrc}
          alt={badge.imageAlt}
          fill
          className="object-contain "
        />
      </div>

      {/* Title */}
      <p className="font-medium text-[#2F3D43] text-sm sm:text-[20px] mt-2 mb-1">
        {badge.title}
      </p>

      {/* Description */}
      <p className="text-[#686D70] text-xs sm:text-[14px] max-w-[172px] leading-relaxed italic">
        {badge.description}
      </p>
    </div>
  );
}