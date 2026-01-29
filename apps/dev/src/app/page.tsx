import { FadeIn } from "@anipotts/ui";
import { FaTerminal, FaCode, FaServer, FaTools, FaLaptopCode } from "react-icons/fa";
import { createClient } from "@anipotts/lib/supabase";
import { getCacheValue, CACHE_KEYS } from "@anipotts/lib/metrics";
import type { GitHubLanguageBreakdown } from "@anipotts/lib/metrics";

// Revalidate every 60 seconds — language data updates daily via cron
export const revalidate = 60;

const stack = {
  frontend: ["Next.js", "React", "Tailwind CSS", "Framer Motion"],
  backend: ["Node.js", "FastAPI", "PostgreSQL", "Redis"],
  infrastructure: ["Vercel", "AWS", "Docker", "Terraform"],
  tools: ["Neovim", "tmux", "Claude Code", "Arc Browser"],
  hardware: ["MacBook Pro M3 Max", "Apple Studio Display", "ZSA Moonlander"],
};

const categories = [
  { name: "Frontend", items: stack.frontend, icon: FaLaptopCode },
  { name: "Backend", items: stack.backend, icon: FaServer },
  { name: "Infrastructure", items: stack.infrastructure, icon: FaServer },
  { name: "Tools", items: stack.tools, icon: FaTools },
  { name: "Hardware", items: stack.hardware, icon: FaTerminal },
];

async function getLanguages(): Promise<GitHubLanguageBreakdown | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const cached = await getCacheValue<GitHubLanguageBreakdown>(
    supabase,
    CACHE_KEYS.GITHUB_LANGUAGES,
  );

  return cached?.value ?? null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DevPage() {
  const languages = await getLanguages();

  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-4xl mx-auto">
      <FadeIn>
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-xs uppercase tracking-widest text-accent-400 mb-2">
            Development Setup
          </h1>
          <p className="text-gray-500 text-sm">
            The tools and technologies I use daily
          </p>
        </div>
      </FadeIn>

      {/* Language breakdown from GitHub */}
      <FadeIn delay={0.05}>
        <div className="p-5 bg-white/5 border border-white/10 rounded-lg">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <FaCode className="text-accent-400" />
            Languages
            {languages && (
              <span className="text-gray-700 font-normal">
                — {languages.repoCount} repos
              </span>
            )}
          </h2>

          {languages && languages.languages.length > 0 ? (
            <>
              {/* Stacked language bar */}
              <div className="flex h-3 rounded-full overflow-hidden mb-4">
                {languages.languages.map((lang) => (
                  <div
                    key={lang.name}
                    className="transition-all duration-500"
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: lang.color,
                      minWidth: lang.percentage > 0 ? "2px" : 0,
                    }}
                    title={`${lang.name}: ${lang.percentage}%`}
                  />
                ))}
              </div>

              {/* Language labels */}
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {languages.languages.map((lang) => (
                  <div key={lang.name} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: lang.color }}
                    />
                    <span className="text-sm text-gray-300">{lang.name}</span>
                    <span className="text-xs text-gray-600 font-mono">
                      {lang.percentage}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Total code size */}
              <p className="text-[10px] text-gray-700 mt-3 font-mono">
                {formatBytes(languages.totalBytes)} total across public repos
              </p>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {["TypeScript", "Python", "Go", "Rust"].map((lang) => (
                <span
                  key={lang}
                  className="px-3 py-1.5 bg-black/40 border border-white/10 rounded text-sm text-gray-300"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Static stack categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category, i) => (
          <FadeIn key={category.name} delay={0.1 + i * 0.08}>
            <div className="p-5 bg-white/5 border border-white/10 rounded-lg hover:border-accent-400/20 transition-colors">
              <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <category.icon className="text-accent-400" />
                {category.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {category.items.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 bg-black/40 border border-white/10 rounded text-sm text-gray-300 hover:border-accent-400/30 hover:text-white transition-colors"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.6}>
        <div className="p-5 bg-accent-400/5 border border-accent-400/20 rounded-lg">
          <h2 className="text-xs uppercase tracking-widest text-accent-400 mb-3">
            Terminal Config
          </h2>
          <pre className="text-xs text-gray-400 font-mono overflow-x-auto">
{`# ~/.zshrc
export EDITOR="nvim"
alias c="claude"
alias dev="pnpm dev"
alias build="pnpm build"

# Navigation
alias ..="cd .."
alias ...="cd ../.."
alias code="cd ~/Code/active"`}
          </pre>
        </div>
      </FadeIn>
    </div>
  );
}
