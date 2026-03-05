import type { Metadata } from "next";
import {
  ArrowSquareOut,
  EnvelopeSimple,
  GithubLogo,
  Globe,
  LinkedinLogo,
  XLogo,
} from "@phosphor-icons/react/dist/ssr";
import { FadeIn } from "@anipotts/ui";
import ContactForm from "@/components/ContactForm";
import { socialLinks } from "@/content/socials";
import {
  PageFrame,
  PagePrelude,
  PageSummary,
  PageTitle,
} from "@/components/page/PageScaffold";

export const metadata: Metadata = {
  title: "connect",
  description: "Get in touch with ani potts",
  alternates: {
    canonical: "https://anipotts.com/connect",
  },
};

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  email: EnvelopeSimple,
  github: GithubLogo,
  linkedin: LinkedinLogo,
  x: XLogo,
};

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  const initialIntent = params.intent?.trim().toLowerCase() ?? "";

  return (
    <PageFrame>
      <section className="flex flex-col gap-5">
        <FadeIn>
          <PagePrelude>connect</PagePrelude>
        </FadeIn>
        <FadeIn delay={0.04}>
          <PageTitle>get in touch</PageTitle>
        </FadeIn>
        <FadeIn delay={0.08}>
          <PageSummary>
            For work inquiries, collaborations, or Claude Code consulting.
          </PageSummary>
        </FadeIn>
        <FadeIn delay={0.12}>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {socialLinks.map((social) => {
              const Icon = iconMap[social.icon] || Globe;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target={social.name === "email" ? undefined : "_blank"}
                  rel={social.name === "email" ? undefined : "noopener noreferrer"}
                  className="group inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-accent-400 transition-colors"
                >
                  <Icon size={14} />
                  <span>{social.description}</span>
                  {social.name !== "email" && <ArrowSquareOut size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                </a>
              );
            })}
          </div>
        </FadeIn>
      </section>

      <section className="flex flex-col gap-4">
        <FadeIn>
          <ContactForm initialIntent={initialIntent} />
        </FadeIn>
      </section>
    </PageFrame>
  );
}
