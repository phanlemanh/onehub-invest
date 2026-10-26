#!/bin/bash
set -uo pipefail
cd "${1:?gốc kho}"; bad=0; base=$(git merge-base origin/main HEAD)
while read -r f; do case "$f" in scripts/kev-nhan/acceptance.mjs|_acceptance/kev-nhan-thuoc-sau-pl1/*|_acceptance/kev-thanh-nhan/decisions.jsonl|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";; *) echo "NGOÀI PHẠM VI $f"; bad=1;; esac; done < <(git diff --name-only "$base" HEAD)
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
