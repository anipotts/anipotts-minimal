#!/usr/bin/env bash
# code-health.sh — Push git repo health data to ingest Worker
# Designed for cron every 30 min on Mac Mini
# Reads INGEST_URL and INGEST_KEY from ~/.config/anipotts/ingest-key

set -euo pipefail
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

command -v jq >/dev/null || { echo "ERROR: jq required" >&2; exit 1; }

CONFIG_FILE="$HOME/.config/anipotts/ingest-key"
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "ERROR: Missing $CONFIG_FILE" >&2
  exit 1
fi

# Parse config safely (no source)
INGEST_URL=$(grep '^INGEST_URL=' "$CONFIG_FILE" | head -1 | cut -d= -f2-)
INGEST_KEY=$(grep '^INGEST_KEY=' "$CONFIG_FILE" | head -1 | cut -d= -f2-)

if [[ -z "${INGEST_URL:-}" || -z "${INGEST_KEY:-}" ]]; then
  echo "ERROR: INGEST_URL and INGEST_KEY must be set in $CONFIG_FILE" >&2
  exit 1
fi

REPOS_DIR="$HOME/Code/active"
repos_arr="[]"

for repo_dir in "$REPOS_DIR"/*/; do
  [[ -d "$repo_dir/.git" ]] || continue

  repo_name=$(basename "$repo_dir")

  # Dirty status
  dirty_count=$(git -C "$repo_dir" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  is_dirty=false
  if [[ "$dirty_count" -gt 0 ]]; then
    is_dirty=true
  fi

  # Unpushed commits (only if remote tracking branch exists)
  unpushed=0
  if git -C "$repo_dir" rev-parse '@{u}' >/dev/null 2>&1; then
    unpushed=$(git -C "$repo_dir" rev-list '@{u}..HEAD' --count 2>/dev/null || echo "0")
  fi

  # Stale branches (merged into main/master, excluding main/master itself)
  stale=0
  default_branch=""
  for candidate in main master; do
    if git -C "$repo_dir" rev-parse --verify "$candidate" >/dev/null 2>&1; then
      default_branch="$candidate"
      break
    fi
  done
  if [[ -n "$default_branch" ]]; then
    stale=$(git -C "$repo_dir" branch --merged "$default_branch" 2>/dev/null \
      | { grep -v "^\*" || true; } \
      | { grep -vE "^\s*(main|master)$" || true; } \
      | wc -l | tr -d ' ')
  fi

  # Last commit (truncate message for sanity)
  last_commit_at=$(git -C "$repo_dir" log -1 --format="%aI" 2>/dev/null || echo "")
  last_commit_msg=$(git -C "$repo_dir" log -1 --format="%s" 2>/dev/null || echo "")
  last_commit_msg="${last_commit_msg:0:200}"

  # Build JSON safely with jq
  repos_arr=$(echo "$repos_arr" | jq \
    --arg repo "$repo_name" \
    --argjson dirty "$is_dirty" \
    --argjson unpushed "$unpushed" \
    --argjson stale "$stale" \
    --arg commit_at "$last_commit_at" \
    --arg commit_msg "$last_commit_msg" \
    '. + [{repo: $repo, dirty: $dirty, unpushed_count: $unpushed, stale_branches: $stale, last_commit_at: $commit_at, last_commit_msg: $commit_msg}]')
done

repo_count=$(echo "$repos_arr" | jq 'length')

if [[ "$repo_count" -gt 0 ]]; then
  payload=$(jq -n --argjson data "$repos_arr" '{category: "code", data: $data}')
  curl -s -X POST "$INGEST_URL" \
    -H "Content-Type: application/json" \
    -H "X-Ingest-Key: $INGEST_KEY" \
    -d "$payload" \
    --max-time 10 || echo "WARN: Failed to POST code health" >&2
fi

echo "code-health: pushed $repo_count repos at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
