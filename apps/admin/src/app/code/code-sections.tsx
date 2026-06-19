import {
  getDeploymentStatus,
  getNpmStats,
  getGitHubOverview,
  getClaudeMonHealth,
  getNpmVersions,
} from "@anipotts/lib/code";
import { getEnv } from "@anipotts/lib/env";
import { getMiniRepos, getMiniSessions } from "@anipotts/lib/mini";
import { Section } from "@/components/shared/section";
import LiveCodeSections from "./live-repos";
import { StatCard } from "./code-display";
import {
  ClaudeMonStatus,
  FlyRow,
  GhRepoRow,
  NpmRow,
  VersionRow,
  WorkerRow,
} from "./code-rows";

export async function LiveCodeWrapper() {
  const [repos, sessions] = await Promise.all([
    getMiniRepos(),
    getMiniSessions(),
  ]);

  return <LiveCodeSections initial={{ repos, sessions }} />;
}

export async function DeploymentsSection() {
  const deployment = await getDeploymentStatus({
    CF_API_TOKEN: getEnv("CF_API_TOKEN"),
    CF_ACCOUNT_ID: getEnv("CF_ACCOUNT_ID"),
    FLY_API_TOKEN: getEnv("FLY_API_TOKEN"),
  });

  return (
    <Section title="Deployments">
      <div className="space-y-3">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">
            Cloudflare Workers
          </div>
          <div className="space-y-px">
            {deployment.workers.map((w) => (
              <WorkerRow key={w.name} w={w} />
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">
            Fly.io
          </div>
          <div className="space-y-px">
            {deployment.flyMachines.map((m) => (
              <FlyRow key={m.name} m={m} />
            ))}
          </div>
        </div>
        <p className="text-[10px] text-zinc-600">
          Fetched{" "}
          {new Date(deployment.fetchedAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    </Section>
  );
}

export async function NpmSection() {
  const packages = await getNpmStats();

  return (
    <Section title="npm Packages">
      <div className="space-y-4">
        {packages.map((pkg) => (
          <NpmRow key={pkg.name} pkg={pkg} />
        ))}
      </div>
    </Section>
  );
}

export async function GitHubSection() {
  const overview = await getGitHubOverview({
    GITHUB_TOKEN: getEnv("GITHUB_TOKEN"),
  });

  if (overview.repos.length === 0) {
    return (
      <Section title="GitHub">
        <p className="text-[12px] text-zinc-600">GITHUB_TOKEN not configured</p>
      </Section>
    );
  }

  return (
    <Section title="GitHub">
      <div className="flex gap-4 mb-3">
        <StatCard label="Stars" value={overview.totalStars} />
        <StatCard label="Issues" value={overview.totalOpenIssues} />
        <StatCard label="PRs" value={overview.totalOpenPRs} />
      </div>
      <div className="admin-row text-[10px] text-zinc-500 uppercase tracking-wide border-b border-zinc-800/40">
        <div className="flex-1">Repo</div>
        <div className="w-14 text-right">Stars</div>
        <div className="w-14 text-right">Issues</div>
        <div className="w-14 text-right">PRs</div>
      </div>
      {overview.repos.map((r) => (
        <GhRepoRow key={r.name} repo={r} />
      ))}
      <p className="text-[10px] text-zinc-600 mt-2">
        Fetched{" "}
        {new Date(overview.fetchedAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
    </Section>
  );
}

export async function ClaudeMonSection() {
  const health = await getClaudeMonHealth();
  return (
    <Section title="ClaudeMon">
      <ClaudeMonStatus health={health} />
      <p className="text-[10px] text-zinc-600 mt-2">
        Checked{" "}
        {new Date(health.fetchedAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
    </Section>
  );
}

export async function PackageVersionsSection() {
  const versions = await getNpmVersions();
  return (
    <Section title="Package Versions">
      <div className="space-y-px">
        {versions.map((pkg) => (
          <VersionRow key={pkg.name} pkg={pkg} />
        ))}
      </div>
    </Section>
  );
}

export function VercelPlaceholder() {
  return (
    <Section title="Vercel">
      <div className="py-6 text-center">
        <p className="text-[12px] text-zinc-600">Connect Vercel</p>
      </div>
    </Section>
  );
}
