#!/bin/bash
# AC-1: trọn ops-facts-so-tong-hop.test.tsx 12 lần, mỗi lần 0 ca đỏ.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)/app" || exit 2
for n in $(seq 1 12); do
  out=$(env -u NODE_TEST_CONTEXT node --import tsx --test tests/ops-facts-so-tong-hop.test.tsx 2>&1); rc=$?
  p=$(printf '%s\n' "$out" | sed -n 's/^ℹ pass //p' | tail -1); f=$(printf '%s\n' "$out" | sed -n 's/^ℹ fail //p' | tail -1)
  echo "lan $n: pass ${p:-?} fail ${f:-?}"
  [ "$rc" -eq 0 ] && [ "${f:-1}" = "0" ] || { printf '%s\n' "$out" | grep -E '^✖|lệch|Assertion' | head -5; echo "LAN $n DO"; exit 1; }
done
echo "OPS 12 LAN XANH"
