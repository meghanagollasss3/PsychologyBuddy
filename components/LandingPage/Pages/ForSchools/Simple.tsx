const steps = [
  {
    number: "01",
    title: "Assessment",
    description:
      "We understand your school's unique needs, challenges, and current systems.",
    highlighted: true,
  },
  {
    number: "02",
    title: "Integration",
    description:
      "Seamless integration with your existing student information systems and workflows.",
    highlighted: false,
  },
  {
    number: "03",
    title: "Training",
    description:
      "Comprehensive onboarding and training for administrators and staff.",
    highlighted: false,
  },
  {
    number: "04",
    title: "Launch",
    description:
      "Soft launch with a pilot group, followed by a full school-wide rollout.",
    highlighted: false,
  },
];

const SimpleImplementation = () => {
  return (
    <section className="w-full bg-[#F4F6F9] py-10 px-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-20">
        <h2 className="text-3xl md:text-[32px] font-semibold text-[#2F3D43] mb-3 tracking-tight">
          Simple Implementation
        </h2>
        <p className="text-[#686D70] text-sm md:text-[16px] leading-relaxed">
          Get started in weeks, not months, with our proven implementation
          process designed for schools
        </p>
      </div>

      {/* Steps Container */}
      <div className="max-w-6xl mx-auto relative">
        {/* Horizontal connecting line */}
        <div className="absolute top-12 left-0 right-0 h-0.5 bg-[#1a9fd4] z-0"></div>
        
        {/* Steps Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 drop-shadow-lg gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`relative bg-white rounded-2xl border pt-10 pb-6 px-6 flex flex-col items-start text-left`}
            >
              {/* Step number badge */}
              <div className={`absolute -top-3 -left-2 w-[53px] h-[48px] rounded-[12px] flex items-center justify-center text-[28px] font-medium shadow-sm bg-gradient-to-b from-[#4FC1F9] to-[#1B9EE0] text-white`}>
                {step.number}
              </div>

              {/* Large background number */}
              <span className="absolute top-10 left-4 text-[55px] font-medium text-[#E8ECF3] select-none leading-none opacity-50">
                {step.number}
              </span>

              {/* Content */}
              <div className="relative z-10 mt-15">
                <h3 className={`font-semibold text-[20px] text-[#2F3D43] mb-2`}>
                  {step.title}
                </h3>
                <p className="text-[#767676] text-[16px] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SimpleImplementation;