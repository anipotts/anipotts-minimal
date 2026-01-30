import { FadeIn } from "@anipotts/ui";
import { socialLinks, liveProjects, site } from "@anipotts/lib/data";
import {
  FaGithub, FaLinkedin, FaEnvelope, FaGlobe, FaCode, FaTerminal,
  FaInstagram, FaTiktok,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  email: FaEnvelope,
  github: FaGithub,
  linkedin: FaLinkedin,
  x: FaXTwitter,
  instagram: FaInstagram,
  tiktok: FaTiktok,
};

export default function LinksPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
      <FadeIn>
        <div className="flex items-center gap-3 mb-2">
          <FaTerminal className="text-accent-400" />
          <h1 className="text-2xl font-bold text-white">{site.name.toLowerCase()}</h1>
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
            <FaGlobe className="text-tertiary group-hover:text-accent-400 transition-colors" />
            <div className="flex-grow">
              <span className="text-white font-medium">Website</span>
              <span className="text-muted text-xs ml-2">{site.domain}</span>
            </div>
            <span className="text-faint text-xs">→</span>
          </a>
        </FadeIn>
      </div>

      {/* Social links */}
      <div className="w-full max-w-md space-y-3 mb-8">
        {socialLinks.map((link, i) => {
          const Icon = iconMap[link.icon] || FaGlobe;
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
                  <span className="text-white font-medium capitalize">{link.name}</span>
                  <span className="text-muted text-xs ml-2">{link.description}</span>
                </div>
                <span className="text-faint text-xs">→</span>
              </a>
            </FadeIn>
          );
        })}
      </div>

      {/* Projects */}
      <FadeIn delay={0.7}>
        <div className="w-full max-w-md">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
            <FaCode className="text-accent-400" />
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
