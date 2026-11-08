#!/usr/bin/env bash
# install-cron-chi AC-5 — nhánh so với main chỉ đổi tệp của lời giao 0611-37 và hồ sơ này.
set -euo pipefail
ROOT="${1:?thiếu gốc kho}"; cd "$ROOT"
BASE="$(git merge-base HEAD origin/main)"
ngoai=0
while IFS= read -r f; do
  case "$f" in
    scripts/install-cron.sh|scripts/install-cron-chi.test.mjs|_acceptance/install-cron-chi/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) ;;
    *) echo "NGOÀI PHẠM VI: $f"; ngoai=1 ;;
  esac
done < <(git diff --name-only "$BASE" HEAD)
[ $ngoai -eq 0 ] && echo "SCOPE OK" || exit 1
