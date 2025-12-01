export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  year: string;
  category: "ai" | "product" | "quant" | "music" | "other";
  role: string;
  duration: string;
  tags: string[];
  links?: {
    live?: string;
    repo?: string;
  };
};

export const projects: Project[] = [
  {
    slug: "pgi-research",
    title: "PGI Research Platform",
    subtitle: "Internal research platform for quants.",
    description: "Building a comprehensive research platform for PGI, serving quants at top universities like UChicago, NYU, Princeton, and Brown. Focuses on data accessibility and analysis tools.",
    year: "2025",
    category: "quant",
    role: "Lead Engineer",
    duration: "Ongoing",
    tags: ["Next.js", "Python", "PostgreSQL", "AWS"],
  },
  {
    slug: "atlantic-analytics",
    title: "Atlantic Records Analytics",
    subtitle: "Internal analytics dashboards.",
    description: "Built internal analytics dashboards to visualize streaming data and artist performance metrics, enabling data-driven decisions for the A&R team.",
    year: "2024",
    category: "product",
    role: "Full Stack Developer",
    duration: "3 months",
    tags: ["React", "D3.js", "Node.js"],
  },
  {
    slug: "dada-digital",
    title: "DADA Digital Scaling",
    subtitle: "Lead generation scaling infrastructure.",
    description: "Scaled lead generation systems, optimizing data pipelines and automating outreach processes to increase conversion rates.",
    year: "2024",
    category: "product",
    role: "Backend Engineer",
    duration: "2 months",
    tags: ["Python", "Celery", "Redis"],
  },
  {
    slug: "range-media-scraper",
    title: "Range Media Scraper",
    subtitle: "Automated social media scraping.",
    description: "Developed automated scraping tools to monitor social media trends and artist engagement across multiple platforms.",
    year: "2023",
    category: "ai",
    role: "Automation Engineer",
    duration: "1 month",
    tags: ["Puppeteer", "TypeScript", "AWS Lambda"],
  },
];
