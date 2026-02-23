'use client';

import React from 'react';
import { Bell, Search, Heart, ChevronDown, ChevronRight, Menu, ArrowLeft, Clock, Smile, Frown, TrendingUp, Users, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-blue-600/10 p-1.5 sm:p-2 rounded-xl">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
          </div>
          <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-500">
            Psychology Buddy
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          <div className="relative cursor-pointer group">
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] text-white font-bold ring-2 ring-white">
              2
            </div>
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-slate-500 group-hover:text-slate-800 transition-colors" />
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5 cursor-pointer ring-2 ring-slate-100 hover:ring-blue-200 transition-all">
            <img 
              src="https://picsum.photos/100/100" 
              alt="User" 
              className="w-full h-full rounded-full object-cover border-2 border-white"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
