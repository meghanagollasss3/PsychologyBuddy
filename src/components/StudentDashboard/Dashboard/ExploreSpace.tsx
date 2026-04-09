"use client";

import Link from "next/link";

const tools = [
  {
    title: "AI Chat",
    subtitle: "Track your journey",
    image: "/Dashboard/Explore/Chat.svg",
    className: "bg-gradient-to-b from-[#ffffff] to-[#A745FA]/10",
    href: "/students/chat",
  },
  {
    title: "Self help Tools",
    subtitle: "Quick tools to calm your mind.",
    image: "/Dashboard/Explore/Tools.svg",
    className: "bg-gradient-to-b from-[#ffffff] to-[#71A5FF]/10",
    href: "/students/selfhelptools",
  },
  {
    title: "Psychoeducation Library",
    subtitle: "Understand emotions and mental wellbeing.",
    image: "/Dashboard/Explore/Library.svg",
    className: "bg-gradient-to-b from-[#ffffff] to-[#00D469]/10",
    href: "/students/content/library",
  },
  {
    title: "Badges and Streaks",
    subtitle: "Track progress and celebrate consistency.",
    image: "/Dashboard/Explore/Badges.svg",
    className: "bg-gradient-to-b from-[#ffffff] to-[#FA83C2]/10",
    href: "/students/badges",
  },
];

export default function ExploreSpace() {
  return (
    <div className="w-full">
      {/* Title */}
      <div className="ml-4 sm:ml-6 md:ml-8 lg:ml-9">

      <h2 className="text-[18px] sm:text-[20px] md:text-[22px] font-semibold text-gray-900">
        Explore Your Space
      </h2>
      <p className="text-[13px] sm:text-[14px] text-[#767676] mb-4 sm:mb-5 md:mb-6">
        Choose what feels helpful right now.
      </p>
      </div>

      {/* Cards Grid */}
      <div className="flex flex-col items-center justify-center">

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-7 w-full max-w-7xl mx-auto sm:pl-8">
        {tools.map((item, idx) => (
          <Link
          key={idx}
          href={item.href}
          className={`bg-white w-full max-w-[284px] min-h-[180px] sm:min-h-[200px] flex flex-col justify-center items-center rounded-[12px] sm:rounded-[14px] p-4 sm:p-5 md:p-6 shadow-xl shadow-[#2424241A] inset-shadow-sm inset-shadow-[#2424241A]-500/50 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer block no-underline ${item.className}`}
          >
            {/* Image */}
            <div className={`p-2 sm:p-3 rounded-xl inline-flex`}>
              <img
                src={item.image}
                alt={item.title}
                className="h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] md:h-[56px] md:w-[55px] object-contain"
                onError={(e) => {
                  // Fallback to a placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/placeholder.png";
                }}
                />
            </div>

            {/* Title */}
            <h3 className="text-[16px] sm:text-[17px] md:text-[18px] font-semibold text-[#2F3D43] mt-2 sm:mt-1 text-center">
              {item.title}
            </h3>

            {/* Subtitle */}
            <p className="text-[12px] sm:text-[13px] md:text-[14px] text-[#686D70] mt-1 sm:mt-2 leading-relaxed text-center">
              {item.subtitle}
            </p>
          </Link>
        ))}
      </div>
        </div>
    </div>
  );
}