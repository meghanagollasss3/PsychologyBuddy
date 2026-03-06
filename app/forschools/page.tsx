'use client';


import HeroSection from "@/components/LandingPage/Pages/ForSchools/Hero";
import SchoolsRealImpact from "@/components/LandingPage/Pages/ForSchools/Impact";
import SimpleImplementation from "@/components/LandingPage/Pages/ForSchools/Simple";
import WhySchools from "@/components/LandingPage/Pages/ForSchools/WhySchools";
import Footer from "@/components/LandingPage/sections/Footer";

export default function Home() {
  return (
    <>
    <HeroSection/>
    <WhySchools/>
    <SimpleImplementation/>
    <SchoolsRealImpact/>
    <Footer/>
    </>
  );
}
