"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Trophy, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsDropdownOpen(false);
      router.push('/student-login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          
          {/* User Avatar and Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                {user?.studentProfile?.profileImage ? (
                  <img 
                    src={user.studentProfile.profileImage} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = getUserInitials();
                    }}
                  />
                ) : (
                  getUserInitials()
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                </div>
                
                <Link href="/students/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </div>
                </Link>
                
                {/* <Link href="/students/badges" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    My Badges
                  </div>
                </Link> */}
                
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    disabled={isLoggingOut}
                    className="w-full justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
