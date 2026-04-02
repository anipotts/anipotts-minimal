import type { Metadata } from "next";
import { sharedOpenGraph } from "@/content/site";
import {
  ArrowSquareOut,
  EnvelopeSimple,
  GithubLogo,
  Globe,
  LinkedinLogo,
  XLogo,
} from "@phosphor-icons/react/dist/ssr";
import { FadeIn, Stagger } from "@anipotts/ui";
import ContactForm from "@/components/ContactForm";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { socialLinks } from "@anipotts/lib/data";
import {
  PageFrame,
  PagePrelude,
  PageSummary,
  PageTitle,
} from "@/components/page/PageScaffold";

export const metadata: Metadata = {
  title: "connect",
  description: "Get in touch with ani potts",
  openGraph: {
    ...sharedOpenGraph,
    title: "connect | ani potts",
    description: "Get in touch with ani potts",
    url: "https://anipotts.com/connect",
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
      <Stagger as="section" className="flex flex-col gap-5">
        <PagePrelude>connect</PagePrelude>
        <PageTitle>get in touch</PageTitle>
        <PageSummary>
          Work, collabs, Claude Code consulting, or just to say hey.
        </PageSummary>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {socialLinks.map((social) => {
            const Icon = iconMap[social.icon] || Globe;
            return (
              <a
                key={social.name}
                href={social.url}
                target={social.name === "email" ? undefined : "_blank"}
                rel={
                  social.name === "email" ? undefined : "noopener noreferrer"
                }
                className="group inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-accent-400 transition-colors"
              >
                <Icon size={14} />
                <span>{social.description}</span>
                {social.name !== "email" && (
                  <ArrowSquareOut
                    size={10}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}
              </a>
            );
          })}
        </div>
      </Stagger>

      <section className="flex flex-col gap-4" aria-label="Newsletter">
        <FadeIn delay={0.3}>
          <NewsletterSubscribe />
        </FadeIn>
      </section>

      <section className="flex flex-col gap-4">
        <FadeIn delay={0.4}>
          <ContactForm initialIntent={initialIntent} />
        </FadeIn>
      </section>
    </PageFrame>
  );
}
