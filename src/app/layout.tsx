import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'LifeOS — Your AI Chief of Staff',
  description:
    'An AI-powered Personal Life Operating System that helps you build a meaningful, balanced, and successful life.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
