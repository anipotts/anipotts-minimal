#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/demos/capture-project-demo.mjs <project-slug>");
  process.exit(1);
}

const scenarioPath = path.join(process.cwd(), "scripts", "demos", "scenarios", `${slug}.json`);
if (!fs.existsSync(scenarioPath)) {
  console.error(`Scenario not found: ${scenarioPath}`);
  process.exit(1);
}

const scenario = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
const outputDir = path.join(process.cwd(), "apps", "www", "public", "media", "demos", slug);
const tempVideoDir = path.join(process.cwd(), "scripts", "demos", ".tmp", slug);

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(tempVideoDir, { recursive: true });

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function hasCommand(name) {
  try {
    execSync(`command -v ${name}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const { chromium } = await import("playwright");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: scenario.viewport || { width: 1440, height: 900 },
  recordVideo: {
    dir: tempVideoDir,
    size: scenario.videoSize || { width: 1440, height: 900 },
  },
});

const page = await context.newPage();
await page.goto(scenario.url, { waitUntil: "networkidle" });

for (const step of scenario.steps || []) {
  if (step.action === "wait") {
    await page.waitForTimeout(step.ms || 500);
    continue;
  }

  if (step.action === "goto" && step.url) {
    await page.goto(step.url, { waitUntil: "networkidle" });
    continue;
  }

  if (step.action === "click" && step.selector) {
    await page.click(step.selector);
    continue;
  }

  if (step.action === "fill" && step.selector) {
    await page.fill(step.selector, step.value || "");
    continue;
  }

  if (step.action === "press" && step.key) {
    await page.keyboard.press(step.key);
    continue;
  }

  if (step.action === "hover" && step.selector) {
    await page.hover(step.selector);
    continue;
  }

  if (step.action === "screenshot") {
    const shot = step.path || path.join(outputDir, "step.png");
    await page.screenshot({ path: shot, fullPage: Boolean(step.fullPage) });
    continue;
  }
}

await page.waitForTimeout(scenario.tailMs || 1000);
await context.close();
await browser.close();

const videoFile = fs
  .readdirSync(tempVideoDir)
  .find((file) => file.endsWith(".webm") || file.endsWith(".mp4"));

if (!videoFile) {
  console.error("No recorded video found.");
  process.exit(1);
}

const sourceVideoPath = path.join(tempVideoDir, videoFile);
const webmPath = path.join(outputDir, "demo.webm");
fs.copyFileSync(sourceVideoPath, webmPath);

const gifPath = path.join(outputDir, "demo.gif");
const posterPath = path.join(outputDir, "poster.jpg");

if (hasCommand("ffmpeg")) {
  run(`ffmpeg -y -i "${webmPath}" -vf "fps=12,scale=960:-1:flags=lanczos" "${gifPath}"`);
  run(`ffmpeg -y -i "${webmPath}" -ss 00:00:01 -vframes 1 "${posterPath}"`);
} else {
  console.warn("ffmpeg not found. Skipping GIF/poster generation.");
}

const manifest = {
  slug,
  sourceUrl: scenario.url,
  generatedAt: new Date().toISOString(),
  files: {
    webm: fs.existsSync(webmPath)
      ? {
          path: path.relative(process.cwd(), webmPath),
          sizeBytes: fs.statSync(webmPath).size,
        }
      : null,
    gif: fs.existsSync(gifPath)
      ? {
          path: path.relative(process.cwd(), gifPath),
          sizeBytes: fs.statSync(gifPath).size,
        }
      : null,
    poster: fs.existsSync(posterPath)
      ? {
          path: path.relative(process.cwd(), posterPath),
          sizeBytes: fs.statSync(posterPath).size,
        }
      : null,
  },
};

const manifestPath = path.join(outputDir, "manifest.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Saved demo assets to ${outputDir}`);
