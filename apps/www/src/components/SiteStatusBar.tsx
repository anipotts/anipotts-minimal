"use client";

import {
  GithubLogo,
  XLogo,
  LinkedinLogo,
  EnvelopeSimple,
  Heart,
  Globe,
} from "@phosphor-icons/react";
import { FadeIn } from "@anipotts/ui";
import { ThemeToggle } from "@anipotts/ui/window";
import { socialLinks } from "@anipotts/lib/data";

const iconMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  email: EnvelopeSimple,
  github: GithubLogo,
  heart: Heart,
  linkedin: LinkedinLogo,
  x: XLogo,
};

const FOOTER_ICONS = ["github", "heart", "x", "linkedin", "email"] as const;

export default function SiteStatusBar() {
  const socials = socialLinks.filter((s) =>
    FOOTER_ICONS.includes(s.icon as (typeof FOOTER_ICONS)[number]),
  );

  return (
    <FadeIn delay={0.4}>
      <div className="border-t border-border-subtle bg-input md:bg-transparent px-6 md:px-10 py-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted font-mono">
        <div className="flex items-center gap-1.5">
          <span>stable</span>
          <span className="text-faint">&middot;</span>
          <span className="text-faint">main</span>
        </div>

        <div className="flex items-center gap-3">
          {socials.map((social) => {
            const Icon = iconMap[social.icon] || Globe;
            return (
              <a
                key={social.name}
                href={social.url}
                target={social.name === "email" ? undefined : "_blank"}
                rel={
                  social.name === "email" ? undefined : "noopener noreferrer"
                }
                className="text-faint hover:text-accent-400 transition-colors"
                aria-label={social.name}
              >
                <Icon size={12} weight="bold" />
              </a>
            );
          })}
          <ThemeToggle />
        </div>
      </div>
    </FadeIn>
  );
}
