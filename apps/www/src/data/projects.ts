export type { Project, ProjectStatus, ProjectCategory } from "@anipotts/types";
import type { Project } from "@anipotts/types";

export const projects: Project[] = [
  {
    slug: "quantercise",
    title: "Quantercise",
    subtitle: "Quant interview prep for Jane Street, Citadel, Two Sigma.",
    description:
      "400+ problems with Python code editor, KaTeX math rendering, instant grading, and gamification. Next.js 15, React 19, Postgres (Aurora to Neon migration), Lambda for sandboxed execution.",
    year: "2024-",
    category: "product",
    role: "Founder and Engineer",
    duration: "Ongoing",
    tags: [
      "Next.js 15",
      "TypeScript",
      "Postgres",
      "AWS Lambda",
      "Monaco",
      "Stripe",
    ],
    status: "live",
    featured: true,
    links: {
      live: "https://quantercise.com",
      page: "/projects/quantercise",
    },
  },
  {
    slug: "quantercise-extension",
    title: "Mental Math",
    subtitle: "Practice mental math drills in your browser.",
    description:
      "Keyboard-driven Chrome extension for mental math drills with sound feedback and progress tracking.",
    year: "2026",
    category: "product",
    role: "Creator",
    duration: "Winter 2026",
    tags: ["Chrome Extension", "JavaScript", "Manifest V3"],
    status: "live",
    icon: "chrome",
    links: {
      repo: "https://github.com/anipotts/quantercise-mental-math-extension",
    },
  },
  {
    slug: "pgi-research-platform",
    title: "PGI Research Portal",
    subtitle: "Macro research platform for 300+ quants.",
    description:
      "Rebuilt PGI's static site into a TypeScript PWA backed by Postgres, aggregating RSS feeds and reducing manual research overhead.",
    year: "2025",
    category: "quant",
    role: "Chief Tech Officer",
    duration: "2025-",
    tags: ["Next.js", "TypeScript", "Postgres", "TailwindCSS", "RSS"],
    status: "live",
    links: {
      live: "https://paragoninvestments.org",
    },
  },
  {
    slug: "chainedchat",
    title: "ChainedChat",
    subtitle: "Multi-LLM workflow orchestration platform.",
    description:
      "Full-stack product for multi-model workflows with shared-context caching, model routing, and execution-focused UX.",
    year: "2025",
    category: "ai",
    role: "Founder",
    duration: "Summer 2025",
    tags: [
      "Next.js",
      "TypeScript",
      "Convex",
      "LangGraph",
      "Stripe",
      "TailwindCSS",
    ],
    status: "live",
    links: {
      live: "https://chained.chat",
      repo: "https://github.com/anipotts/chained-chat",
    },
  },
  {
    slug: "nyu-purity-test",
    title: "NYU Purity Test",
    subtitle: "A campus quiz taken by 3,000+ NYU students (200k+ visits).",
    description:
      "Launched and marketed a TypeScript web app in four hours. Reached 1,000+ completions in under 17 hours.",
    year: "2024",
    category: "product",
    role: "Creator",
    duration: "Fall 2024",
    tags: ["TypeScript", "React", "Next.js", "TailwindCSS", "Analytics"],
    status: "live",
    links: {
      live: "https://nyupuritytest.com",
      repo: "https://github.com/anipotts/nyu-rice-purity",
    },
  },
  {
    slug: "habittracker-obh",
    title: "Artist Scouting Dashboard",
    subtitle:
      "Cross-platform artist growth tracking for an Atlantic Records venture.",
    description:
      "Aggregated Chartmetric, YouTube, TikTok, and Instagram signals into a centralized scouting dashboard with geo-based discovery flows.",
    year: "2024",
    category: "music",
    role: "Data Engineering Intern",
    duration: "Summer 2024",
    tags: ["Python", "Streamlit", "SQL", "APIs", "Data Pipelines"],
    status: "live",
  },
  {
    slug: "options-pricing-sensitivity",
    title: "Options Pricing + Sensitivity Analysis",
    subtitle: "Black-Scholes and binomial pricing with volatility sweeps.",
    description:
      "Python tool to price European options with Black-Scholes and binomial models across volatility regimes.",
    year: "2023",
    category: "quant",
    role: "Developer",
    duration: "Spring 2023",
    tags: ["Python", "NumPy", "Pandas", "Quantitative Finance"],
    status: "live",
    links: {
      repo: "https://github.com/anirudhp15/Options-Pricing-and-Sensitivity-Analysis-Tool",
    },
  },
];

export const liveProjects = projects.filter((project) =>
  Boolean(project.links?.live),
);
