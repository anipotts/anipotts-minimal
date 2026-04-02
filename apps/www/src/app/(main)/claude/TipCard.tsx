"use client";

import { useState, useRef, useEffect } from "react";
import { CopyButton } from "./CopyButton";

interface TipCardFeature {
  name: string;
  desc: string;
  href?: string;
}

interface TipCardProps {
  name: string;
  tagline: string;
  install: string;
  href: string;
  features: TipCardFeature[];
}

export function TipCard({
  name,
  tagline,
  install,
  href,
  features,
}: TipCardProps) {
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
      tabIndex={0}
      aria-expanded={isOpen}
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
            ? "py-4 border-accent-400 bg-overlay-5 rounded-r-xl"
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
            <h2
              className={`font-bold ${
                isOpen
                  ? "text-heading"
                  : "text-secondary group-hover:text-heading"
              }`}
            >
              {name}
            </h2>
          </div>
          <p className="text-xs text-muted pl-6">{tagline}</p>
        </div>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height }}
      >
        <div ref={contentRef}>
          <div className="pl-8 pt-4 pb-2 flex flex-col gap-5">
            {/* Install command */}
            <div
              className="flex items-center gap-3 bg-input rounded px-3 py-2 font-mono text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-muted select-none">$</span>
              <code className="text-secondary flex-1 overflow-x-auto">
                {install}
              </code>
              <CopyButton text={install} />
            </div>

            {/* Features */}
            <div className="flex flex-col gap-2">
              {features.map((f) => (
                <div key={f.name} className="flex items-baseline gap-2 text-sm">
                  <span className="text-muted select-none font-mono text-xs">
                    +
                  </span>
                  {f.href ? (
                    <a
                      href={f.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-400 hover:underline decoration-accent-400/30 underline-offset-4 font-mono text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {f.name}
                    </a>
                  ) : (
                    <span className="text-accent-400 font-mono text-xs">
                      {f.name}
                    </span>
                  )}
                  <span className="text-tertiary text-xs">{f.desc}</span>
                </div>
              ))}
            </div>

            {/* Repo link */}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-tertiary hover:text-body hover:underline decoration-overlay-30 underline-offset-4 inline-flex items-center gap-1 w-fit"
              onClick={(e) => e.stopPropagation()}
            >
              ./view_source
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
