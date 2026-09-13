import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Eden — Landscape Worlds', description: 'Explore seven landscape architecture and urban design projects by Yizhan Zhang (Eden).' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html> }
