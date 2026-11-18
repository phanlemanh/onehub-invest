#!/usr/bin/env bash
# s10-bang-hang-vao-danh-ba AC-5: bốn tên S10 (bảng hàng, tên dự án, bảng nối, view quỹ căn) không được nhắc ở cloud, Bán, thước giá,
# metrics, app, API: pipeline/sync-cloud.mjs, pipeline/sql/, app/, data-api/, pipeline/transform-* (trừ transform-s10.mjs).
# Chạy trên gốc kho (mặc định) rồi tự chạy chiều đỏ trên cây tạm: mỗi gốc một ca phải đỏ đúng tệp; tên trong transform-s10.mjs không đỏ.
set -uo pipefail
TEN='stg_s10_stock|stg_s10_project|s10_project_links|s10_quy_can_du_an'

quet() { # $1 = gốc; in tệp vi phạm, thoát 1 nếu có
  local g=$1 out
  out=$( { [ -f "$g/pipeline/sync-cloud.mjs" ] && grep -lE "$TEN" "$g/pipeline/sync-cloud.mjs";
           for d in pipeline/sql app data-api; do [ -d "$g/$d" ] && grep -rlE --exclude-dir=node_modules --exclude-dir=.next "$TEN" "$g/$d"; done;
           for f in "$g"/pipeline/transform-*; do [ -f "$f" ] && [ "$(basename "$f")" != "transform-s10.mjs" ] && grep -lE "$TEN" "$f"; done; } 2>/dev/null )
  [ -z "$out" ] && return 0
  printf '%s\n' "$out"; return 1
}

GOC=$(cd "$(dirname "$0")/../../.." && pwd -P)
if ! vp=$(quet "$GOC"); then echo "s10-chan: ĐỎ $vp"; exit 1; fi

# Chiều đỏ: sáu ca trên cây tạm.
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/pipeline/sql" "$T/app/src" "$T/data-api/src"
ca() { # $1 tệp tương đối, $2 mong (do|xanh)
  rm -rf "$T/pipeline" "$T/app" "$T/data-api"; mkdir -p "$T/pipeline/sql" "$T/app/src" "$T/data-api/src"
  mkdir -p "$T/$(dirname "$1")"; echo "SELECT * FROM s10_quy_can_du_an" > "$T/$1"
  if vp=$(quet "$T"); then kq=xanh; else kq=do; fi
  if [ "$2" = do ] && { [ $kq != do ] || ! printf '%s' "$vp" | grep -qF "$T/$1"; }; then echo "s10-chan: thước hỏng — ca đỏ $1 không đỏ đúng tệp"; exit 2; fi
  if [ "$2" = xanh ] && [ $kq != xanh ]; then echo "s10-chan: thước hỏng — $1 không được đỏ"; exit 2; fi
}
ca pipeline/sync-cloud.mjs do; ca pipeline/sql/300_x.sql do; ca app/src/x.ts do; ca data-api/src/x.ts do
ca pipeline/transform-zalo.mjs do; ca pipeline/transform-s10.mjs xanh
echo "s10-chan: PASS — 4 tên S10 không ở cloud, sql, app, data-api, transform khác (6 ca chiều đỏ/xanh đúng)"
