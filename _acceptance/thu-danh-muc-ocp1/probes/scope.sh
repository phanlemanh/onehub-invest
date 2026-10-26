#!/bin/bash
# Phạm vi nhánh tích hợp S08 (PL10 + ZC8): tệp của lời giao 2610-10 (ZCode) + thước kev-nhan theo v4 + bộ kiểm + hai hồ sơ.
set -uo pipefail
cd "${1:?gốc kho}"; bad=0; base=$(git merge-base origin/main HEAD)
while read -r f; do case "$f" in collector/docs/DATA-CONTRACT.md|collector/package.json|collector/src/collectors/index.ts|collector/src/collectors/s08-danh-muc.ts|collector/src/core/storage.ts|collector/src/core/types.ts|collector/src/test/api.test.ts|collector/src/test/fixtures/s08-ocp2.json|collector/src/test/kev-nhan.test.ts|collector/src/test/media-fetch.test.ts|collector/src/test/s08-danh-muc.test.ts|pipeline/import-airbnb.mjs|pipeline/import-s08-row.mjs|pipeline/scripts/import-s08-row.test.mjs|pipeline/scripts/importer-bo-qua-du-lieu-thu.test.mjs|scripts/kev-nhan/acceptance.mjs|scripts/s08-danh-muc/acceptance.mjs|_acceptance/thu-danh-muc-ocp1/*|_acceptance/import-s08/*|_acceptance/kev-thanh-nhan/*|_acceptance/kev-nhan-thuoc-sau-pl1/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";; *) echo "NGOÀI PHẠM VI $f"; bad=1;; esac; done < <(git diff --name-only "$base" HEAD)
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
