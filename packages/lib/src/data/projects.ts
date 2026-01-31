import type { Project } from "@anipotts/types";

export const projects: Project[] = [
  // === FLAGSHIP PRODUCTS ===
  {
    slug: "quantercise",
    title: "Quantercise",
    subtitle: "Quant interview prep for Jane Street, Citadel, Two Sigma.",
    description:
      "400+ problems with Python code editor, KaTeX math rendering, instant grading, and gamification. Next.js 15, React 19, Postgres (Aurora → Neon migration), Lambda for sandboxed execution. Actively used by candidates targeting top trading firms.",
    year: "2024–",
    category: "product",
    role: "Founder & Engineer",
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
      "Practice mental math drills in your browser. Keyboard-driven, sound feedback, progress tracking. Vanilla JS, Manifest V3, zero external dependencies.",
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

  // === ACTIVE WORK ===
  {
    slug: "pgi-research-platform",
    title: "PGI Research Portal",
    subtitle: "Macro research platform for 300+ quants.",
    description:
      "Rebuilt PGI's static site into a TypeScript PWA backed by Postgres, aggregating RSS feeds and cutting manual research overhead. Enables analysts to monitor macro catalysts and event signals directly from mobile.",
    year: "2025",
    category: "quant",
    role: "Chief Tech Officer",
    duration: "2025–",
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
      "Built a full-stack platform for interacting with multiple LLMs in a single conversational workflow. Implements shared-context caching, multi-model routing, and intuitive UI for cost-efficient prompt chaining.",
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
      "Launched and marketed a TypeScript web app in 4 hours of a purity questionnaire tailored to NYU culture. Reached 1,000+ completions in under 17 hours.",
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

  // === PROFESSIONAL EXPERIENCE ===
  {
    slug: "habittracker-obh",
    title: "Artist Scouting Dashboard",
    subtitle:
      "Cross-platform artist growth tracking for an Atlantic Records venture.",
    description:
      "Aggregated Chartmetric, YouTube, TikTok, and Instagram signals into a centralized scouting dashboard. Implemented geo-based artist discovery to find emerging talent in targeted campaign markets.",
    year: "2024",
    category: "music",
    role: "Data Engineering Intern",
    duration: "Summer 2024",
    tags: ["Python", "Streamlit", "SQL", "APIs", "Data Pipelines"],
    status: "live",
  },

  // === QUANT/FINANCE ===
  {
    slug: "options-pricing-sensitivity",
    title: "Options Pricing + Sensitivity Analysis",
    subtitle: "Black–Scholes and binomial pricing with volatility sweeps.",
    description:
      "Developed a Python tool to price European options using Black–Scholes and binomial models, analyzing how prices move across volatility regimes to illustrate Greeks and model behavior.",
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

/** Projects with an external live URL (for status monitoring, links page, etc.) */
export const liveProjects = projects.filter((p) => p.links?.live);
