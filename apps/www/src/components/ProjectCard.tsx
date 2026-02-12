"use client";

import { useState, useRef, useEffect } from "react";
import type { Project } from "@anipotts/types";
import Link from "next/link";

function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="50" fill="#fff" />
      <path d="M50 5 A45 45 0 0 1 89.4 27.5 L50 50 Z" fill="#EA4335" />
      <path d="M89.4 27.5 A45 45 0 0 1 50 95 L50 50 Z" fill="#FBBC05" />
      <path d="M50 95 A45 45 0 0 1 10.6 27.5 L50 50 Z" fill="#34A853" />
      <path d="M10.6 27.5 A45 45 0 0 1 50 5 L50 50 Z" fill="#EA4335" />
      <circle cx="50" cy="50" r="22" fill="#fff" />
      <circle cx="50" cy="50" r="18" fill="#4285F4" />
    </svg>
  );
}

function StatusBadge({
  status,
  featured,
}: {
  status?: string;
  featured?: boolean;
}) {
  if (featured) {
    return (
      <span className="text-[10px] uppercase tracking-wider text-accent-400 bg-accent-400/10 border border-accent-400/20 px-1.5 py-0.5 rounded font-medium">
        featured
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="text-[10px] uppercase tracking-wider text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded font-medium">
        in progress
      </span>
    );
  }
  if (status === "coming-soon") {
    return (
      <span className="text-[10px] uppercase tracking-wider text-tertiary bg-gray-400/10 border border-gray-400/20 px-1.5 py-0.5 rounded font-medium">
        coming soon
      </span>
    );
  }
  return null;
}

export default function ProjectCard({ project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setIsOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen((o) => !o);
        }
      }}
      className={`
        group w-full cursor-pointer border-l-2 pl-4 pr-4 transition-all duration-300 ease-in-out
        ${
          isOpen
            ? "py-6 border-accent-400 bg-[rgba(var(--overlay-base),0.03)] rounded-r-xl"
            : "py-3 border-border hover:border-overlay-30 hover:bg-overlay-5"
        }
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span
              className={
                isOpen
                  ? "text-accent-400"
                  : "text-muted group-hover:text-secondary"
              }
            >
              {isOpen ? "[-]" : "[+]"}
            </span>
            {project.icon === "chrome" && (
              <ChromeIcon className="w-4 h-4 flex-shrink-0" />
            )}
            <h3
              className={`font-bold ${
                isOpen
                  ? "text-heading"
                  : "text-secondary group-hover:text-heading"
              }`}
            >
              {project.title}
            </h3>
            <StatusBadge status={project.status} featured={project.featured} />
          </div>
          <p className="text-xs text-muted pl-6">{project.subtitle}</p>
        </div>
        <span className="text-xs text-faint font-mono">{project.year}</span>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height }}
      >
        <div ref={contentRef}>
          <div className="pl-6 pt-6 pb-2 flex flex-col gap-6">
            <p className="text-sm text-secondary leading-relaxed max-w-2xl border-l border-border pl-4">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs uppercase tracking-wider text-muted bg-input px-2 py-1 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {(project.links?.live ||
              project.links?.repo ||
              project.links?.page) && (
              <div className="flex gap-4 text-xs font-mono pt-2">
                {project.links?.page && (
                  <Link
                    href={project.links.page}
                    className="text-accent-400 hover:underline decoration-accent-400/30 underline-offset-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ./deep_dive.md
                  </Link>
                )}
                {project.links?.live && (
                  <a
                    href={project.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-400 hover:underline decoration-accent-400/30 underline-offset-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ./launch_site.sh
                  </a>
                )}
                {project.links?.repo && (
                  <a
                    href={project.links.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tertiary hover:text-body hover:underline decoration-overlay-30 underline-offset-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ./view_source.git
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
