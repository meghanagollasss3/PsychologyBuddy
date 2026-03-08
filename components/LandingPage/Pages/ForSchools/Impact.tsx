import { size } from "lodash";
import { Check } from "lucide-react";
import Image from "next/image";


const impactCards = [
  {
    image: "/for/7.svg",
    title: "Measurable Impact",
    points: [
      "Improved attendance rates",
      "Reduced disciplinary incidents",
      "Enhanced academic performance",
      "Increased student engagement",
    ],
    highlighted: true,
  },
  {
    image: "/for/8.svg",
    title: "Administrative Efficiency",
    points: [
      "Reduced counselor workload",
      "Better resource allocation",
      "Simplified documentation",
      "Time-saving automation",
    ],
    highlighted: false,
  },
  {
    image: "/for/9.svg",
    size:"12",
    title: "Trust & Safety",
    points: [
      "Evidence-based approach",
      "Licensed clinical oversight",
      "Complete privacy protection",
      "Transparent reporting",
    ],
    highlighted: false,
  },
];

const SchoolsRealImpact = () => {
  return (
    <section className="w-full bg-[#F4F6F9] py-20 px-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-3xl md:text-[32px] font-semibold text-[#2F3D43] mb-3 tracking-tight">
          Schools See Real Impact
        </h2>
        <p className="text-[#686D70] text-sm md:text-[16px] leading-relaxed">
          Meaningful improvements across student wellbeing, administrative efficiency, and trust
        </p>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        {/* Impact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {impactCards.map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border p-10 flex flex-col gap-4 transition-shadow duration-200 hover:shadow-md drop-shadow-lg drop-shadow-[#5DBAF926]"
              
            >
              {/* Image */}
              <div className="w-11 h-11">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Title */}
              <h3 className="font-medium text-[#3A3A3A] text-[20px]">{card.title}</h3>

              {/* Points */}
              <ul className="flex flex-col gap-2">
                {card.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2 text-[16px] text-[#767676]">
                    <Check className="text-[#16A249] w-5 h-5"/>
                    {/* <span className="text-[#1a9fd4] mt-0.5 text-xs font-bold">✓</span> */}
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="bg-white p-10 rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Quote */}
            <div className="p-8 flex flex-col justify-center">
              <div className="absolute left-97 top-683">
                <Image 
                              src="/for/11.svg" 
                              alt="Psychology Buddy Background" 
                              width={35}
                              height={35}
                              className="object-cover"
                            />
              </div>
              {/* <div className="text-[#1a9fd4] text-5xl font-serif leading-none mb-4 select-none"></div> */}
              
              <p className="text-[#686D70] text-[20px] leading-relaxed mb-6">
                Psychology Buddy has transformed how we support student mental health. The insights
                and early intervention tools have made a real difference.
              </p>
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-[60px] h-[54px] rounded-[14px] bg-gradient-to-bl from-[#52C6FF] to-[#1694D4] flex items-center justify-center text-white text-[24px] font-medium flex-shrink-0">
                  SM
                </div>
                <div>
                  <p className="font-medium text-[#2F3D43] text-[16px]">Dr. Sarah Mitchell</p>
                  <p className="text-[#767676] text-[14px]">Principal, Lincoln High School</p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="relative flex items-center justify-center">
              {/* Replace with your actual image */}
              <Image 
                              src="/for/10.svg" 
                              alt="Psychology Buddy Background" 
                              fill
                              className="object-contain"
                            />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SchoolsRealImpact;