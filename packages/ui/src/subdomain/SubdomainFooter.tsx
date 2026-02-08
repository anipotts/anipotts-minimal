"use client";

interface SubdomainFooterProps {
  subdomain: string;
}

/**
 * Minimal footer for subdomain pages.
 * Shows copyright and link back to main site.
 * Uses internal paths for SPA navigation.
 */
export function SubdomainFooter({ subdomain }: SubdomainFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto pt-8 pb-4 px-2 border-t border-border-subtle">
      <div className="flex items-center justify-between text-[10px] text-faint font-mono">
        <span>© {year} ani potts</span>
        <a
          href="/"
          className="hover:text-accent-400 transition-colors"
        >
          anipotts.com
        </a>
      </div>
    </footer>
  );
}
