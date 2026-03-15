#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Not a git repository: $ROOT_DIR" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit or stash changes first." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "Not on main branch (current: $BRANCH)." >&2
  exit 1
fi

pnpm update-claude-stats

git add apps/www/src/app/(main)/claude/claude-stats.json

if git diff --cached --quiet; then
  echo "No changes to claude-stats.json."
  exit 0
fi

git commit -m "chore: update claude stats"
