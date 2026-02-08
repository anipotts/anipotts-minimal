"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { publicSubdomains } from "@anipotts/lib/data";
import { getInternalPath } from "../../hooks/useSubdomainNavigation";

interface NavItem {
  name: string;
  /** Internal path for navigation (e.g., "/thoughts") */
  href: string;
  /** Whether this links to a different subdomain context */
  isSubdomain: boolean;
  isActive: boolean;
  /** Subdomain for SPA navigation (e.g., "www", "thoughts") */
  subdomain?: string;
  /** Path within the subdomain for SPA navigation */
  path?: string;
}

interface ExpandableNavProps {
  /** Current subdomain (e.g., "www", "thoughts", "dev") */
  currentSubdomain: string;
  /** Current pathname within the subdomain */
  pathname?: string;
  /** PostHog tracking callback */
  onNavClick?: (name: string, href: string) => void;
  /**
   * SPA navigation callback. When provided, subdomain navigation uses this
   * instead of full page reload. Called with (subdomain, path).
   * If not provided, falls back to navigateToSubdomain() (full reload).
   */
  onNavigate?: (subdomain: string, path?: string) => void;
}

// Primary nav items always shown in collapsed view
const primaryItems = [
  { name: "index", path: "/", subdomain: "www" },
  { name: "work", path: "/work", subdomain: "www" },
  { name: "thoughts", path: "/thoughts", subdomain: "www" },
  { name: "connect", path: "/connect", subdomain: "www" },
];

// Map subdomain names to nav display names
const subdomainDisplayNames: Record<string, string> = {
  www: "index",
  thoughts: "thoughts",
  dev: "dev",
  links: "links",
  updates: "updates",
  status: "status",
  lab: "lab",
  docs: "docs",
};

export function ExpandableNav({ currentSubdomain, pathname = "/", onNavClick, onNavigate }: ExpandableNavProps) {
  const [expanded, setExpanded] = useState(false);

  const handleNavClick = useCallback((name: string, href: string, targetSubdomain?: string, targetPath?: string) => {
    onNavClick?.(name, href);
    if (onNavigate && targetSubdomain) {
      onNavigate(targetSubdomain, targetPath || "/");
    }
  }, [onNavClick, onNavigate]);

  const buildNavItems = (): NavItem[] => {
    if (!expanded) {
      // Collapsed: always show the same primary items
      return primaryItems.map((item) => {
        const isWwwItem = item.subdomain === "www";
        const href = isWwwItem ? item.path : getInternalPath(item.subdomain, item.path || "/");

        // Active if: subdomain matches AND (for www items) path matches
        let isActive = false;
        if (isWwwItem) {
          isActive = currentSubdomain === "www" && pathname === item.path;
        } else {
          isActive = currentSubdomain === item.subdomain;
        }

        return {
          name: item.name,
          href,
          isSubdomain: !isWwwItem,
          isActive,
          subdomain: item.subdomain,
          path: item.path || "/",
        };
      });
    }

    // Expanded: show all public subdomains
    return publicSubdomains.map((sub) => ({
      name: subdomainDisplayNames[sub.name] || sub.name,
      href: getInternalPath(sub.name, "/"),
      isSubdomain: sub.name !== currentSubdomain,
      isActive: sub.name === currentSubdomain,
      subdomain: sub.name,
      path: "/",
    }));
  };

  const navItems = buildNavItems();

  return (
    <nav className="nav-container w-full flex items-center justify-between py-6 mb-8">
      <span className="text-accent-400 text-sm font-medium tracking-wide">
        ani potts
      </span>
      <motion.div
        className="flex flex-wrap items-center justify-end text-sm font-medium tracking-wide"
        layout
        transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
        style={{ gap: expanded ? "0.75rem" : "1.5rem" }}
      >
        <AnimatePresence mode="popLayout">
          {navItems.map((item, index) => {
            const linkClass = `transition-colors duration-300 whitespace-nowrap ${
              item.isActive
                ? "text-body underline decoration-accent-400 underline-offset-4"
                : "text-tertiary hover:text-body"
            }`;

            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.2,
                  delay: expanded ? index * 0.02 : 0,
                  ease: "easeOut"
                }}
                layout
              >
                {item.isActive && !expanded ? (
                  <span className={linkClass}>{item.name}</span>
                ) : (
                  <a
                    href={item.href}
                    className={linkClass}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.name, item.href, item.subdomain, item.path);
                    }}
                  >
                    {item.name}
                  </a>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="text-tertiary hover:text-accent-400 transition-colors duration-300 text-xs whitespace-nowrap"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {expanded ? "less" : "more"}
        </motion.button>
      </motion.div>
    </nav>
  );
}
