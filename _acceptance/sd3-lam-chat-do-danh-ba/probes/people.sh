#!/bin/bash
# E7 (sd3-lam-chat-do-danh-ba): dựng DB thử chép máy thu rồi chạy test che số /ops/people qua loader thật trên DB thử đó.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
TEN=oneinvest_p4_ldb_people
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash _acceptance/sdt-luu-goc-e164/probes/db-thu-chac.sh "$TEN"
cd app && DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN" node --import tsx --test tests/people-che-so-loader.test.tsx 2>&1 \
  | grep -E "^# quyền|^ℹ (tests|pass|fail|skipped)|^✖|LO SO|DB DUNG"
