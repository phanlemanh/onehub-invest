#!/bin/bash
# AC-2: thước baseline-doc xanh trên tài liệu thật (lần đo mới nhất khớp báo cáo sống). Chiều đỏ trên bản chép tài liệu
# (UI_BASELINE_DOC): (a) bỏ mục đo 27/10 → «mục đo mới nhất … lệch báo cáo sống»; (b) baseline của lần đo 85 thành 140 →
# «số baseline tăng»; (c) đổi riêng bảng đầu của mục mới → «hai bảng lệch nhau»; (d) tổng lần đo 85 thành 200 → «tổng vi phạm tăng».
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
DOC=docs/research/ui-baseline-2026-10.md; TAM=$(mktemp -d); trap 'rm -rf "$TAM"' EXIT; bad=0
OUT=$(node scripts/ui-standards/acceptance.mjs baseline-doc 2>&1); rc=$?
if [ $rc = 0 ] && printf '%s\n' "$OUT" | grep -q "OK  lần đo mới nhất khớp báo cáo sống"; then echo "tai lieu that: xanh — $(printf '%s\n' "$OUT" | grep -o 'tài liệu: [^(]*')"; else echo "TAI LIEU THAT DO"; printf '%s\n' "$OUT" | tail -4; bad=1; fi
grep -q "^## Hiện trạng 27/10" $DOC || { echo "THIEU MUC DO 27/10"; exit 1; }
sed '/^## Hiện trạng 27\/10/,$d' $DOC > "$TAM/a.md"
python3 - "$DOC" "$TAM" <<'PY'
import sys,re
doc,tam=sys.argv[1],sys.argv[2]; s=open(doc).read()
b=s.replace("| **Tổng** | 85 | 82 | 3 | 0 |","| **Tổng** | 85 | 140 | 3 | 0 |")
if b==s: print("DOT BIEN KHONG AP DUOC (b)"); sys.exit(2)
open(tam+"/b.md","w").write(b)
i=s.index("## Hiện trạng 27/10"); dau,sau=s[:i],s[i:]
c=re.sub(r"\| \*\*Tổng\*\* \| (\d+) \|", lambda m: f"| **Tổng** | {int(m.group(1))+1} |", sau, count=1)
if c==sau: print("DOT BIEN KHONG AP DUOC (c)"); sys.exit(2)
open(tam+"/c.md","w").write(dau+c)
d=s.replace("| **Tổng** | 85 | 82 | 3 | 0 |","| **Tổng** | 200 | 82 | 3 | 0 |")
if d==s: print("DOT BIEN KHONG AP DUOC (d)"); sys.exit(2)
open(tam+"/d.md","w").write(d)
PY
[ $? = 0 ] || exit 2
for cap in "a|mục đo mới nhất của tài liệu|ban bo muc 27/10" "b|số baseline tăng|ban baseline tang" "c|hai bảng lệch nhau|ban lech hai bang" "d|tổng vi phạm tăng|ban tong tang"; do
  IFS='|' read -r t tdiep nhan <<< "$cap"
  O=$(UI_BASELINE_DOC="$TAM/$t.md" node scripts/ui-standards/acceptance.mjs baseline-doc 2>&1); r=$?
  if [ $r != 0 ] && printf '%s\n' "$O" | grep -q "$tdiep"; then echo "$nhan: do, thong diep ghim co"; else echo "CA KHONG DO ($nhan, rc $r)"; printf '%s\n' "$O" | tail -3; bad=1; fi
done
[ $bad = 0 ] && echo "DOC OK"
exit $bad
