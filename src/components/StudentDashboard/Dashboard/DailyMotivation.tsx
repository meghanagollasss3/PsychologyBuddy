"use client";

import { Quote, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";

const QUOTES = [
  {
    text: "People tell you the world looks a certain way... you can design your own life.",
    author: "Carrie Ann Moss",
  },
  {
    text: "Some women choose to follow men, and some choose to follow their dreams. Your career will never wake up and tell you that it doesn’t love you anymore.",
    author: "Lady Gaga",
  },
  {
    text: "Life is what happens to us while we are making other plans.",
    author: "Allen Saunders",
  },
  {
    text: "Life isn’t about finding yourself. Life is about creating yourself.",
    author: "George Bernard Shaw",
  },
  {
    text: "You are the sum total of everything you’ve ever seen, heard, eaten, smelled, been told, forgot—everything influences each of us.",
    author: "Maya Angelou",
  },
  {
    text: "Doubt kills more dreams than failure ever will.",
    author: "Suzy Kassem",
  },
  {
    text: "Keep your face always toward the sunshine, and shadows will fall behind you.",
    author: "Walt Whitman",
  },
  {
    text: "Whether you think you can or think you can’t, you’re right.",
    author: "Henry Ford",
  },
  {
    text: "Your talent determines what you can do. Your motivation determines how much you’re willing to do. Your attitude determines how well you do it.",
    author: "Lou Holtz",
  },
  {
    text: "The happiness of your life depends on the quality of your thoughts.",
    author: "Marcus Aurelius",
  },
  {
    text: "Nothing is impossible. The word itself says ‘I’m possible!’",
    author: "Audrey Hepburn",
  },
  {
    text: "You are who you are meant to be. Live as if you’ll die today.",
    author: "James Dean",
  },
  {
    text: "You do not find the happy life. You make it.",
    author: "Camilla Eyring Kimball",
  },
  {
    text: "Happiness is not something readymade. It comes from your own actions.",
    author: "Dalai Lama",
  },
  {
    text: "Folks are usually about as happy as they make up their minds to be.",
    author: "Abraham Lincoln",
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
  },
  {
    text: "Discouragement and failure are stepping stones to success.",
    author: "Dale Carnegie",
  },
  {
    text: "You learn more from failure than from success. Failure builds character.",
    author: "Unknown",
  },
  {
    text: "Fairytales tell children that dragons can be killed.",
    author: "G. K. Chesterton",
  },
  {
    text: "The bad news is time flies. The good news is you’re the pilot.",
    author: "Michael Altshuler",
  },
  {
    text: "Just because it’s what’s done doesn’t mean it’s what should be done!",
    author: "Cinderella",
  },
  {
    text: "With a smile and a song, life is like a bright sunny day.",
    author: "Snow White",
  },
  {
    text: "It’s no use going back to yesterday because I was a different person then.",
    author: "Alice (Alice in Wonderland)",
  },
  {
    text: "When we get to the end of the story, you will know more than you do now.",
    author: "Hans Christian Andersen",
  },
  {
    text: "The most important thing in life is to stop saying ‘I wish’ and start saying ‘I will’.",
    author: "Charles Dickens",
  },
  {
    text: "Learn as if you will live forever, live like you will die tomorrow.",
    author: "Mahatma Gandhi",
  },
  {
    text: "All our dreams can come true if we have the courage to pursue them.",
    author: "Walt Disney",
  },
  {
    text: "Move out of your comfort zone. Growth happens when you feel uncomfortable.",
    author: "Brian Tracy",
  },
];

export default function DailyMotivation() {
  const [quote, setQuote] = useState(QUOTES[0]);

  const refreshQuote = () => {
    let newQuote;
    do {
      newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    } while (newQuote.text === quote.text); // avoid same quote

    setQuote(newQuote);
  };

  return (
    <div
      className="rounded-[16px] p-10 border-2 border-white bg-gradient-to-br 
                 from-[#bcffe5ac] via-[#edfff873] to-[#beffe0bc] drop-shadow-xl w-auto h-auto "
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Quote className="h-[20px] w-[25px] text-[#096112]" />
          <h3 className="text-[20px] font-semibold text-[#096112]">
            Daily Motivation
          </h3>
        </div>

        {/* Refresh Button */}
        <button
          onClick={refreshQuote}
          className="p-1.5  rounded-full drop-shadow-sm bg-[#c8ffdd] hover:bg-green-200 transition"
        >
          <RefreshCw className="h-4 w-4 text-[#5C7364]" />
        </button>
      </div>

      <p className="mt-8 text-[#3A3A3A] text-[16px] leading-relaxed">
        “{quote.text}”
      </p>

      <p className="mt-7 ml-60 text-[14px] text-[#7C7C7C]">— {quote.author}</p>
    </div>
  );
}