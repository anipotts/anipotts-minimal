import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://labs.anipotts.com"),
  title: {
    default: "anipotts / labs",
    template: "%s · anipotts / labs",
  },
  description:
    "Observable artifacts from Ani's autonomous framework. Weekly bot-authored digests plus human-authored experiments.",
  authors: [{ name: "Ani Potts", url: "https://anipotts.com" }],
  openGraph: {
    type: "website",
    title: "anipotts / labs",
    description:
      "Observable artifacts from Ani's autonomous framework. Weekly bot-authored digests plus human-authored experiments.",
    url: "https://labs.anipotts.com",
    siteName: "anipotts / labs",
  },
  twitter: {
    card: "summary",
    creator: "@anipotts",
    title: "anipotts / labs",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://labs.anipotts.com" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <meta name="theme-color" content="#fbfaf7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#11111b" media="(prefers-color-scheme: dark)" />
      </head>
      <body>{children}</body>
    </html>
  );
}
