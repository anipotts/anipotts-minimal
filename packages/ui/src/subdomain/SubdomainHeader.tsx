"use client";

interface SubdomainHeaderProps {
  subdomain: string;
  showHomeLink?: boolean;
}

/**
 * Minimal header for subdomain apps.
 * Shows link back to anipotts.com and current subdomain name.
 */
export function SubdomainHeader({ subdomain, showHomeLink = true }: SubdomainHeaderProps) {
  return (
    <nav className="flex items-center justify-between py-4 px-2 border-b border-border-subtle mb-6">
      {showHomeLink ? (
        <a
          href="https://anipotts.com"
          className="text-xs uppercase tracking-widest text-muted hover:text-accent-400 transition-colors"
        >
          ani potts
        </a>
      ) : (
        <span className="text-xs uppercase tracking-widest text-muted">ani potts</span>
      )}
      <span className="text-xs uppercase tracking-widest text-accent-400">
        {subdomain}
      </span>
    </nav>
  );
}
