import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VETCO - Connecting Farmers and Vets',
  description: 'A platform for farmers to connect with veterinarians',
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