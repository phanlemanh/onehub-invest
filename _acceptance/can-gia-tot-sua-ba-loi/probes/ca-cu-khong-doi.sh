#!/usr/bin/env bash
# AC-4: phần kiểm của CG1 không bị sửa. Tệp test chỉ được thêm dòng so với gốc của nhánh; sau khi gộp, gốc là chính HEAD nên phép đo thành hiển nhiên.
set -euo pipefail
TEP=app/tests/can-gia-tot-biet-can.test.tsx
cd "$(git rev-parse --show-toplevel)"
GOC=$(git merge-base HEAD origin/main)
TAM=$(mktemp -d); trap 'rm -rf "$TAM"' EXIT
git show "$GOC:$TEP" > "$TAM/goc"
so_xoa() { git diff --no-index --numstat "$1" "$2" | cut -f2 || true; }
# Đối chứng đỏ trên cùng tệp: bỏ một dòng thì thước phải thấy, không thì thước hỏng.
sed '1d' "$TAM/goc" > "$TAM/pha"
[ "$(so_xoa "$TAM/goc" "$TAM/pha")" = "1" ] || { echo "ca-cu-khong-doi: thước hỏng, không thấy dòng bị bỏ"; exit 3; }
XOA=$(so_xoa "$TAM/goc" "$TEP"); XOA=${XOA:-0}
[ "$XOA" = "0" ] || { echo "ca-cu-khong-doi: $XOA dòng cũ bị xoá hay sửa trong $TEP"; exit 1; }
echo "ca-cu-khong-doi: 0 dòng cũ bị đổi so với $GOC"
