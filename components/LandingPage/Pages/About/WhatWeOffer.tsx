import Link from "next/link";

const features = [
  {
    image: "/about/1s.svg",
    title: "Accessible Resources",
    description: "Evidence-based mental health content tailored for students of all backgrounds and experiences.",
  },
  {
    image: "/about/2s.svg",
    title: "AI-Guided Emotional Support",
    description: "A supportive AI companion that helps students reflect, calm their thoughts, and explore coping strategies.",
  },
  {
    image: "/about/3.svg",
    title: "Early Awareness",
    description: "The platform supports early emotional awareness. When serious concerns arise, schools follow their existing offline processes.",
  },
  {
    image: "/about/4.svg",
    title: "School Integration",
    description: "Seamlessly integrates with existing school systems and workflows for administrators.",
  },
  {
    image: "/about/5.svg",
    title: "Privacy First by Design",
    description: "Chats and journal entries remain completely private.",
  },
  {
    image: "/about/6.svg",
    title: "Data & Insights",
    description: "Schools get valuable insights about student wellness trends while protecting privacy.",
  },
];

const WhatWeOffer = () => {
  return (
    <section className="w-full">
      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            What We Offer
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Our mission is to make mental wellness simple, supportive, and
            always within reach for every student.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group rounded-[12.47px] border-[0.39px] p-6 flex flex-col gap-3 transition-all duration-200 bg-gray-50 text-gray-800 hover:shadow-md hover:bg-[#1DA0E1] hover:text-white hover:border-transparent border-[#D4D4D4]/50 drop-shadow-sm items-center"
            >
              <div
                className="w-[63px] h-[63px] rounded-full overflow-hidden flex items-center justify-center bg-[#EAF8FF] transition-colors duration-200 group-hover:bg-white"
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-[36px] h-[36px] object-cover"
                />
              </div>

              <h3
                className="font-medium text-[16px] text-[#2F3D43] transition-colors duration-200 group-hover:text-white"
              >
                {feature.title}
              </h3>
              <p
                className="text-[#767676] leading-relaxed text-[14px] text-center transition-colors duration-200 group-hover:text-white/85"
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-[#FDFEFF] drop-shadow-xl mb-12">
        <div className="max-w-3xl mx-auto px-6 py-14 text-center">
          <h2 className="text-2xl md:text-[32px] font-bold text-[#1DA0E1] mb-3">
            Ready to Transform Student Wellbeing?
          </h2>
          <p className="text-[#1DA0E1] text-sm md:text-[16px] mb-8 max-w-md mx-auto leading-relaxed">
            Join schools across the country creating safer, more supportive
            learning environments.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-2 bg-[#1DA0E1] hover:bg-[#1589b8] text-white font-medium text-[16px] px-7 py-3 rounded-full transition-colors duration-200 shadow-md"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WhatWeOffer;