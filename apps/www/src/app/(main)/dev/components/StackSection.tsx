import { FadeIn } from "@anipotts/ui";
import type { GitHubLanguageBreakdown } from "@anipotts/lib/metrics";

const stack = {
  frontend: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
  backend: ["Node.js", "FastAPI", "PostgreSQL", "Redis"],
  infrastructure: ["Vercel", "AWS", "Docker", "Terraform"],
  tools: ["Neovim", "tmux", "Claude Code", "Arc Browser"],
  hardware: ["MacBook Pro M3 Max", "Apple Studio Display", "ZSA Moonlander"],
};

const categories = [
  { name: "Frontend", items: stack.frontend },
  { name: "Backend", items: stack.backend },
  { name: "Infrastructure", items: stack.infrastructure },
  { name: "Tools", items: stack.tools },
  { name: "Hardware", items: stack.hardware },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StackSection({
  languages,
}: {
  languages: GitHubLanguageBreakdown | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Language breakdown from GitHub */}
      <FadeIn delay={0.05}>
        <div className="p-5 bg-input border border-border rounded-lg">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-4">
            Languages
            {languages && (
              <span className="text-faint font-normal ml-2">
                {languages.repoCount} repos
              </span>
            )}
          </h2>

          {languages && languages.languages.length > 0 ? (
            (() => {
              const topLangs = languages.languages.slice(0, 6);
              const otherLangs = languages.languages.slice(6);
              const otherPct = otherLangs.reduce(
                (sum, l) => sum + l.percentage,
                0,
              );
              const displayLangs =
                otherPct > 0
                  ? [
                      ...topLangs,
                      {
                        name: "Other",
                        percentage: otherPct,
                        color: "#6b7280",
                        bytes: 0,
                      },
                    ]
                  : topLangs;

              return (
                <>
                  <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
                    {displayLangs.map((lang) => (
                      <div
                        key={lang.name}
                        className="transition-all duration-500"
                        style={{
                          width: `${lang.percentage}%`,
                          backgroundColor: lang.color,
                          minWidth: lang.percentage > 0.5 ? "3px" : 0,
                        }}
                        title={`${lang.name}: ${lang.percentage}%`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5">
                    {displayLangs.map((lang) => (
                      <div key={lang.name} className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: lang.color }}
                        />
                        <span className="text-xs text-secondary truncate">
                          {lang.name}
                        </span>
                        <span className="text-[10px] text-faint font-mono ml-auto">
                          {lang.percentage.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-faint mt-2 font-mono">
                    {formatBytes(languages.totalBytes)} across{" "}
                    {languages.repoCount} repos
                  </p>
                </>
              );
            })()
          ) : (
            <div className="flex flex-wrap gap-2">
              {["TypeScript", "Python", "Go", "Rust"].map((lang) => (
                <span
                  key={lang}
                  className="px-3 py-1.5 bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded text-sm text-secondary"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Stack categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category, i) => (
          <FadeIn key={category.name} delay={0.1 + i * 0.05}>
            <div className="p-5 bg-input border border-border rounded-lg hover:border-accent-400/20 transition-colors">
              <h2 className="text-xs uppercase tracking-widest text-muted mb-4">
                {category.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {category.items.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded text-sm text-secondary hover:border-accent-400/30 hover:text-body transition-colors"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Terminal config */}
      <FadeIn delay={0.4}>
        <div className="p-5 bg-accent-400/5 border border-accent-400/20 rounded-lg">
          <h2 className="text-xs uppercase tracking-widest text-accent-400 mb-3">
            Terminal Config
          </h2>
          <pre className="text-xs text-tertiary font-mono overflow-x-auto">
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
