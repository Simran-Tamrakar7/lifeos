import type { Metadata, Viewport } from "next";
import { Fraunces, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { RegisterSW } from "@/components/providers/register-sw";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "LifeOS — Your Personal Operating System",
    template: "%s · LifeOS",
  },
  description:
    "A premium personal productivity operating system with Ledger-inspired typography and ink palette.",
  applicationName: "LifeOS",
  authors: [{ name: "LifeOS" }],
  keywords: ["productivity", "tasks", "calendar", "notes", "habits", "PWA"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LifeOS",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "LifeOS — Your Personal Operating System",
    description: "A second brain you'll actually enjoy opening every day.",
    type: "website",
    siteName: "LifeOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "LifeOS",
    description: "Your personal operating system for work and life.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1f2a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${publicSans.variable} ${plexMono.variable} ${fraunces.variable} min-h-full antialiased`}
      >
        <Providers>
          <RegisterSW />
          {children}
        </Providers>
      </body>
    </html>
  );
}
