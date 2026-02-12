"use client";

import { useState, useEffect, useCallback, memo, type ReactNode } from "react";
import { useAdmin } from "./AdminProvider";
import { FaSignOutAlt, FaExternalLinkAlt, FaMoon, FaSun, FaAdjust } from "react-icons/fa";
import type { AdminScope, AdminTabId } from "./types";
import { getTabsForScope, getDefaultTab } from "./tabs";

export type ThemeMode = "dark" | "light" | "system";

export interface AdminPanelContentProps {
  scope?: AdminScope;
  /** Render function for tab content - receives current tab id */
  renderTab: (tabId: AdminTabId) => ReactNode;
  /** Optional widget to show in the command bar (e.g., TypefullyStatusWidget) */
  statusWidget?: ReactNode;
  /** Optional link to live site */
  liveSiteUrl?: string;
  /** Current theme mode - passed from parent that has access to ThemeProvider */
  theme?: ThemeMode;
  /** Function to cycle through themes */
  onThemeChange?: () => void;
}

/**
 * Admin panel content with tab navigation.
 * Full-height layout with no scrolling. GPU-optimized.
 */
// Theme icon mapping
const THEME_ICONS: Record<ThemeMode, typeof FaMoon> = {
  dark: FaMoon,
  light: FaSun,
  system: FaAdjust,
};

export const AdminPanelContent = memo(function AdminPanelContent({
  scope = "all",
  renderTab,
  statusWidget,
  liveSiteUrl = "/",
  theme = "dark",
  onThemeChange,
}: AdminPanelContentProps) {
  const { logout } = useAdmin();
  const tabs = getTabsForScope(scope);
  const [activeTab, setActiveTab] = useState<AdminTabId>(getDefaultTab(scope));
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour12: false })
  );
  const ThemeIcon = THEME_ICONS[theme];

  // Update time every second (batched updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Memoized tab change handler
  const handleTabChange = useCallback((tabId: AdminTabId) => {
    setActiveTab(tabId);
  }, []);

  // Keyboard shortcuts for tab navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const tabIndex = parseInt(e.key);
        if (tabIndex >= 1 && tabIndex <= tabs.length) {
          e.preventDefault();
          handleTabChange(tabs[tabIndex - 1].id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabs, handleTabChange]);

  const handleLogout = useCallback(() => logout(), [logout]);

  return (
    <div className="h-full flex flex-col">
      {/* Command Bar - fixed height */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[var(--border)] p-4 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wide">
              ADMIN_{scope.toUpperCase()}
            </span>
          </div>
          <div className="hidden md:flex gap-1 text-[11px] font-mono text-[var(--text-muted)] items-center">
            <span>{currentTime}</span>
            {statusWidget && (
              <>
                <span className="text-[var(--text-faint)]">|</span>
                {statusWidget}
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1.5 rounded-lg border border-[var(--border)] flex-wrap" role="tablist" aria-label="Admin panel tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-mono uppercase tracking-wide transition-colors ${
                  isActive
                    ? "bg-[var(--overlay-10)] text-[var(--accent-400)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--input-bg)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {onThemeChange && (
            <button
              onClick={onThemeChange}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-400)] transition-colors font-mono flex items-center gap-1.5 px-2.5 py-2 rounded hover:bg-[var(--input-bg)]"
              aria-label={`Theme: ${theme}`}
              title={`Theme: ${theme} (click to cycle)`}
            >
              <ThemeIcon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline capitalize">{theme}</span>
            </button>
          )}
          <span className="text-[var(--text-faint)]">|</span>
          <a
            href={liveSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-400)] transition-colors font-mono flex items-center gap-1.5 px-2.5 py-2 rounded hover:bg-[var(--input-bg)]"
          >
            <FaExternalLinkAlt className="w-3 h-3" />
            <span className="hidden lg:inline">Live Site</span>
          </a>
          <span className="text-[var(--text-faint)]">|</span>
          <button
            onClick={handleLogout}
            className="text-xs text-red-400/80 hover:text-red-400 transition-colors font-mono flex items-center gap-1.5 px-2.5 py-2 rounded hover:bg-red-500/10"
          >
            <FaSignOutAlt className="w-3 h-3" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area - fills remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {renderTab(activeTab)}
      </div>
    </div>
  );
});
