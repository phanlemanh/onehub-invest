#!/bin/bash
# AC-3: trọn listings-browse.test.tsx 12 lần, mỗi lần 11/11 xanh và ≤ 60 giây.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)/app" || exit 2
for n in $(seq 1 12); do
  s=$(date +%s)
  out=$(env -u NODE_TEST_CONTEXT node --import tsx --test tests/listings-browse.test.tsx 2>&1); rc=$?
  d=$(( $(date +%s) - s ))
  t=$(printf '%s\n' "$out" | sed -n 's/^ℹ tests //p' | tail -1); p=$(printf '%s\n' "$out" | sed -n 's/^ℹ pass //p' | tail -1); f=$(printf '%s\n' "$out" | sed -n 's/^ℹ fail //p' | tail -1)
  echo "lan $n: tests ${t:-?} pass ${p:-?} fail ${f:-?} (${d}s)"
  [ "$rc" -eq 0 ] && [ "${t:-0}" = "11" ] && [ "${p:-0}" = "11" ] && [ "$d" -le 60 ] || { echo "LAN $n DO"; exit 1; }
done
echo "LB 12 LAN XANH"
