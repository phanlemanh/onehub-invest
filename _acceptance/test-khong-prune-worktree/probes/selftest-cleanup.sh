#!/bin/bash
# AC-5: rút NGUYÊN VĂN hàm cleanup() của selftest hook, chạy trên kho git tạm có worktree «của phiên khác» với thư mục vắng.
# Ma trận: kho {chính, worktree liên kết} × gỡ {lỗi thật — worktree bị lock, remove trả mã ≠ 0; thành công}; worktree tạm nằm
# dưới đường symlink (đường dựng ≠ đường thật git ghi). Đột biến: thay khối giữa hai dấu mốc «>>> du-phong»/«<<< du-phong»
# bằng `worktree prune` → đỏ với thông điệp ghim. Không đụng kho thật.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2
echo "root $ROOT sha $(git -C "$ROOT" rev-parse HEAD)"
SRC="$ROOT/.claude/hooks/tests/typecheck-changed.selftest.sh"
HAM=$(sed -n '/^cleanup() {$/,/^}$/p' "$SRC")
[ -n "$HAM" ] || { echo "KHONG RUT DUOC CLEANUP"; exit 2; }
printf '%s\n' "$HAM" | grep -q 'worktree prune' && { echo "CLEANUP SAI (con worktree prune)"; exit 1; }
printf '%s\n' "$HAM" | grep -q '>>> du-phong' && printf '%s\n' "$HAM" | grep -q '<<< du-phong' || { echo "DOT BIEN KHONG AP DUOC (thieu dau moc du-phong)"; exit 2; }
HAM_PRUNE=$(printf '%s\n' "$HAM" | awk '/>>> du-phong/{print "    git -C \"$REPO\" worktree prune >/dev/null 2>&1"; bo=1; next} /<<< du-phong/{bo=0; next} !bo')
G() { git -c user.name=t -c user.email=t@local.test "$@"; }
# kich_ban <hàm> <chinh|lienket> <loi|ok> → «<giu|mat> <sach|con>»; ca lỗi in thêm mã remove thật lên stderr
kich_ban() {
  local T; T=$(cd "$(mktemp -d)" && pwd -P)
  local K="$T/kho"; mkdir -p "$K"; G -C "$K" init -q; echo x > "$K/a"; G -C "$K" add a; G -C "$K" commit -qm a
  local R="$K"; [ "$2" = lienket ] && { G -C "$K" worktree add -q --detach "$T/repo-wt" HEAD; R="$T/repo-wt"; }
  G -C "$R" worktree add -q --detach "$T/khac" HEAD; rm -rf "$T/khac"
  mkdir -p "$T/thuc/tmp"; ln -s "$T/thuc" "$T/lk"
  local W="$T/lk/tmp/wt"; G -C "$R" worktree add -q --detach "$W" HEAD
  if [ "$3" = loi ]; then G -C "$R" worktree lock "$W"; G -C "$R" worktree remove --force "$W" >/dev/null 2>&1; echo "remove loi that: rc=$?" >&2; fi
  ( REPO="$R"; WT="$W"; TMP="$T/lk/tmp"; eval "$1"; cleanup )
  local giu=mat; grep -lqsF "$T/khac/.git" "$K"/.git/worktrees/*/gitdir && giu=giu
  local sach=sach; grep -lqsE "$T/(lk|thuc)/tmp/wt/.git" "$K"/.git/worktrees/*/gitdir && sach=con
  rm -rf "$T"; echo "$giu $sach"
}
bad=0; ok=0
for kho in chinh lienket; do for go in loi ok; do
  k=$(kich_ban "$HAM" $kho $go); echo "cleanup ban sua: kho $kho, remove $go → $k"
  [ "$k" = "giu sach" ] && ok=$((ok+1)) || { echo "CLEANUP SAI ($kho/$go: $k)"; bad=1; }
done; done
[ $ok = 4 ] && echo "cleanup ban sua: 4/4 kich ban giu worktree khac va go sach worktree tam"
c=$(kich_ban "$HAM_PRUNE" chinh loi)
if [ "${c%% *}" = mat ]; then echo "worktree của phiên khác bị gỡ metadata"; echo "cleanup ban prune: do, thong diep ghim co"; else echo "CA KHONG DO (ban prune: $c)"; bad=1; fi
[ $bad = 0 ] && echo "SELFTEST CLEANUP OK"
exit $bad
