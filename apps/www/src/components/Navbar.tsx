"use client";

import { usePathname } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { ExpandableNav, getSectionFromPath } from "@anipotts/ui";

export default function Navbar() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const currentSection = getSectionFromPath(pathname);

  const handleNavClick = (name: string, href: string) => {
    posthog.capture("nav_link_clicked", {
      link_name: name,
      link_path: href,
      from_path: pathname,
    });
  };

  return (
    <ExpandableNav
      currentSection={currentSection}
      pathname={pathname}
      onNavClick={handleNavClick}
    />
  );
}
