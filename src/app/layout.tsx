import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PinAuthProvider } from '@/lib/pin-auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Restaurant POS System',
  description: 'A modern point of sale system for restaurants',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PinAuthProvider>
          {children}
        </PinAuthProvider>
      </body>
    </html>
  )
}