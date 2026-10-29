#!/bin/bash
# AC-2: bo-worktree.test.mjs xanh trên bản sửa (ma trận kho chính/worktree liên kết × gỡ lỗi thật bằng lock/thành công, đường
# symlink); bản sao hàm thay khối giữa dấu mốc «>>> du-phong»/«<<< du-phong» bằng `worktree prune` → ca đỏ với thông điệp ghim
# «worktree của phiên khác bị gỡ metadata». Bản sao chạy ở thư mục tạm (test tự dựng kho git tạm, không đụng kho thật).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2
echo "root $ROOT sha $(git -C "$ROOT" rev-parse HEAD)"
TAM=$(mktemp -d); trap 'rm -rf "$TAM"' EXIT
for b in sua prune; do mkdir -p "$TAM/$b/scripts/lib"; cp "$ROOT/scripts/bo-worktree.test.mjs" "$TAM/$b/scripts/"; cp "$ROOT/scripts/lib/bo-worktree.mjs" "$TAM/$b/scripts/lib/"; done
node - "$TAM/prune/scripts/lib/bo-worktree.mjs" <<'JS' || exit 2
const fs = require("fs"); const f = process.argv[2]; const s = fs.readFileSync(f, "utf8");
const m = s.match(/^[ \t]*\/\/ >>> du-phong[^\n]*\n[\s\S]*?^[ \t]*\/\/ <<< du-phong[^\n]*\n/m);
if (!m) { console.log("DOT BIEN KHONG AP DUOC (thieu dau moc du-phong)"); process.exit(2); }
fs.writeFileSync(f, s.replace(m[0], '  git(repo, "worktree", "prune");\n'));
JS
OUT=""
chay() { OUT=$(cd "$TAM/$1" && env -u NODE_TEST_CONTEXT node --test scripts/bo-worktree.test.mjs 2>&1); }
so() { printf '%s\n' "$OUT" | sed -n "s/^ℹ $1 \([0-9]*\)$/\1/p" | tail -1; }
bad=0
chay sua; t=$(so tests); p=$(so pass); f=$(so fail)
echo "ban sua: ${p:-?}/${t:-?} ca xanh"
[ -n "$t" ] && [ "$t" = "$p" ] && [ "$f" = 0 ] && [ "$t" -ge 4 ] || { printf '%s\n' "$OUT" | tail -30; bad=1; }
printf '%s\n' "$OUT" | grep -q "remove loi that: rc=[1-9]" && echo "nhanh du phong da chay (remove loi that)" || { echo "NHANH DU PHONG KHONG CHAY"; bad=1; }
chay prune
if [ "$(so fail)" -ge 1 ] 2>/dev/null && printf '%s\n' "$OUT" | grep -q "worktree của phiên khác bị gỡ metadata"; then
  echo "ban prune: ca do, thong diep ghim co"
else
  echo "CA KHONG DO (ban prune)"; printf '%s\n' "$OUT" | tail -30; bad=1
fi
[ $bad = 0 ] && echo "BO WORKTREE OK"
exit $bad
