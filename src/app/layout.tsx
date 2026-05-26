import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SolanaDefi — Финансы будущего',
  description: 'Премиальный финтех на самом быстром блокчейне.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
