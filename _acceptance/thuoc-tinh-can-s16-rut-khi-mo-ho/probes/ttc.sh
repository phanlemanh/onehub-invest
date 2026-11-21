#!/usr/bin/env bash
# E7: ca TTC-AC-1 xanh ở ba trạng thái cây — HEAD, cây tạm có thêm migration, và main sau gộp với tệp test của HEAD.
set -euo pipefail
HO_SO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GOC="$(cd "$HO_SO/../.." && pwd)"
TAM="$(mktemp -d)"
don() { for w in "$TAM"/w1 "$TAM"/w2; do git -C "$GOC" worktree remove --force "$w" 2>/dev/null || true; done; git -C "$GOC" worktree prune; rm -rf "$TAM"; }
trap don EXIT
TEST=pipeline/tests/thuoc-tinh-can-s16.itest.mjs
chay() { (cd "$1" && node --test --test-concurrency=1 --test-name-pattern='TTC-AC-1' "$TEST"); }
chuan_bi() { git -C "$GOC" worktree add -q --detach "$1" "$2"; for m in pipeline app; do ln -s "$(cd "$GOC/$m/node_modules" && pwd -P)" "$1/$m/node_modules"; done; cp "$GOC/$TEST" "$1/$TEST"; }
echo "== HEAD"; chay "$GOC"
echo "== cây tạm có thêm migration"; chuan_bi "$TAM/w1" HEAD
printf -- '-- migration thử của ttc.sh\nSELECT 1;\n' > "$TAM/w1/db/migrations/999_rmh_thu.sql"; git -C "$TAM/w1" add -N db/migrations/999_rmh_thu.sql
git -C "$TAM/w1" diff --name-status "$(git -C "$TAM/w1" merge-base HEAD origin/main)" -- db/migrations | grep -q '^A.*999_rmh_thu' || { echo "ttc.sh: cây tạm không thấy migration thử"; exit 1; }
chay "$TAM/w1"
echo "== main sau gộp"; chuan_bi "$TAM/w2" origin/main; chay "$TAM/w2"
echo "ttc.sh: xanh ở cả ba trạng thái"
