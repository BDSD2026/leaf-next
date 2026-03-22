import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'leaf — discuss what you\'ve read',
  description: 'A place to discuss what people learned from books.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Nav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
