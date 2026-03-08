const features = [
  {
    image: "/for/1.svg",
    title: "Safe & Compliant",
    description:
      "DPDP Act-2003, Cyber security Policy and Others with end-to-end encryption. Student privacy is our top priority with parental consent workflows.",
    highlighted: true,
  },
  {
    image: "/for/2.svg",
    title: "Evidence-Based Approach",
    description:
      "Built on cognitive behavioral therapy (CBT) principles and validated by mental health professionals and educators.",
    highlighted: false,
  },
  {
    image: "/for/3.svg",
    title: "Easy to Implement",
    description:
      "No complex setup or extra staff required. Psychology Buddy fits seamlessly into existing school workflows.",
    highlighted: false,
  },
  {
    image: "/for/4.svg",
    title: "Resource Management",
    description:
      "Curate and customize mental health resources aligned with your school's values and curriculum.",
    highlighted: false,
  },
  {
    image: "/for/5.svg",
    title: "Daily Wellbeing",
    description:
      "Students engage in daily check-ins, exercises, and reflections, making mental wellbeing a habit not a one-time intervention.",
    highlighted: false,
  },
  {
    image: "/for/6.svg",
    title: "Actionable Insights for Administrators",
    description:
      "Clear dashboards like Clear dashboards, Engagement levels, Tool usage, Alerts by severity.",
    highlighted: false,
  },
];

const WhySchools = () => {
  return (
    <section className="w-full bg-gradient-to-b from-[#D4EAFF] to-white py-16 px-6 mb-10">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-[32px] font-semibold text-[#2F3D43] mb-3 tracking-tight">
          Why Schools Choose Psychology Buddy
        </h2>
        <p className="text-[#686D70] text-sm md:text-[16px] leading-relaxed">
          Comprehensive mental health support designed specifically for educational institutions with
          safety and effectiveness at the core
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7">
        {features.map((feature, i) => (
          <div
            key={i}
            className={`rounded-2xl p-6 flex flex-col gap-4 drop-shadow-lg border transition-shadow duration-200 hover:shadow-md ${
              feature.highlighted
                ? "bg-white border-[#c5e8f7] shadow-md"
                : "bg-white border-gray-100"
            }`}
          >
            {/* Image */}
            <div className="w-[59px] h-[55px] ">
              <img
                src={feature.image}
                alt={feature.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Text */}
            <div>
              <h3 className="font-medium text-[#2F3D43] text-[20px] mb-1.5">{feature.title}</h3>
              <p className="text-[#767676] text-[14px] leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhySchools;