'use client';

import { usePathname } from 'next/navigation';
import { TerminalHeader } from '@anipotts/ui';
import { getSubdomainFromPath } from '@anipotts/ui';

/**
 * Client component wrapper for TerminalHeader that automatically
 * sets the title based on the current subdomain from the route path.
 */
export default function TerminalHeaderWrapper() {
  const pathname = usePathname();
  const subdomain = getSubdomainFromPath(pathname);

  // For main site, don't pass a default title (uses router-based title)
  // For subdomains, show the full subdomain URL
  const defaultTitle = subdomain === 'www'
    ? undefined
    : `ani@potts:~/${subdomain}.anipotts.com`;

  return <TerminalHeader defaultTitle={defaultTitle} />;
}
