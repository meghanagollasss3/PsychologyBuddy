import Link from "next/link";
import { useState } from "react";

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
    <div className="w-full bg-gray-50 font-sans">
      {/* Hero Banner */}
      <div className="relative bg-[#1a9fd4] overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 left-10 text-white text-8xl">💬</div>
          <div className="absolute bottom-4 right-10 text-white text-7xl">🤝</div>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center py-14 px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
            Get in touch, Let us Know how<br />we can help.
          </h1>
          <p className="text-white/85 text-sm md:text-base">
            Psychology buddy is ready to provide the right solution according to your needs
          </p>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="max-w-4xl mx-auto px-6 -mt-1 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Chat to sales */}
          <div className="bg-white rounded-xl p-5 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-[#e8f6fd] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#1a9fd4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Chat to sales</p>
              <p className="text-gray-400 text-xs mb-1">Speak to our friendly team.</p>
              <p className="text-[#1a9fd4] text-xs font-medium">Psychologybuddysales@gmail.com</p>
            </div>
          </div>

          {/* Call us */}
          <div className="bg-white rounded-xl p-5 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-[#e8f6fd] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#1a9fd4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Call us</p>
              <p className="text-gray-400 text-xs mb-1">Mon-Fri from 9am to 5pm.</p>
              <p className="text-gray-700 text-xs font-medium">+91 000000000</p>
            </div>
          </div>

          {/* Visit us */}
          <div className="bg-white rounded-xl p-5 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-[#e8f6fd] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#1a9fd4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Visit us</p>
              <p className="text-gray-400 text-xs mb-1">Visit our office HQ.</p>
              <p className="text-gray-700 text-xs font-medium">PragatiNagar, Hyderabad</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form + Map */}
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Form */}
            <div className="p-8">
              <p className="text-[#1a9fd4] text-xs font-semibold mb-1">Contact us</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Get in touch</h2>
              <p className="text-gray-400 text-sm mb-6">We'd love to hear from you. Please fill out this form.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First full name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">School/Institution Name</label>
                  <input
                    type="text"
                    name="schoolName"
                    value={form.schoolName}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email ID</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone number</label>
                  <div className="flex gap-2">
                    <select className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] bg-white">
                      <option value="IN">IN</option>
                      <option value="US">US</option>
                      <option value="UK">UK</option>
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 0000000000"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a9fd4]/30 focus:border-[#1a9fd4] transition resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="agreed"
                    id="agree"
                    checked={form.agreed}
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#1a9fd4]"
                  />
                  <label htmlFor="agree" className="text-xs text-gray-500">
                    You agree to our friendly{" "}
                    <Link href="#" className="text-[#1a9fd4] underline">privacy policy</Link>.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1a9fd4] hover:bg-[#1589b8] text-white font-semibold text-sm py-2.5 rounded-lg transition-colors duration-200"
                >
                  Send message
                </button>
              </form>
            </div>

            {/* Map */}
            <div className="h-64 md:h-auto min-h-[400px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d243647.3160087256!2d78.24323046132812!3d17.412281099999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb99daeaebd2c7%3A0xae93b78392bafbc2!2sHyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "400px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Hyderabad Map"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-[#f0f9ff] border-t border-[#d0ecf9]">
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Let's get started on something great
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Join over 4,000+ startups already growing with Untitled.
          </p>
          <Link
            href="#"
            className="inline-flex items-center bg-[#1a9fd4] hover:bg-[#1589b8] text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors duration-200 shadow-md"
          >
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;