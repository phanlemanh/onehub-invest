#!/usr/bin/env bash
# AC-1 — khối tri_thuc khai đúng: cong_khai true, kho ten/duong/remote, không noi; gốc giải về cạnh checkout chính; kho riêng PRIVATE.
set -uo pipefail; . "$(dirname "$0")/_chung.sh"
cd "$ROOT" || exit 2
r="$(node -e 'const k=require("./scripts/tri-thuc-khoa.cjs");console.log(JSON.stringify(k.docTriThuc(require("fs").readFileSync("_acceptance/config.yaml","utf8"))))')"
echo "khối: $r"
echo "$r" | grep -q '"congKhai":true' && ok "cong_khai: true" || bad "cong_khai không true"
echo "$r" | grep -q '"ten":"onehub-invest-tri-thuc","duong":"../onehub-invest-tri-thuc","remote":"https://github.com/phanlemanh/onehub-invest-tri-thuc.git"' && ok "kho: ten/duong/remote đúng" || bad "kho sai"
echo "$r" | grep -q '"noi":null' && ok "không khai noi (gốc là kho riêng)" || bad "có noi"
echo "$r" | grep -q '"loi":\[\]' && ok "bộ đọc của kit: 0 lỗi" || bad "bộ đọc báo lỗi"
main="$(dirname "$(cd "$ROOT" && git rev-parse --path-format=absolute --git-common-dir)")"
[ "$GOC" = "$(dirname "$main")/onehub-invest-tri-thuc" ] && ok "gốc tri thức = $GOC (cạnh checkout chính $main)" || bad "gốc giải ra $GOC"
v="$(gh repo view phanlemanh/onehub-invest-tri-thuc --json visibility -q .visibility 2>&1)"
[ "$v" = "PRIVATE" ] && ok "kho riêng trên GitHub: PRIVATE" || bad "visibility: $v"
[ $fail -eq 0 ] && echo "KHAI OK" || { echo "KHAI FAIL"; exit 1; }
