import type { Project } from "@anipotts/types";

export const projects: Project[] = [
  // === FLAGSHIP PRODUCTS ===
  {
    slug: "quantercise",
    title: "Quantercise",
    subtitle: "Quant interview prep for Jane Street, Citadel, Two Sigma.",
    description:
      "400+ problems with Python code editor, KaTeX math rendering, instant grading, and gamification. Next.js 15, React 19, Postgres (Aurora to Neon migration), Lambda for sandboxed execution.",
    year: "2024",
    category: "product",
    role: "Founder and Engineer",
    duration: "Launched 2024",
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
    status: "archived",
    icon: "chrome",
    links: {
      repo: "https://github.com/anipotts/quantercise-mental-math-extension",
    },
  },

  // === ACTIVE WORK ===
  {
    slug: "claude-code-tips",
    title: "Claude Code Tips",
    subtitle:
      "Practical patterns for agentic coding: hooks, agents, automation.",
    description:
      "Reference repo built from hundreds of Claude Code sessions. Hooks, custom agents, MCP servers, plugin development, automation patterns.",
    year: "2025-",
    category: "ai",
    role: "Creator",
    duration: "Ongoing",
    tags: ["Python", "Claude Code", "Hooks", "Agents", "MCP", "Plugins"],
    status: "live",
    featured: false,
    links: {
      repo: "https://github.com/anipotts/claude-code-tips",
    },
  },

  {
    slug: "imessage-mcp",
    title: "iMessage MCP",
    subtitle:
      "Explore your iMessage history with AI. Spotify Wrapped for texts.",
    description:
      "Read-only MCP server for macOS that gives AI access to iMessage analytics. Conversation search, streaks, contact stats, and more. Privacy-first, published on npm.",
    year: "2025-",
    category: "ai",
    role: "Creator",
    duration: "Ongoing",
    tags: ["TypeScript", "MCP", "SQLite", "macOS", "Privacy"],
    status: "live",
    links: {
      repo: "https://github.com/anipotts/imessage-mcp",
      live: "https://npmjs.com/package/imessage-mcp",
    },
  },

  {
    slug: "saeshify",
    title: "Saeshify",
    subtitle: "Real-time rhyme visualizer for lyrics and audio.",
    description:
      "WebGL and Web Audio pipeline that follows lyrics as they play and makes rhyme patterns visible in real time.",
    year: "2025-",
    category: "music",
    role: "Creator",
    duration: "Ongoing",
    tags: ["TypeScript", "WebGL", "Audio", "Visualization"],
    status: "live",
    links: {
      repo: "https://github.com/anipotts/saeshify",
      live: "https://saeshify.vercel.app",
    },
  },

  {
    slug: "pgi-research-platform",
    title: "PGI Research Portal",
    subtitle: "Macro research platform for 300+ quants.",
    description:
      "Rebuilt PGI's static site into a TypeScript PWA backed by Postgres, aggregating RSS feeds and cutting manual research overhead. Enables analysts to monitor macro catalysts and event signals directly from mobile.",
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
    subtitle: "Sunsetted multi-LLM chat with shared context.",
    description:
      "Archived Convex and Clerk app for interacting with multiple LLMs in a single conversational workflow. Useful as a snapshot, not an active product.",
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
    status: "archived",
    links: {
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
    visible: false,
  },

  // === QUANT/FINANCE ===
  {
    slug: "options-pricing-sensitivity",
    title: "Options Pricing + Sensitivity Analysis",
    subtitle: "Black-Scholes and binomial pricing with volatility sweeps.",
    description:
      "Developed a Python tool to price European options using Black-Scholes and binomial models, analyzing how prices move across volatility regimes to illustrate Greeks and model behavior.",
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
