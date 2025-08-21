import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VoiceRef - AI-Powered Reference Checking',
  description: 'Automated web reference checking with AI analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
