import { FadeIn } from "@anipotts/ui";
import { fetchSocialLinks, fetchProjects } from "@anipotts/lib/cms";
import {
  GithubLogo,
  LinkedinLogo,
  EnvelopeSimple,
  Globe,
  InstagramLogo,
  TiktokLogo,
  XLogo,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import ContactForm from "@/components/ContactForm";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "connect",
  description: "Get in touch with ani potts. Social links and contact form.",
  openGraph: {
    title: "connect | ani potts",
    description: "Get in touch with ani potts. Social links and contact form.",
    url: "https://anipotts.com/connect",
    siteName: "anipotts.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "connect | ani potts",
    description: "Get in touch with ani potts. Social links and contact form.",
  },
  alternates: {
    canonical: "https://anipotts.com/connect",
  },
};

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  email: EnvelopeSimple,
  github: GithubLogo,
  linkedin: LinkedinLogo,
  x: XLogo,
  instagram: InstagramLogo,
  tiktok: TiktokLogo,
};

export default async function ConnectPage() {
  const [socialLinks, projects] = await Promise.all([
    fetchSocialLinks(),
    fetchProjects({ featured: true }),
  ]);

  const liveProjects = projects.filter((p) => p.links?.live);

  return (
    <div className="flex flex-col gap-16 md:gap-20 pb-20">
      {/* Intro Section */}
      <section className="flex flex-col gap-4">
        <FadeIn>
          <h1 className="text-sm font-mono tracking-wide text-accent-400">
            connect
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-signal-green bg-signal-green/10 border border-signal-green/20 rounded-full px-3 py-1 w-fit">
              <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse" />
              <span>open to collaboration</span>
            </div>
            <p className="text-xl md:text-2xl text-body leading-relaxed max-w-2xl">
              If you&apos;re working with LLM orchestration systems and think I can
              help, feel free to reach out:
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Socials Section */}
      <section className="flex flex-col gap-4">
        <FadeIn delay={0.15}>
          <h2 className="text-sm font-mono tracking-wide text-accent-400">
            socials
          </h2>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {socialLinks.map((social) => {
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
                  aria-label={social.name}
                  className="group flex items-center gap-3 p-4 border border-border-subtle rounded-sm bg-input hover:bg-overlay-5 hover:border-border transition-all duration-300"
                >
                  <Icon
                    className="text-tertiary group-hover:text-accent-400 transition-colors shrink-0"
                    size={20}
                  />
                  <div className="flex-grow min-w-0">
                    <span className="text-sm uppercase tracking-widest text-tertiary group-hover:text-accent-400 transition-colors">
                      {social.name}
                    </span>
                    {social.description && (
                      <span className="text-xs text-faint ml-2">
                        {social.description}
                      </span>
                    )}
                  </div>
                  <ArrowSquareOut
                    className="text-faint shrink-0"
                    size={14}
                  />
                </a>
              );
            })}
          </div>
        </FadeIn>
      </section>

      {/* Live Projects Section */}
      {liveProjects.length > 0 && (
        <section className="flex flex-col gap-4">
          <FadeIn delay={0.25}>
            <h2 className="text-sm font-mono tracking-wide text-accent-400">
              live projects
            </h2>
          </FadeIn>
          <FadeIn delay={0.25}>
            <div className="space-y-2">
              {liveProjects.map((project) => (
                <a
                  key={project.slug}
                  href={project.links!.live!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${project.title}`}
                  className="flex items-center justify-between p-4 bg-[rgba(var(--overlay-invert),0.4)] border border-border-subtle rounded-lg hover:border-accent-400/20 transition-all group"
                >
                  <div>
                    <span className="text-secondary text-sm font-medium">
                      {project.title}
                    </span>
                    <span className="text-faint text-xs ml-2">
                      {project.subtitle}
                    </span>
                  </div>
                  <ArrowSquareOut
                    className="text-faint group-hover:text-accent-400 transition-colors shrink-0"
                    size={14}
                  />
                </a>
              ))}
            </div>
          </FadeIn>
        </section>
      )}

      {/* Contact Form Section */}
      <section className="flex flex-col gap-4">
        <FadeIn delay={0.3}>
          <h2 className="text-sm font-mono tracking-wide text-accent-400">
            message me
          </h2>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div className="max-w-xl">
            <ContactForm />
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
