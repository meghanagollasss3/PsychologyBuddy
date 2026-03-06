const features = [
  {
    image: "https://placehold.co/44x44/1a9fd4/ffffff?text=🛡️",
    title: "Safe & Compliant",
    description:
      "DPDP Act-2003, Cyber security Policy and Others with end-to-end encryption. Student privacy is our top priority with parental consent workflows.",
    highlighted: true,
  },
  {
    image: "https://placehold.co/44x44/1a9fd4/ffffff?text=🧠",
    title: "Evidence-Based Approach",
    description:
      "Built on cognitive behavioral therapy (CBT) principles and validated by mental health professionals and educators.",
    highlighted: false,
  },
  {
    image: "https://placehold.co/44x44/1a9fd4/ffffff?text=📊",
    title: "Easy to Implement",
    description:
      "No complex setup or extra staff required. Psychology Buddy fits seamlessly into existing school workflows.",
    highlighted: false,
  },
  {
    image: "https://placehold.co/44x44/1a9fd4/ffffff?text=📁",
    title: "Resource Management",
    description:
      "Curate and customize mental health resources aligned with your school's values and curriculum.",
    highlighted: false,
  },
  {
    image: "https://placehold.co/44x44/1a9fd4/ffffff?text=💙",
    title: "Daily Wellbeing",
    description:
      "Students engage in daily check-ins, exercises, and reflections, making mental wellbeing a habit not a one-time intervention.",
    highlighted: false,
  },
  {
    image: "https://placehold.co/44x44/1a9fd4/ffffff?text=📈",
    title: "Actionable Insights for Administrators",
    description:
      "Clear dashboards like Clear dashboards, Engagement levels, Tool usage, Alerts by severity.",
    highlighted: false,
  },
];

const WhySchools = () => {
  return (
    <section className="w-full bg-gradient-to-b from-[#f0f9ff] to-white py-16 px-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Why Schools Choose Psychology Buddy
        </h2>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          Comprehensive mental health support designed specifically for educational institutions with
          safety and effectiveness at the core
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {features.map((feature, i) => (
          <div
            key={i}
            className={`rounded-2xl p-6 flex flex-col gap-4 border transition-shadow duration-200 hover:shadow-md ${
              feature.highlighted
                ? "bg-white border-[#c5e8f7] shadow-md"
                : "bg-white border-gray-100"
            }`}
          >
            {/* Image */}
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm">
              <img
                src={feature.image}
                alt={feature.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Text */}
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1.5">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhySchools;