import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rintu Studio: build and deploy console',
  description:
    'A live console for Rintu’s repositories, deployments and workflow runs, read from the GitHub API.',
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#08090d',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
