"use client";

import FadeIn from "@/components/FadeIn";
import posthog from "posthog-js";
import { socialLinks } from "@anipotts/lib/data";

const handleSocialClick = (name: string, url: string) => {
  posthog.capture('social_link_clicked', {
    platform: name,
    href: url,
  });
};

import ContactForm from "@/components/ContactForm";

export default function ConnectPage() {
  return (
    <div className="flex flex-col gap-12 pb-20">
      {/* Intro Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="col-span-1">
          <FadeIn>
            <h1 className="text-xs font-bold uppercase tracking-widest text-accent-400">connect</h1>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3">
          <FadeIn delay={0.1}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-signal-green">
                <span>open to collaboration</span>
              </div>
              <p className="text-lg md:text-xl text-secondary leading-relaxed max-w-2xl">
                If you're working with LLM orchestration systems and think I can help, feel free to reach out:
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Socials Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="col-span-1">
          <FadeIn delay={0.2}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-accent-400">Socials</h2>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3">
          <FadeIn delay={0.2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target={social.name === "email" ? undefined : "_blank"}
                  rel={social.name === "email" ? undefined : "noopener noreferrer"}
                  className="group flex items-center justify-between p-4 border border-border-subtle rounded-sm bg-input hover:bg-overlay-10 hover:border-border transition-all duration-300"
                  onClick={() => handleSocialClick(social.name, social.url)}
                >
                  <span className="text-xs uppercase tracking-widest text-tertiary group-hover:text-accent-400 transition-colors">
                    {social.name}
                  </span>
                  <span className="text-xs text-faint group-hover:text-tertiary transition-colors transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 duration-300">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="col-span-1">
          <FadeIn delay={0.3}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-accent-400">Message Me</h2>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3">
          <FadeIn delay={0.3}>
            <div className="max-w-xl">
              <ContactForm />
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
