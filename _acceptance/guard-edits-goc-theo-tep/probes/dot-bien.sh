#!/bin/bash
# AC-6: thước có chiều đỏ. Cùng một worktree tạm: bản hook hiện tại → selftest PASS; bản trước khi sửa và từng đột biến → selftest đỏ
# đúng những ca đã ghim, ca đỏ ngoài danh sách là DO TRAN. Selftest lấy $REPO theo vị trí của nó nên chạy trong worktree tạm là đo bản
# hook đã phá ở đó. Thư mục tạm về đường thật để đột biến pwd -L chỉ đổi ca qua symlink, không đổi mọi ca trên macOS (/var là symlink).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
BAN_CU=610a924a   # commit ngay trước bản sửa, nằm vĩnh viễn trong lịch sử main
HOOK=.claude/hooks/guard-edits.sh
ST=.claude/hooks/tests/guard-edits.selftest.sh
TMP="$(mktemp -d "${TMPDIR:-/tmp}/onehub-guard-dotbien.XXXXXX")"; TMP="$(cd "$TMP" && pwd -P)"
WT="$TMP/wt"
ST_TMP="$TMP/st"   # selftest của lượt này tạo worktree trong đây, nên kiểm rò không dính phiên khác trên kho dùng chung
mkdir -p "$ST_TMP"
bad=0
# Gỡ worktree dưới một thư mục, kể cả ca cố tình rò; không dùng lệnh prune của git.
go_duoi() {
  git -C "$ROOT" worktree list --porcelain | sed -n 's/^worktree //p' | grep -F "$1" | while IFS= read -r p; do
    git -C "$ROOT" worktree remove --force "$p" >/dev/null 2>&1
  done
}
cleanup() { go_duoi "$TMP/"; rm -rf "$TMP"; }
trap cleanup EXIT

git -C "$ROOT" worktree add --detach "$WT" HEAD >/dev/null 2>&1 || { echo "KHONG TAO DUOC WORKTREE TAM"; exit 2; }
# Eval chạy trên cây chưa commit cũng phải đo đúng selftest của cây đó.
cp "$ROOT/$HOOK" "$WT/$HOOK"; cp "$ROOT/$ST" "$WT/$ST"

chay() { (cd "$WT" && TMPDIR="$ST_TMP" bash "$ST" 2>&1); }

# ghim <nhãn> <ca bắt buộc đỏ>... [-- <ca đỏ theo, đã biết>...]: tập ca đỏ phải bằng đúng hai danh sách. Đo xong khôi phục bản lành, gỡ worktree rò.
ghim() {
  local nhan="$1"; shift
  local out chua c kem=0; out="$(chay)"
  if ! grep -q '^FAIL (' <<<"$out"; then echo "CA KHONG DO: $nhan"; bad=1; fi
  chua="$(grep '^  FAIL  ' <<<"$out")"
  for c in "$@"; do
    if [ "$c" = "--" ]; then kem=1; continue; fi
    if grep -qF "  FAIL  $c" <<<"$chua"; then
      if [ "$kem" -eq 1 ]; then echo "$nhan: do kem «$c»"; else echo "$nhan: do, ghim co «$c»"; fi
      chua="$(grep -vF "  FAIL  $c" <<<"$chua")"
    else echo "THIEU THONG DIEP GHIM: $nhan «$c»"; bad=1; fi
  done
  if [ -n "$chua" ]; then echo "DO TRAN: $nhan"; echo "$chua"; bad=1; fi
  cp "$ROOT/$HOOK" "$WT/$HOOK"; cp "$ROOT/$ST" "$WT/$ST"
  go_duoi "$ST_TMP/"
}

# dot_tep <tệp> <từ> <thành>: đổi nguyên văn một đoạn; không áp được thì báo, không tính là đỏ.
dot_tep() {
  FROM="$2" TO="$3" perl -0pi -e 's/\Q$ENV{FROM}\E/$ENV{TO}/' "$WT/$1"
  cmp -s "$ROOT/$1" "$WT/$1" && { echo "DOT BIEN KHONG AP DUOC: $2"; bad=1; return 1; }
  return 0
}
dot() { dot_tep "$HOOK" "$1" "$2"; }

out="$(chay)"
if grep -qx 'PASS' <<<"$out"; then echo "ban lanh: PASS"; else echo "BAN LANH KHONG XANH"; echo "$out"; bad=1; fi

