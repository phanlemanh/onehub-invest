#!/bin/bash
# Baseline hành vi AC-1 ca A trên code CŨ (47680c0): trích nguyên văn khối L4b cũ
# (từ `if [ -f "$OC_LOG_GLOB" ]` tới `fi` đóng), thay alert() bằng echo — không
# launchctl/pkill. Tệp giả trong thư mục tạm.
set -uo pipefail
R="$(cd "$(dirname "$0")/../../.." && pwd)"
T=$(mktemp -d "${TMPDIR:-/tmp}/acc-zc3-base-XXXXXX"); trap 'rm -rf "$T"' EXIT
git -C "$R" show 47680c0:scripts/zalo-watchdog.sh | awk '/^if \[ -f "\$OC_LOG_GLOB" \]; then/{p=1} p{print} p&&/^fi$/{exit}' > "$T/old-l4b.sh"
grep -c . "$T/old-l4b.sh" | sed 's/^/dòng khối cũ trích được: /'
alert() { echo "ALERT(giả): $1"; }
B="2026-10-23T00:00:02 [zalouser] message received"
TURN="2026-10-23T00:00:01 [auto-reply/agent-turn-timing] turn=1"
MARKER="$T/turn-marker"
OC_LOG_GLOB="$T/openclaw-2026-10-22.log"; printf '%s\n%s\n' "$B" "$B" > "$OC_LOG_GLOB"
source "$T/old-l4b.sh"; echo "ngày cũ 2 dòng → marker=$(cat "$MARKER")"
OC_LOG_GLOB="$T/openclaw-2026-10-23.log"; { printf '%s\n' "$TURN"; for i in 1 2 3 4; do printf '%s\n' "$B"; done; } > "$OC_LOG_GLOB"
out=$(source "$T/old-l4b.sh"); echo "ngày mới 5 dòng, turn dòng 1 → ${out:-KHÔNG alert (sót turn) — code cũ đỏ ca A}"
