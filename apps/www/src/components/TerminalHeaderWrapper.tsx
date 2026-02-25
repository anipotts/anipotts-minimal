'use client';

import { usePathname } from 'next/navigation';
import { TerminalHeader } from '@anipotts/ui';
import { getSectionFromPath } from '@anipotts/ui';
import { siteConfig } from '@/content/site';

/**
 * Client component wrapper for TerminalHeader that sets the title
 * based on the current section from the route path.
 */
export default function TerminalHeaderWrapper() {
  const pathname = usePathname();
  const section = getSectionFromPath(pathname);

  const defaultTitle = section === 'www'
    ? undefined
    : `ani@potts:~/${section}`;

  return <TerminalHeader defaultTitle={defaultTitle} version={siteConfig.version} />;
}
