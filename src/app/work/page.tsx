"use client";

import { useState } from "react";
import { projects } from "@/data/projects";
import FadeIn from "@/components/FadeIn";
import { motion, AnimatePresence } from "framer-motion";

const categories = ["all", "ai", "product", "quant", "music"];

export default function WorkPage() {
  const [filter, setFilter] = useState("all");

  const filteredProjects = projects.filter(p => filter === "all" || p.category === filter);

  return (
    <div className="flex flex-col gap-12 pb-20">
      <FadeIn>
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold font-heading text-gray-100">work</h1>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 text-xs uppercase tracking-wider rounded-full border transition-all duration-300 ${
                  filter === cat 
                    ? "border-accent-400 text-accent-400 bg-accent-400/10" 
                    : "border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      <div className="flex flex-col gap-16">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.slug}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              id={project.slug}
              className="group flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                  <h2 className="text-2xl font-bold text-gray-200 group-hover:text-accent-400 transition-colors font-heading">
                    {project.title}
                  </h2>
                  <div className="text-xs text-gray-500 font-mono flex gap-2 items-center">
                    <span>{project.year}</span>
                    <span>·</span>
                    <span>{project.category}</span>
                    <span>·</span>
                    <span>{project.role}</span>
                    <span>·</span>
                    <span>{project.duration}</span>
                  </div>
                </div>
                <p className="text-lg text-gray-300 font-medium">{project.subtitle}</p>
              </div>
              
              <p className="text-gray-400 leading-relaxed max-w-2xl">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                {project.tags.map(tag => (
                  <span key={tag} className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-sm border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>

              {project.links && (
                <div className="flex gap-4 mt-2 text-sm font-medium">
                  {project.links.live && (
                    <a href={project.links.live} target="_blank" rel="noopener noreferrer" className="text-accent-400 hover:underline hover:text-accent-300 transition-colors">
                      view project ↗
                    </a>
                  )}
                  {project.links.repo && (
                    <a href={project.links.repo} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-200 transition-colors">
                      view code ↗
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
