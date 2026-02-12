import { Suspense } from "react";
import { FadeIn } from "@anipotts/ui";
import { fetchProjects } from "@anipotts/lib/cms";
import type { Project } from "@anipotts/types";
import type { Metadata } from "next";

import WorkFilteredList from "./WorkFilteredList";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "work",
  description: "Projects, experiments, and open-source work from ani potts",
  openGraph: {
    title: "work | ani potts",
    description: "Projects, experiments, and open-source work from ani potts",
    url: "https://anipotts.com/work",
    siteName: "anipotts.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "work | ani potts",
    description: "Projects, experiments, and open-source work from ani potts",
  },
  alternates: {
    canonical: "https://anipotts.com/work",
  },
};

export default async function WorkPage() {
  const projects = await fetchProjects();

  return (
    <div className="flex flex-col gap-16 md:gap-20 pb-20">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <FadeIn>
            <h1 className="text-sm font-mono tracking-widest uppercase text-accent-400">
              work
            </h1>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3 flex flex-col gap-8">
          <FadeIn delay={0.05}>
            <p className="text-secondary text-base leading-relaxed">
              Projects, experiments, and open-source work. Click any to expand.
            </p>
          </FadeIn>
          <Suspense>
            <WorkFilteredList projects={projects} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
