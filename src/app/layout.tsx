import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { RegisterSW } from "@/components/providers/register-sw";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
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
    "A premium personal productivity operating system. Tasks, calendar, notes, habits, goals, focus, and analytics — Notion + Linear + Apple in one elegant app.",
  applicationName: "LifeOS",
  authors: [{ name: "LifeOS" }],
  keywords: ["productivity", "tasks", "calendar", "notes", "habits", "PWA"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LifeOS",
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
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#070a12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} min-h-full antialiased`}
      >
        <Providers>
          <RegisterSW />
          {children}
        </Providers>
      </body>
    </html>
  );
}
