"use client";

import { ExpandableNav } from "../components/navigation";

interface SubdomainHeaderProps {
  subdomain: string;
  showHomeLink?: boolean;
  /**
   * SPA navigation callback. When provided, subdomain navigation uses this
   * instead of full page reload. Called with (subdomain, path).
   */
  onNavigate?: (subdomain: string, path?: string) => void;
}

/**
 * Header for subdomain apps using the shared ExpandableNav component.
 * Provides consistent navigation across all subdomains with expandable menu.
 */
export function SubdomainHeader({ subdomain, onNavigate }: SubdomainHeaderProps) {
  return (
    <ExpandableNav
      currentSubdomain={subdomain}
      onNavigate={onNavigate}
    />
  );
}
