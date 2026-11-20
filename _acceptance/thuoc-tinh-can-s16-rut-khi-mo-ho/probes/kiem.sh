#!/usr/bin/env bash
# Lệnh eval của hồ sơ thuoc-tinh-can-s16-rut-khi-mo-ho (DA48). Đường suy từ vị trí script.
set -euo pipefail
HO_SO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GOC="$(cd "$HO_SO/../.." && pwd)"
cd "$GOC"
case "${1:-}" in
  db)   exec node --test --test-concurrency=1 pipeline/tests/thuoc-tinh-can-s16-rut.itest.mjs ;;
  app)  cd app && exec node --import tsx --test --test-concurrency=1 tests/thuoc-tinh-can-rut.test.tsx ;;
  ttc)  exec bash "$HO_SO/probes/ttc.sh" ;;
  that) exec node "$HO_SO/probes/that.mjs" ;;
  *) echo "kiem.sh: dùng db | app | ttc | that" >&2; exit 2 ;;
esac
