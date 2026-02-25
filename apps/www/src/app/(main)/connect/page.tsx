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
  CardBlock,
  ContentBlocks,
  PageFrame,
  PagePrelude,
  PageSummary,
  PageTitle,
} from "@/components/page/PageScaffold";

export const metadata: Metadata = {
  title: "connect",
  description: "Work together with ani potts on high-leverage product and Claude Code systems",
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
          <PageTitle>let&apos;s build something sharp</PageTitle>
        </FadeIn>
        <FadeIn delay={0.08}>
          <PageSummary>
            Send one clear intent. I will respond with the fastest path to execution.
          </PageSummary>
        </FadeIn>
      </section>

      <section className="flex flex-col gap-4">
        <FadeIn>
          <PagePrelude>command composer</PagePrelude>
        </FadeIn>
        <ContentBlocks>
          <ContactForm initialIntent={initialIntent} />
        </ContentBlocks>
      </section>

      <section className="flex flex-col gap-4">
        <FadeIn>
          <PagePrelude>direct links</PagePrelude>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {socialLinks.map((social, index) => {
            const Icon = iconMap[social.icon] || Globe;
            return (
              <FadeIn key={social.name} delay={0.04 + index * 0.03}>
                <CardBlock>
                  <a
                    href={social.url}
                    target={social.name === "email" ? undefined : "_blank"}
                    rel={social.name === "email" ? undefined : "noopener noreferrer"}
                    className="group flex items-center gap-3"
                  >
                    <Icon className="text-tertiary group-hover:text-accent-400 transition-colors" size={18} />
                    <div className="flex-grow min-w-0">
                      <span className="text-xs uppercase tracking-[0.18em] text-tertiary group-hover:text-accent-400 transition-colors">
                        {social.name}
                      </span>
                      {social.description && (
                        <p className="text-sm text-secondary mt-1 truncate">{social.description}</p>
                      )}
                    </div>
                    <ArrowSquareOut className="text-faint shrink-0" size={14} />
                  </a>
                </CardBlock>
              </FadeIn>
            );
          })}
        </div>
      </section>
    </PageFrame>
  );
}
