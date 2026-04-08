import { cookies } from "next/headers";
import { verifySessionToken, ADMIN_COOKIE } from "@anipotts/lib/admin";
import type { Metadata } from "next";
import LoginForm from "./login-form";
import AdminNav from "./admin-nav";
import "./admin.css";

export const metadata: Metadata = {
  title: "Content Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = process.env.ADMIN_PASSWORD;

  const isAuthenticated = token && secret && verifySessionToken(token, secret);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex overflow-hidden">
      <AdminNav />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
