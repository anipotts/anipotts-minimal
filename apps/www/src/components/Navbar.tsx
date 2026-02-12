"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { usePostHog } from "posthog-js/react";
import { ExpandableNav, useSectionNavigation, getSectionFromPath } from "@anipotts/ui";

export default function Navbar() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const { navigateTo } = useSectionNavigation();
  const currentSubdomain = getSectionFromPath(pathname);

  const handleNavClick = (name: string, href: string) => {
    posthog.capture("nav_link_clicked", {
      link_name: name,
      link_path: href,
      from_path: pathname,
    });
  };

  // SPA navigation handler for subdomain links
  const handleNavigate = useCallback((subdomain: string, path?: string) => {
    navigateTo(subdomain, path);
  }, [navigateTo]);

  return (
    <ExpandableNav
      currentSubdomain={currentSubdomain}
      pathname={pathname}
      onNavClick={handleNavClick}
      onNavigate={handleNavigate}
    />
  );
}
