import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import clsx from "clsx";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ani Potts",
  description: "Software Engineer building minimal interfaces for messy systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={clsx(inter.variable, spaceGrotesk.variable, "dark")}>
      <body className="antialiased min-h-screen flex flex-col items-center bg-background text-foreground selection:bg-accent-400/20 selection:text-accent-400">
        <div className="w-full max-w-3xl px-6 md:px-8 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow w-full">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