git -C "$ROOT" show "$BAN_CU:$HOOK" > "$WT/$HOOK" || { echo "KHONG DOC DUOC BAN CU"; exit 2; }
ghim "ban truoc khi sua" "migration đã commit, worktree anh em" "migration đã commit, worktree lồng trong .claude/worktrees" \
  "migration đã commit, qua đường symlink" "thông điệp nêu đường theo worktree chứa tệp" "notebook_path, worktree anh em" \
  "không có CLAUDE_PROJECT_DIR, worktree anh em" "migration chỉ commit ở HEAD của worktree anh em" "kho git khác, migration đã commit"

dot ' && pwd -P)' ' && pwd -L)' && ghim "dot bien pwd -L" "migration đã commit, qua đường symlink"
dot 'git -C "$root" cat-file' 'git -C "$CLAUDE_PROJECT_DIR" cat-file' && ghim "dot bien xet HEAD cua phien" "migration chỉ commit ở HEAD của worktree anh em" -- "không có CLAUDE_PROJECT_DIR, worktree anh em" "kho git khác, migration đã commit"
dot 'if git -C "$root" cat-file -e "HEAD:$rel" 2>/dev/null; then' 'if true; then' && ghim "dot bien chan moi migration" "migration mới chưa commit, worktree anh em" -- "cùng tên đó ở worktree của phiên, HEAD không có"
dot 'if [ -n "$file_root" ]; then' 'if [ -n "$file_root" ] || true; then' && ghim "dot bien bo duong cu" "thư mục chưa tồn tại, đường cũ vẫn chặn snapshot" -- "snapshot, thư mục chưa tồn tại, worktree anh em"
dot ' // .tool_input.notebook_path' '' && ghim "dot bien bo notebook_path" "notebook_path, worktree anh em"
dot 'Chặn: $rel đã commit' 'Chặn: $file đã commit' && ghim "dot bien thong diep duong tuyet doi" "thông điệp nêu đường theo worktree chứa tệp"
dot '*/snapshots/*|snapshots/*)' '*/khong-co-dau/*)' && ghim "dot bien bo luat snapshot" "snapshot ở worktree anh em" "snapshot, thư mục chưa tồn tại, worktree anh em" "kho git khác, snapshot" -- "thư mục chưa tồn tại, đường cũ vẫn chặn snapshot"
dot '*.airdna-profile/*)' '*khong-co-dau/*)' && ghim "dot bien bo luat airdna" ".airdna-profile ở worktree anh em"
dot 'echo "Chặn: raw snapshot là BẤT BIẾN' 'echo "Chặn: sai câu' && ghim "dot bien sai thong diep snapshot" "snapshot ở worktree anh em" -- "thư mục chưa tồn tại, đường cũ vẫn chặn snapshot" "snapshot, thư mục chưa tồn tại, worktree anh em" "kho git khác, snapshot"

# Kiểm rò của selftest: cùng một fixture, worktree của lần chạy khác không làm đỏ, worktree rò của chính nó thì đỏ.
git -C "$ROOT" worktree add --detach "$ST_TMP/onehub-guard-selftest.lan-khac" HEAD >/dev/null 2>&1 || { echo "KHONG TAO DUOC WORKTREE GIA"; exit 2; }
out="$(chay)"
if grep -qx 'PASS' <<<"$out"; then echo "worktree cua lan chay khac: selftest van PASS"; else echo "DO GIA VI LAN CHAY KHAC"; echo "$out"; bad=1; fi
dot_tep "$ST" 'grep -qF "$TMP_THUC/"' 'grep -q "onehub-guard-selftest"' && ghim "dot bien selftest xet ca kho" "worktree tạm còn trong git worktree list"
dot_tep "$ST" 'go_worktree "$B"' ':' && ghim "dot bien selftest bo go worktree" "worktree tạm còn trong git worktree list"

# Đường đỏ cũng phải dọn sạch: selftest chạy đỏ nhiều lần ở trên.
if git -C "$ROOT" worktree list | grep -qF "$ST_TMP/"; then echo "CON WORKTREE TAM cua selftest"; bad=1; else echo "duong do: khong con worktree tam cua selftest"; fi
cleanup; trap - EXIT
if git -C "$ROOT" worktree list | grep -qF "$WT"; then echo "CON WORKTREE TAM cua dau do"; bad=1; else echo "duong do: khong con worktree tam cua dau do"; fi
if git -C "$ROOT" for-each-ref | grep -q 'onehub-guard'; then echo "CON REF TAM"; bad=1; else echo "duong do: khong con ref tam"; fi

[ "$bad" -eq 0 ] && echo "DOT-BIEN OK"
exit $bad
