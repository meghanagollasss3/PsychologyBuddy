'use client';

import WhatWeOffer from "@/components/LandingPage/Pages/About/WhatWeOffer";
import AboutSection from "../../components/LandingPage/Pages/About/About";
import Footer from "@/components/LandingPage/sections/Footer";
// import LandingPageNew from "@/components/LandingPageNew/LandingPageNew";
// import LandingPage from "../components/LandingPage/LandingPage";

export default function Home() {
  return (
    <>
    <AboutSection />
    <WhatWeOffer/>
    <Footer/>
    </>
  );
}
