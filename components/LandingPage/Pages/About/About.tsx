import Image from "next/image";
import Link from "next/link";

const AboutSection = () => {
  return (
    <section className="w-full">
      {/* Hero Banner */}
      <div className="relative w-full bg-[#1a9fd4] overflow-hidden">
        {/* Background decorative blurred icons */}
        <div className="absolute inset-0 opacity-20 pointer-events-none select-none flex items-center justify-between px-10">
          <div className="text-white text-8xl">🧠</div>
          <div className="text-white text-6xl">💙</div>
          <div className="text-white text-7xl">🤝</div>
        </div>

        {/* Faint floating label top-right */}
        <div className="absolute top-6 right-12 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full border border-white/30">
          Emotional Wellbeing
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center py-16 px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            About Psychology Buddy
          </h1>
          <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            We&apos;re reimagining how schools support student mental health
            through technology, compassion, and evidence-based practices.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-white w-full">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-12">
          {/* Images */}
          <div className="relative w-full md:w-1/2 flex-shrink-0 h-72 md:h-80">
            {/* Back card */}
            <div className="absolute top-0 left-0 w-64 h-52 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
              {/* Placeholder — replace src with your actual image */}
              <div className="w-full h-full bg-gradient-to-br from-[#c8e8f7] to-[#a0d4f0] flex items-center justify-center">
                <span className="text-6xl">🤖</span>
              </div>
            </div>
            {/* Front card */}
            <div className="absolute bottom-0 right-4 w-48 h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
              <div className="w-full h-full bg-gradient-to-br from-[#dff0fb] to-[#b8dff5] flex items-center justify-center">
                <span className="text-5xl">🧘</span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">
              Our Mission
            </h2>
            <p className="text-gray-600 text-base leading-relaxed mb-8">
              Psychology Buddy exists to democratize mental health support in
              schools. We believe every student deserves access to professional,
              compassionate resources—regardless of their background or zip
              code. By combining clinical expertise with cutting-edge
              technology, we&apos;re making quality mental health support a
              standard part of every school experience.
            </p>
            <Link
              href="#"
              className="inline-flex items-center gap-2 bg-[#1a9fd4] hover:bg-[#1589b8] text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors duration-200"
            >
              Lets started
              <span className="text-base">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;