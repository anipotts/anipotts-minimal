import type { IconType } from "react-icons";
import { FaList, FaEdit, FaGraduationCap, FaClock, FaCog, FaChartLine, FaServer, FaDatabase, FaGlobe } from "react-icons/fa";
import type { AdminScope, AdminTabId } from "../types";
import { SCOPE_TAB_CONFIG } from "../types";

export interface TabConfig {
  id: AdminTabId;
  label: string;
  icon: IconType;
  shortcut: string;
}

/**
 * All available tab configurations.
 */
export const ALL_TABS: TabConfig[] = [
  { id: "pipeline", label: "Pipeline", icon: FaList, shortcut: "⌘1" },
  { id: "content", label: "Content", icon: FaEdit, shortcut: "⌘2" },
  { id: "atoms", label: "Atoms", icon: FaGraduationCap, shortcut: "⌘3" },
  { id: "schedule", label: "Schedule", icon: FaClock, shortcut: "⌘4" },
  { id: "config", label: "Config", icon: FaCog, shortcut: "⌘5" },
  { id: "site", label: "Site", icon: FaGlobe, shortcut: "⌘6" },
  { id: "analytics", label: "Analytics", icon: FaChartLine, shortcut: "⌘7" },
  { id: "metrics", label: "Metrics", icon: FaDatabase, shortcut: "⌘8" },
  { id: "status", label: "Status", icon: FaServer, shortcut: "⌘9" },
];

/**
 * Get tabs available for a given scope.
 */
export function getTabsForScope(scope: AdminScope): TabConfig[] {
  const allowedIds = SCOPE_TAB_CONFIG[scope] ?? SCOPE_TAB_CONFIG["all"];
  return ALL_TABS.filter((tab) => allowedIds.includes(tab.id));
}

/**
 * Get the default tab for a scope (first available tab).
 */
export function getDefaultTab(scope: AdminScope): AdminTabId {
  const tabs = getTabsForScope(scope);
  return tabs[0]?.id ?? "analytics";
}

export type { ContentStatusGroup } from "./types";
export { STATUS_COLUMNS } from "./types";
