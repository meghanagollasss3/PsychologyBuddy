const steps = [
  {
    number: "01",
    title: "Assessment",
    description:
      "We understand your school's unique needs, challenges, and current systems.",
  },
  {
    number: "02",
    title: "Integration",
    description:
      "Seamless integration with your existing student information systems and workflows.",
  },
  {
    number: "03",
    title: "Training",
    description:
      "Comprehensive onboarding and training for administrators and staff.",
  },
  {
    number: "04",
    title: "Launch",
    description:
      "Soft launch with a pilot group, followed by a full school-wide rollout.",
  },
];

const SimpleImplementation = () => {
  return (
    <section className="w-full bg-gradient-to-b from-[#f0f9ff] to-white py-16 px-6">
      {/* Header */}
      <div className="max-w-xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Simple Implementation
        </h2>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          Get started in weeks, not months, with our proven implementation
          process designed for schools
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {steps.map((step, i) => (
          <div
            key={i}
            className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200"
          >
            {/* Step badge */}
            <div className="w-10 h-10 rounded-xl bg-[#1a9fd4] flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {step.number}
            </div>

            {/* Faint large background number */}
            <span className="absolute top-4 right-5 text-5xl font-black text-gray-100 select-none leading-none">
              {step.number}
            </span>

            {/* Divider line */}
            <div className="w-8 h-0.5 bg-[#1a9fd4] rounded-full" />

            {/* Text */}
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1.5">
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SimpleImplementation;