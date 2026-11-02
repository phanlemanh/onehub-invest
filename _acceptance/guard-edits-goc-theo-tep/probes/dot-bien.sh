#!/bin/bash
# AC-6: thước có chiều đỏ. Cùng một worktree tạm: bản hook hiện tại → selftest PASS; bản trước khi sửa và từng đột biến → selftest đỏ
# đúng những ca đã ghim. Selftest lấy $REPO theo vị trí của nó nên chạy trong worktree tạm là đo bản hook đã phá ở đó.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
BAN_CU=610a924a   # commit ngay trước bản sửa, nằm vĩnh viễn trong lịch sử main
HOOK=.claude/hooks/guard-edits.sh
ST=.claude/hooks/tests/guard-edits.selftest.sh
TMP="$(mktemp -d "${TMPDIR:-/tmp}/onehub-guard-dotbien.XXXXXX")"
WT="$TMP/wt"
bad=0
tam_truoc="$(git -C "$ROOT" worktree list | grep -c 'onehub-guard-selftest')"
cleanup() { git -C "$ROOT" worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$TMP"; }
trap cleanup EXIT

git -C "$ROOT" worktree add --detach "$WT" HEAD >/dev/null 2>&1 || { echo "KHONG TAO DUOC WORKTREE TAM"; exit 2; }
# Eval chạy trên cây chưa commit cũng phải đo đúng selftest của cây đó.
cp "$ROOT/$HOOK" "$WT/$HOOK"; cp "$ROOT/$ST" "$WT/$ST"

chay() { (cd "$WT" && bash "$ST" 2>&1); }

# ghim <nhãn> <chuỗi FAIL bắt buộc>...: đo xong khôi phục hook về bản lành.
ghim() {
  local nhan="$1"; shift
  local out; out="$(chay)"
  if ! grep -q '^FAIL (' <<<"$out"; then echo "CA KHONG DO: $nhan"; bad=1; fi
  local c
  for c in "$@"; do
    if grep -qF "  FAIL  $c" <<<"$out"; then echo "$nhan: do, ghim co «$c»"; else echo "THIEU THONG DIEP GHIM: $nhan «$c»"; bad=1; fi
  done
  cp "$ROOT/$HOOK" "$WT/$HOOK"
}

# dot <từ> <thành>: đổi nguyên văn một đoạn trong hook; không áp được thì báo, không tính là đỏ.
dot() {
  FROM="$1" TO="$2" perl -0pi -e 's/\Q$ENV{FROM}\E/$ENV{TO}/' "$WT/$HOOK"
  cmp -s "$ROOT/$HOOK" "$WT/$HOOK" && { echo "DOT BIEN KHONG AP DUOC: $1"; bad=1; return 1; }
  return 0
}

out="$(chay)"
if grep -qx 'PASS' <<<"$out"; then echo "ban lanh: PASS"; else echo "BAN LANH KHONG XANH"; echo "$out"; bad=1; fi

git -C "$ROOT" show "$BAN_CU:$HOOK" > "$WT/$HOOK" || { echo "KHONG DOC DUOC BAN CU"; exit 2; }
ghim "ban truoc khi sua" "migration đã commit, worktree anh em" "migration đã commit, worktree lồng trong .claude/worktrees" \
  "migration đã commit, qua đường symlink" "thông điệp nêu đường theo worktree chứa tệp" "notebook_path, worktree anh em" \
  "không có CLAUDE_PROJECT_DIR, worktree anh em" "migration chỉ commit ở HEAD của worktree anh em" "kho git khác, migration đã commit"

dot ' && pwd -P)' ' && pwd -L)' && ghim "dot bien pwd -L" "migration đã commit, qua đường symlink"
dot 'git -C "$root" cat-file' 'git -C "$CLAUDE_PROJECT_DIR" cat-file' && ghim "dot bien xet HEAD cua phien" "migration chỉ commit ở HEAD của worktree anh em"
dot 'if git -C "$root" cat-file -e "HEAD:$rel" 2>/dev/null; then' 'if true; then' && ghim "dot bien chan moi migration" "migration mới chưa commit, worktree anh em"
dot 'if [ -n "$file_root" ]; then' 'if [ -n "$file_root" ] || true; then' && ghim "dot bien bo duong cu" "thư mục chưa tồn tại, đường cũ vẫn chặn snapshot"
dot ' // .tool_input.notebook_path' '' && ghim "dot bien bo notebook_path" "notebook_path, worktree anh em"
dot 'Chặn: $rel đã commit' 'Chặn: $file đã commit' && ghim "dot bien thong diep duong tuyet doi" "thông điệp nêu đường theo worktree chứa tệp"
dot '*/snapshots/*|snapshots/*)' '*/khong-co-dau/*)' && ghim "dot bien bo luat snapshot" "snapshot ở worktree anh em" "snapshot, thư mục chưa tồn tại, worktree anh em" "kho git khác, snapshot"
dot '*.airdna-profile/*)' '*khong-co-dau/*)' && ghim "dot bien bo luat airdna" ".airdna-profile ở worktree anh em"
dot 'echo "Chặn: raw snapshot là BẤT BIẾN' 'echo "Chặn: sai câu' && ghim "dot bien sai thong diep snapshot" "snapshot ở worktree anh em"

# Đường đỏ cũng phải dọn sạch: selftest chạy đỏ nhiều lần ở trên.
cleanup; trap - EXIT
tam_sau="$(git -C "$ROOT" worktree list | grep -c 'onehub-guard-selftest')"
if [ "$tam_sau" -gt "$tam_truoc" ]; then echo "CON WORKTREE TAM ($tam_truoc → $tam_sau)"; bad=1; else echo "duong do: khong con worktree tam cua selftest"; fi
if git -C "$ROOT" worktree list | grep -qF "$WT"; then echo "CON WORKTREE TAM cua dau do"; bad=1; else echo "duong do: khong con worktree tam cua dau do"; fi
if git -C "$ROOT" for-each-ref | grep -q 'onehub-guard'; then echo "CON REF TAM"; bad=1; else echo "duong do: khong con ref tam"; fi

[ "$bad" -eq 0 ] && echo "DOT-BIEN OK"
exit $bad
