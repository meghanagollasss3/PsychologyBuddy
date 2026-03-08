import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const AboutSection = () => {
  return (
    <section className="w-full">
      {/* Hero Banner */}
      <div className="relative w-full h-[354px] overflow-hidden">
        {/* Background Image */}
        <Image 
          src="/about/About.svg" 
          alt="Psychology Buddy Background" 
          fill
          className="object-cover"
        />
        
      </div>

      {/* Mission Section */}
      <div className="bg-white w-full">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-12">
          {/* Image */}
          <div className="w-full md:w-1/2 flex-shrink-0">
            <Image 
              src="/about/1.svg" 
              alt="Our Mission" 
              width={600}
              height={400}
              className="w-full h-auto border-6 border-white object-cover"
            />
          </div>

          {/* Text */}
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl md:text-[40px] font-semibold text-[#2F3D43] mb-5">
              Our Mission
            </h2>
            <p className="text-[#767676] text-[16px] leading-relaxed mb-8">
              Psychology Buddy exists to democratize mental health support in
              schools. We believe every student deserves access to professional,
              compassionate resources—regardless of their background or zip
              code. By combining clinical expertise with cutting-edge
              technology, we&apos;re making quality mental health support a
              standard part of every school experience.
            </p>
            <Link
              href="#"
              className="inline-flex items-center gap-2 bg-gradient-to-b from-[#4FC1F9] to-[#1B9EE0] hover:bg-[#1589b8] text-white font-medium text-[16px] px-6 py-3 rounded-full transition-colors duration-200"
            >
              Lets started
              <ArrowRight/>
              {/* <span className="text-base">→</span> */}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;