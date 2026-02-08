"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "./AdminProvider";
import { AdminLogin } from "./AdminLogin";
import { useLayoutCoordinator } from "../context/LayoutCoordinator";
import { ADMIN_ANIMATION_CONFIG, type AdminScope } from "./types";

interface AdminPanelProps {
  /** Content to show when authenticated (e.g. AdminPanelContent) */
  children: ReactNode;
  /** Subdomain scope for filtering tabs and content */
  scope?: AdminScope;
}

/**
 * Full-screen right-sliding admin panel.
 * Triggered by Cmd+Shift+A via AdminProvider's keyboard listener.
 * Coordinates with TerminalNavigator via LayoutCoordinator for split-view.
 */
export function AdminPanel({ children, scope = "all" }: AdminPanelProps) {
  const { isModalOpen, isAdmin, toggleModal } = useAdmin();
  const { state, dimensions } = useLayoutCoordinator();
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isModalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isModalOpen]);

  // Close on Escape (handled in AdminProvider, but we handle click-outside here)
  // Note: We explicitly do NOT close on click-outside as per requirements

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop - visible only when terminal isn't covering it */}
          {!state.isTerminalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9997] bg-[var(--background)]"
            />
          )}

          {/* Admin Panel - slides from right */}
          <motion.div
            ref={panelRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: ADMIN_ANIMATION_CONFIG.stiffness,
              damping: ADMIN_ANIMATION_CONFIG.damping,
              mass: ADMIN_ANIMATION_CONFIG.mass,
            }}
            className="fixed right-0 z-[9998] flex flex-col overflow-hidden border-l border-[var(--border)] shadow-2xl bg-[var(--card-darker)]"
            style={{
              top: dimensions.adminTop,
              height: dimensions.adminHeight,
              width: "100vw",
            }}
            data-scope={scope}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--input-bg)] shrink-0">
              <div className="flex items-center gap-3">
                {/* Traffic light dots */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleModal}
                    className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all"
                    aria-label="Close admin panel"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] opacity-50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] opacity-50" />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  admin — {scope === "all" ? "master" : scope}
                </span>
              </div>

              <button
                onClick={toggleModal}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-xs font-mono px-2 py-1 rounded hover:bg-[var(--overlay-5)]"
                aria-label="Close admin panel"
              >
                [×]
              </button>
            </div>

            {/* Content area - no scroll, tabs fill 100% */}
            <div className="flex-1 overflow-hidden">
              {isAdmin ? children : <AdminLogin />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
