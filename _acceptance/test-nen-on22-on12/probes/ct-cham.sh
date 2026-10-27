#!/bin/bash
# AC-4: CT-AC-1 không phụ thuộc nhịp chờ — route công tắc ghi ops_audit TRONG giao dịch trước khi trả (e627e4fe, #155). Bản sao
# cong-tac-nhom-go.test.tsx chèn vào pg (Pool lẫn Client) cho mọi INSERT INTO ops_audit:
#   tre — trễ 400 ms rồi mới ghi, lời gọi CHỜ lệnh xong → CT-AC-1 xanh (không phụ thuộc nhịp);
#   nen — trả ngay, ghi sau 400 ms (đúng lớp «ghi nền» trước #155) → CT-AC-1 đỏ «một dòng nhật ký» (test canh được lớp lỗi ấy).
# Bản sao ở app/node_modules/.tn-ct-<pid> (eslint/tsc bỏ qua), import tương đối đổi sang tuyệt đối.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2
echo "root $ROOT sha $(git -C "$ROOT" rev-parse HEAD)"
TAM="$ROOT/app/node_modules/.tn-ct-$$"; mkdir -p "$TAM"; DEM="$TAM/dem"; trap 'rm -rf "$TAM"' EXIT
TEP="$ROOT/app/tests/cong-tac-nhom-go.test.tsx"
ban_sao() { # $1 = tre | nen
  local tra='return new Promise((r) => setTimeout(r, 400)).then(() => goc.apply(this, a))'
  [ "$1" = nen ] && tra='setTimeout(() => goc.apply(this, a).catch(() => {}), 400); return Promise.resolve({ rows: [], rowCount: 1 })'
  sed -e "s#\"\.\./\.\./pipeline/#\"$ROOT/pipeline/#g" -e "s#\"\./helpers/#\"$ROOT/app/tests/helpers/#g" -e "s#\"\.\./src/#\"$ROOT/app/src/#g" \
      -e "s#^const APP = .*#const APP = \"$ROOT/app\"#" "$TEP" > "$TAM/$1.test.tsx"
  node - "$TAM/$1.test.tsx" "$DEM" "$tra" <<'JS' || exit 2
const fs = require("fs"); const [f, dem, tra] = process.argv.slice(2); let s = fs.readFileSync(f, "utf8")
const moc = 'import pg from "pg"\n'
if (!s.includes(moc)) { console.log("TRE KHONG CHEN (thieu import pg)"); process.exit(2) }
const chen = `import { appendFileSync as __ghi } from "node:fs"\nfor (const K of [pg.Pool, pg.Client] as any[]) { const goc = K.prototype.query; K.prototype.query = function (this: unknown, ...a: any[]) { const s = String(a[0]?.text ?? a[0]); if (/INSERT INTO ops_audit/i.test(s)) { __ghi(${JSON.stringify(dem)}, "x\\n"); ${tra} } return goc.apply(this, a) } }\n`
fs.writeFileSync(f, s.replace(moc, moc + chen))
JS
}
ban_sao tre; ban_sao nen
OUT=""
chay() { rm -f "$DEM"; OUT=$(cd "$ROOT/app" && env -u NODE_TEST_CONTEXT node --import tsx --test --test-name-pattern="CT-AC-1" "$TAM/$1.test.tsx" 2>&1); }
so() { printf '%s\n' "$OUT" | sed -n "s/^ℹ $1 \([0-9]*\)$/\1/p" | tail -1; }
bad=0
chay tre; n=$(grep -c . "$DEM" 2>/dev/null || echo 0)
if [ "$(so fail)" = 0 ] && [ "$(so pass)" -ge 1 ] 2>/dev/null; then echo "tre 400ms co cho: xanh"; else echo "BAN SUA DO (tre co cho)"; printf '%s\n' "$OUT" | grep -A6 "✖" | head -20; bad=1; fi
echo "tre duoc chen: $n lan"; [ "$n" -ge 3 ] || { echo "TRE KHONG CHEN ($n lan)"; bad=1; }
chay nen
if [ "$(so fail)" -ge 1 ] 2>/dev/null && printf '%s\n' "$OUT" | grep -q "một dòng nhật ký"; then echo "ghi nen 400ms: do, thong diep «mot dong nhat ky»"; else echo "DOI CHUNG KHONG DO"; printf '%s\n' "$OUT" | grep -A6 "✖" | head -20; bad=1; fi
[ $bad = 0 ] && echo "CT CHAM OK"
exit $bad
