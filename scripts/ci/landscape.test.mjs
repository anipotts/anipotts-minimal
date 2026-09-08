import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = (name) =>
  readFileSync(`apps/www/src/components/${name}.astro`, "utf8");
const flow = component("AmbientFlow");
assert.ok(flow.includes('preserveAspectRatio="xMidYMid slice"'));
assert.equal(flow.includes('preserveAspectRatio="none"'), false);
assert.ok(flow.includes('kind: "work" | "writing"'));
assert.ok(flow.includes("prefers-reduced-motion: no-preference"));
assert.ok(flow.includes("prefers-reduced-motion: reduce"));
assert.ok(flow.includes("(pointer: fine)"));
assert.ok(flow.includes("(pointer: coarse)"));
assert.ok(flow.includes("a:focus-visible"));
assert.ok(flow.includes("--flow-shift: -4px"));
assert.ok(flow.includes(".ambient-flow__shape--3 {\n      display: none;"));
assert.equal(/<script|@keyframes/.test(flow), false);

const page = component("PageCurrent");
assert.ok(page.includes('preserveAspectRatio="xMidYMid slice"'));
assert.ok(page.includes("opacity: 0.052"));
assert.ok(page.includes("opacity: 0.035"));
assert.ok(page.includes("prefers-reduced-motion: reduce"));
for (const name of [
  "WorkCard",
  "WritingRow",
  "ExperienceFeatureCard",
  "CodingAgentTipsCard",
]) {
  const source = component(name);
  assert.ok(source.includes("<AmbientFlow"), `${name} uses shared artwork`);
  assert.equal(
    /transform:\s*(?:translateY\(-|scale\(1\.)/.test(source),
    false,
    `${name} keeps content steady during interaction`,
  );
}
console.log(
  "landscape: shared crops, static fallbacks, and anchored content passed",
);
