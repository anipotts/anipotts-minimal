'use client';

import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { TerminalNavigator } from '@anipotts/ui/terminal-navigator';
import { getSectionFromPath, useSectionNavigation } from '@anipotts/ui';

/**
 * Client component wrapper for TerminalNavigator that automatically
 * detects the current subdomain from the route path and provides
 * SPA navigation for the cd command.
 */
export default function TerminalNavigatorWrapper() {
  const pathname = usePathname();
  const subdomain = getSectionFromPath(pathname);
  const { navigateTo } = useSectionNavigation();

  // SPA navigation handler for terminal cd command
  const handleNavigate = useCallback((targetSubdomain: string) => {
    navigateTo(targetSubdomain);
  }, [navigateTo]);

  return (
    <TerminalNavigator
      currentSubdomain={subdomain}
      onNavigate={handleNavigate}
    />
  );
}
