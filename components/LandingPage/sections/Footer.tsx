import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <footer className="bg-[#1B9EE0] text-white w-full">
      <div className="max-w-8xl mx-auto px-6 sm:px-6 lg:px-24 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              {/* Logo placeholder — replace with your actual logo */}
              <Image
                src="/Logo.png"
                alt="Psychology Buddy Logo"
                width={47}
                height={47}
                className="w-[47px] h-[47px]"
              />
              <span className="font-semibold text-lg sm:text-xl lg:text-[21px] leading-tight">
                Psychology Buddy
              </span>
            </div>
            <p className="text-sm sm:text-base lg:text-[16px] text-[#EFEFEF]/70 leading-relaxed">
              Supporting student mental health through accessible, compassionate
              resources.
            </p>
          </div>

          {/* Platform, Company, and Legal sections */}
          {/* Platform, Company, and Legal sections */}
<div className="lg:col-span-3 grid grid-cols-3 gap-6 lg:gap-1 lg:ml-15">

  {/* Platform */}
  <div>
    <h3 className="font-semibold text-[16px] sm:text-xl lg:text-[21px] mb-4">
      Platform
    </h3>
    <ul className="space-y-3 text-sm sm:text-base lg:text-[16px] text-[#EFEFEF]/70">
      <li>
        <button
          onClick={() => scrollToSection("features")}
          className="hover:text-white transition-colors"
        >
          Features
        </button>
      </li>
      <li>
        <button
          onClick={() => scrollToSection("how-it-works")}
          className="hover:text-white transition-colors"
        >
          How it work
        </button>
      </li>
    </ul>
  </div>

  {/* Company */}
  <div>
    <h3 className="font-semibold text-[16px] sm:text-xl lg:text-[21px] mb-4">
      Company
    </h3>
    <ul className="space-y-3 text-sm sm:text-base lg:text-[16px] text-[#EFEFEF]/70">
      <li>
        <Link href="/about" className="hover:text-white transition-colors">
          About
        </Link>
      </li>
      <li>
        <Link href="/contact" className="hover:text-white transition-colors">
          Contact Us
        </Link>
      </li>
      <li>
        <Link href="/forschools" className="hover:text-white transition-colors">
          For Schools
        </Link>
      </li>
      
    </ul>
  </div>

  {/* Legal */}
  <div>
    <h3 className="font-semibold text-[16px] sm:text-xl lg:text-[21px] mb-4">
      Legal
    </h3>
    <ul className="space-y-3 text-sm sm:text-base lg:text-[16px] text-[#EFEFEF]/70">
      <li>
        <Link href="/termsandconditions" className="hover:text-white transition-colors">
          Terms & Conditions
        </Link>
      </li>
      <li>
        <Link href="#" className="hover:text-white transition-colors">
          Privacy Policy
        </Link>
      </li>
      <li>
        <Link href="/contact" className="hover:text-white transition-colors">
          Contact
        </Link>
      </li>
    </ul>
  </div>

</div>

          {/* Connect */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-[16px] sm:text-xl lg:text-[21px] mb-4">Connect with us</h3>
            <div className="flex gap-3 mb-5">
              {/* LinkedIn */}
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-8 h-8  flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/footer/l.svg"
                  alt='linked in'
                  width={80}
                  height={80}
                  className="object-contain w-6 h-5 lg:w-8 lg:h-8"
                />
              </a>

              {/* Facebook */}
              <a
                href="#"
                aria-label="Facebook"
                className="w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                 <Image
                          src="/footer/f.svg"
                          alt='linked in'
                          width={80}
                          height={80}
                          className="object-contain w-6 h-5 lg:w-8 lg:h-8"
                        />
              </a>

              {/* YouTube */}
              <a
                href="#"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                 <Image
                          src="/footer/y.svg"
                          alt='linked in'
                          width={80}
                          height={80}
                          className="object-contain w-6 h-5 lg:w-8 lg:h-8"
                        />
              </a>

              {/* Twitter/X */}
              <a
                href="#"
                aria-label="Twitter"
                className="w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                 <Image
                          src="/footer/t.svg"
                          alt='linked in'
                          width={80}
                          height={80}
                          className="object-contain w-6 h-5 lg:w-8 lg:h-8"
                        />
              </a>

              {/* Phone/WhatsApp */}
              <a
                href="#"
                aria-label="Phone"
                className="w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                 <Image
                          src="/footer/w.svg"
                          alt='linked in'
                          width={80}
                          height={80}
                          className="object-contain w-6 h-5 lg:w-8 lg:h-8"
                        />
              </a>
            </div>

            <p className="text-sm sm:text-base lg:text-[16px] text-[#EFEFEF]/70 mb-1">
              support@psychologybuddy.edu
            </p>
            <p className="text-sm sm:text-base lg:text-[16px] text-[#EFEFEF]/70">+91 0000000000</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#D3D0D0] mt-8 sm:mt-10 pt-4 sm:pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm sm:text-base lg:text-[16px] text-[#EFEFEF]/70">
          <p> 2025 Psychology Buddy. All rights reserved.</p>
          <p className="hidden md:block">
            Made with{" "}
            <span className="text-white" aria-label="love">
              ♡
            </span>{" "}
            for student wellbeing
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;