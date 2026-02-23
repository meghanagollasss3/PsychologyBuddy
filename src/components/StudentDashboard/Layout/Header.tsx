"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Trophy } from "lucide-react";

export default function Header() {
  // const { logout, isLoading } = useLogout();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="px-5 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/Logo.png" 
              alt="Psychology Buddy Logo" 
              width={46}
              height={46}
              className="w-[30px] h-[30px] sm:w-[36px] sm:h-[36px]"
            />
            <h1 className="text-[21px] font-semibold text-[#1a9bcc]">
              Psychology Buddy
            </h1>
          </div>
          
          {/* <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isLoading ? 'Logging out...' : 'Logout'}
            </span>
          </Button> */}
        </div>
      </div>
    </header>
  );
}
