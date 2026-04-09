"use client";

import Image from "next/image";


export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="relative w-full h-[354px] overflow-hidden">
                    {/* Background Image */}
                    <Image 
                      src="/terms/1.svg" 
                      alt="Psychology Buddy Background" 
                      fill
                      className="object-cover"
                    />
                    
                  </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-12 space-y-10">

        {/* 1 */}
        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">1. Acceptance of Terms</h2>
          <p className="text-[16px] text-[#767676] leading-relaxed">
            By accessing and using Psychology Buddy ("Platform", "Service"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, you may not use our Service. These terms apply to all users, including but not limited to students, parents, educators, and administrators.
          </p>
        </div>

        {/* 2 */}
        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">2. Service Description</h2>
          <p className="text-[16px] text-[#767676] mb-3">Psychology Buddy is a school-based mental health support platform designed to:</p>
          <ul className="space-y-1.5">
            {[
              "Provide accessible mental health resources and information",
              "Facilitate connections between students and licensed mental health professionals",
              "Offer crisis support resources and interventions",
              "Enable school administrators to monitor wellness trends",
              "Coordinate support between school staff and external mental health providers",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 3 */}
        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">3. User Eligibility & Accounts</h2>
          <p className="text-[16px] text-[#767676] mb-1">
            <span className="font-semibold text-gray-800">Student Users:</span> Must be enrolled in a participating school. Students under 13 require parental consent and consent from their school. Students 13 and older may use the Platform with school consent.
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold text-gray-800">Adult Users (Parents/Educators):</span> Must be at least 18 years old to create an account.
          </p>
          <p className="text-sm text-gray-600 mb-3">
            <span className="font-semibold text-gray-800">School Administrators:</span> Must be authorized representatives of their school district and comply with all institutional policies.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </div>

        {/* 4 */}
        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">4. Privacy & Data Protection</h2>
          <ul className="space-y-1.5">
            {[
              "DPDP Act, 2023 : Data privacy, consent, minors' protection.",
              "IT Act, 2000 : Cybersecurity & platform responsibility.",
              "IT Rules, 2021 : User safety, transparency, grievance redressal.",
              "POCSO Act, 2012 – Child safety & mandatory reporting.",
              "IT Rules, 2021 – User safety, transparency, grievance redressal.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[16px] text-[#767676]">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 5 */}
        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">5. Acceptable Use Policy</h2>
          <p className="text-sm text-gray-600 mb-3">You agree not to:</p>
          <ul className="space-y-1.5">
            {[
              "Harass, threaten, or abuse other users",
              "Share another person's personal information without consent",
              "Attempt to gain unauthorized access to the Platform",
              "Use the Platform for commercial purposes without authorization",
              "Share misinformation or harmful content",
              "Violate any applicable laws or regulations",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[16px] text-[#767676]">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">6. Mental Health Support & Crisis Resources</h2>
          {/* <p className="text-sm text-gray-600 mb-3">You agree not to:</p> */}
          <ul className="space-y-1.5">
            {[
              "Important Disclaimer: Psychology Buddy is not a substitute for professional mental health care. Content and resources provided are for informational and educational purposes only.",
              "Crisis Support: The Platform includes links to crisis resources, including the National Suicide Prevention Lifeline (988) and Crisis Text Line (text HOME to 741741). In case of immediate danger, always call emergency services (911).",
              "Therapist Connections: Connections with licensed therapists through our Platform do not guarantee availability or assignment. All connected professionals maintain separate confidentiality agreements",
              
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[16px] text-[#767676]">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">7. Intellectual Property</h2>
          {/* <p className="text-sm text-gray-600 mb-3">You agree not to:</p> */}
          <ul className="space-y-1.5">
            {[
              "All content, features, and functionality of the Platform (including but not limited to text, graphics, logos, and software) are owned by Psychology Buddy, our content providers, or our licensors. You may not reproduce, distribute, or transmit any content without our express written permission",
              
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[16px] text-[#767676]">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">8. Limitation of Liability</h2>
          {/* <p className="text-sm text-gray-600 mb-3">You agree not to:</p> */}
          <ul className="space-y-1.5">
            {[
              "To the fullest extent permitted by law, Psychology Buddy shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the Platform, including but not limited to damages for loss of profits, data, or goodwill.",
              
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[16px] text-[#767676]">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">9. Termination</h2>
          {/* <p className="text-sm text-gray-600 mb-3">You agree not to:</p> */}
          <ul className="space-y-1.5">
            {[
              "We may suspend or terminate your account if you violate these Terms or engage in prohibited conduct. Students' accounts will be terminated when they are no longer enrolled in their school or as requested by the school administrator",
              
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[16px] text-[#767676]">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">10. Changes to Terms</h2>
          {/* <p className="text-sm text-gray-600 mb-3">You agree not to:</p> */}
          <ul className="space-y-1.5">
            {[
              "We may modify these Terms at any time. Changes will be effective upon posting to the Platform. Your continued use of the Platform after changes are posted constitutes your acceptance of the modified Terms.",
              
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[16px] text-[#767676]">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[20px] font-semibold text-[#3A3A3A] mb-2">11. Governing Law</h2>
          {/* <p className="text-sm text-gray-600 mb-3">You agree not to:</p> */}
          <ul className="space-y-1.5">
            {[
              "These Terms are governed by and construed in accordance with the laws of the jurisdiction in which the user's school is located, without regard to its conflict of law principles.",
              
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[16px] text-[#767676]">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}