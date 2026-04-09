"use client";

import { useRouter } from "next/navigation";
import { BookOpen, Music, Brain } from "lucide-react";
import BackToDashboard from "../Layout/BackToDashboard";
import Image from "next/image";

export default function SelfHelpCardsExact() {
  const router = useRouter();

  const cards = [
    {
      id: "journaling",
      title: "Journaling",
      description:
        "Express your thoughts and feelings in a safe, private space",
      image: "/selfhelptools/journaling.svg",
      icon: BookOpen,
            gradient: "from-white via-[#F9F5FF] to-[#F3E8FF]",
      glow: "from-[#F5D8FF] to-white",
      bullets: "bg-[#893ACC]",
      cta: "from-[#8D3AD4] to-[#A949FC]",
      benefits: ["Process emotions", "Track patterns", "Build self-awareness"],
      buttonText: "Build self-awareness",
    },
    {
      id: "music",
      title: "Music Therapy",
      description: "Curated playlists to support your emotional wellbeing",
      image: "/selfhelptools/music.svg",
      icon: Music,
      gradient: "from-white via-[#F3F7FF] to-[#E6F0FF]",
      glow: "from-[#DDEAFF] to-white",
      bullets: "bg-[#368AF0]",
      cta: "from-[#2C7EDE] to-[#68A1FD]",
      benefits: ["Reduce stress", "Improve mood", "Enhance focus"],
      buttonText: "Start Music Therapy",
    },
    {
      id: "meditation",
      title: "Meditation",
      description: "Guided practices for mindfulness and inner peace",
      image: "/selfhelptools/med.svg",
      gradient: "from-white via-[#EDFFF7] to-[#D9FCEA]",
      glow: "from-[#C8FFE0] to-white",
      bullets: "bg-[#07A049]",
      cta: "from-[#07B04D] to-[#01D066]",
      benefits: ["Calm your mind", "Reduce anxiety", "Improve sleep"],
      buttonText: "Start Meditation",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <main className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        {/* Back Button */}
        <div className="max-w-7xl mb-3 sm:mb-4 mt-3 sm:mt-5">
          <BackToDashboard />
        </div>

        {/* Header */}
        <div className="flex mb-8 sm:mb-10 md:mb-12 items-start gap-3 sm:gap-4 w-auto ">
          <Image
            src="/Content/Library.svg"
            alt="Psychology Buddy Logo"
            width={63}
            height={63}
            className="w-[25px] h-[25px] sm:w-[40px] sm:h-[40px] md:w-[50px] md:h-[50px] lg:w-[63px] lg:h-[63px]"
          />
          <div className="ml-[3px] sm:ml-[5px] flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-bold text-slate-900 mb-1 sm:mb-2">
              Self-Help Tools{" "}
            </h1>
            <p className="text-[#686D70] text-xs sm:text-sm md:text-base font-light hidden xs:block sm:block">
              Quick, effective tools to help you manage emotions, reduce
              stress.{" "}
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.id}
                className={`
                  w-full max-w-[379px] mx-auto sm:w-auto sm:max-w-none h-auto sm:h-[400px] md:h-[431px]
                  rounded-[12px] sm:rounded-[15px] p-4 sm:p-5 md:p-6 lg:p-7 relative overflow-hidden
                  bg-gradient-to-b ${card.gradient}
                  border-2 border-white
                  drop-shadow-xl shadow-[#2424241A] inset-shadow-xl inset-shadow-[#2424241A]-500/50 hover:shadow-md hover:scale-[1.02] transition-all 
                `}
              >
                {/* Glow Effect */}
                <div
                  className={`absolute inset-0 w-[164px] h-[164px] left-[290px] top-[-45px] rounded-full bg-gradient-to-l ${card.gradient} opacity-70`}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    
                  >
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-[50px] sm:h-[60px] md:h-[71px] w-[52px] sm:w-[62px] md:w-[73px]"
                      onError={(e) => {
                        // Fallback to a placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/placeholder.png";
                      }}
                    />
                  </div>

                  {/* Title */}
                  <h2 className="text-lg sm:text-xl md:text-[20px] font-semibold text-[#2F3D43] mt-3 sm:mt-4 md:mt-5">
                    {card.title}
                  </h2>

                  {/* Description */}
                  <p className="text-[#767676] text-sm sm:text-base md:text-[16px] mt-1.5 sm:mt-2">
                    {card.description}
                  </p>

                  {/* Benefits */}
                  <div className="mt-3 sm:mt-4">
                    <p className="text-sm sm:text-base md:text-[16px] font-semibold text-[#2F3D43] mb-1.5 sm:mb-2">
                      Benefits
                    </p>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-[14px] text-[#767676]">
                      {card.benefits.map((b) => (
                        <li key={b} className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${card.bullets}`}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() =>
                      router.push(`/students/selfhelptools/${card.id}`)
                    }
                    className={`
                      mt-5 sm:mt-6 md:mt-8 w-full py-2.5 sm:py-3 text-sm sm:text-base md:text-[16px] font-medium rounded-full text-white
                      bg-gradient-to-r ${card.cta}
                      shadow-md hover:shadow-lg transition-all cursor-pointer
                    `}
                  >
                    {card.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
