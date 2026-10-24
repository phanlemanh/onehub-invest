#!/bin/bash
# cloud-sync.sh — C4: đẩy dữ liệu local → Supabase mỗi 15' (launchd).
# Outbound-only qua HTTPS (mạng này chặn TLS Postgres thẳng — xem sync-cloud.mjs).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="$HOME/.local/node-v24.21.0/bin"
export PATH="$NODE_BIN:$PATH"

# Hai bước luôn chạy cả hai (push-ops-facts là nhịp tim cho /ops, không tắt khi sync hỏng);
# mã thoát là mã hỏng ĐẦU TIÊN, mỗi bước hỏng in `JOB FAIL [cloud-sync] bước <nhãn> mã <n>` (AU13).
. "$ROOT/scripts/lib/job-step.sh"
job_run cloud-sync sync-cloud node "$ROOT/pipeline/sync-cloud.mjs"
job_run cloud-sync push-ops-facts node "$ROOT/pipeline/push-ops-facts.mjs"
exit "$JOB_RC"

