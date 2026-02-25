'use client';

import { usePathname } from 'next/navigation';
import { SubdomainHeader, getSectionFromPath } from '@anipotts/ui';

/**
 * Client component wrapper for SubdomainHeader that automatically
 * detects the current section from the route path.
 */
export default function SubdomainHeaderWrapper() {
  const pathname = usePathname();
  const section = getSectionFromPath(pathname);

  // Don't show subdomain header on main site
  if (section === 'www') {
    return null;
  }

  return (
    <SubdomainHeader subdomain={section} />
  );
}
