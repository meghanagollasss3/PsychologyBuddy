import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const Navigation: React.FC = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      {/* Nav Container */}
      <div
  className="
    flex items-center justify-between
    px-3 py-3 rounded-full h-[61px]

    bg-white/50 border-[0.2px] border-white/40
    shadow-[0_4px_20px_rgba(0,0,0,0.08)]
    ring-1 ring-white/40

    backdrop-blur-md
  "
>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-[47px] h-[47px] rounded-full bg-white flex items-center justify-center shadow">
            <Image
              src="/Logo.png"
              alt="Psychology Buddy Logo"
              width={40}
              height={40}
              className="w-[30px] h-[30px]"
            />
          </div>

          <span className="text-[21px] font-semibold bg-gradient-to-b from-[#00A7DA] to-[#0F71A1] bg-clip-text text-transparent">
            <Link href="/">Psychology Buddy</Link>
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div className="flex items-center gap-10 mr-5">

        <div className="hidden md:flex gap-13 text-[#01243C] text-[16px] font-medium">
          <Link href="/about" className="hover:text-[#1B9EE0] transition">
            About us
          </Link>
          <Link href="/contact" className="hover:text-[#1B9EE0] transition">
            Contact us
          </Link>
          <Link href="/forschools" className="hover:text-[#1B9EE0] transition">
            For schools
          </Link>
        </div>

        {/* CTA Button (visible on all screens) */}
        <Button
          onClick={handleGetStarted}
          className="
            bg-gradient-to-b from-[#4FC1F9] to-[#1B9EE0]
            text-[16px] text-white
            px-[16px] py-[6px]
            rounded-[24px]
            font-medium
            hover:bg-[#1588c2]
            transition-all duration-200
            shadow-md hover:shadow-lg
          "
        >
          Lets Started
        </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 