"use client";

export { AdminProvider, useAdmin } from "./AdminProvider";
export type { AdminActions, AdminContextType } from "./AdminProvider";
export { AdminShell } from "./AdminShell";
export { AdminLogin } from "./AdminLogin";
export { AdminPanel } from "./AdminPanel";
export { AdminPanelContent } from "./AdminPanelContent";
export type { AdminPanelContentProps } from "./AdminPanelContent";
export type {
  AdminScope,
  AdminTabId,
} from "./types";
export { SCOPE_TAB_CONFIG, ADMIN_ANIMATION_CONFIG } from "./types";
export { getTabsForScope, getDefaultTab, ALL_TABS } from "./tabs";
export type { TabConfig } from "./tabs";
