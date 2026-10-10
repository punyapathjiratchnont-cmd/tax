import type { Metadata } from 'next'
import { Prompt, Space_Mono, Mali } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-prompt-next',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono-next',
})

const mali = Mali({
  subsets: ['thai', 'latin'],
  weight: ['700'],
  variable: '--font-title-next',
})

export const metadata: Metadata = {
  title: 'tax',
  description: 'tax web page',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} ${spaceMono.variable} ${mali.variable} bg-[#060b07] text-white antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
