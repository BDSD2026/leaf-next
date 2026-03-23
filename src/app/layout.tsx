import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import ThemeProvider from '@/components/ThemeProvider'
import MobileTabBar from '@/components/MobileTabBar'

export const metadata: Metadata = {
  title: 'leaf — discuss what you\'ve read',
  description: 'A place to discuss what people learned from books.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Nav />
          {children}
          <MobileTabBar />
        </ThemeProvider>
      </body>
    </html>
  )
}
