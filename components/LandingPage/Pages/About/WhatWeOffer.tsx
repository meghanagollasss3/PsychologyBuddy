import Link from "next/link";

const features = [
  {
    image: "https://placehold.co/48x48/ffffff/1a9fd4?text=📚",
    title: "Accessible Resources",
    description: "Evidence-based mental health content tailored for students of all backgrounds and experiences.",
    highlighted: true,
  },
  {
    image: "https://placehold.co/48x48/e8f6fd/1a9fd4?text=🤖",
    title: "AI-Guided Emotional Support",
    description: "A supportive AI companion that helps students reflect, calm their thoughts, and explore coping strategies.",
    highlighted: false,
  },
  {
    image: "https://placehold.co/48x48/e8f6fd/1a9fd4?text=💡",
    title: "Early Awareness",
    description: "The platform supports early emotional awareness. When serious concerns arise, schools follow their existing offline processes.",
    highlighted: false,
  },
  {
    image: "https://placehold.co/48x48/e8f6fd/1a9fd4?text=🏫",
    title: "School Integration",
    description: "Seamlessly integrates with existing school systems and workflows for administrators.",
    highlighted: false,
  },
  {
    image: "https://placehold.co/48x48/e8f6fd/1a9fd4?text=🔒",
    title: "Privacy First by Design",
    description: "Chats and journal entries remain completely private.",
    highlighted: false,
  },
  {
    image: "https://placehold.co/48x48/e8f6fd/1a9fd4?text=📊",
    title: "Data & Insights",
    description: "Schools get valuable insights about student wellness trends while protecting privacy.",
    highlighted: false,
  },
];

const WhatWeOffer = () => {
  return (
    <section className="w-full bg-white">
      {/* Features Section */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            What We Offer
          </h2>
          <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Our mission is to make mental wellness simple, supportive, and
            always within reach for every student.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`rounded-2xl p-6 flex flex-col gap-3 transition-shadow duration-200 ${
                feature.highlighted
                  ? "bg-[#1a9fd4] text-white shadow-lg"
                  : "bg-gray-50 text-gray-800 hover:shadow-md border border-gray-100"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center ${
                  feature.highlighted ? "bg-white/20" : "bg-[#e8f6fd]"
                }`}
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-12 h-12 object-cover"
                />
              </div>
              <h3
                className={`font-bold text-base ${
                  feature.highlighted ? "text-white" : "text-gray-900"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  feature.highlighted ? "text-white/85" : "text-gray-500"
                }`}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-[#f0f9ff] border-t border-[#d0ecf9]">
        <div className="max-w-3xl mx-auto px-6 py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Ready to Transform Student Wellbeing?
          </h2>
          <p className="text-gray-500 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
            Join schools across the country creating safer, more supportive
            learning environments.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-2 bg-[#1a9fd4] hover:bg-[#1589b8] text-white font-semibold text-sm px-7 py-3 rounded-full transition-colors duration-200 shadow-md"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WhatWeOffer;