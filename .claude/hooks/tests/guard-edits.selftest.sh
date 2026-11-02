#!/bin/bash
# Selftest hook PreToolUse `.claude/hooks/guard-edits.sh`: luật chặn phải chạy theo kho chứa TỆP, không theo phiên.
# Dựng worktree tạm A (đóng vai CLAUDE_PROJECT_DIR của phiên), B (anh em) và C (lồng trong A/.claude/worktrees/, như
# khi phiên ở checkout chính sửa tệp của worktree con), rồi đưa đường tệp cho hook:
#   1. migration đã commit, ở chính A / ở B / ở C / qua đường symlink tới B → exit 2;
#   2. migration chỉ commit ở B (HEAD của A không có) → exit 2;
#   3. migration mới chưa commit ở B → exit 0;
#   4. tệp trong thư mục chưa tồn tại → giữ đường cũ, không lỗi;
#   5. snapshot và .airdna-profile ở worktree khác → exit 2;
#   6. thông điệp chặn nêu đường tương đối theo worktree chứa tệp; notebook_path và phiên không có CLAUDE_PROJECT_DIR cũng chặn;
#   7. kho git khác: ghim hành vi đã trình ở Cổng Phạm vi.
# Chạy hook của cây làm việc ($REPO) để thấy cả bản sửa chưa commit. Luôn gỡ worktree tạm (trap). Không sửa cây thật.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
HOOK="$REPO/.claude/hooks/guard-edits.sh"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/onehub-guard-selftest.XXXXXX")"
TMP_THUC="$(cd "$TMP" && pwd -P)"   # git worktree list in đường thật (macOS: /var → /private/var)
A="$TMP/a"
B="$TMP/b"
C="$A/.claude/worktrees/c"
before="$(git -C "$REPO" status --porcelain)"
fails=0

