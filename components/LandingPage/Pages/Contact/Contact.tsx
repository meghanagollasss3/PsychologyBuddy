import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui";


const ContactPage = () => {
  const [form, setForm] = useState({
    fullName: "",
    schoolName: "",
    email: "",
    phone: "",
    message: "",
    agreed: false,
  });

  const handleChange = (e: { target: { name: any; value: any; type: any; checked?: any; }; }) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <div className="w-full bg-[#F4F6F9]">
      {/* Hero Banner */}
      <div className="relative w-full h-[354px] bg-gradient-to-b from-[#1f94ce] to-[#1e8cc6]">
              {/* Background Image */}
              <Image 
                src="/about/2.svg" 
                alt="Psychology Buddy Background" 
                fill
                className="object-contain"
              />
              
            </div>

      {/* Contact Info Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-1 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Chat to sales */}
          <div className="bg-white rounded-[24px] p-5 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className="rounded-full bg-[#e8f6fd] flex items-center justify-center flex-shrink-0">
              <Image 
                        src="/contact/1.svg" 
                        alt="Psychology Buddy Background" 
                        width={70}
                        height={70}
                        className="object-cover "
                      />
            </div>
            <div>
              <p className="font-semibold text-[#2F3D43] text-[18px]">Chat to sales</p>
              <p className="text-[#767676] text-[14px] mb-1">Speak to our friendly team.</p>
              <p className="text-[#686D70] text-[14px] font-medium">Psychologybuddysales@gmail.com</p>
            </div>
          </div>

          {/* Call us */}
          <div className="bg-white rounded-[24px] p-5 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className="rounded-full bg-[#e8f6fd] flex items-center justify-center flex-shrink-0">
              <Image 
                        src="/contact/2.svg" 
                        alt="Psychology Buddy Background" 
                        width={70}
                        height={70}
                        className="object-cover "
                      />
            </div>
            <div>
              <p className="font-semibold text-[#2F3D43] text-[18px]">Call us</p>
              <p className="text-[#767676] text-[14px] mb-1">Mon-Fri from 9am to 5pm.</p>
              <p className="text-[#686D70] text-[14px] font-medium">+91 000000000</p>
            </div>
          </div>

          {/* Visit us */}
          <div className="bg-white rounded-[24px] p-5 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className=" rounded-full bg-[#e8f6fd] flex items-center justify-center flex-shrink-0">
              <Image 
                        src="/contact/3.svg" 
                        alt="Psychology Buddy Background" 
                        width={70}
                        height={70}
                        className="object-cover "
                      />
            </div>
            <div>
              <p className="font-semibold text-[#2F3D43] text-[18px]">Visit us</p>
              <p className="text-[#767676] text-[14px] mb-1">Visit our office HQ.</p>
              <p className="text-[#686D70] text-[14px] font-medium">PragatiNagar, Hyderabad</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form + Map */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Form */}
            <div className="p-8 flex flex-col justify-center items-center">
              <p className="text-[#1B9EE0] text-[16px] font-semibold mb-1">Contact us</p>
              <h2 className="text-[36px] font-semibold text-[#2F3D43] mb-1">Get in touch</h2>
              <p className="text-[#686D70] text-[20px] mb-6">We'd love to hear from you. Please fill out this form.</p>

              <form onSubmit={handleSubmit} className="space-y-4 w-full">
                <div>
                  <label className="block text-[14px] font-medium text-[#344054] mb-1">First full name</label>
                  <Input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    // className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] transition"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#344054] mb-1">School/Institution Name</label>
                  <Input
                    type="text"
                    name="schoolName"
                    value={form.schoolName}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    // className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] transition"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#344054] mb-1">Email ID</label>
                  <Input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    // className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] transition"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#344054] mb-1">Phone number</label>
                  <div className="flex gap-2">
                    <select className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] bg-white">
                      <option value="IN">IN</option>
                      <option value="US">US</option>
                      <option value="UK">UK</option>
                    </select>
                    <Input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 0000000000"
                      // className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#344054] mb-1">Message</label>
                  <Textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] transition resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="checkbox"
                    name="agreed"
                    id="agree"
                    checked={form.agreed}
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#1a9fd4]"
                  />
                  <label htmlFor="agree" className="text-[16px] text-[#667085]">
                    You agree to our friendly{" "}
                    <Link href="#" className="text-[#1a9fd4] underline">privacy policy</Link>.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1B9EE0] hover:bg-[#1589b8] text-white font-semibold text-[16px] py-3 rounded-[16px] transition-colors duration-200"
                >
                  Send message
                </button>
              </form>
            </div>

            {/* Map */}
            <div className="h-64 md:h-auto min-h-[400px] px-8 py-16">
              <iframe
                src="https://www.google.com/maps?q=17.5195056,78.3918841&z=17&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "400px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Hyderabad Map"
                className="rounded-[12px] border-2 border-[#D4D4D4]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex items-center justify-center ">

      <div className="bg-white m-4 rounded-[16px] drop-shadow-lg max-w-5xl w-full">
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <h2 className="text-2xl md:text-[30px] font-semibold text-[#2F3D43] mb-2">
            Let's get started on something great
          </h2>
          <p className="text-[#686D70] text-16px mb-6">
            Join over 4,000+ startups already growing with Untitled.
          </p>
          <Link
            href="#"
            className="inline-flex items-center bg-[#1B9EE0] hover:bg-[#1589b8] text-white font-medium text-[16px] px-6 py-2.5 rounded-full transition-colors duration-200 shadow-md"
            >
            Get started
          </Link>
        </div>
            </div>
      </div>
    </div>
  );
};

export default ContactPage;