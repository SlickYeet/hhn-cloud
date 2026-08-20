import type { Metadata } from "next"
import { Geist, Geist_Mono, Roboto } from "next/font/google"

import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"

import "@/styles/globals.css"
import "@/lib/api/server"

const robotoHeading = Roboto({
  subsets: ["latin"],
  variable: "--font-heading",
})

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  description: "HHN Cloud",
  title: "HHN Cloud",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={cn(robotoHeading.variable)} lang="en">
      <head>
        <meta content="HHN Cloud" name="apple-mobile-web-app-title" />
      </head>
      <body
        className={cn(geistSans.variable, geistMono.variable, "antialiased")}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
