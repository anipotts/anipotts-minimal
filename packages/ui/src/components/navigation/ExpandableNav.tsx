"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface ExpandableNavProps {
  currentSection: string;
  pathname?: string;
  onNavClick?: (name: string, href: string) => void;
}

const navItems = [
  { name: "index", path: "/", section: "www" },
  { name: "work", path: "/work", section: "work" },
  { name: "thoughts", path: "/thoughts", section: "thoughts" },
  { name: "connect", path: "/connect", section: "connect" },
  { name: "dev", path: "/dev", section: "dev" },
  { name: "claude", path: "/claude", section: "claude" },
];

export function ExpandableNav({ currentSection, pathname = "/", onNavClick }: ExpandableNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const items = navItems.map((item) => {
    const isActive = item.section === "www"
      ? currentSection === "www" && pathname === "/"
      : currentSection === item.section || pathname.startsWith(item.path);
    return { name: item.name, href: item.path, isActive };
  });

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const handleLinkClick = useCallback((name: string, href: string) => {
    onNavClick?.(name, href);
    setMenuOpen(false);
  }, [onNavClick]);

  const noMotion = shouldReduceMotion ?? false;

  return (
    <nav className="nav-container w-full pt-8 pb-6 md:pt-10 md:pb-6" aria-label="Main navigation">
      <div className="flex items-center justify-between">
        {/* Site name - always one line, links to home */}
        <Link
          href="/"
          className="text-accent-400 text-sm font-medium tracking-wide whitespace-nowrap shrink-0"
          onClick={() => onNavClick?.("home", "/")}
        >
          ani potts
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`transition-colors duration-300 whitespace-nowrap ${
                item.isActive
                  ? "text-body underline decoration-accent-400 underline-offset-4"
                  : "text-tertiary hover:text-body"
              }`}
              onClick={() => onNavClick?.(item.name, item.href)}
              aria-current={item.isActive ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-tertiary hover:text-body text-sm font-medium tracking-wide transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {menuOpen ? "[x_]" : "[>_]"}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav-menu"
            role="menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={noMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-border-subtle mt-4"
          >
            <div className="flex flex-col py-2">
              {items.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={noMotion ? { duration: 0 } : { delay: index * 0.04, duration: 0.15 }}
                >
                  <Link
                    href={item.href}
                    role="menuitem"
                    className={`flex items-center gap-2 py-2.5 text-sm font-medium tracking-wide transition-colors ${
                      item.isActive
                        ? "text-body"
                        : "text-tertiary hover:text-body"
                    }`}
                    onClick={() => handleLinkClick(item.name, item.href)}
                    aria-current={item.isActive ? "page" : undefined}
                  >
                    <span className={`text-accent-400 w-4 ${item.isActive ? "opacity-100" : "opacity-0"}`}>
                      {">"}
                    </span>
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
