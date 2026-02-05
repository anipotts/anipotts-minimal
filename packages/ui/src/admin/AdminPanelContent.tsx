"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useAdmin } from "./AdminProvider";
import { FaSignOutAlt, FaLayerGroup } from "react-icons/fa";
import type { AdminScope, AdminTabId } from "./types";
import { getTabsForScope, getDefaultTab, type TabConfig } from "./tabs";

export interface AdminPanelContentProps {
  scope?: AdminScope;
  /** Render function for tab content - receives current tab id */
  renderTab: (tabId: AdminTabId) => ReactNode;
  /** Optional widget to show in the command bar (e.g., TypefullyStatusWidget) */
  statusWidget?: ReactNode;
  /** Optional link to live site */
  liveSiteUrl?: string;
}

/**
 * Admin panel content with tab navigation.
 * The actual tab content is provided by the app via renderTab prop.
 */
export function AdminPanelContent({
  scope = "all",
  renderTab,
  statusWidget,
  liveSiteUrl = "/",
}: AdminPanelContentProps) {
  const { logout } = useAdmin();
  const tabs = getTabsForScope(scope);
  const [activeTab, setActiveTab] = useState<AdminTabId>(getDefaultTab(scope));
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts for tab navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const tabIndex = parseInt(e.key);
        if (tabIndex >= 1 && tabIndex <= tabs.length) {
          e.preventDefault();
          setActiveTab(tabs[tabIndex - 1].id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabs]);

  return (
    <div className="flex flex-col gap-6 min-h-full">
      {/* Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-input border border-border rounded-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-secondary uppercase tracking-widest">
              ADMIN_{scope.toUpperCase()}
            </span>
          </div>
          <div className="hidden md:flex gap-1 text-[10px] font-mono text-muted items-center">
            <span>{currentTime}</span>
            {statusWidget && (
              <>
                <span className="text-faint">|</span>
                {statusWidget}
              </>
            )}
            <span className="text-faint">|</span>
            <span>content-network</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-[rgba(var(--overlay-invert),0.4)] p-1 rounded-lg border border-border flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? "bg-overlay-10 text-accent-400 shadow-sm"
                    : "text-muted hover:text-secondary hover:bg-input"
                }`}
                title={`${tab.label} ${tab.shortcut}`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="hidden md:inline opacity-50 text-[8px] ml-1">
                  {tab.shortcut}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <a
            href={liveSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted hover:text-white transition-colors font-mono flex items-center gap-2"
          >
            <FaLayerGroup />
            <span className="hidden md:inline">Live Site</span>
          </a>
          <button
            onClick={() => logout()}
            className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-mono flex items-center gap-2 border border-red-500/20 px-3 py-1.5 rounded hover:bg-red-500/10"
          >
            <FaSignOutAlt />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow relative">
        <div
          key={activeTab}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {renderTab(activeTab)}
        </div>
      </div>
    </div>
  );
}
