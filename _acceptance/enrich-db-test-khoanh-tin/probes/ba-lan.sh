#!/bin/bash
# AC-1: trọn bộ agent ba lần liên tiếp trên DB :5433 dùng chung — cả ba phải 0 ca đỏ.
set -u
cd "$(git rev-parse --show-toplevel)/agent" || exit 2
for n in 1 2 3; do
  out=$(env -u NODE_TEST_CONTEXT npm test 2>&1); rc=$?
  p=$(printf '%s\n' "$out" | sed -n 's/^ℹ pass //p' | tail -1); f=$(printf '%s\n' "$out" | sed -n 's/^ℹ fail //p' | tail -1)
  echo "lan $n: pass ${p:-?} fail ${f:-?}"
  [ "$rc" -eq 0 ] && [ "${f:-1}" = "0" ] || { printf '%s\n' "$out" | grep -E '^✖|Assertion' | head -5; echo "LAN $n DO"; exit 1; }
done
echo "BA LAN XANH"
