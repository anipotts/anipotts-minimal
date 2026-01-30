"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { FaTerminal, FaEdit, FaSignOutAlt, FaLayerGroup } from "react-icons/fa";
import AnalyticsMonitor from "./AnalyticsMonitor";
import ContentManager from "./ContentManager";
import Link from "next/link";

export default function AdminCommandCenter() {
  const { logout } = useAdmin();
  const [activeTab, setActiveTab] = useState<"monitor" | "editor">("monitor");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "1") setActiveTab("monitor");
      if (e.metaKey && e.key === "2") setActiveTab("editor");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col gap-6 min-h-[80vh]">
      {/* Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-input border border-border rounded-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-secondary uppercase tracking-widest">
              ADMIN_ROOT
            </span>
          </div>
          <div className="hidden md:flex gap-1 text-[10px] font-mono text-muted">
            <span>{currentTime}</span>
            <span className="text-faint">|</span>
            <span>us-east-1</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[rgba(var(--overlay-invert),0.4)] p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab("monitor")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === "monitor"
                ? "bg-overlay-10 text-accent-400 shadow-sm"
                : "text-muted hover:text-secondary hover:bg-input"
            }`}
          >
            <FaTerminal />
            <span>Monitor</span>
            <span className="hidden md:inline opacity-50 text-[8px] ml-1">1</span>
          </button>
          <button
            onClick={() => setActiveTab("editor")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === "editor"
                ? "bg-overlay-10 text-accent-400 shadow-sm"
                : "text-muted hover:text-secondary hover:bg-input"
            }`}
          >
            <FaEdit />
            <span>Editor</span>
            <span className="hidden md:inline opacity-50 text-[8px] ml-1">2</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" target="_blank" className="text-xs text-muted hover:text-white transition-colors font-mono flex items-center gap-2">
            <FaLayerGroup />
            <span className="hidden md:inline">Live Site</span>
          </Link>
          <button
            onClick={() => logout()}
            className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-mono flex items-center gap-2 border border-red-500/20 px-3 py-1.5 rounded hover:bg-red-500/10"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow relative">
        {activeTab === "monitor" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AnalyticsMonitor />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ContentManager />
          </div>
        )}
      </div>
    </div>
  );
}
