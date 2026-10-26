#!/bin/bash
set -uo pipefail
# Phạm vi của PR #135: tệp do bốn commit của PR chạm (800eb77c, 9b72cfbe, f5411aa8, c75cd98d — lịch sử cố định, đúng sau khi đã vào main; khoảng commit thì lẫn commit main gộp vào).
cd "${1:?gốc kho}"; bad=0
while read -r f; do case "$f" in scripts/kev-nhan/acceptance.mjs|_acceptance/kev-nhan-thuoc-sau-pl1/*|_acceptance/kev-thanh-nhan/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";; *) echo "NGOÀI PHẠM VI $f"; bad=1;; esac; done < <(git show --name-only --format= 800eb77c 9b72cfbe f5411aa8 c75cd98d | sort -u | grep -v "^$")
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
