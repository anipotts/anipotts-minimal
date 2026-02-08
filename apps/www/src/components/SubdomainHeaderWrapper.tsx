'use client';

import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { SubdomainHeader, useSubdomainNavigation, getSubdomainFromPath } from '@anipotts/ui';

/**
 * Client component wrapper for SubdomainHeader that automatically
 * detects the current subdomain from the route path and provides
 * SPA navigation for subdomain links.
 */
export default function SubdomainHeaderWrapper() {
  const pathname = usePathname();
  const subdomain = getSubdomainFromPath(pathname);
  const { navigateTo } = useSubdomainNavigation();

  // SPA navigation handler for subdomain links
  const handleNavigate = useCallback((targetSubdomain: string, path?: string) => {
    navigateTo(targetSubdomain, path);
  }, [navigateTo]);

  // Don't show subdomain header on main site
  if (subdomain === 'www') {
    return null;
  }

  return (
    <SubdomainHeader
      subdomain={subdomain}
      onNavigate={handleNavigate}
    />
  );
}
