import { cookies } from "next/headers";
import { verifySessionToken, ADMIN_COOKIE } from "@anipotts/lib/admin";
import { JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";
import LoginForm from "./login-form";
import AdminNav from "./admin-nav";
import "./globals.css";
import "./admin.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = process.env.ADMIN_PASSWORD;

  const isAuthenticated = token && secret && verifySessionToken(token, secret);

  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <head>
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="bg-zinc-950 text-zinc-100 font-mono antialiased">
        {!isAuthenticated ? (
          <div className="min-h-screen flex items-center justify-center p-4">
            <LoginForm />
          </div>
        ) : (
          <div className="h-screen flex overflow-hidden">
            <AdminNav />
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
