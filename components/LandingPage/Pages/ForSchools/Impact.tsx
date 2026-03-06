const impactCards = [
  {
    image: "https://placehold.co/44x44/1a9fd4/ffffff?text=📈",
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
    image: "https://placehold.co/44x44/1a9fd4/ffffff?text=⚙️",
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
    image: "https://placehold.co/44x44/1a9fd4/ffffff?text=🛡️",
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
    <section className="w-full bg-[#f5fbff] py-16 px-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Schools See Real Impact
        </h2>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          Meaningful improvements across student wellbeing, administrative efficiency, and trust
        </p>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        {/* Impact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {impactCards.map((card, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl border p-6 flex flex-col gap-4 transition-shadow duration-200 hover:shadow-md ${
                card.highlighted ? "border-[#c5e8f7] shadow-md" : "border-gray-100 shadow-sm"
              }`}
            >
              {/* Image */}
              <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title */}
              <h3 className="font-bold text-gray-900 text-base">{card.title}</h3>

              {/* Points */}
              <ul className="flex flex-col gap-2">
                {card.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-500">
                    <span className="text-[#1a9fd4] mt-0.5 text-xs font-bold">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Quote */}
            <div className="p-8 flex flex-col justify-center">
              <div className="text-[#1a9fd4] text-5xl font-serif leading-none mb-4 select-none">"</div>
              <p className="text-gray-700 text-base leading-relaxed mb-6">
                Psychology Buddy has transformed how we support student mental health. The insights
                and early intervention tools have made a real difference.
              </p>
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a9fd4] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  SM
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Dr. Sarah Mitchell</p>
                  <p className="text-gray-400 text-xs">Principal, Lincoln High School</p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="relative h-56 md:h-auto bg-gradient-to-br from-[#c8e8f7] to-[#a0d4f0] flex items-center justify-center">
              {/* Replace with your actual image */}
              <div className="text-center">
                <div className="text-7xl mb-2">👧🤖👦</div>
                <p className="text-[#1a9fd4] text-xs font-medium opacity-60">Student interaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SchoolsRealImpact;