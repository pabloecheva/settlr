import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Settlr - Smart Contract Escrow",
  description: "Secure escrow management for smart contracts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50/50`}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  )
}
