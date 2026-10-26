#!/bin/bash
set -uo pipefail
cd "${1:?gốc kho}"; bad=0; base=$(git merge-base origin/main HEAD)
while read -r f; do case "$f" in pipeline/apify-facebook-collector.mjs|pipeline/collect-chotot.mjs|pipeline/scripts/cong-tac-that.test.mjs|pipeline/scripts/s05-paused.test.mjs|pipeline/scripts/weekly-with-jitter.sh|scripts/airdna-daily.sh|scripts/chotot-daily.sh|scripts/smoke-daily.sh|_acceptance/*/decisions.jsonl|_acceptance/*/evidence-report.md|_acceptance/*/run-log.jsonl|_acceptance/*/probes/*|_acceptance/cong-tac-that/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";; *) echo "NGOÀI PHẠM VI $f"; bad=1;; esac; done < <(git diff --name-only "$base" HEAD)
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
