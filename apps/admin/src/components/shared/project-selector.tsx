"use client";

import { useRouter } from "next/navigation";

import { PROJECTS } from "@/lib/projects";
import type { ProjectCapability } from "@/lib/projects";

interface ProjectSelectorProps {
  capability: ProjectCapability;
  currentSlug: string;
  basePath: string;
}

export default function ProjectSelector({
  capability,
  currentSlug,
  basePath,
}: ProjectSelectorProps) {
  const router = useRouter();
  const projects = PROJECTS.filter((p) => p.capabilities.includes(capability));

  // Single project: just show name as static text
  if (projects.length <= 1) {
    const project = projects[0];
    return (
      <span className="text-[10px] text-zinc-500">
        {project?.name ?? "No projects configured"}
      </span>
    );
  }

  // Multiple projects: dropdown
  return (
    <select
      value={currentSlug}
      onChange={(e) => router.push(`${basePath}/${e.target.value}`)}
      className="cursor-pointer rounded border border-zinc-800/60 bg-transparent px-2 py-1 text-[10px] text-zinc-400 focus:border-zinc-600 focus:outline-none"
    >
      {projects.map((p) => (
        <option key={p.slug} value={p.slug}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
