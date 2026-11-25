#!/usr/bin/env bash
# E2–E7 của DA45: chạy một chế độ của tren-db-thu.mjs trên DB thử CHÉP TỪ MÁY THU (db/db-thu.sh, xoá khi xong).
#   bash tren-db-thu.sh chot-luot-dau|chay-lai|tin-moi|ma-tran|ap-lui|thoi-gian|doi-chung-resolve [đối số thêm]
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(git -C "$DIR" rev-parse --show-toplevel)"
case "${1:-}" in chot-luot-dau|chay-lai|tin-moi|ma-tran|ap-lui|thoi-gian|doi-chung-resolve) ;; *) echo "dùng: bash tren-db-thu.sh <chế độ>"; exit 2;; esac
cd "$ROOT/pipeline" || exit 9
exec bash "$ROOT/db/db-thu.sh" "oneinvest_suite_pct_${1//-/_}" --chay node "$DIR/tren-db-thu.mjs" "$@"
