#!/usr/bin/env node

import assert from "node:assert/strict";

const POSITIVE_FIXTURE = `
# worker inventory

## retained workers

| Worker | Classification |
| --- | --- |
| \`workers/example\` | keep |

## conclusion
`;

const NEGATIVE_FIXTURE = `
# worker inventory

The worker at \`workers/example\` is discussed here but is not classified.

## deploy target mapping

| Worker | Deploy input |
| --- | --- |
| \`workers/example\` | example=true |
`;

assert.deepEqual(classifiedWorkers(POSITIVE_FIXTURE), ["workers/example"]);
assert.deepEqual(classifiedWorkers(NEGATIVE_FIXTURE), []);

export function classifiedWorkers(source) {
  const section = source.match(
    /^## retained workers\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m,
  );
  if (!section) return [];

  return section[1]
    .split("\n")
    .map((line) => line.match(/^\|\s*`(workers\/[a-z0-9-]+)`\s*\|/i)?.[1])
    .filter(Boolean)
    .sort();
}
