"use client";

import { useSearchParams, useRouter } from "next/navigation";
import type { Project } from "@anipotts/types";
import ProjectCard from "@/components/ProjectCard";

const CATEGORIES = ["all", "ai", "product", "quant", "music"];

export default function WorkFilteredList({
  projects,
}: {
  projects: Project[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get("category") ?? "all";

  const handleFilter = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "all") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    const qs = params.toString();
    router.replace(`/work${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const filteredProjects = projects
    .filter((p) => filter === "all" || p.category === filter)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleFilter(cat)}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-sm border transition-all duration-300 ${
              filter === cat
                ? "border-accent-400 text-accent-400 bg-accent-400/10"
                : "border-border text-muted hover:border-overlay-30 hover:text-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div
              key={project.slug}
              className="animate-[fadeInUp_0.4s_ease-out_both]"
            >
              <ProjectCard project={project} />
            </div>
          ))
        ) : (
          <p className="text-muted text-sm font-mono py-8 text-center">
            no projects in &quot;{filter}&quot; yet.
          </p>
        )}
      </div>
    </>
  );
}
