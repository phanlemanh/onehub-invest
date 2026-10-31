#!/bin/bash
# AC-7: chạy THẬT ba script vào launchd có cổng CLI vòng đời (airdna-daily, weekly-with-jitter, smoke-daily) trên bản chép tạm,
# với pipeline/lib/vong-doi.mjs GIẢ trả 3 (không chạy) rồi 2 (lỗi). Sau cổng không có collector/ hay nhà cung cấp nào trong
# bản chép: script đi quá cổng thì đỏ ở bước kế, nên «thoát 0 + đúng dòng bỏ qua» chứng nó dừng tại cổng. Không chạm máy thật.
set -uo pipefail
GOC="${1:?gốc kho}"; bad=0
for pair in "scripts/airdna-daily.sh:S02" "pipeline/scripts/weekly-with-jitter.sh:S01" "scripts/smoke-daily.sh:S01"; do
  f="${pair%%:*}"; ma="${pair##*:}"
  for rc in 3 2; do
    T=$(mktemp -d); mkdir -p "$T/$(dirname "$f")" "$T/pipeline/lib"
    cp "$GOC/$f" "$T/$f"
    printf 'console.log(JSON.stringify({code:process.argv[2],run:false,ly_do:"nguon-paused"}));process.exit(%s)\n' "$rc" > "$T/pipeline/lib/vong-doi.mjs"
    out=$(cd "$T" && HOME="$T" bash "$T/$f" 2>&1); code=$?
    if [ "$rc" = 3 ]; then
      if [ "$code" = 0 ] && echo "$out" | grep -q "nguon-paused" && [ "$(echo "$out" | grep -c .)" = 1 ]; then echo "ok   $f · cổng 3 → thoát 0, đúng một dòng có lý do"; else echo "FAIL $f · cổng 3 → thoát $code, $(echo "$out" | grep -c .) dòng"; bad=1; fi
    else
      if [ "$code" != 0 ] && echo "$out" | grep -qi "fail-closed"; then echo "ok   $f · cổng 2 → thoát $code, dừng fail-closed"; else echo "FAIL $f · cổng 2 → thoát $code"; bad=1; fi
    fi
    rm -rf "$T"
  done
done
[ "$bad" = 0 ] && echo "CONG-LAUNCHD PASS" || echo "CONG-LAUNCHD FAIL"; exit "$bad"
