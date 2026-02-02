"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  FaTerminal,
  FaEdit,
  FaSignOutAlt,
  FaLayerGroup,
  FaList,
  FaGraduationCap,
  FaClock,
  FaCog,
  FaChartLine,
} from "react-icons/fa";
import Link from "next/link";

// Tab components
import PipelineTab from "./tabs/PipelineTab";
import ContentTab from "./tabs/ContentTab";
import AtomsTab from "./tabs/AtomsTab";
import ScheduleTab from "./tabs/ScheduleTab";
import ConfigTab from "./tabs/ConfigTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import TypefullyStatusWidget from "./TypefullyStatusWidget";

type TabName = "pipeline" | "content" | "atoms" | "schedule" | "config" | "analytics";

interface TabConfig {
  id: TabName;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}

const TABS: TabConfig[] = [
  { id: "pipeline", label: "Pipeline", icon: FaList, shortcut: "⌘1" },
  { id: "content", label: "Content", icon: FaEdit, shortcut: "⌘2" },
  { id: "atoms", label: "Atoms", icon: FaGraduationCap, shortcut: "⌘3" },
  { id: "schedule", label: "Schedule", icon: FaClock, shortcut: "⌘4" },
  { id: "config", label: "Config", icon: FaCog, shortcut: "⌘5" },
  { id: "analytics", label: "Analytics", icon: FaChartLine, shortcut: "⌘6" },
];

export default function AdminHub() {
  const { logout } = useAdmin();
  const [activeTab, setActiveTab] = useState<TabName>("pipeline");
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
        if (tabIndex >= 1 && tabIndex <= TABS.length) {
          setActiveTab(TABS[tabIndex - 1].id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "pipeline":
        return <PipelineTab />;
      case "content":
        return <ContentTab />;
      case "atoms":
        return <AtomsTab />;
      case "schedule":
        return <ScheduleTab />;
      case "config":
        return <ConfigTab />;
      case "analytics":
        return <AnalyticsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-[80vh]">
      {/* Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-input border border-border rounded-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-secondary uppercase tracking-widest">
              ANIPOTTS_ADMIN_HUB
            </span>
          </div>
          <div className="hidden md:flex gap-1 text-[10px] font-mono text-muted items-center">
            <span>{currentTime}</span>
            <span className="text-faint">|</span>
            <TypefullyStatusWidget />
            <span className="text-faint">|</span>
            <span>content-network</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-[rgba(var(--overlay-invert),0.4)] p-1 rounded-lg border border-border flex-wrap">
          {TABS.map((tab) => {
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
          <Link
            href="/thoughts"
            target="_blank"
            className="text-xs text-muted hover:text-white transition-colors font-mono flex items-center gap-2"
          >
            <FaLayerGroup />
            <span className="hidden md:inline">Live Site</span>
          </Link>
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
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
