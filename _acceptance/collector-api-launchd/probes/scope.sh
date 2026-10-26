#!/bin/bash
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"; bad=0; base=$(git merge-base origin/main HEAD)
while read -r f; do
  case "$f" in
    scripts/install-collector-api.sh|pipeline/scripts/install-collector-api.test.mjs|_acceptance/collector-api-launchd/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";;
    *) echo "NGOÀI PHẠM VI $f"; bad=1;;
  esac
done < <(git diff --name-only "$base" HEAD)
bash -n scripts/install-collector-api.sh && echo "SYNTAX OK" || bad=1
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
