import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Psychology Buddy',
  description: 'Your AI-powered mental health companion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        {/* Temporarily disabled ClientRouteGuard for debugging */}
        {/* <ClientRouteGuard> */}
          <AuthProvider>
            {/* <AppProvider> */}
              {children}
            {/* </AppProvider> */}
          </AuthProvider>
        {/* </ClientRouteGuard> */}
        <Toaster />
      </body>
    </html>
  )
}
