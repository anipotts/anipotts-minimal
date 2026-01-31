/**
 * GitHub API helpers for metrics.
 * Uses the GraphQL API for contribution calendar (streaks)
 * and REST API for commit counts and repo stats.
 */

import { getLanguageColor } from "../utils/languages";

interface ContributionDay {
  contributionCount: number;
  date: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface GitHubStats {
  totalCommits: number;
  currentStreak: number;
  longestStreak: number;
  publicRepos: number;
  totalStars: number;
  fetchedAt: string;
}

export interface GitHubLanguageBreakdown {
  languages: { name: string; bytes: number; percentage: number; color: string }[];
  totalBytes: number;
  repoCount: number;
  fetchedAt: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  date: string;
  repo: string;
  url: string;
}

export interface GitHubRecentActivity {
  commits: GitHubCommit[];
  fetchedAt: string;
}

/**
 * Fetch contribution calendar via GitHub GraphQL API.
 * Requires a personal access token with `read:user` scope.
 */
async function fetchContributionCalendar(
  username: string,
  token: string,
): Promise<ContributionDay[]> {
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL API error: ${res.status}`);
  }

  const data = await res.json();
  const weeks: ContributionWeek[] =
    data?.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];

  return weeks.flatMap((w) => w.contributionDays);
}

/** Calculate current and longest streaks from contribution days. */
function calculateStreaks(days: ContributionDay[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (days.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Sort by date descending (most recent first)
  const sorted = [...days].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Current streak: count backwards from today (or yesterday if today has 0)
  let currentStreak = 0;
  const today = new Date().toISOString().split("T")[0];
  let startIdx = 0;

  // If today has no contributions, start from yesterday
  if (sorted[0]?.date === today && sorted[0].contributionCount === 0) {
    startIdx = 1;
  }

  for (let i = startIdx; i < sorted.length; i++) {
    if (sorted[i].contributionCount > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Longest streak: scan all days in chronological order
  let longestStreak = 0;
  let streak = 0;
  const chronological = [...days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  for (const day of chronological) {
    if (day.contributionCount > 0) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * Fetch total commit count using GitHub Search API.
 * This counts commits authored by the user across all repos.
 */
async function fetchTotalCommits(
  username: string,
  token: string,
): Promise<number> {
  const res = await fetch(
    `https://api.github.com/search/commits?q=author:${username}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.cloak-preview+json",
      },
    },
  );

  if (!res.ok) {
    // Fallback: use contribution calendar total if search API fails
    return 0;
  }

  const data = await res.json();
  return data.total_count ?? 0;
}

/** Fetch user profile stats (repos, etc.) from REST API. */
async function fetchUserProfile(
  username: string,
  token: string,
): Promise<{ publicRepos: number; totalStars: number }> {
  const [userRes, starsRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),
  ]);

  const userData = userRes.ok ? await userRes.json() : { public_repos: 0 };
  const repos = starsRes.ok ? await starsRes.json() : [];

  const totalStars = Array.isArray(repos)
    ? repos.reduce(
        (sum: number, repo: { stargazers_count?: number }) =>
          sum + (repo.stargazers_count ?? 0),
        0,
      )
    : 0;

  return {
    publicRepos: userData.public_repos ?? 0,
    totalStars,
  };
}

/**
 * Fetch all GitHub stats for a user.
 * Requires env: GITHUB_TOKEN (personal access token with read:user scope)
 */
export async function fetchGitHubStats(
  username: string,
  token: string,
): Promise<GitHubStats> {
  const [contributionDays, totalCommits, profile] = await Promise.all([
    fetchContributionCalendar(username, token),
    fetchTotalCommits(username, token),
    fetchUserProfile(username, token),
  ]);

  const { currentStreak, longestStreak } = calculateStreaks(contributionDays);

  // If search API returned 0, fall back to contribution calendar total
  const commitCount =
    totalCommits > 0
      ? totalCommits
      : contributionDays.reduce((sum, d) => sum + d.contributionCount, 0);

  return {
    totalCommits: commitCount,
    currentStreak,
    longestStreak,
    publicRepos: profile.publicRepos,
    totalStars: profile.totalStars,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch aggregated language breakdown across all public repos.
 * Uses the per-repo `/languages` endpoint and sums bytes.
 */
export async function fetchRepoLanguages(
  username: string,
  token: string,
): Promise<GitHubLanguageBreakdown> {
  // Get all repos first
  const reposRes = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!reposRes.ok) {
    throw new Error(`GitHub repos API error: ${reposRes.status}`);
  }

  const repos: { name: string; fork: boolean }[] = await reposRes.json();
  // Skip forks — they inflate language counts with code you didn't write
  const ownRepos = repos.filter((r) => !r.fork);

  // Fetch language bytes for each repo (in parallel, batched)
  const langTotals = new Map<string, number>();
  const batchSize = 10;

  for (let i = 0; i < ownRepos.length; i += batchSize) {
    const batch = ownRepos.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (repo) => {
        const res = await fetch(
          `https://api.github.com/repos/${username}/${repo.name}/languages`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return {};
        return (await res.json()) as Record<string, number>;
      }),
    );

    for (const repoLangs of results) {
      for (const [lang, bytes] of Object.entries(repoLangs)) {
        langTotals.set(lang, (langTotals.get(lang) ?? 0) + bytes);
      }
    }
  }

  const totalBytes = Array.from(langTotals.values()).reduce((a, b) => a + b, 0);

  // Sort by bytes descending, take top 10
  const sorted = Array.from(langTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const languages = sorted.map(([name, bytes]) => ({
    name,
    bytes,
    percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
    color: getLanguageColor(name),
  }));

  return {
    languages,
    totalBytes,
    repoCount: ownRepos.length,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch recent commits across the user's repos.
 * Gets the last 30 days of commits from the most recently pushed repos.
 */
export async function fetchRecentCommits(
  username: string,
  token: string,
  repos?: string[],
): Promise<GitHubRecentActivity> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // If specific repos are provided, use those; otherwise fetch recently pushed repos
  let repoNames: string[];
  if (repos && repos.length > 0) {
    repoNames = repos;
  } else {
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=20&sort=pushed`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!reposRes.ok) {
      throw new Error(`GitHub repos API error: ${reposRes.status}`);
    }
    const repoList: { name: string; fork: boolean }[] = await reposRes.json();
    repoNames = repoList.filter((r) => !r.fork).map((r) => r.name);
  }

  // Fetch commits for each repo
  const allCommits: GitHubCommit[] = [];

  const batchSize = 5;
  for (let i = 0; i < repoNames.length; i += batchSize) {
    const batch = repoNames.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (repoName) => {
        const res = await fetch(
          `https://api.github.com/repos/${username}/${repoName}/commits?author=${username}&since=${since}&per_page=30`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return [];
        const commits: {
          sha: string;
          commit: { message: string; author: { date: string } };
          html_url: string;
        }[] = await res.json();

        return commits.map((c) => ({
          sha: c.sha.slice(0, 7),
          message: c.commit.message.split("\n")[0],
          date: c.commit.author.date,
          repo: repoName,
          url: c.html_url,
        }));
      }),
    );
    allCommits.push(...results.flat());
  }

  // Sort by date descending, take most recent 50
  allCommits.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    commits: allCommits.slice(0, 50),
    fetchedAt: new Date().toISOString(),
  };
}
