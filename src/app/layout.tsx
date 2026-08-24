import type { Metadata } from "next"
import { Source_Code_Pro, Source_Serif_4 } from "next/font/google"

import { Providers } from "@/components/providers"
import { APP_DESCRIPTION, APP_NAME } from "@/constants/app"
import { cn } from "@/lib/utils"

import "@/styles/globals.css"
import "@/lib/api/server"

const sourceCodePro = Source_Code_Pro({
  subsets: [
    "latin",
    "latin-ext",
    "cyrillic",
    "cyrillic-ext",
    "greek",
    "greek-ext",
    "vietnamese",
  ],
  variable: "--font-source-code-pro",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
})

const sourceSerif4 = Source_Serif_4({
  subsets: [
    "latin",
    "latin-ext",
    "cyrillic",
    "cyrillic-ext",
    "greek",
    "vietnamese",
  ],
  variable: "--font-source-serif-4",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  description: APP_DESCRIPTION,
  title: APP_NAME,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className="dark" lang="en">
      <head>
        <meta content={APP_NAME} name="apple-mobile-web-app-title" />
      </head>
      <body
        className={cn(
          "antialiased",
          sourceCodePro.variable,
          sourceSerif4.variable,
          sourceCodePro.variable,
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
