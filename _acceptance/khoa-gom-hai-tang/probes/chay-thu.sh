#!/usr/bin/env bash
# GT5 E10 (AC-10): không phá lượt nạp. Bản chép DB máy thu, công tắc bật:
#   hai lượt nạp → lượt hai 0 tin đổi thành phần; in số tin trước/sau theo khu, số tin chạm lát hai-khu-ghep-b, thời gian bước gom;
#   snapshot: mọi tệp có trước lượt đo còn nguyên tên và cỡ (bộ thu máy thu vẫn ghi bản mới trong lúc đo — tệp mới đếm riêng); số post thử bị gạt bằng nhau và > 0.
#   Phát lại theo lát ngày (7 ngày cuối của captured_at, mỗi ngày một lượt) → thành phần cuối bằng một lượt toàn bộ; mọi offer_id đổi
#   giữa lát có đường nối; in số lần lật.
# Chiều đỏ: đột biến khoá không tất định (độ giống chữ ngẫu nhiên) → lượt hai đổi tin, thoát 1 ghim offer_id.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
D=_acceptance/khoa-gom-hai-tang/probes/gt5-db.mjs; H=_acceptance/khoa-gom-hai-tang/probes/gt5-chay-thu.mjs
U() { echo "postgres://oneinvest:oneinvest@localhost:5433/$1"; }
SNAP="${GT5_SNAP:-$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")/collector/snapshots}"
F=pipeline/lib/gom-tin-hai-tang.mjs; RA="$(mktemp -d)"; cp "$F" "$RA/goc.mjs"
tra_lai() { cp "$RA/goc.mjs" "$F"; for t in oneinvest_gt5_ct1 oneinvest_gt5_ct2 oneinvest_gt5_ct3 oneinvest_gt5_ct4; do node $D xoa $t >/dev/null 2>&1 || true; done; }
trap tra_lai EXIT
RC=0
ke_snap() { [ -d "$SNAP" ] || return 0; find "$SNAP" -type f -print0 | xargs -0 stat -f '%N %z' | sort; }
nap() { local db=$1 nhan=$2; local t0=$SECONDS; DATABASE_URL="$(U "$db")" node pipeline/transform-zalo.mjs > "$RA/$nhan.txt" 2>&1 || { tail -5 "$RA/$nhan.txt"; echo "ĐỎ: transform lỗi ($nhan)"; exit 1; }; echo "  $nhan: $((SECONDS - t0))s · $(grep -o 'gom hai tầng: BẬT[^·]*' "$RA/$nhan.txt") · $(grep -o 'gạt [0-9]* post thử' "$RA/$nhan.txt")"; }
ke_snap > "$RA/snap0.txt"; echo "snapshot trước: $(wc -l < "$RA/snap0.txt" | tr -d " ") tệp"
bash db/db-thu.sh oneinvest_gt5_ct1 >/dev/null || { echo "ĐỎ: không chép được DB thử"; exit 2; }
DATABASE_URL="$(U oneinvest_gt5_ct1)" node $D chup "$RA/s0.json"
node $D nhan oneinvest_gt5_ct1 oneinvest_gt5_ct3 >/dev/null; node $D nhan oneinvest_gt5_ct1 oneinvest_gt5_ct4 >/dev/null
DATABASE_URL="$(U oneinvest_gt5_ct1)" node $D cong-tac bat "chay-thu"
echo "== hai lượt nạp, công tắc bật"
nap oneinvest_gt5_ct1 luot1; DATABASE_URL="$(U oneinvest_gt5_ct1)" node $D chup "$RA/s1.json"
nap oneinvest_gt5_ct1 luot2; DATABASE_URL="$(U oneinvest_gt5_ct1)" node $D chup "$RA/s2.json"
node $D so-sanh "$RA/s1.json" "$RA/s2.json" bang || RC=1
DATABASE_URL="$(U oneinvest_gt5_ct1)" node $H thong-ke "$RA/s0.json" "$RA/s1.json"
T1="$(grep -o 'gạt [0-9]*' "$RA/luot1.txt")"; T2="$(grep -o 'gạt [0-9]*' "$RA/luot2.txt")"
if [ -n "$T1" ] && [ "$T1" = "$T2" ] && [ "${T1#gạt }" -gt 0 ]; then echo "đạt: post thử bị gạt như nhau ($T1)"; else echo "ĐỎ: post thử gạt lệch ($T1 / $T2)"; RC=1; fi
echo "== phát lại theo lát ngày (7 ngày cuối)"
DATABASE_URL="$(U oneinvest_gt5_ct3)" node $D cong-tac bat "phat lai"; DATABASE_URL="$(U oneinvest_gt5_ct4)" node $D cong-tac bat "toan bo"
NGAY="$(DATABASE_URL="$(U oneinvest_gt5_ct3)" node $H cat-lat 7)"; echo "  ngày: $NGAY"
LAT=0; nap oneinvest_gt5_ct3 lat0; DATABASE_URL="$(U oneinvest_gt5_ct3)" node $D chup "$RA/l0.json"
for d in $NGAY; do
  LAT=$((LAT+1))
  DATABASE_URL="$(U oneinvest_gt5_ct3)" node $H tra-lat "$d"
  nap oneinvest_gt5_ct3 "lat$LAT"; DATABASE_URL="$(U oneinvest_gt5_ct3)" node $D chup "$RA/l$LAT.json"
  DATABASE_URL="$(U oneinvest_gt5_ct3)" node $D treo "$RA/l$((LAT-1)).json" > "$RA/treo$LAT.txt" || { cat "$RA/treo$LAT.txt"; RC=1; }
