import React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingQuestion {
  text: string;
  className: string;
}

const Hero: React.FC = () => {
  const router = useRouter();
  const floatingQuestions: FloatingQuestion[] = [
    // LEFT SIDE BUBBLES — EXACT diagonal ↘
    {
      text: "Is anything stressing you today?",
      className: "top-[372px] left-[240px] rotate-[8deg]",
    },
    {
      text: "How is your mood on a scale of 1–5?",
      className: "top-[525px] left-[342px] rotate-[3deg]",
    },

    // RIGHT SIDE BUBBLES — EXACT diagonal ↙
    {
      text: "Is everything good today?",
      className: "top-[390px] left-[1181px] rotate-[5deg]",
    },
    {
      text: "How are you feeling today?",
      className: "top-[520px] left-[1100px] rotate-[-1deg]",
    },
  ];

  const handleExploreNow = () => {
    router.push("/login");
  };

  return (
    <section className="relative w-full pt-20 pb-194 flex justify-center">
      {/* Floating Questions */}
      {floatingQuestions.map((question, index) => (
        <div
          key={index}
          className={`absolute ${question.className} animate-float hidden lg:block z-20`}
          style={{ animationDelay: `${index * 0.5}s` }}
        >
          <div
            className="
    relative
    px-6 h-[34px]
    rounded-[12px]
    flex items-center gap-2
    backdrop-blur-md

    bg-white/5

    /* TRUE glass border */
    border-[0.5px] border-white/70

    /* PERFECT outer glow */
    shadow-[0_0_20px_rgba(255,255,255,0.35),
            0_4px_18px_rgba(0,0,0,0.05)]
  "
          >
            {/* inner glossy highlight */}
            <div
              className="
      absolute inset-0
      rounded-[12px]
      bg-gradient-to-br
      from-black/3
      via-white/5
      to-white/5
      pointer-events-none
    "
            />

            <Sparkles className="w-3.5 h-3.5 text-[#6B7073] opacity-70" />
            <span className="text-[12px] text-[#6B7073] opacity-80 ">
              {question.text}
            </span>
          </div>
        </div>
      ))}

      {/* Hero Content */}
      <div className="relative z-10 mt-40 text-center px-6 max-w-4xl mx-auto">
        <div>
          {/* Tag above heading */}
          <div
            className="inline-flex items-center gap-2 p-2 rounded-full mb-4
            bg-white/33 h-[27px]
            shadow-[0_8px_32px_rgba(0,0,0,0.08)]
            border-[0.4px] border-[#1CBBFF]"
          >
            <Sparkles className="w-[10px] h-[9px] text-[#1D9FE1]" />
            <span className="text-[10px] font-medium text-[#1D9FE1]">
              Your Well-being Champion
            </span>
          </div>

          <h1 className="text-[48px] font-bold text-[#2F3D43] mb-2 leading-[58px] drop-shadow-lg ">
            Your Safe Space for Everyday <br /> Mental Wellness
          </h1>
        </div>

        <p className="text-[16px] text-[#686D70] max-w-2xl mx-auto  mt-[-2px] mb-4">
          Get personalized support, track your emotions, and build healthy
          <br />
          habits all in one trusted space designed for students.
        </p>

        <Button
          onClick={handleExploreNow}
          className="bg-gradient-to-b from-[#4FC1F9] to-[#1B9EE0] text-white font-medium hover:from-[#4FC1F9] hover:to-[#1B9EE0] transition-all duration-200 drop-shadow-xl hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 tracking-wider disabled:cursor-not-allowed mt-5 text-[16px]"
          style={{
            width: "158px",
            height: "43px",
            borderRadius: "24px",
            paddingTop: "12.46px",
            paddingRight: "5.19px",
            paddingBottom: "12.46px",
            paddingLeft: "5.19px",
            gap: "8.31px",
          }}
        >
          Explore Now
        </Button>
      </div>

      {/* Decorative elements */}
      {/* <div className="absolute top-20 right-20 w-16 h-16 rounded-[12px] blur-xl animate-pulse"></div>
      <div
        className="absolute bottom-40 left-20 w-24 h-24 rounded-[12px] blur-xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/2 right-32 w-12 h-12 rounded-[12px] blur-xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div> */}
    </section>
  );
};

export default Hero;
