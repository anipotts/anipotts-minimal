import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const adminSource = join(root, "apps/admin/src");
const productionFiles = collect(adminSource).filter(
  (file) =>
    !file.endsWith(".test.ts") &&
    !file.endsWith(".test.tsx") &&
    !file.endsWith(".test-fixtures.ts") &&
    !file.includes("/dev-"),
);

for (const file of productionFiles) {
  const source = readFileSync(file, "utf8");
  assert.doesNotMatch(
    source,
    /from\s+["'][^"']*(?:dev-fixtures|dev-work-lifecycle-fixtures|dev-operator-work)["']/,
    `${relative(root, file)} statically imports development fixture data`,
  );
}

const fixtureConsumers = productionFiles.filter((file) => {
  const source = readFileSync(file, "utf8");
  return /admin-control\/(?:dev-fixtures|dev-work-lifecycle-fixtures)/.test(
    source,
  );
});

for (const file of fixtureConsumers) {
  const source = readFileSync(file, "utf8");
  assert.match(
    source,
    /import\.meta\.env\.DEV/,
    `${relative(root, file)} must guard fixture loading with import.meta.env.DEV`,
  );
  assert.match(
    source,
    /await import\(/,
    `${relative(root, file)} must load development fixtures dynamically`,
  );
  if (source.includes("loadAdminControlSnapshot")) {
    assert.match(
      source,
      /loadAdminControlSnapshot\(null,\s*adminControlFixtureData\)/,
      `${relative(root, file)} must not let a local D1 binding shadow explicit development fixtures`,
    );
  }
}

const runtimeOperatorWork = readFileSync(
  join(adminSource, "data/operator-work.ts"),
  "utf8",
);
assert.match(runtimeOperatorWork, /mode:\s*"disconnected"/);
assert.doesNotMatch(runtimeOperatorWork, /operatorWorkFixture/);

console.log(
  `admin fixture boundary passed for ${productionFiles.length} production modules`,
);

function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collect(path);
    return [".astro", ".ts", ".tsx"].includes(extname(path)) ? [path] : [];
  });
}
