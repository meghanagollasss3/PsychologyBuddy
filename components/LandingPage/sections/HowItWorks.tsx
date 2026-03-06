"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const steps = [
  {
    key: "chooseMood",
    label: "Choose Mood",
    sublabel: "Step 1",
    image: "/HIW/11.png",
    className: "-ml-20 -mt-28 w-[400px] h-[250px]",
    gradient: "from-blue-100/60 to-blue-50/20",
    description: "Choose your mood in seconds no pressure, just honesty",
  },
  {
    key: "aiSupport",
    label: "AI Support",
    sublabel: "Step 2",
    image: "/HIW/2.svg",
    className: "-ml-19 -mt-39 w-[400px] h-[250px]",
    gradient: "from-green-100/60 to-green-50/20",
    description: "Psychology buddy helps you understand why you feel that way",
  },
  {
    key: "learnGrow",
    label: "Learn & Grow",
    sublabel: "Step 3",
    image: "/HIW/3.svg",
    className: "-ml-25 -mt-38 w-[400px] h-[250px]",
    gradient: "from-amber-100/60 to-amber-50/20",
    description: "Learn through Mind Space lessons and earn badges",
  },
  {
    key: "expertHelp",
    label: "Get Expert Help",
    sublabel: "Step 4",
    image: "/HIW/4.svg",
    className: "-ml-22.5 -mt-35 w-[400px] h-[250px]",
    gradient: "from-pink-100/60 to-pink-50/20",
    description: "In cases requiring further support, alerts enable school administrators to respond.",
  },
];

const HowItWorks = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Scroll animation controller
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 80%", "end 30%"],
  });

  // Animate line width
  const animatedWidth = useTransform(scrollYProgress, [0, 1], ["0%", "65%"]);

  return (
    <section
      ref={sectionRef}
      className="py-10 bg-gradient-to-r from-[#f5f5f9] via-[#f3f3f4]/10 to-[#f5f5f9] relative overflow-hidden"
    >
      {/* Section Title */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-[40px] font-semibold text-[#2F3D43]">
          How It Works
        </h2>
        <p className="text-[#686D70] mt-2 text-[16px]">
          Your journey to emotional wellbeing in four simple steps
        </p>
      </div>

      {/* ===== Animated Behind-Line ===== */}
      <div className="absolute top-[385px] left-[1400px] -translate-x-1/2 w-[120%] hidden md:block z-0">
        <motion.div
          style={{ width: animatedWidth }}
          className="h-[3px] border-2 border-[#2DC8EF] drop-shadow-sm drop-shadow-[#2DC8EF] rounded-full"
        />
      </div>

      {/* ===== Steps ===== */}
      <div className="max-w-8xl mx-auto grid grid-cols-1 md:grid-cols-4 justify-between px-26 py-20  relative z-10">
        {steps.map((step) => (
          <div key={step.key} className="flex flex-col items-center text-center">
            <div className="w-[217px] h-[117px] drop-shadow-xl drop-shadow-[#589EE626] rounded-[21px] bg-white mt-16">

            {/* REAL screenshot uses a white rounded rectangle behind each icon */}
            <div className={`flex  ${step.className} items-center justify-center relative z-10`}>
              <Image
                src={step.image}
                alt={step.label}
                width={
      step.key === "chooseMood" ? 650 :
      step.key === "aiSupport" ? 275 :
      step.key === "learnGrow" ? 330 :
      280 // expertHelp
    }
    height={
      step.key === "chooseMood" ? 650 :
      step.key === "aiSupport" ? 125 :
      step.key === "learnGrow" ? 175 :
      240 // expertHelp
    }
    className="object-contain"
    />
            </div>

    </div>
            <h3 className="mt-16 text-[24px] font-medium text-[#2F3D43]">
              {step.label}
            </h3>

            <p className="text-[#767676] mt-2 w-[210px] text-[16px] leading-relaxed px-2">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;