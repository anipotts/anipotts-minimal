"use client";

import { type ReactNode, useCallback } from "react";
import {
  AdminProvider as SharedAdminProvider,
  useAdmin,
} from "@anipotts/ui/admin";
import {
  useLayoutCoordinator,
  LayoutCoordinatorProvider,
} from "@anipotts/ui/context";
import {
  checkAuth,
  login,
  logout,
} from "@/app/admin/actions";

// Re-export useAdmin so existing imports from "@/context/AdminContext" still work
export { useAdmin };

const adminActions = { checkAuth, login, logout };

/**
 * Inner provider that connects AdminProvider to LayoutCoordinator.
 */
function AdminProviderInner({ children }: { children: ReactNode }) {
  const layout = useLayoutCoordinator();

  const handleModalChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        layout.openAdmin();
      } else {
        layout.closeAdmin();
      }
    },
    [layout]
  );

  return (
    <SharedAdminProvider actions={adminActions} onModalChange={handleModalChange}>
      {children}
    </SharedAdminProvider>
  );
}

/**
 * AdminProvider wrapped with LayoutCoordinator for terminal coordination.
 */
export function AdminProvider({ children }: { children: ReactNode }) {
  return (
    <LayoutCoordinatorProvider>
      <AdminProviderInner>{children}</AdminProviderInner>
    </LayoutCoordinatorProvider>
  );
}
