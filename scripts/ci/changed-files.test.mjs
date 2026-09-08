import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { changedFiles } from "./changed-files.mjs";

const cwd = mkdtempSync(join(tmpdir(), "site-changed-files-"));
const git = (...args) => execFileSync("git", args, { cwd, stdio: "pipe" });
const write = (path, value) => writeFileSync(join(cwd, path), value);
try {
  git("init", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.invalid");
  git("config", "commit.gpgsign", "false");
  for (const path of [
    "committed",
    "staged",
    "unstaged",
    "deleted",
    "renamed",
  ]) {
    write(path, "before");
    git("add", path);
  }
  git("commit", "-m", "baseline");
  git("branch", "baseline");
  write("committed", "after");
  git("add", "committed");
  git("commit", "-m", "branch edit");
  const options = { cwd, base: "baseline" };
  assert.deepEqual(changedFiles(options), ["M\tcommitted"]);
  write("staged", "after");
  git("add", "staged");
  write("staged", "before");
  write("unstaged", "after");
  rmSync(join(cwd, "deleted"));
  renameSync(join(cwd, "renamed"), join(cwd, "new name"));
  write("untracked", "new");
  assert.deepEqual(
    changedFiles(options),
    ["M\tcommitted"],
    "CI scope excludes dirty changes",
  );
  const actual = new Set(changedFiles({ ...options, workingTree: true }));
  assert.deepEqual(
    actual,
    new Set([
      "M\tcommitted",
      "M\tstaged",
      "M\tunstaged",
      "D\tdeleted",
      "D\trenamed",
      "A\tnew name",
      "A\tuntracked",
    ]),
  );
  write("café", "new");
  assert.ok(
    changedFiles({ ...options, workingTree: true }).includes("A\tcafé"),
  );
  write("unsafe\npath", "new");
  assert.throws(
    () => changedFiles({ ...options, workingTree: true }),
    /tabs or newlines/,
  );
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
console.log(
  "changed-file scope: committed, staged, unstaged, untracked, deletes and renames passed",
);
