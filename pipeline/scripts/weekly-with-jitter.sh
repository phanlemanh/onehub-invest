#!/usr/bin/env bash
# weekly-with-jitter.sh — CCP (ADR-0007): randomized delay ≤30 phút trước
# weekly-collect để cron không rơi đúng giờ tròn (tương đương systemd
# RandomizedDelaySec). launchd gọi file này, KHÔNG gọi weekly-collect trực tiếp.
set -euo pipefail
sleep $((RANDOM % 1800))
exec bash "$(cd "$(dirname "$0")" && pwd)/weekly-collect.sh" "$@"
