import React from "react";
import Navigation from "./components/Navigation";
import Hero from "./sections/Hero";
import Features from "./sections/Features";
import HowItWorks from "./sections/HowItWorks";
import WellnessSection from "./sections/Wellness";
import TrustSection from "./sections/Privacy";
import FAQSection from "./sections/FAQ";
import Footer from "./sections/Footer";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F9] relative overflow-x-hidden">
      <Navigation />
      
      {/* WRAPPER FOR IMAGE + CONTENT */}
      <div 
        className="relative flex flex-col -mt-20 items-center"
        style={{
          backgroundImage: 'url("/LandingPage/LP.svg")',
          backgroundSize: "100% auto", // Matches image width to screen width
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Section 1: Hero */}
        <Hero />

        {/* Section 2: Features 
            The negative margin (mt-[-120px]) pulls the features 
            up onto the reflection area of the SVG image.
        */}
        <div id="features" className="relative z-20 w-full mt-[-80px] md:mt-[-150px] pb-20"> 
          <Features />
        </div>
      </div>

      <div id="how-it-works">
        <HowItWorks />
      </div>
      <WellnessSection/>
      <TrustSection/>
      <FAQSection/>
      <Footer/>
    </div>
  );
};

export default LandingPage;