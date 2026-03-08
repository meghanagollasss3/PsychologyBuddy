import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";


const stats = [
  { value: "50K+", label: "Students supported" },
  { value: "200+", label: "Partner schools" },
  { value: "95%", label: "Student satisfaction" },
  { value: "24/7", label: "Support available" },
];

const HeroSection = () => {
  return (
    <section className="w-full bg-gradient-to-b from-[#EBF6FF] via-[#CAE6FF] to-[#D4EAFF] overflow-hidden">
      {/* Hero Content */}
      <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-10 mt-20 mb-20 text-center">
        {/* Floating decorative blobs */}
        
        
        

        {/* Badge */}
        <div
                    className="inline-flex items-center gap-2 p-2 rounded-full mb-4
                    bg-white/33 h-[27px]
                    shadow-[0_8px_32px_rgba(0,0,0,0.08)]
                    border-[0.4px] border-[#1CBBFF]"
                  >
                    <Sparkles className="w-[10px] h-[9px] text-[#1D9FE1]" />
                    <span className="text-[10px] font-medium text-[#1D9FE1]">
                      Mental Health Support Built for Schools
                    </span>
                  </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-[48px] lg:text-[48px] font-semibold text-[#2F3D43] leading-tight mb-5 tracking-tight">
          Mental Health Support Built for Schools
        </h1>

        {/* Subtext */}
        <p className="text-[#767676] text-sm md:text-[16px] mx-auto leading-relaxed mb-8">
          Give administrators powerful tools and students access to professional
          support. Psychology <br/> Buddy integrates seamlessly with your school's
          existing infrastructure.
        </p>

        {/* CTA */}
        <Link
          href="#"
          className="inline-flex items-center bg-gradient-to-b from-[#4FC1F9] to-[#1B9EE0] hover:bg-[#1589b8] text-white font-medium text-[16px] px-7 py-3 rounded-full transition-colors duration-200 shadow-md"
        >
          Request a Demo
        </Link>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 pb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm rounded-2xl py-6 text-center drop-shadow-lg border border-white"
            >
              <p className="text-2xl md:text-[34px] font-semibold text-[#1B9EE0] mb-1">
                {stat.value}
              </p>
              <p className="text-[#2F3D43] text-[20px]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;