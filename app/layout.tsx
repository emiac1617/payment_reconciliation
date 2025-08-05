import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Payment reconciliation App',
  description: 'Payment reconciliation dashboard for managing financial transactions',
  generator: 'v0.dev',
  icons: {
    icon: 'https://imedia.sgp1.digitaloceanspaces.com/emiac/2021/06/png-100x100.png',
    shortcut: 'https://imedia.sgp1.digitaloceanspaces.com/emiac/2021/06/png-100x100.png',
    apple: 'https://imedia.sgp1.digitaloceanspaces.com/emiac/2021/06/png-100x100.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
