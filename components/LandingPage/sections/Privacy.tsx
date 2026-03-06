"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Shield } from "lucide-react";

const features = [
  {
    id: 1,
    title: "Always Supported",
    imageSrc: "/Privacy/1.svg",
    imageAlt: "Calm Champion badge",
    description:
      "24/7 AI support to help manage your wellbeing, with timely alerts shared with your school support team when needed.",
  },
  {
    id: 2,
    title: "Privacy First",
    imageSrc: "/Privacy/2.svg",
    imageAlt: "Calm Champion badge",
    description:
      "Your thoughts stay private. School teams can see only overall trends,never your chats or journal entries. Personal data is never shared with third parties.",
  },
  {
    id: 3,
    title: "Expert-Designed",
    imageSrc: "/Privacy/3.svg",
    imageAlt: "Calm Champion badge",
    description:
      "Built with schools and psychologists to protect student well-being. Every feature is reviewed by mental health professionals.",
  },
];

const Icon = ({ type }: { type: number }) => {
  if (type === 1)
    return (
      <svg viewBox="0 0 36 36" className="w-6 h-6">
        <path
          d="M18 4C11.3 4 6 9.3 6 16v3a4 4 0 0 0 4 4h1v-7H8a10 10 0 0 1 20 0h-3v7h1a4 4 0 0 0 4-4v-3c0-6.7-5.3-12-12-12Z"
          fill="#3B9EF0"
        />
      </svg>
    );

  if (type === 2)
    return (
      <svg viewBox="0 0 36 36" className="w-6 h-6">
        <rect x="8" y="16" width="20" height="14" rx="3" fill="#3B9EF0" />
        <path
          d="M12 16v-4a6 6 0 1 1 12 0v4"
          stroke="#3B9EF0"
          strokeWidth="2"
        />
      </svg>
    );

  return (
    <svg viewBox="0 0 36 36" className="w-6 h-6">
      <path
        d="M18 3L30 8v9c0 7-5.4 13.5-12 15C9.4 30.5 6 24 6 17V8Z"
        stroke="#3B9EF0"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 18l4 4 8-8"
        stroke="#3B9EF0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default function TrustSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );

    if (ref.current) obs.observe(ref.current);

    return () => obs.disconnect();
  }, []);

  const fade = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(30px)",
    transition: `all .7s ease ${delay}ms`,
  });

  return (
    <section
      ref={ref}
      className="relative py-24 px-6 bg-[#F3FAFE] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-16" style={fade()}>
          <div className="inline-flex items-center bg-white px-4 py-2 rounded-full border mb-5 drop-shadow-xl text-[12px] text-[#3A3A3A]">
            <Shield className="w-[12px] h-[14px] text-[#1FA1E2]"></Shield>
            Safe. Private. Supported.
          </div>

          <h2 className="text-[40px] font-semibold text-[#2F3D43]">
            Your Trust is Our Priority
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-6">

          {/* Illustration */}
          <div className="w-full lg:w-[620px]" style={fade(200)}>
            <Image
              src="/LandingPage/1.svg"
              alt="Laptop security"
              width={674.4769287109375}
              height={440.00042724609375}
              className="object-contain"
            />
          </div>

          {/* Cards */}
          <div className="relative w-full lg:w-[320px] flex flex-col gap-6">

            {/* Card 1 */}
            <Card feature={features[0]} icon={1} delay={300} />

            {/* Card 2 */}
            <Card feature={features[1]} icon={2} delay={400} />

            {/* Floating Card */}
            <div className="lg:absolute lg:-right-90 w-[320px] lg:top-1/2 lg:-translate-y-1/2">
              <Card feature={features[2]} icon={3} delay={500} />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

function Card({
  feature,
  icon,
  delay,
}: {
  feature: any;
  icon: number;
  delay: number;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        transition: "all .25s ease",
        boxShadow: hover
          ? "0 12px 40px rgba(0,0,0,0.08)"
          : "0 4px 18px rgba(0,0,0,0.05)",
      }}
      className="bg-[#FFFFFF1A] rounded-2xl p-6 text-center w-[337px] h-[236.8009490966797px] border-1 border-[#E2E2E2] drop-shadow-2xl drop-shadow-[#0980D226]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="w-[54px] h-[49px] flex items-center justify-center rounded-xl bg-[#FFFFFF1A] mx-auto mb-3">
<Image
          src={feature.imageSrc}
          alt={feature.imageAlt}
          width={54}
          height={49}
          className="object-contain "
        />      </div>

      <h3 className="font-medium text-[21px] text-[#2F3D43] mb-2">
        {feature.title}
      </h3>

      <p className="text-[14px] text-[#686D70] leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}