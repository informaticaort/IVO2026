import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Press_Start_2P } from 'next/font/google'
import { PresenceReporter } from '@/components/presence/presence-reporter'
import { CountdownGate } from '@/components/gate/countdown-gate'
import { InfoLogo } from '@/components/info-logo'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const pressStart = Press_Start_2P({
  variable: '--font-press-start',
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'IA Fuera de Control | Sala de Escape',
  description: 'Sala de escape: IA Fuera de Control',
  icons: {
    icon: [
      {
        url: '/images/InfoOrtLogo.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/images/InfoOrtLogo.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/images/InfoOrtLogo.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/images/InfoOrtLogo.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#070a14',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`dark bg-background ${geistSans.variable} ${geistMono.variable} ${pressStart.variable}`}
    >
      <body className="font-sans antialiased">
        {/* Nadie entra al proyecto hasta que termina la cuenta regresiva
            (o hasta que se ingresa la clave de acceso anticipado). */}
        <CountdownGate>
          <PresenceReporter />
          {children}
        </CountdownGate>
        <InfoLogo />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
