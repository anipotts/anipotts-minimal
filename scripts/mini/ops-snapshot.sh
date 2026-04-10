#!/usr/bin/env bash
# ops-snapshot.sh — Push system vitals + service status to ingest Worker
# Designed for cron every 5 min on Mac Mini
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

post_to_ingest() {
  local category="$1"
  local data="$2"
  local payload
  payload=$(jq -n --arg cat "$category" --argjson data "$data" '{category: $cat, data: $data}')
  curl -s -X POST "$INGEST_URL" \
    -H "Content-Type: application/json" \
    -H "X-Ingest-Key: $INGEST_KEY" \
    -d "$payload" \
    --max-time 10 || echo "WARN: Failed to POST $category" >&2
}

# ── System Vitals ──

cpu_percent=$(top -l 1 -n 0 2>/dev/null | awk '/CPU usage/{gsub(/%/,""); print $3+$5}' || echo "0")

# Memory via vm_stat
page_size=$(sysctl -n hw.pagesize 2>/dev/null || echo 4096)
vm_output=$(vm_stat 2>/dev/null || echo "")
pages_active=$(echo "$vm_output" | awk '/Pages active/{gsub(/\./,""); print $3}')
pages_active="${pages_active:-0}"
pages_wired=$(echo "$vm_output" | awk '/Pages wired/{gsub(/\./,""); print $3}')
pages_wired="${pages_wired:-0}"
pages_compressed=$(echo "$vm_output" | awk '/Pages occupied by compressor/{gsub(/\./,""); print $3}')
pages_compressed="${pages_compressed:-0}"
total_mem_bytes=$(sysctl -n hw.memsize 2>/dev/null || echo "1")
used_pages=$((pages_active + pages_wired + pages_compressed))
used_bytes=$((used_pages * page_size))
mem_percent=$(awk -v used="$used_bytes" -v total="$total_mem_bytes" 'BEGIN {if(total>0) printf "%.1f", (used/total)*100; else print "0.0"}')

# Disk
disk_percent=$(df -h / 2>/dev/null | awk 'NR==2{gsub(/%/,""); print $5}' || echo "0")

# Uptime
uptime_str=$(uptime 2>/dev/null | sed 's/.*up //' | sed 's/,.*//' || echo "unknown")

# Load average
load_avg=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2, $3, $4}' || echo "0 0 0")

system_value=$(jq -n \
  --argjson cpu "$cpu_percent" \
  --argjson mem "$mem_percent" \
  --argjson disk "$disk_percent" \
  --arg uptime "$uptime_str" \
  --arg load "$load_avg" \
  '{cpu_percent: $cpu, memory_percent: $mem, disk_percent: $disk, uptime: $uptime, load_average: $load}')

system_data=$(jq -n \
  --arg key "system" \
  --arg category "system" \
  --arg value "$system_value" \
  '{key: $key, category: $category, value: $value}')

post_to_ingest "ops" "$system_data"

# ── LaunchAgents ──

agents_arr="[]"
while IFS=$'\t' read -r pid status label; do
  [[ -z "$label" ]] && continue
  [[ "$label" == "Label" ]] && continue

  agent_status="unknown"
  if [[ "$pid" != "-" && "$pid" != "0" ]]; then
    agent_status="running"
  elif [[ "$status" == "0" ]]; then
    agent_status="stopped"
  else
    agent_status="error"
  fi

  [[ "$status" =~ ^-?[0-9]+$ ]] || status="0"
  pid_val="null"
  [[ "$pid" =~ ^[0-9]+$ ]] && pid_val="$pid"

  namespace="user"
  if [[ "$label" == com.apple.* ]]; then
    namespace="system"
  fi

  agents_arr=$(echo "$agents_arr" | jq \
    --arg label "$label" \
    --arg ns "$namespace" \
    --arg st "$agent_status" \
    --argjson pid "$pid_val" \
    --argjson exit "$status" \
    '. + [{label: $label, namespace: $ns, status: $st, pid: $pid, last_exit_code: $exit}]')
done < <(launchctl list 2>/dev/null | grep -E '(com\.anipotts\.|local\.)' || true)

if [[ "$agents_arr" != "[]" ]]; then
  agents_value=$(echo "$agents_arr" | jq -c '.')
  agents_data=$(jq -n \
    --arg key "launchagents" \
    --arg category "launchagents" \
    --arg value "$agents_value" \
    '{key: $key, category: $category, value: $value}')
  post_to_ingest "ops" "$agents_data"
fi

# ── Cron Health ──

CRON_LOG_DIR="$HOME/.local/log/cron"
if [[ -d "$CRON_LOG_DIR" ]]; then
  crons_arr="[]"
  for logfile in "$CRON_LOG_DIR"/*.log; do
    [[ -f "$logfile" ]] || continue
    cron_name=$(basename "$logfile" .log)
    last_line=$(tail -1 "$logfile" 2>/dev/null || echo "")
    last_mod=$(stat -f "%Sm" -t "%Y-%m-%dT%H:%M:%S" "$logfile" 2>/dev/null || echo "")

    exit_code="null"
    duration="null"
    if [[ "$last_line" =~ exit=([0-9]+) ]]; then
      exit_code="${BASH_REMATCH[1]}"
    fi
    if [[ "$last_line" =~ duration=([0-9]+) ]]; then
      duration="${BASH_REMATCH[1]}"
    fi

    crons_arr=$(echo "$crons_arr" | jq \
      --arg name "$cron_name" \
      --arg last_run "$last_mod" \
      --argjson exit "$exit_code" \
      --argjson dur "$duration" \
      '. + [{name: $name, last_run: $last_run, exit_code: $exit, duration_ms: $dur}]')
  done

  if [[ "$crons_arr" != "[]" ]]; then
    crons_value=$(echo "$crons_arr" | jq -c '.')
    crons_data=$(jq -n \
      --arg key "crons" \
      --arg category "crons" \
      --arg value "$crons_value" \
      '{key: $key, category: $category, value: $value}')
    post_to_ingest "ops" "$crons_data"
  fi
fi

# ── Rudy Health ──

rudy_running=false
if pgrep -x "rudy" >/dev/null 2>&1; then
  rudy_running=true
fi

vault_size="null"
vault_dir="$HOME/.rudy/vault"
if [[ -d "$vault_dir" ]]; then
  vault_bytes=$(du -sk "$vault_dir" 2>/dev/null | awk '{print $1 * 1024}' || echo "0")
  vault_size="$vault_bytes"
fi

graph_edges="null"
contacts="null"
rudy_db="$HOME/.rudy/rudy.db"
if [[ -f "$rudy_db" ]]; then
  graph_edges=$(timeout 5 sqlite3 "$rudy_db" "SELECT COUNT(*) FROM edges" 2>/dev/null || echo "null")
  contacts=$(timeout 5 sqlite3 "$rudy_db" "SELECT COUNT(*) FROM contacts" 2>/dev/null || echo "null")
fi

rudy_value=$(jq -n \
  --argjson running "$rudy_running" \
  --argjson vault "$vault_size" \
  --argjson edges "$graph_edges" \
  --argjson contacts "$contacts" \
  '{daemon_running: $running, vault_size_bytes: $vault, graph_edges: $edges, contacts: $contacts}')

rudy_data=$(jq -n \
  --arg key "rudy" \
  --arg category "rudy" \
  --arg value "$rudy_value" \
  '{key: $key, category: $category, value: $value}')

post_to_ingest "ops" "$rudy_data"

echo "ops-snapshot: done at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
