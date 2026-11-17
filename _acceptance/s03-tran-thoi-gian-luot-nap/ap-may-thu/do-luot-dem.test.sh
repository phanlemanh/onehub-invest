#!/bin/bash
# Ba log mẫu viết trước → ba kết luận viết trước (AC-9). Đỏ nếu một ô lệch.
cd "$(dirname "$0")" || exit 2
loi=0
kiem() { local ra; ra=$(bash do-luot-dem.sh "mau/$1"); local rc=$?
  if [ "$rc" = "$2" ] && [[ "$ra" == *"$3" ]]; then echo "ok  $1 → $ra"; else echo "SAI $1 → rc=$rc «$ra» (đợi rc=$2, đuôi «$3»)"; loi=1; fi; }
kiem luot-3h.log 0 "10800 giây (3h00m) — ĐẠT"
kiem luot-5h38-khong-cat.log 1 "— KHÔNG ĐẠT (vượt 14400 giây, không có dòng cắt trần)"
kiem luot-cat-tran.log 0 "— ĐẠT (cắt trần)"
kiem luot-3h-tran-tat.log 1 "— KHÔNG ĐẠT (trần thời gian TẮT ở lượt này)"
kiem luot-tat-truoc-roi-bat.log 0 "10800 giây (3h00m) — ĐẠT"
grep -q "20280 giây (5h38m)" <(bash do-luot-dem.sh mau/luot-5h38-khong-cat.log) || { echo "SAI tổng lượt 5h38m"; loi=1; }
[ "$loi" = 0 ] && echo "DO-LUOT-DEM OK"; exit "$loi"
