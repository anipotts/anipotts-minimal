#!/bin/bash
# Syncs ~/Business/data/*.yaml to D1 via the ingest Worker.
# Run from Mac Mini: ./scripts/sync-yaml-to-d1.sh
# Requires: yq (https://github.com/mikefarah/yq), curl, INGEST_KEY env var
#
# DO NOT install as a cron. This is a manual/on-demand script.

set -euo pipefail

INGEST_URL="${INGEST_URL:-https://anipotts-ingest.anipotts.workers.dev}"
YAML_DIR="${YAML_DIR:-$HOME/Business/data}"
INGEST_KEY="${INGEST_KEY:?Set INGEST_KEY env var (same as MAC_MINI_INGEST_KEY on the Worker)}"

if ! command -v yq &> /dev/null; then
  echo "Error: yq is required. Install with: brew install yq"
  exit 1
fi

sync_file() {
  local file="$1"
  local basename
  basename=$(basename "$file" .yaml)
  local json

  json=$(yq -o=json '.' "$file")

  local payload
  payload=$(cat <<EOF
{
  "category": "business",
  "data": {
    "key": "$basename",
    "value": $(echo "$json" | jq -c '.' 2>/dev/null || echo "$json"),
    "source_file": "$basename.yaml"
  }
}
EOF
)

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$INGEST_URL" \
    -H "Content-Type: application/json" \
    -H "X-Ingest-Key: $INGEST_KEY" \
    -d "$payload")

  if [ "$status" = "200" ]; then
    echo "  ✓ $basename.yaml -> D1"
  else
    echo "  ✗ $basename.yaml (HTTP $status)"
    return 1
  fi
}

echo "Syncing YAML to D1..."
echo "  Source: $YAML_DIR"
echo "  Target: $INGEST_URL"
echo ""

errors=0
for file in "$YAML_DIR"/*.yaml; do
  [ -f "$file" ] || continue
  sync_file "$file" || ((errors++))
done

echo ""
if [ "$errors" -gt 0 ]; then
  echo "Done with $errors error(s)."
  exit 1
else
  echo "All files synced."
fi
