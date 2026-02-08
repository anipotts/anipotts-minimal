"use client";

import { useCallback } from "react";

interface NavItem {
  name: string;
  href: string;
  isActive: boolean;
}

interface ExpandableNavProps {
  currentSubdomain: string;
  pathname?: string;
  onNavClick?: (name: string, href: string) => void;
  onNavigate?: (subdomain: string, path?: string) => void;
}

const navItems = [
  { name: "index", path: "/", section: "www" },
  { name: "work", path: "/work", section: "work" },
  { name: "thoughts", path: "/thoughts", section: "thoughts" },
  { name: "connect", path: "/connect", section: "connect" },
  { name: "dev", path: "/dev", section: "dev" },
];

export function ExpandableNav({ currentSubdomain, pathname = "/", onNavClick, onNavigate }: ExpandableNavProps) {
  const handleNavClick = useCallback((name: string, href: string, section: string) => {
    onNavClick?.(name, href);
    if (onNavigate) {
      onNavigate(section);
    }
  }, [onNavClick, onNavigate]);

  const items: NavItem[] = navItems.map((item) => {
    const isActive = item.section === "www"
      ? currentSubdomain === "www" && pathname === "/"
      : currentSubdomain === item.section || pathname.startsWith(item.path);

    return {
      name: item.name,
      href: item.path,
      isActive,
    };
  });

  return (
    <nav className="nav-container w-full flex items-center justify-between py-6 mb-8">
      <span className="text-accent-400 text-sm font-medium tracking-wide">
        ani potts
      </span>
      <div className="flex items-center gap-6 text-sm font-medium tracking-wide">
        {items.map((item) => {
          const linkClass = `transition-colors duration-300 whitespace-nowrap ${
            item.isActive
              ? "text-body underline decoration-accent-400 underline-offset-4"
              : "text-tertiary hover:text-body"
          }`;

          const navItem = navItems.find((n) => n.name === item.name)!;

          return item.isActive ? (
            <span key={item.name} className={linkClass}>{item.name}</span>
          ) : (
            <a
              key={item.name}
              href={item.href}
              className={linkClass}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.name, item.href, navItem.section);
              }}
            >
              {item.name}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
