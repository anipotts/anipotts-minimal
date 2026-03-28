import Link from "next/link";
import {
  GithubLogo,
  XLogo,
  LinkedinLogo,
  EnvelopeSimple,
  Heart,
  Globe,
} from "@phosphor-icons/react/dist/ssr";
import { FadeIn } from "@anipotts/ui";
import { socialLinks } from "@anipotts/lib/data";

const NAV = [
  { name: "index", href: "/" },
  { name: "work", href: "/work" },
  { name: "thoughts", href: "/thoughts" },
  { name: "claude", href: "/claude" },
  { name: "connect", href: "/connect" },
] as const;

const iconMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  email: EnvelopeSimple,
  github: GithubLogo,
  heart: Heart,
  linkedin: LinkedinLogo,
  x: XLogo,
};

const FOOTER_ICONS = ["github", "heart", "x", "linkedin", "email"] as const;

export default function Footer() {
  const footerSocials = socialLinks.filter((s) =>
    FOOTER_ICONS.includes(s.icon as (typeof FOOTER_ICONS)[number]),
  );

  return (
    <FadeIn delay={0.6}>
      <footer className="w-full mt-auto border-t border-border-subtle">
        <div className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs font-mono">
          <nav
            className="flex flex-wrap items-center gap-x-4 gap-y-1 uppercase tracking-widest"
            aria-label="Footer navigation"
          >
            {NAV.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted hover:text-accent-400 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {footerSocials.map((social) => {
                const Icon = iconMap[social.icon] || Globe;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target={social.name === "email" ? undefined : "_blank"}
                    rel={
                      social.name === "email"
                        ? undefined
                        : "noopener noreferrer"
                    }
                    className="text-faint hover:text-accent-400 transition-colors"
                    aria-label={social.name}
                  >
                    <Icon size={16} weight="bold" />
                  </a>
                );
              })}
            </div>

            <span className="text-faint">
              &copy; {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </footer>
    </FadeIn>
  );
}
