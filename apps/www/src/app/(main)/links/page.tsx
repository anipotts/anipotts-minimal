import { FadeIn } from "@anipotts/ui";
import { socialLinks, liveProjects, site } from "@anipotts/lib/data";
import {
  GithubLogo, LinkedinLogo, EnvelopeSimple, Globe, Code, Terminal,
  InstagramLogo, TiktokLogo, XLogo, ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "links | ani potts",
  description: "Quick links to ani potts social profiles and projects",
  openGraph: {
    title: "links | ani potts",
    description: "Quick links to ani potts social profiles and projects",
    url: "https://anipotts.com/links",
    siteName: "anipotts.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "links | ani potts",
    description: "Quick links to ani potts social profiles and projects",
  },
  alternates: {
    canonical: "https://anipotts.com/links",
  },
};

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  email: EnvelopeSimple,
  github: GithubLogo,
  linkedin: LinkedinLogo,
  x: XLogo,
  instagram: InstagramLogo,
  tiktok: TiktokLogo,
};

export default function LinksPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
      <FadeIn>
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="text-accent-400" size={16} />
          <h1 className="text-2xl font-bold text-body">{site.name.toLowerCase()}</h1>
        </div>
        <p className="text-muted text-sm text-center mb-8">{site.title} in {site.location}</p>
      </FadeIn>

      {/* Website link */}
      <div className="w-full max-w-md space-y-3 mb-3">
        <FadeIn delay={0}>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-input border border-border rounded-lg hover:bg-overlay-10 hover:border-accent-400/30 transition-all group"
          >
            <Globe className="text-tertiary group-hover:text-accent-400 transition-colors" size={16} />
            <div className="flex-grow">
              <span className="text-body font-medium">Website</span>
              <span className="text-muted text-xs ml-2">{site.domain}</span>
            </div>
            <ArrowSquareOut className="text-faint" size={14} />
          </a>
        </FadeIn>
      </div>

      {/* Social links */}
      <div className="w-full max-w-md space-y-3 mb-8">
        {socialLinks.map((link, i) => {
          const Icon = iconMap[link.icon] || Globe;
          return (
            <FadeIn key={link.name} delay={(i + 1) * 0.1}>
              <a
                href={link.url}
                target={link.name === "email" ? undefined : "_blank"}
                rel={link.name === "email" ? undefined : "noopener noreferrer"}
                className="flex items-center gap-4 p-4 bg-input border border-border rounded-lg hover:bg-overlay-10 hover:border-accent-400/30 transition-all group"
              >
                <Icon className="text-tertiary group-hover:text-accent-400 transition-colors" />
                <div className="flex-grow">
                  <span className="text-body font-medium capitalize">{link.name}</span>
                  <span className="text-muted text-xs ml-2">{link.description}</span>
                </div>
                <ArrowSquareOut className="text-faint" size={14} />
              </a>
            </FadeIn>
          );
        })}
      </div>

      {/* Projects */}
      <FadeIn delay={0.7}>
        <div className="w-full max-w-md">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
            <Code className="text-accent-400" size={14} />
            Projects
          </h2>
          <div className="space-y-2">
            {liveProjects.map((project) => (
              <a
                key={project.slug}
                href={project.links!.live!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-[rgba(var(--overlay-invert),0.4)] border border-border-subtle rounded-lg hover:border-accent-400/20 transition-all"
              >
                <div>
                  <span className="text-secondary text-sm font-medium">{project.title}</span>
                  <span className="text-faint text-xs ml-2">{project.subtitle}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
