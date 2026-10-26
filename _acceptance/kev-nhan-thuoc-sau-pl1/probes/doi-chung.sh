#!/bin/bash
# Đối chứng: chạy bản harness CŨ (ở merge-base với main) cho hai mode — phải ĐỎ đúng hai ca gốc,
# để chứng rằng bản sửa chữa đúng chỗ đỏ thật chứ không nới thước. Bản cũ chép tạm cạnh bản mới (ROOT tính theo đường dẫn), xoá khi thoát.
set -uo pipefail
# Gốc đối chứng CỐ ĐỊNH = main 432d7ca7 trước PR #135 (merge-base hết nghĩa sau khi bản sửa đã vào main).
cd "${1:?gốc kho}"; base=432d7ca7; cu="scripts/kev-nhan/.cu-$$.mjs"
trap 'rm -f "$cu"' EXIT
git show "$base:scripts/kev-nhan/acceptance.mjs" > "$cu"
iv=$(node "$cu" import-versions 2>&1); hl=$(node "$cu" handler-label 2>&1); ok=1
echo "$iv" | grep -q "bỏ qua thư mục không đúng khuôn" && echo "$iv" | grep -q "IMPORT-VERSIONS FAIL" && echo "đỏ đúng gốc: import-versions — thư mục giả sai khuôn PL1" || { echo "KHÔNG tái hiện import-versions"; ok=0; }
echo "$hl" | grep -q "FAIL log ghi gate-down" && echo "$hl" | grep -q "HANDLER-LABEL FAIL (1 mục)" && echo "đỏ đúng gốc: handler-label — chữ log ZC6 đổi" || { echo "KHÔNG tái hiện handler-label"; ok=0; }
[ "$ok" = 1 ] && echo "DOI-CHUNG OK"; [ "$ok" = 1 ]
