#!/bin/bash
set -uo pipefail
cd "${1:?gốc kho}"; bad=0; base=$(git merge-base origin/main HEAD)
while read -r f; do case "$f" in scripts/ui-capture-login.test.mjs|_acceptance/uc-ta-5-tmp-rieng/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";; *) echo "NGOÀI PHẠM VI $f"; bad=1;; esac; done < <(git diff --name-only "$base" HEAD)
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
