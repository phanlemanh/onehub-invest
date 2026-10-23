#!/bin/bash
# Phản biện AC-5: retry của zalo-import-daily dựa vào chữ ECONNREFUSED trong đầu ra
# import-airbnb.mjs THẬT (không có errDetail). Snapshot giả rỗng (manifest 0 file) trong
# thư mục tạm, DATABASE_URL trỏ cổng không ai nghe → hỏng ở client.connect(), không ghi gì.
set -uo pipefail
R="$(cd "$(dirname "$0")/../../.." && pwd)"
T=$(mktemp -d "${TMPDIR:-/tmp}/acc-zc3-ia-XXXXXX"); trap 'rm -rf "$T"' EXIT
S="$T/hanoi__zalo-agent__2026-10-22T060000000"; mkdir -p "$S"
echo '{"schemaVersion":2,"snapshotId":"acc-probe","city":"hanoi","source":"zalo-agent","files":[]}' > "$S/manifest.json"
PORT=$(node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{const p=s.address().port;s.close(()=>console.log(p))})')
(cd "$R/pipeline" && U=acc; DATABASE_URL="postgres://$U:$U@localhost:$PORT/acc" node import-airbnb.mjs "$S") > "$T/out" 2>&1
echo "import-airbnb thật, DB cổng $PORT không nghe: kết thúc $( [ $? = 0 ] && echo 'thành công' || echo 'lỗi (≠0)')"
echo "dòng chứa ECONNREFUSED: $(grep -c ECONNREFUSED "$T/out") → nhánh retry của import_one $(grep -q ECONNREFUSED "$T/out" && echo 'KÍCH được' || echo 'KHÔNG kích')"
grep -m2 ECONNREFUSED "$T/out" | sed 's/^ */  /'
