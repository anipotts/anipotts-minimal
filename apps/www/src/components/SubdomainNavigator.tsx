"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import { motion, AnimatePresence } from "framer-motion";

type SubdomainStatus = "production" | "static" | "coming-soon";

interface SubdomainEntry {
  name: string;
  url: string;
  desc: string;
  status: SubdomainStatus;
  permissions: string;
}

const SUBDOMAINS: SubdomainEntry[] = [
  { name: "thoughts", url: "https://thoughts.anipotts.com", desc: "blog & writing", status: "production", permissions: "drwxr-xr-x" },
  { name: "dev", url: "https://dev.anipotts.com", desc: "tech stack & tools", status: "production", permissions: "drwxr-xr-x" },
  { name: "links", url: "https://links.anipotts.com", desc: "all my links", status: "production", permissions: "drwxr-xr-x" },
  { name: "updates", url: "https://updates.anipotts.com", desc: "changelog", status: "production", permissions: "drwxr-xr-x" },
  { name: "metrics", url: "https://metrics.anipotts.com", desc: "engineering stats", status: "production", permissions: "drwxr-xr-x" },
  { name: "status", url: "https://status.anipotts.com", desc: "system uptime", status: "production", permissions: "drwxr-xr-x" },
  { name: "lab", url: "https://lab.anipotts.com", desc: "experiments", status: "production", permissions: "drwxr-xr-x" },
  { name: "docs", url: "https://docs.anipotts.com", desc: "documentation", status: "production", permissions: "dr-xr-xr-x" },
];

function StatusDot({ status }: { status: SubdomainStatus }) {
  const colorClass =
    status === "production" ? "bg-green-400" :
    status === "static" ? "bg-yellow-500" :
    "bg-gray-600";

  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colorClass}`} />;
}

export default function SubdomainNavigator() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const posthog = usePostHog();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openTimeRef = useRef<number>(0);

  const filtered = useMemo(() => {
    if (!filter) return SUBDOMAINS;
    const q = filter.toLowerCase();
    return SUBDOMAINS.filter(
      (s) => s.name.includes(q) || s.desc.includes(q)
    );
  }, [filter]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  // Global Ctrl+` shortcut (desktop only)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    if (!mq.matches) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // PostHog tracking
  useEffect(() => {
    if (isOpen) {
      openTimeRef.current = Date.now();
      posthog.capture("subdomain_navigator_opened");
      setFilter("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (openTimeRef.current > 0) {
      posthog.capture("subdomain_navigator_closed", {
        time_open_ms: Date.now() - openTimeRef.current,
      });
      openTimeRef.current = 0;
    }
  }, [isOpen, posthog]);

  // Escape + click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleNavigate(filtered[selectedIndex]);
    }
  };

  const handleNavigate = (entry: SubdomainEntry) => {
    posthog.capture("subdomain_navigator_clicked", {
      subdomain: entry.name,
      status: entry.status,
    });
    window.open(entry.url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-[var(--backdrop-medium)] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md bg-card border border-border rounded-md shadow-2xl overflow-hidden"
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-input">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted font-mono uppercase tracking-wider">
                  ssh hosts
                </span>
                <span className="text-[9px] text-faint font-mono">
                  ~/.ssh/config
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-secondary transition-colors text-xs"
                aria-label="Close"
              >
                [x]
              </button>
            </div>

            {/* Search Input */}
            <div className="border-b border-border-subtle px-3 py-2">
              <div className="flex items-center gap-1 text-xs font-mono">
                <span className="text-accent-400">ssh</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="flex-1 bg-transparent text-secondary outline-none placeholder:text-faint"
                  placeholder="filter hosts..."
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Host List */}
            <div className="p-2 font-mono text-xs max-h-[320px] overflow-y-auto">
              {/* Column Headers */}
              <div className="flex items-center gap-2 px-1 py-1 text-[9px] text-faint border-b border-border-subtle mb-1">
                <span className="w-[70px]">permissions</span>
                <span className="w-4 text-center">st</span>
                <span className="w-6">user</span>
                <span className="flex-1">host</span>
                <span className="text-right">description</span>
              </div>

              {filtered.length === 0 ? (
                <div className="text-faint px-1 py-2">
                  ssh: no matching hosts
                </div>
              ) : (
                <div className="flex flex-col">
                  {filtered.map((entry, i) => (
                    <button
                      key={entry.name}
                      onClick={() => handleNavigate(entry)}
                      className={`flex items-center gap-2 text-left px-1 py-1 rounded transition-colors w-full ${
                        i === selectedIndex
                          ? "bg-input text-accent-400"
                          : "text-tertiary hover:bg-input"
                      }`}
                    >
                      <span className="text-faint text-[9px] w-[70px] shrink-0">
                        {entry.permissions}
                      </span>
                      <span className="w-4 flex justify-center shrink-0">
                        <StatusDot status={entry.status} />
                      </span>
                      <span className="text-faint text-[9px] w-6 shrink-0">
                        ani
                      </span>
                      <span className={`shrink-0 ${
                        i === selectedIndex ? "text-accent-400" : "text-secondary"
                      }`}>
                        {entry.name}/
                      </span>
                      <span className="flex-1 text-right text-[9px] text-faint truncate ml-2">
                        {entry.desc}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border-subtle px-3 py-1.5 text-[9px] text-faint font-mono flex justify-between">
              <span>{filtered.length} host{filtered.length !== 1 ? "s" : ""}</span>
              <span>
                <span className="text-muted">ctrl+`</span> toggle
                <span className="mx-1.5 text-faint">|</span>
                <span className="text-muted">arrows</span> navigate
                <span className="mx-1.5 text-faint">|</span>
                <span className="text-muted">enter</span> open
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
