#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const owner = process.argv[2] || "anipotts";
const now = Date.now();
const outputDir = path.join(process.cwd(), "content", "work");

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}

function daysSince(isoDate) {
  return Math.max(0, Math.floor((now - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24)));
}

function scoreRepo(repo) {
  const ageDays = daysSince(repo.updatedAt);
  const recencyScore = ageDays <= 14 ? 35 : ageDays <= 45 ? 28 : ageDays <= 90 ? 20 : ageDays <= 180 ? 12 : 4;
  const starScore = Math.min(20, (repo.stargazerCount || 0) * 4);
  const language = repo.primaryLanguage?.name || "none";
  const languageScore = ["TypeScript", "Python", "Go", "Rust"].includes(language) ? 15 : 8;
  const descriptionScore = repo.description && repo.description.trim().length > 18 ? 10 : 3;
  const namingScore = repo.name.includes("test") || repo.name.includes("sandbox") ? 4 : 10;

  const total = recencyScore + starScore + languageScore + descriptionScore + namingScore;

  let publishState = "improve_then_publish";
  if (total >= 72) publishState = "publish_now";
  if (total < 52) publishState = "placeholder";
  if (repo.name.includes("archive") || repo.name.includes("old")) publishState = "archive";

  return {
    ...repo,
    language,
    score: total,
    publishState,
    polishActions: [
      "tighten README positioning",
      "add demo gif/webm",
      "clarify technical scope + outcome",
    ],
  };
}

const raw = run(
  `gh repo list ${owner} --limit 200 --json name,description,isPrivate,updatedAt,url,stargazerCount,primaryLanguage`,
);
const repos = JSON.parse(raw).filter((repo) => !repo.isPrivate);

const scored = repos
  .map(scoreRepo)
  .sort((a, b) => b.score - a.score)
  .map((repo, index) => ({ ...repo, rank: index + 1 }));

fs.mkdirSync(outputDir, { recursive: true });

const jsonPath = path.join(outputDir, "github-audit.json");
fs.writeFileSync(jsonPath, `${JSON.stringify(scored, null, 2)}\n`, "utf8");

const mdRows = scored
  .map(
    (repo) =>
      `| ${repo.rank} | ${repo.name} | ${repo.language} | ${repo.score} | ${repo.publishState} | ${repo.polishActions.join(", ")} |`,
  )
  .join("\n");

const markdown = `# GitHub Public Repo Audit\n\nGenerated: ${new Date().toISOString()}\nOwner: ${owner}\n\n| Rank | Repo | Language | Score | Decision | Recommended Next Edits |\n| --- | --- | --- | --- | --- | --- |\n${mdRows}\n`;

const mdPath = path.join(outputDir, "github-audit.md");
fs.writeFileSync(mdPath, markdown, "utf8");

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
console.log(`Scored ${scored.length} public repositories.`);
