"use client";

import { type ReactNode } from "react";
import {
  AdminProvider as SharedAdminProvider,
  useAdmin,
} from "@anipotts/ui/admin";
import {
  checkAuth,
  login,
  logout,
} from "@/app/actions";

// Re-export useAdmin so existing imports from "@/context/AdminContext" still work
export { useAdmin };

const adminActions = { checkAuth, login, logout };

export function AdminProvider({ children }: { children: ReactNode }) {
  return (
    <SharedAdminProvider actions={adminActions}>
      {children}
    </SharedAdminProvider>
  );
}
