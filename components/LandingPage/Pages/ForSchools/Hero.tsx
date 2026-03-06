import Link from "next/link";

const stats = [
  { value: "50K+", label: "Students supported" },
  { value: "200+", label: "Partner schools" },
  { value: "95%", label: "Student satisfaction" },
  { value: "24/7", label: "Support available" },
];

const HeroSection = () => {
  return (
    <section className="w-full bg-gradient-to-b from-[#dff0fb] via-[#eaf6fd] to-[#f5fbff] overflow-hidden">
      {/* Hero Content */}
      <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
        {/* Floating decorative blobs */}
        <div className="absolute top-6 left-6 w-16 h-16 opacity-80 pointer-events-none select-none">
          <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-orange-400 rounded-2xl rotate-12 flex items-center justify-center text-2xl shadow-lg">
            💛
          </div>
        </div>
        <div className="absolute top-4 right-10 w-14 h-14 opacity-80 pointer-events-none select-none">
          <div className="w-full h-full bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-xl -rotate-6 flex items-center justify-center text-xl shadow-md">
            ✨
          </div>
        </div>
        <div className="absolute top-32 right-8 w-20 h-20 opacity-90 pointer-events-none select-none">
          <div className="w-full h-full bg-gradient-to-br from-[#a0d4f0] to-[#1a9fd4] rounded-2xl rotate-6 flex items-center justify-center text-3xl shadow-lg">
            🧠
          </div>
        </div>
        <div className="absolute top-28 left-4 w-20 h-20 opacity-90 pointer-events-none select-none">
          <div className="w-full h-full bg-gradient-to-br from-pink-300 to-red-400 rounded-2xl -rotate-12 flex items-center justify-center text-3xl shadow-lg">
            💗
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#c5e8f7] text-[#1a9fd4] text-xs font-medium px-4 py-1.5 rounded-full mb-6 shadow-sm">
          <span className="text-sm">🧩</span>
          Mental Health Support Built for Schools
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-5 tracking-tight">
          Mental Health Support<br />Built for Schools
        </h1>

        {/* Subtext */}
        <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed mb-8">
          Give administrators powerful tools and students access to professional
          support. Psychology Buddy integrates seamlessly with your school's
          existing infrastructure.
        </p>

        {/* CTA */}
        <Link
          href="#"
          className="inline-flex items-center bg-[#1a9fd4] hover:bg-[#1589b8] text-white font-semibold text-sm px-7 py-3 rounded-full transition-colors duration-200 shadow-md"
        >
          Request a Demo
        </Link>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-6 pb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-6 text-center shadow-sm border border-white"
            >
              <p className="text-2xl md:text-3xl font-extrabold text-[#1a9fd4] mb-1">
                {stat.value}
              </p>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;