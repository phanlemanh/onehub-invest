#!/usr/bin/env bash
# stg-du-an-s08 AC-5: bảng stg_s08_project không được nhắc ở cloud, app, API: pipeline/sync-cloud.mjs, app/, data-api/.
# Chạy trên gốc kho rồi tự chạy chiều đỏ trên cây tạm: mỗi gốc một ca phải đỏ đúng tệp; thước không đỏ đúng tệp → thoát 2.
set -uo pipefail
TEN='stg_s08_project'

quet() { # $1 = gốc; in tệp vi phạm, thoát 1 nếu có
  local g=$1 out
  out=$( { [ -f "$g/pipeline/sync-cloud.mjs" ] && grep -lE "$TEN" "$g/pipeline/sync-cloud.mjs";
           for d in app data-api; do [ -d "$g/$d" ] && grep -rlE --exclude-dir=node_modules --exclude-dir=.next "$TEN" "$g/$d"; done; } 2>/dev/null )
  [ -z "$out" ] && return 0
  printf '%s\n' "$out"; return 1
}

GOC=$(cd "$(dirname "$0")/../../.." && pwd -P)
if ! vp=$(quet "$GOC"); then echo "s08da-chan: ĐỎ $vp"; exit 1; fi

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
ca() { # $1 tệp tương đối phải đỏ đúng tệp
  rm -rf "$T/pipeline" "$T/app" "$T/data-api"; mkdir -p "$T/pipeline" "$T/app/src" "$T/data-api/src"
  mkdir -p "$T/$(dirname "$1")"; echo "SELECT * FROM stg_s08_project" > "$T/$1"
  if vp=$(quet "$T"); then echo "s08da-chan: thước hỏng — ca đỏ $1 không đỏ"; exit 2; fi
  printf '%s' "$vp" | grep -qF "$T/$1" || { echo "s08da-chan: thước hỏng — ca đỏ $1 không gọi đúng tệp"; exit 2; }
}
ca pipeline/sync-cloud.mjs; ca app/src/x.ts; ca data-api/src/x.ts
echo "s08da-chan: PASS — stg_s08_project không ở cloud, app, data-api (3 ca chiều đỏ đúng tệp)"
