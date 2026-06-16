#!/bin/bash
# Daily Claude Code stats update
# Regenerates claude-stats.json from mine.db and optionally commits

set -euo pipefail

REPO_DIR="$HOME/Code/projects/anipotts-com"
LOG_DIR="$HOME/.claude/logs"
LOG_FILE="$LOG_DIR/stats-update.log"
MEMORY_FILE="$HOME/.claude/projects/-Users-anipotts-Code-projects-anipotts-com/memory/claude_stats_verified.md"
MINE_DB="$HOME/.claude/mine.db"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

log "Starting stats update"

cd "$REPO_DIR"

# Regenerate stats JSON from mine.db
if ! node scripts/claude/generate-claude-stats.mjs >> "$LOG_FILE" 2>&1; then
  log "ERROR: Stats generation failed"
  exit 1
fi

log "Stats JSON regenerated"

# Weekly snapshot append (only if latest snapshot is > 6 days old)
if [ -f "$MINE_DB" ] && [ -f "$MEMORY_FILE" ]; then
  LAST_SNAPSHOT=$(grep -o 'Snapshot: [0-9-]*' "$MEMORY_FILE" | tail -1 | cut -d' ' -f2)
  TODAY=$(date '+%Y-%m-%d')

  if [ -n "$LAST_SNAPSHOT" ]; then
    DAYS_SINCE=$(( ($(date -j -f '%Y-%m-%d' "$TODAY" '+%s') - $(date -j -f '%Y-%m-%d' "$LAST_SNAPSHOT" '+%s')) / 86400 ))
  else
    DAYS_SINCE=999
  fi

  if [ "$DAYS_SINCE" -ge 7 ]; then
    log "Appending weekly snapshot (last was $LAST_SNAPSHOT, $DAYS_SINCE days ago)"

    STATS=$(sqlite3 "$MINE_DB" "
      SELECT
        COUNT(*),
        COALESCE(ROUND(SUM(MIN(duration_wall_seconds, 21600)) / 3600.0), 0),
        COALESCE(ROUND(SUM(duration_active_seconds) / 3600.0), 0),
        COALESCE(SUM(tool_use_count), 0)
      FROM sessions WHERE is_subagent = 0
    ")

    IFS='|' read -r SESSIONS HOURS_WALL HOURS_ACTIVE TOOLS <<< "$STATS"

    STREAK=$(sqlite3 "$MINE_DB" "
      WITH daily AS (
        SELECT DISTINCT date(start_time, 'localtime') as d
        FROM sessions WHERE is_subagent = 0 AND start_time IS NOT NULL
      ),
      streak AS (
        SELECT d, ROW_NUMBER() OVER (ORDER BY d DESC) as rn,
               CAST(julianday(date('now', 'localtime')) - julianday(d) AS INTEGER) as days_ago
        FROM daily
      )
      SELECT COUNT(*) FROM streak WHERE days_ago = rn - 1 OR (rn = 1 AND days_ago <= 1)
    ")

    PROJECTS=$(sqlite3 "$MINE_DB" "SELECT COUNT(DISTINCT project_name) FROM sessions WHERE is_subagent = 0")

    cat >> "$MEMORY_FILE" << EOF

## Snapshot: $TODAY

| Metric | Value |
|--------|-------|
| Main sessions | $SESSIONS |
| Wall hours (6h cap) | $HOURS_WALL |
| Active hours | $HOURS_ACTIVE |
| Tool calls (main) | $TOOLS |
| Streak | ${STREAK}d |
| Projects | $PROJECTS |
EOF

    log "Snapshot appended: $SESSIONS sessions, ${HOURS_WALL}h wall, ${HOURS_ACTIVE}h active"
  else
    log "Skipping snapshot (only $DAYS_SINCE days since last)"
  fi
fi

log "Done"
