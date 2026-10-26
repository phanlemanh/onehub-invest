#!/bin/bash
# AC-2: ca «AC-6 để sau: lượt backlog» tám lần xanh; đối chứng: bản tệp test của origin/main đỏ ít nhất một lần trong tám.
set -u
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT/agent" || exit 2
CA="AC-6 để sau: lượt backlog"
chay() { env -u NODE_TEST_CONTEXT node --import tsx --test --test-name-pattern="$CA" "$1" 2>&1 | grep -q '^ℹ fail 0'; }
for n in $(seq 1 8); do chay tests/enrich-db.test.ts && echo "lan $n: xanh" || { echo "lan $n: DO"; exit 1; }; done
echo "TAM LAN XANH"
# Thân ca không truyền offerIds cho lượt backlog (giữ ý đo của AC-6).
# Lấy đúng khối «await runEnrich({ … });» của lượt backlog trong ca (bỏ chú thích).
goi=$(awk -v ca="$CA" 'index($0, ca){f=1} f && /await runEnrich\(\{/{g=1} g{print} g && /\}\);/{exit}' tests/enrich-db.test.ts | sed 's#//.*##')
printf '%s\n' "$goi" | grep -q 'runId: "test-ac6-backlog"' || { echo "KHONG THAY LOI GOI BACKLOG"; exit 1; }
printf '%s\n' "$goi" | grep -q 'offerIds' && { echo "LOI GOI BACKLOG CO offerIds"; exit 1; }
echo "LOI GOI BACKLOG KHONG offerIds"
# Đối chứng: bản trên origin/main.
cu=tests/.enrich-db-doi-chung.test.ts; git -C "$ROOT" show origin/main:agent/tests/enrich-db.test.ts > "$cu"
k=0; for n in $(seq 1 8); do chay "$cu" || k=$((k+1)); done; rm -f "$cu"
echo "DOI CHUNG: ban cu do $k/8"
[ "$k" -ge 1 ] || { echo "DOI CHUNG KHONG DO — phép đo không phân biệt"; exit 1; }
