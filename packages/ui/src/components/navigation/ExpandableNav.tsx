"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export interface ExpandableNavProps {
  currentSection: string;
  pathname?: string;
  onNavClick?: (name: string, href: string) => void;
}

const primaryItems = [
  { name: "index", path: "/", section: "www" },
  { name: "work", path: "/work", section: "work" },
  { name: "thoughts", path: "/thoughts", section: "thoughts" },
  { name: "claude", path: "/claude", section: "claude" },
] as const;

const connectItem = { name: "connect", path: "/connect", section: "connect" } as const;

function isItemActive(
  section: string,
  path: string,
  currentSection: string,
  pathname: string,
): boolean {
  if (section === "www") {
    return currentSection === "www" && pathname === "/";
  }

  return currentSection === section || pathname.startsWith(path);
}

export function ExpandableNav({
  currentSection,
  pathname = "/",
  onNavClick,
}: ExpandableNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const items = primaryItems.map((item) => ({
    name: item.name,
    href: item.path,
    isActive: isItemActive(item.section, item.path, currentSection, pathname),
  }));

  const connectActive = isItemActive(
    connectItem.section,
    connectItem.path,
    currentSection,
    pathname,
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

  const handleLinkClick = useCallback(
    (name: string, href: string) => {
      onNavClick?.(name, href);
      setMenuOpen(false);
    },
    [onNavClick],
  );

  return (
    <nav
      className="nav-container w-full pt-8 pb-6 md:pt-10 md:pb-6"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-accent-400 text-sm font-medium tracking-wide whitespace-nowrap shrink-0"
          onClick={() => onNavClick?.("home", "/")}
        >
          ani potts
        </Link>

        <div className="hidden md:flex items-center gap-5 text-sm font-medium tracking-wide">
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

          <Link
            href={connectItem.path}
            className={`px-3 py-1.5 rounded-sm border text-xs uppercase tracking-[0.2em] transition-colors ${
              connectActive
                ? "border-accent-400 bg-accent-400/15 text-accent-400"
                : "border-accent-400/40 text-accent-400 hover:bg-accent-400/10"
            }`}
            onClick={() => onNavClick?.(connectItem.name, connectItem.path)}
            aria-current={connectActive ? "page" : undefined}
          >
            {connectItem.name}
          </Link>
        </div>

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

      <div
        id="mobile-nav-menu"
        role="menu"
        aria-hidden={!menuOpen}
        className={`md:hidden overflow-hidden border-t border-border-subtle mt-4 transition-[max-height,opacity] duration-200 ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col py-2">
          {[...items, { name: connectItem.name, href: connectItem.path, isActive: connectActive }].map((item, index) => (
            <Link
              key={item.name}
              href={item.href}
              role="menuitem"
              className={`flex items-center gap-2 py-2.5 text-sm font-medium tracking-wide transition-[opacity,transform,color] duration-150 ${
                item.isActive ? "text-body" : "text-tertiary hover:text-body"
              } ${menuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"}`}
              style={{ transitionDelay: menuOpen ? `${index * 24}ms` : "0ms" }}
              onClick={() => handleLinkClick(item.name, item.href)}
              aria-current={item.isActive ? "page" : undefined}
            >
              <span
                className={`text-accent-400 w-4 ${
                  item.isActive ? "opacity-100" : "opacity-0"
                }`}
              >
                {">"}
              </span>
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
