'use client';

import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { TerminalNavigator } from '@anipotts/ui/terminal-navigator';
import { getSectionFromPath, useSectionNavigation } from '@anipotts/ui';

/**
 * Client component wrapper for TerminalNavigator that detects the
 * current section from the route path and provides SPA navigation.
 */
export default function TerminalNavigatorWrapper() {
  const pathname = usePathname();
  const section = getSectionFromPath(pathname);
  const { navigateTo } = useSectionNavigation();

  const handleNavigate = useCallback((targetSection: string) => {
    navigateTo(targetSection);
  }, [navigateTo]);

  return (
    <TerminalNavigator
      currentSubdomain={section}
      onNavigate={handleNavigate}
    />
  );
}
