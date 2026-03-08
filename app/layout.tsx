import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import QueryProvider from "@/src/providers/QueryProvider"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Psychology Buddy",
  description: "Your AI-powered mental health companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}