go_worktree() {
  # Gỡ ĐÚNG worktree tạm của selftest, không dùng lệnh prune của git: prune quét mọi worktree của kho dùng chung và gỡ
  # metadata của phiên khác khi thư mục của nó đang vắng (hồ sơ test-khong-prune-worktree).
  local wt="$1" thuc=""
  thuc="$(cd "$wt" 2>/dev/null && pwd -P)"
  if ! git -C "$REPO" worktree remove --force "$wt" >/dev/null 2>&1; then
    # >>> du-phong — chỉ gỡ mục quản trị có gitdir trỏ về worktree tạm (đường dựng hoặc đường thật)
    local common d tro
    common="$(cd "$REPO" && cd "$(git rev-parse --git-common-dir)" && pwd -P)"
    for d in "$common"/worktrees/*; do
      tro="$(cat "$d/gitdir" 2>/dev/null)"
      if [ "$tro" = "$wt/.git" ] || { [ -n "$thuc" ] && [ "$tro" = "$thuc/.git" ]; }; then rm -rf "$d"; fi
    done
    # <<< du-phong
  fi
}
cleanup() {
  # C lồng trong A: gỡ C trước.
  go_worktree "$C"
  go_worktree "$B"
  go_worktree "$A"
  rm -rf "$TMP"
}
trap cleanup EXIT

ok()   { echo "  OK    $*"; }
fail() { echo "  FAIL  $*"; fails=$((fails + 1)); }

echo "[guard-edits] hook selftest"
command -v jq >/dev/null || { echo "  FAIL  thiếu jq"; exit 1; }

MIG="$(git -C "$REPO" ls-files 'db/migrations/*.sql' | sort | head -1)"
[ -n "$MIG" ] || { echo "  FAIL  không tìm được migration mẫu"; exit 1; }
for wt in "$A" "$B" "$C"; do
  git -C "$REPO" worktree add --detach "$wt" HEAD >/dev/null 2>&1 || { echo "  FAIL  không tạo được worktree tạm $wt"; exit 1; }
done
ln -s "$B" "$TMP/lien-ket"
ok "worktree tạm A, B, C (HEAD $(git -C "$A" rev-parse --short HEAD)); migration mẫu: $MIG"

# Exit 2 cũng là mã của lỗi cú pháp bash, nên ca chặn phải ghim thêm câu của đúng luật.
MIG_MSG="Schema chỉ đổi qua migration MỚI"
SNAP_MSG="raw snapshot là BẤT BIẾN"
AIRDNA_MSG="profile đăng nhập"

# kiem <exit cần> <mô tả> <đường tệp> [câu thông điệp]: hook chạy như phiên có CLAUDE_PROJECT_DIR=A, cwd=A.
kiem() {
  local can="$1" mo_ta="$2" tep="$3" cau="${4:-}" out rc
  out="$(cd "$A" && jq -n --arg f "$tep" '{tool_input:{file_path:$f}}' | CLAUDE_PROJECT_DIR="$A" bash "$HOOK" 2>&1)"; rc=$?
  if [ "$rc" -ne "$can" ]; then fail "$mo_ta → exit $rc (cần $can) $out"
  elif [ -n "$cau" ] && ! grep -qF "$cau" <<<"$out"; then fail "$mo_ta → thiếu thông điệp «$cau»: $out"
  else ok "$mo_ta → exit $rc"; fi
}

kiem 2 "migration đã commit, ngay worktree của phiên" "$A/$MIG" "$MIG_MSG"
kiem 2 "migration đã commit, worktree anh em" "$B/$MIG" "$MIG_MSG"
kiem 2 "migration đã commit, worktree lồng trong .claude/worktrees" "$C/$MIG" "$MIG_MSG"
kiem 2 "migration đã commit, qua đường symlink (như ~/dev/one-invest)" "$TMP/lien-ket/$MIG" "$MIG_MSG"
out="$(cd "$A" && jq -n --arg f "$B/$MIG" '{tool_input:{file_path:$f}}' | CLAUDE_PROJECT_DIR="$A" bash "$HOOK" 2>&1)"
grep -qF "Chặn: $MIG đã commit" <<<"$out" && ok "thông điệp nêu đường theo worktree chứa tệp" || fail "thông điệp nêu đường theo worktree chứa tệp: $out"
out="$(cd "$A" && jq -n --arg f "$B/$MIG" '{tool_input:{notebook_path:$f}}' | CLAUDE_PROJECT_DIR="$A" bash "$HOOK" 2>&1)"; rc=$?
[ "$rc" -eq 2 ] && grep -qF "$MIG_MSG" <<<"$out" && ok "notebook_path, worktree anh em → exit 2" || fail "notebook_path, worktree anh em → exit $rc (cần 2) $out"
out="$(cd "$A" && jq -n --arg f "$B/$MIG" '{tool_input:{file_path:$f}}' | env -u CLAUDE_PROJECT_DIR bash "$HOOK" 2>&1)"; rc=$?
[ "$rc" -eq 2 ] && grep -qF "$MIG_MSG" <<<"$out" && ok "không có CLAUDE_PROJECT_DIR, worktree anh em → exit 2" || fail "không có CLAUDE_PROJECT_DIR, worktree anh em → exit $rc (cần 2) $out"

kiem 0 "migration mới chưa commit, worktree anh em" "$B/db/migrations/999_selftest.sql"

# Commit trong B: HEAD của A không có tệp này, HEAD của B có. Xét theo HEAD của phiên thì sẽ lọt.
printf -- '-- selftest\n' > "$B/db/migrations/999_selftest.sql"
git -C "$B" add db/migrations/999_selftest.sql
if git -C "$B" -c user.name=selftest -c user.email=selftest@local.test commit -qm "selftest" >/dev/null 2>&1; then
  kiem 2 "migration chỉ commit ở HEAD của worktree anh em" "$B/db/migrations/999_selftest.sql" "$MIG_MSG"
  kiem 0 "cùng tên đó ở worktree của phiên, HEAD không có" "$A/db/migrations/999_selftest.sql"
else
  fail "không commit được tệp mẫu trong worktree tạm"
fi

kiem 0 "thư mục chưa tồn tại, ngoài db/migrations" "$A/khong-co/moi.txt"
kiem 2 "thư mục chưa tồn tại, đường cũ vẫn chặn snapshot" "$A/snapshots/khong-co/moi.json" "$SNAP_MSG"
kiem 2 "snapshot, thư mục chưa tồn tại, worktree anh em" "$B/snapshots/khong-co/moi.json" "$SNAP_MSG"
kiem 0 "tệp ngoài mọi kho git" "$TMP/ngoai-kho.txt"

mkdir -p "$B/snapshots" "$B/.airdna-profile"
kiem 2 "snapshot ở worktree anh em" "$B/snapshots/x.json" "$SNAP_MSG"
kiem 2 ".airdna-profile ở worktree anh em" "$B/.airdna-profile/x" "$AIRDNA_MSG"

# Kho git khác: ghim hành vi đã trình ở Cổng Phạm vi (Hỏi-4) để đổi quyết định thì ca này đỏ.
K="$TMP/kho-khac"
mkdir -p "$K/db/migrations" "$K/snapshots"
git -C "$K" init -q
printf -- '-- kho khac\n' > "$K/db/migrations/001_x.sql"
git -C "$K" add db/migrations/001_x.sql
if git -C "$K" -c user.name=selftest -c user.email=selftest@local.test -c core.hooksPath=/dev/null commit -qm "selftest" >/dev/null 2>&1; then
  kiem 2 "kho git khác, migration đã commit" "$K/db/migrations/001_x.sql" "$MIG_MSG"
  kiem 2 "kho git khác, snapshot" "$K/snapshots/x.json" "$SNAP_MSG"
else
  fail "không commit được tệp mẫu trong kho git khác"
fi

# Dọn rồi kiểm.
cleanup; trap - EXIT
[ ! -e "$TMP" ] && ok "thư mục tạm đã gỡ" || fail "thư mục tạm còn tồn tại"
# Chỉ xét worktree của lần chạy này: kho dùng chung, lần chạy khác có thể đang giữ worktree cùng tiền tố.
git -C "$REPO" worktree list | grep -qF "$TMP_THUC/" && fail "worktree tạm còn trong git worktree list" || ok "git worktree list sạch"
[ "$(git -C "$REPO" status --porcelain)" = "$before" ] && ok "cây làm việc thật không đổi" || fail "cây làm việc thật bị đổi"

if [ "$fails" -eq 0 ]; then echo "PASS"; exit 0; fi
echo "FAIL ($fails kiểm hỏng)"; exit 1