done
nap oneinvest_gt5_ct4 toanbo; DATABASE_URL="$(U oneinvest_gt5_ct4)" node $D chup "$RA/tb.json"
node $H thanh-phan "$RA/l$LAT.json" "$RA/tb.json" || RC=1
echo "  số tin nghỉ do lật offer_id giữa lát: $(cat "$RA"/treo*.txt 2>/dev/null | grep -o '[0-9]* nghỉ' | awk '{s+=$1} END {print s+0}')"
echo "== chiều đỏ: khoá không tất định"
python3 - "$F" <<'PY'
import sys; p=sys.argv[1]; t=open(p).read(); a="doGiong(x.chu, y.chu)"; assert a in t; open(p,"w").write(t.replace(a,"Math.random()",1))
PY
node $D nhan oneinvest_gt5_ct1 oneinvest_gt5_ct2 >/dev/null
nap oneinvest_gt5_ct2 dot1; DATABASE_URL="$(U oneinvest_gt5_ct2)" node $D chup "$RA/d1.json"
nap oneinvest_gt5_ct2 dot2; DATABASE_URL="$(U oneinvest_gt5_ct2)" node $D chup "$RA/d2.json"; cp "$RA/goc.mjs" "$F"
if node $D so-sanh "$RA/d1.json" "$RA/d2.json" bang > "$RA/do.txt"; then cat "$RA/do.txt"; echo "ĐỎ: thước mù — khoá không tất định mà lượt hai không đổi"; RC=1
else grep ĐỎ "$RA/do.txt" | sed 's/^ĐỎ/đạt (đột biến bị bắt)/'; fi
ke_snap > "$RA/snap1.txt"
N0="$(wc -l < "$RA/snap0.txt" | tr -d ' ')"; MAT="$(comm -23 "$RA/snap0.txt" "$RA/snap1.txt" | wc -l | tr -d ' ')"; MOI="$(comm -13 "$RA/snap0.txt" "$RA/snap1.txt" | wc -l | tr -d ' ')"
echo "snapshot sau: tệp cũ đổi hoặc mất $MAT · tệp mới (bộ thu ghi trong lúc đo) $MOI"
if [ "$N0" -gt 0 ] && [ "$MAT" = 0 ]; then echo "đạt: không tệp snapshot cũ nào đổi ($N0 tệp)"; else echo "ĐỎ: snapshot cũ đổi hoặc mất ($MAT), hoặc thư mục rỗng"; comm -23 "$RA/snap0.txt" "$RA/snap1.txt" | head -3; RC=1; fi
[ $RC = 0 ] && echo "XANH: chay-thu" || echo "ĐỎ: chay-thu"
exit $RC
