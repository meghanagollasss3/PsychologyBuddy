import React from "react";
import { Heart, MessageCircle, BookOpen, Wrench, LucideIcon } from "lucide-react";
import FeatureCard from "../components/FeatureCard";

interface Feature {
  icon: LucideIcon;
  imageSrc?: string;
  title: string;
  description: string;
}

const Features: React.FC = () => {
  const features: Feature[] = [
    {
      icon: Heart,
      imageSrc:'./FeatureCards/1.svg',
      title: "Smart Mood Tracker",
      description:
        "Understand how you feel every day with simple check-ins and insightful patterns",
    },
    {
      icon: MessageCircle,
            imageSrc:'./FeatureCards/2.svg',

      title: "AI Support Chat",
      description:
        "Talk freely with your friendly AI mentor available 24/7 whenever you need support",
    },
    {
      icon: BookOpen,
            imageSrc:'./FeatureCards/3.svg',

      title: "MindSpace Library",
      description:
        "Learn how to manage stress, focus better, and build confidence with expert-designed lessons",
    },
    {
      icon: Wrench,
            imageSrc:'./FeatureCards/4.svg',

      title: "Self-help Tools",
      description: "Evidence-based exercises and coping strategies",
    },
  ];

 return (
    <div className="py-3 px-6 bg-gradient-to-r from-[#f8f8f8] via-[#f3f3f4]/10 to-[#f6f4f3]">
      {/* 1. Ensure the outer container is centered with mx-auto */}
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-[40px] font-semibold text-[#2F3D43] mb-4 tracking-normal">
            Designed for Schools. Loved by Students.
          </h2>
          <p className="text-[16px] text-[#686D70] max-w-3xl mx-auto mt-[-10px]">
            Empowering institutions to care for every student's emotional health
          </p>
        </div>
        
        {/* 2. ADDED: justify-center and justify-items-center to ensure the cards stay in the middle */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 justify-center justify-items-center w-full">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              imageSrc={feature.imageSrc}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;