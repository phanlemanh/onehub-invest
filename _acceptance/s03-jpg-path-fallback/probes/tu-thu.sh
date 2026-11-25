#!/usr/bin/env bash
# tu-thu.sh — ZC16 chiều đỏ của E1–E3, chạy lại mỗi lượt chấm: ba đột biến trên bản chép collector/src, mỗi đột biến phải làm
# đúng ca của nó đỏ với thông điệp ghim. In 'TU-THU PASS' và thoát 0 khi cả ba đỏ đúng chỗ.
set -uo pipefail
GOC="$(git rev-parse --show-toplevel)"; T=$(mktemp -d); trap 'rm -rf "$T"' EXIT; LOI=0
dot_bien() {  # $1 tên · $2 tệp · $3 chuỗi gốc · $4 chuỗi thay · $5 thông điệp ghim phải xuất hiện
  local d="$T/$1"; mkdir -p "$d"; cp -R "$GOC/collector/src" "$GOC/collector/package.json" "$GOC/collector/tsconfig.json" "$d/"
  ln -s "$GOC/collector/node_modules" "$d/node_modules"
  F="$d/src/$2" GOC_="$3" THAY="$4" python3 -c 'import os;p=os.environ["F"];s=open(p).read();g=os.environ["GOC_"];assert g in s,"không thấy chuỗi gốc";open(p,"w").write(s.replace(g,os.environ["THAY"],1))' || { echo "FAIL $1: không áp được đột biến"; LOI=1; return; }
  ( cd "$d" && npx tsc -p tsconfig.json >/dev/null 2>&1 )
  local out; out=$(cd "$d" && node --test dist/test/media-fetch.test.js 2>&1)
  if echo "$out" | grep -q "^ℹ fail 0"; then echo "FAIL $1: đột biến mà mọi ca vẫn xanh"; LOI=1
  elif echo "$out" | grep -qF "$5"; then echo "ok   $1 → đỏ với «$5»"
  else echo "FAIL $1: đỏ nhưng không có thông điệp ghim «$5»"; LOI=1; fi
}
dot_bien bo-thu-lai core/media-fetch.ts 'if (dl.error === "http-400") {' 'if (false) {' "fallback phải tải được ảnh khi bỏ /jpg/"
dot_bien bam-url-goc core/media-fetch.ts 'update(fetchedUrl).digest' 'update(url).digest' "tên tệp phải băm theo URL đã tải"
dot_bien thu-moi-loi core/media-fetch.ts 'if (dl.error === "http-400") {' 'if (dl.error) {' "không thử lại"
[ "$LOI" = 0 ] && { echo "TU-THU PASS"; exit 0; }; echo "TU-THU FAIL"; exit 1
