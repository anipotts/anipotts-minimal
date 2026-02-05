"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import posthog from "posthog-js";

/**
 * Server action callbacks that each app provides.
 * These stay per-app because "use server" functions can't cross app boundaries.
 */
export interface AdminActions {
  checkAuth: () => Promise<boolean>;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export interface AdminContextType {
  isAdmin: boolean;
  isModalOpen: boolean;
  toggleModal: () => void;
  openModal: () => void;
  closeModal: () => void;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
  actions: AdminActions;
  /** Optional callback when modal state changes - for layout coordination */
  onModalChange?: (isOpen: boolean) => void;
}

export function AdminProvider({ children, actions, onModalChange }: AdminProviderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync modal state with external coordinator
  useEffect(() => {
    onModalChange?.(isModalOpen);
  }, [isModalOpen, onModalChange]);

  useEffect(() => {
    actions.checkAuth().then(setIsAdmin);
  }, [actions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+A (Mac) or Ctrl+Shift+A (Windows/Linux)
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "a"
      ) {
        e.preventDefault();
        setIsModalOpen((prev) => !prev);
      }

      // Escape to close
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const toggleModal = useCallback(() => setIsModalOpen((prev) => !prev), []);
  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const login = async (password: string) => {
    const res = await actions.login(password);
    if (res.success) {
      setIsAdmin(true);
      posthog.identify("admin_user", { role: "admin" });
      posthog.capture("admin_login_success");
    }
    return res;
  };

  const logout = async () => {
    await actions.logout();
    setIsAdmin(false);
    posthog.capture("admin_logout");
    posthog.reset();
  };

  return (
    <AdminContext.Provider
      value={{ isAdmin, isModalOpen, toggleModal, openModal, closeModal, login, logout }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
