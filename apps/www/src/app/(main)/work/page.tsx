import type { Metadata } from "next";
import Link from "next/link";
import { Stagger } from "@anipotts/ui";
import ProjectCard from "@/components/ProjectCard";
import type { ProjectEntry } from "@/content/projects";
import { sharedOpenGraph } from "@/content/site";
import { getWorkProjects } from "@/content/projects";
import {
  ContentBlocks,
  PageFrame,
  PagePrelude,
  PageSummary,
  PageTitle,
} from "@/components/page/PageScaffold";

export const metadata: Metadata = {
  title: "work",
  description: "Curated projects and systems from ani potts",
  openGraph: {
    ...sharedOpenGraph,
    title: "work | ani potts",
    description: "Curated projects and systems from ani potts",
    url: "https://anipotts.com/work",
  },
  alternates: {
    canonical: "https://anipotts.com/work",
  },
};

const CATEGORIES = ["all", "ai", "product", "quant", "music", "other"] as const;
type WorkCategory = (typeof CATEGORIES)[number];

function getActiveCategory(raw: string | undefined): WorkCategory {
  const normalized = raw?.trim().toLowerCase() ?? "all";
  return (CATEGORIES as readonly string[]).includes(normalized)
    ? (normalized as WorkCategory)
    : "all";
}

const SEASON_TO_QUARTER: Record<string, string> = {
  winter: "Q1",
  spring: "Q2",
  summer: "Q3",
  fall: "Q4",
};

function getPeriod(project: ProjectEntry): string {
  const d = project.duration.toLowerCase();

  if (d === "ongoing") return "ongoing";

  for (const [season, quarter] of Object.entries(SEASON_TO_QUARTER)) {
    if (d.includes(season)) {
      const ym = d.match(/\d{4}/);
      if (ym) return `${quarter} ${ym[0]}`;
      return "ongoing";
    }
  }

  const ym = d.match(/^\d{4}/);
  if (ym) return ym[0];

  return "ongoing";
}

interface QuarterGroup {
  quarter: string | null;
  projects: ProjectEntry[];
}

interface YearGroup {
  year: string;
  quarters: QuarterGroup[];
}

function groupByYearAndQuarter(projects: ProjectEntry[]): YearGroup[] {
  const yearMap = new Map<string, Map<string, ProjectEntry[]>>();

  for (const project of projects) {
    const period = getPeriod(project);

    let year: string;
    let quarter: string | null = null;

    if (period === "ongoing") {
      year = "ongoing";
    } else if (period.startsWith("Q")) {
      // "Q2 2025" -> year "2025", quarter "Q2"
      const spaceIdx = period.indexOf(" ");
      quarter = period.slice(0, spaceIdx);
      year = period.slice(spaceIdx + 1);
    } else {
      // just a year like "2025"
      year = period;
    }

    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const qMap = yearMap.get(year) ?? new Map();
    const key = quarter ?? "_none";
    if (!qMap.has(key)) qMap.set(key, []);
    const arr = qMap.get(key) ?? [];
    arr.push(project);
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => {
      if (a === "ongoing") return -1;
      if (b === "ongoing") return 1;
      return parseInt(b, 10) - parseInt(a, 10);
    })
    .map(([year, qMap]) => ({
      year,
      quarters: Array.from(qMap.entries())
        .sort(([a], [b]) => {
          if (a === "_none") return -1;
          if (b === "_none") return 1;
          return b.localeCompare(a);
        })
        .map(([key, items]) => ({
          quarter: key === "_none" ? null : key,
          projects: items,
        })),
    }));
}

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = getActiveCategory(params.category);
  const projects = getWorkProjects(
    activeCategory === "all" ? undefined : activeCategory,
  );
  const yearGroups = groupByYearAndQuarter(projects);

  return (
    <PageFrame>
      <Stagger as="section" className="flex flex-col gap-5">
        <PagePrelude>work</PagePrelude>
        <PageTitle>selected systems and products</PageTitle>
        <PageSummary>
          Everything I&apos;ve shipped or am actively building. Status, context,
          links to live product or source.
        </PageSummary>
      </Stagger>

      <Stagger as="section" className="flex flex-col gap-4">
        <PagePrelude>catalog</PagePrelude>
        <ContentBlocks>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={
                  category === "all" ? "/work" : `/work?category=${category}`
                }
                scroll={false}
                aria-current={activeCategory === category ? "page" : undefined}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-sm border transition-all duration-200 ${
                  activeCategory === category
                    ? "border-accent-400 text-accent-400 bg-accent-400/10"
                    : "border-border text-muted hover:border-overlay-30 hover:text-secondary"
                }`}
              >
                {category}
              </Link>
            ))}
          </div>

          {yearGroups.length > 0 ? (
            <Stagger
              className="flex flex-col gap-14"
              interval={0.1}
              offset={0.12}
            >
              {yearGroups.map(({ year, quarters }) => (
                <div key={year} className="flex flex-col gap-6">
                  <h2 className="text-sm uppercase tracking-widest text-secondary font-mono border-b border-border pb-2 font-semibold">
                    {year}
                  </h2>
                  {quarters.map(({ quarter, projects: qProjects }) => (
                    <div key={quarter ?? "all"} className="flex flex-col gap-4">
                      {quarter && (
                        <h3 className="text-xs uppercase tracking-wider text-muted font-mono pl-4">
                          {quarter}
                        </h3>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {qProjects.map((project) => (
                          <ProjectCard
                            key={project.slug}
                            project={project}
                            headingLevel="h3"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </Stagger>
          ) : (
            <p className="text-muted text-sm font-mono py-8 text-center">
              no projects in &quot;{activeCategory}&quot; yet.
            </p>
          )}
        </ContentBlocks>
      </Stagger>
    </PageFrame>
  );
}
