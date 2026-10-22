#!/bin/bash
# Selftest hook Stop `.claude/hooks/typecheck-changed.sh` (E8 của ui-standards-reui).
# Dựng worktree tạm (git worktree add --detach, symlink app/node_modules), rồi:
#   1. thêm `<table />` vào một file UI → hook phải exit 2 và in `onehub-ui/no-raw-table`;
#   2. hoàn tác + thêm một chú thích vô hại → hook phải exit 0.
# Luôn gỡ worktree tạm (trap). Không sửa cây làm việc thật.
# Ghi chú tsc: tsconfig của app đã chạy sạch trong worktree tạm (next-env.d.ts được theo dõi, `.next/types` là
# glob include nên thiếu cũng không lỗi) — không cần `next typegen`. Hook chỉ tính lỗi tsc nằm trong file vừa đổi.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
HOOK_REL=".claude/hooks/typecheck-changed.sh"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/onehub-hook-selftest.XXXXXX")"
WT="$TMP/wt"
before="$(git -C "$REPO" status --porcelain)"
fails=0

cleanup() {
  git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1
  git -C "$REPO" worktree prune >/dev/null 2>&1
  rm -rf "$TMP"
}
trap cleanup EXIT

ok()   { echo "  OK    $*"; }
fail() { echo "  FAIL  $*"; fails=$((fails + 1)); }

echo "[ui-standards-reui] hook selftest (typecheck-changed.sh)"
[ -x "$REPO/app/node_modules/.bin/eslint" ] || { echo "  FAIL  thiếu app/node_modules (cd app && npm install)"; exit 1; }
command -v jq >/dev/null || { echo "  FAIL  thiếu jq"; exit 1; }

git -C "$REPO" worktree add --detach "$WT" HEAD >/dev/null 2>&1 || { echo "  FAIL  không tạo được worktree tạm"; exit 1; }
ln -s "$REPO/app/node_modules" "$WT/app/node_modules"
ok "worktree tạm: $WT (HEAD $(git -C "$WT" rev-parse --short HEAD))"

# Chọn file UI nhỏ, được theo dõi, không vendor, không nằm trong baseline suppress → vi phạm thêm vào sẽ đỏ thật.
TARGET=""
while read -r f; do
  case "$f" in app/src/components/ui/*|app/src/components/reui/*|app/src/components/blocks/*|app/src/components/examples/*) continue ;; esac
  rel="${f#app/}"
  grep -qF "\"$rel\"" "$WT/app/eslint-suppressions.json" && continue
  TARGET="$f"; break
done < <(git -C "$WT" ls-files 'app/src/components/*.tsx' | sort)
[ -n "$TARGET" ] || { echo "  FAIL  không tìm được file .tsx mẫu"; exit 1; }
ok "file mẫu: $TARGET"

run_hook() {
  echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR="$WT" bash "$WT/$HOOK_REL" 2>&1
  return "${PIPESTATUS[1]}"
}

# 0. Nền sạch: chưa đổi gì → exit 0.
out="$(run_hook)"; rc=$?
[ "$rc" -eq 0 ] && ok "nền sạch (chưa đổi file) → exit 0" || fail "nền sạch exit $rc: $out"

# 1. Vi phạm → exit 2 + tên luật.
printf '\nexport const __SelfTest = () => <table />;\n' >> "$WT/$TARGET"
out="$(run_hook)"; rc=$?
[ "$rc" -eq 2 ] && ok "file có <table /> → exit 2" || fail "file có <table /> → exit $rc (cần 2)"
grep -q 'onehub-ui/no-raw-table' <<<"$out" && ok "output in onehub-ui/no-raw-table" || fail "output không có onehub-ui/no-raw-table: $out"

# 2. Hoàn tác + đổi vô hại → exit 0.
git -C "$WT" checkout -- "$TARGET"
printf '\n// selftest: thay đổi vô hại\n' >> "$WT/$TARGET"
out="$(run_hook)"; rc=$?
[ "$rc" -eq 0 ] && ok "file sạch (chỉ thêm chú thích) → exit 0" || fail "file sạch → exit $rc (cần 0): $out"

# 3. stop_hook_active=true luôn cho qua kể cả khi có vi phạm.
printf '\nexport const __SelfTest = () => <table />;\n' >> "$WT/$TARGET"
echo '{"stop_hook_active":true}' | CLAUDE_PROJECT_DIR="$WT" bash "$WT/$HOOK_REL" >/dev/null 2>&1
[ $? -eq 0 ] && ok "stop_hook_active=true → exit 0 (lần dừng thứ hai cho qua)" || fail "stop_hook_active=true không cho qua"
git -C "$WT" checkout -- "$TARGET"

# Dọn rồi kiểm.
cleanup; trap - EXIT
[ ! -e "$WT" ] && ok "worktree tạm đã gỡ" || fail "worktree tạm còn tồn tại"
git -C "$REPO" worktree list | grep -q "onehub-hook-selftest" && fail "worktree tạm còn trong git worktree list" || ok "git worktree list sạch"
[ "$(git -C "$REPO" status --porcelain)" = "$before" ] && ok "cây làm việc thật không đổi" || fail "cây làm việc thật bị đổi"

if [ "$fails" -eq 0 ]; then echo "PASS"; exit 0; fi
echo "FAIL ($fails kiểm hỏng)"; exit 1
