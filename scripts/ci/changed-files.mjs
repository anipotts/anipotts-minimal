import { execFileSync } from "node:child_process";

/** Commit scope is the CI default; working-tree mode adds all local changes. */
export function changedFiles({
  cwd = process.cwd(),
  base = "origin/main",
  workingTree = false,
} = {}) {
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
  const record = (status, path) => {
    if (!path || /[\t\r\n]/u.test(path))
      throw new Error("changed-file paths must not contain tabs or newlines");
    return `${status}\t${path}`;
  };
  const diff = (...args) => {
    const fields = git(
      "diff",
      "--name-status",
      "--no-renames",
      "-z",
      ...args,
    ).split("\0");
    fields.pop();
    const records = [];
    for (let i = 0; i < fields.length; i += 2)
      records.push(record(fields[i], fields[i + 1]));
    return records;
  };
  const mergeBase = git("merge-base", base, "HEAD").trim();
  const changes = diff(mergeBase, "HEAD");
  if (workingTree) {
    changes.push(...diff("--cached"), ...diff());
    const untracked = git("ls-files", "--others", "--exclude-standard", "-z");
    changes.push(
      ...untracked
        .split("\0")
        .filter(Boolean)
        .map((path) => record("A", path)),
    );
  }
  return [...new Set(changes)];
}
