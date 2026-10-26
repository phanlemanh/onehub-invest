#!/usr/bin/env bash
# AC-9 — tệp đổi so với nền chỉ thuộc danh sách khai; product-map --check khớp; check-lo-trinh static không thêm FAIL mới.
set -uo pipefail; . "$(dirname "$0")/_chung.sh"
cd "$ROOT" || exit 2
base="$(git merge-base HEAD origin/main)"
cho='^(_acceptance/config\.yaml|_acceptance/kho-tri-thuc-invest/.*|scripts/(tri-thuc-khoa\.cjs|tri-thuc-nguon\.cjs|tri-thuc\.mjs|tri-thuc-tra\.cjs|can-cu-s1\.cjs|luat-san-pham\.cjs)|skills/acceptance/references/tri-thuc-template\.md|docs/plan/pham-vi-[a-z0-9-]+\.md|docs/plan/BOI-CANH\.md|docs/ROADMAP\.md|PRODUCT-MAP\.md|LO-TRINH\.html)$'
ngoai="$(git diff --name-only "$base" HEAD | grep -vE "$cho" || true)"
[ -z "$ngoai" ] && ok "tệp đổi: $(git diff --name-only "$base" HEAD | wc -l | tr -d ' ') tệp, đều trong danh sách khai" || bad "NGOÀI PHẠM VI: $ngoai"
git diff "$base" HEAD -- 'docs/plan/pham-vi-*.md' | grep -E '^[-+][^-+]' | grep -vE '^[-+]nguon: ' && bad "bản phạm vi đổi dòng khác ngoài nguon" || ok "bản phạm vi: chỉ dòng nguon đổi"
pm="$(node scripts/product-map.mjs --root . --check 2>&1)" && ok "product-map --check: khớp" || bad "product-map --check: $pm"
f_ht="$(bash scripts/check-lo-trinh.sh static 2>&1 | grep '^FAIL' | sed -E 's/rc=[0-9]+, //' | sort)"
T="$(mktemp -d)"; trap 'git worktree remove --force "$T/n" >/dev/null 2>&1; rm -rf "$T"' EXIT
git worktree add -q --detach "$T/n" "$base" && f_nen="$(cd "$T/n" && bash scripts/check-lo-trinh.sh static 2>&1 | grep '^FAIL' | sed -E 's/rc=[0-9]+, //' | sort)"
moi="$(comm -23 <(echo "$f_ht") <(echo "$f_nen"))"
[ -z "$moi" ] && ok "check-lo-trinh static: không FAIL mới so với nền ($(echo "$f_nen" | grep -c FAIL) FAIL có từ trước)" || bad "check-lo-trinh static FAIL mới: $moi"
[ $fail -eq 0 ] && echo "SCOPE OK" || { echo "SCOPE FAIL"; exit 1; }
