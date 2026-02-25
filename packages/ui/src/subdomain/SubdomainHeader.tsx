"use client";

import { ExpandableNav } from "../components/navigation";

interface SubdomainHeaderProps {
  subdomain: string;
  showHomeLink?: boolean;
  onNavClick?: (name: string, href: string) => void;
}

/**
 * Header for subdomain apps using the shared ExpandableNav component.
 * Provides consistent navigation across all subdomains with expandable menu.
 */
export function SubdomainHeader({ subdomain, onNavClick }: SubdomainHeaderProps) {
  return (
    <ExpandableNav
      currentSection={subdomain}
      onNavClick={onNavClick}
    />
  );
}
