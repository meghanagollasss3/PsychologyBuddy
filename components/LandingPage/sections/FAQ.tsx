"use client";

import { useState } from "react";

/* ─────────────────────────────────────────
   FAQ data — left column and right column
───────────────────────────────────────── */
const leftFaqs = [
  {
    id: 1,
    question: "What is this app for?",
    answer:
      "This app is a safe place for students to talk about feelings, manage stress, and learn about mental well-being privately through AI support.",
    defaultOpen: true,
  },
  {
    id: 3,
    question: "Can the AI read my personal data?",
    answer:
      "No. Your conversations are private and encrypted. The AI uses your inputs only to support you in the moment and does not store identifiable data.",
  },
  {
    id: 5,
    question: "If phones are not allowed in my school, how do I use this app?",
    answer:
      "You can access the app on any school-provided device through a web browser, so no personal phone is required.",
  },
  {
    id: 7,
    question: "Does this app cost money for students?",
    answer:
      "No. The app is provided free of charge to students through their school. There are no hidden fees or premium tiers for learners.",
  },
  {
    id: 9,
    question: "Will my school constantly monitor me?",
    answer:
      "Schools only receive anonymised, aggregate well-being trends. Your individual conversations and journal entries are never shared with staff.",
  },
];

const rightFaqs = [
  {
    id: 2,
    question: "Who can use this app?",
    answer:
      "The app is designed for students of all ages. School administrators set up access, and students can log in with their school credentials.",
  },
  {
    id: 4,
    question: "What happens if I say something serious, like I'm unsafe or too stressed?",
    answer:
      "Your safety comes first. If the AI detects a crisis situation, it will immediately provide coping resources and, where necessary, alert a trusted school counsellor.",
  },
  {
    id: 6,
    question: "Will my classmates know what I talk in the app?",
    answer:
      "Absolutely not. All conversations are completely private. No other student or peer can access your chats or mood logs.",
  },
  {
    id: 8,
    question: "What if AI misunderstands my emotions?",
    answer:
      "You can always correct the AI or rephrase your feelings. The system is designed to ask clarifying questions and improve over time based on your feedback.",
  },
  {
    id: 10,
    question: "What is the main mission of Psychology Buddy?",
    answer:
      "Our mission is to make mental health support accessible, private, and stigma-free for every student — right inside their school environment.",
  },
];

/* ─────────────────────────────────────────
   Single accordion item
───────────────────────────────────────── */
function FAQItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-2xl bg-white cursor-pointer select-none"
      style={{
        border: "1.5px solid #e8eef6",
        boxShadow: open
          ? "0 4px 20px rgba(56,189,248,0.10), 0 1px 4px rgba(0,0,0,0.04)"
          : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.25s ease",
      }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <span
          className="text-[16px] font-medium text-[#2F3D43] leading-snug"
        >
          {question}
        </span>

        {/* +/– button */}
        <button
          className="flex-shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #1B9EE0, #1B9EE0)",
          }}
          aria-label={open ? "Collapse" : "Expand"}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="w-3.5 h-3.5"
            style={{
              transform: open ? "rotate(0deg)" : "rotate(0deg)",
              transition: "transform 0.50s ease",
            }}
          >
            {/* horizontal bar always visible */}
            <rect x="3" y="7.25" width="10" height="1.5" rx="0.75" fill="white" />
            {/* vertical bar — hidden when open */}
            {!open && (
              <rect x="7.25" y="3" width="1.5" height="10" rx="0.75" fill="white" />
            )}
          </svg>
        </button>
      </div>

      {/* answer */}
      <div
        style={{
          maxHeight: open ? "200px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
      >
        <p className="px-5 pb-5 text-[16px] text-[#686D70] leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main FAQ Section
───────────────────────────────────────── */
export default function FAQSection() {
  return (
    <section
      className="w-full px-6 py-20"
      style={{ background: "#f8f8f8" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-[40px] font-semibold text-[#2F3D43] mb-3"
            
          >
            Frequently Asked Questions
          </h2>
          <p className="text-[#686D70] text-sm sm:text-[16px]">
            Answers to common questions before you get started.
          </p>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Left column */}
          <div className="flex flex-col gap-6">
            {leftFaqs.map((faq) => (
              <FAQItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
                defaultOpen={faq.defaultOpen}
              />
            ))}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {rightFaqs.map((faq) => (
              <FAQItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}