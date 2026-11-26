#!/usr/bin/env bash
# ban-chep.sh AC-4 — ghi-tam-do-sau-co-han E4: chép DB máy thu sang DB thử (db/db-thu.sh: pg_dump chỉ đọc nguồn), áp migration
# 129 hai lần, in câu đếm theo lô và so với số viết tay; đột biến (gộp hai lô đêm, đảo doc_lap lô đọc toàn bộ) phải đỏ với thông
# điệp ghim; chạy thử khối lùi (probes/lui-129.sql) rồi đếm lại. Xoá DB thử khi xong. In mọi số để chép vào ap-may-thu.md.
set -euo pipefail
[ "${1:-}" = "AC-4" ] || { echo "dùng: ban-chep.sh AC-4"; exit 2; }
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
HS="$GOC/_acceptance/ghi-tam-do-sau-co-han"
TEN=oneinvest_nb10_ban_chep
cd "$GOC"
P=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$TEN" -q -At -v ON_ERROR_STOP=1)
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
DEM="SELECT string_agg(ma || '=' || n || ':' || doc_lap || ':' || (han_do_bu - current_date), ' ' ORDER BY ma)
       FROM (SELECT g.ma, g.doc_lap, g.han_do_bu, count(e.id) AS n FROM ghi_tam_lo g
               LEFT JOIN enrichment_proposals e ON e.lo_id = g.ma AND e.status = 'applied' GROUP BY 1, 2, 3) x"
THIEU="SELECT count(*) FROM enrichment_proposals WHERE status = 'applied' AND route = 'corroborated' AND applied_at < '2026-11-24'
         AND lo_id IS NULL AND ((run_id LIKE 'enrich-%' AND field IN ('property_type','block_raw')) OR (run_id LIKE 'doc%' AND field = 'property_type'))"
BAM="SELECT md5(string_agg(id || ':' || coalesce(lo_id,'') || ':' || ghi_tam, ',' ORDER BY id)) FROM enrichment_proposals"
MONG="doc-toan-bo-loai-hinh=1993:true:14 truoc-doc-lap-loai-hinh=187:false:14 truoc-doc-lap-toa=110:false:14"

dung() {  # $1 = tệp migration
  bash db/db-thu.sh "$TEN" >/dev/null
  "${P[@]}" < "$1"
}
kiem() {  # in số, trả 0 khi khớp MONG
  local dem thieu; dem="$("${P[@]}" -c "$DEM")"; thieu="$("${P[@]}" -c "$THIEU")"
  echo "lô: $dem · giá trị tự ghi trước 24/11 thiếu lô: $thieu"
  [ "$dem" = "$MONG" ] && [ "$thieu" = "0" ]
}

echo "== bản chép DB máy thu + 129"
dung "$GOC/db/migrations/129_ghi_tam_lo.sql"
kiem || { echo "ĐỎ AC-4: câu đếm lệch, mong «$MONG»"; exit 1; }
b1="$("${P[@]}" -c "$BAM")"; n1="$("${P[@]}" -c "SELECT count(*) FROM ghi_tam_lo")"
"${P[@]}" < "$GOC/db/migrations/129_ghi_tam_lo.sql"
b2="$("${P[@]}" -c "$BAM")"; n2="$("${P[@]}" -c "SELECT count(*) FROM ghi_tam_lo")"
[ "$b1" = "$b2" ] && [ "$n1" = "$n2" ] || { echo "ĐỎ AC-4: áp lần hai đổi dòng (băm $b1 → $b2, lô $n1 → $n2)"; exit 1; }
echo "áp lần hai: không đổi (băm $b1, $n1 lô)"

echo "== bẫy thứ tự 066 (giả lập 066 áp sau 129)"
VA="SELECT prosrc ~ '129 \\(NB10 Hỏi-4\\)' FROM pg_proc WHERE proname = 'revert_enrichment'"
node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");const i=s.indexOf("CREATE OR REPLACE FUNCTION revert_enrichment");process.stdout.write(s.slice(i,s.indexOf("$$;",s.indexOf("AS $$",i))+3)+"\n")' \
  "$GOC/db/migrations/066_can_theo_tin.sql" | "${P[@]}"
[ "$("${P[@]}" -c "$VA")" = "f" ] || { echo "ĐỎ AC-6: nạp 066 không làm mất bản vá — ca bẫy không đo gì"; exit 1; }
LO1="$("${P[@]}" -c "SELECT ma FROM ghi_tam_lo ORDER BY ma LIMIT 1")"
ERR="$(mktemp)"
if "${P[@]}" -c "BEGIN; UPDATE ghi_tam_lo SET han_do_bu = current_date - 1 WHERE ma = '$LO1'; SELECT * FROM xet_han_ghi_tam(); COMMIT;" >/dev/null 2>"$ERR"; then
  echo "ĐỎ AC-6: mất bản vá mà actor máy vẫn rút được lô $LO1"; exit 1
fi
echo "mất bản vá: rút bằng actor máy bị từ chối — $(grep -o 'chỉ người được hoàn tác[^,]*' "$ERR" | head -1); lô $LO1 còn $("${P[@]}" -c "SELECT trang_thai FROM ghi_tam_lo WHERE ma = '$LO1'")"
rm -f "$ERR"
"${P[@]}" < "$GOC/db/migrations/129_ghi_tam_lo.sql"
[ "$("${P[@]}" -c "$VA")" = "t" ] || { echo "ĐỎ AC-6: chạy lại 129 không phục hồi bản vá"; exit 1; }
kiem >/dev/null || { echo "ĐỎ AC-4: chạy lại 129 sau 066 làm đổi lô"; exit 1; }
echo "chạy lại 129: bản vá phục hồi, ba lô giữ nguyên"

echo "== chạy thử khối lùi"
"${P[@]}" < "$HS/probes/lui-129.sql"
echo "sau lùi: bảng ghi_tam_lo $("${P[@]}" -c "SELECT to_regclass('ghi_tam_lo') IS NULL") (true = đã gỡ) · cột lo_id $("${P[@]}" -c "SELECT count(*) FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'enrichment_proposals' AND column_name IN ('lo_id','ghi_tam')") (0 = đã gỡ)"

hong=0
dotbien() {  # $1 tên, $2 chuỗi tìm, $3 chuỗi thay, $4 thông điệp ghim
  local t; t="$(mktemp)"
  node -e 'const fs=require("fs");const [f,a,b,o]=process.argv.slice(1);const s=fs.readFileSync(f,"utf8");if(s.split(a).length!==2){console.error("không thấy đúng một chỗ: "+a);process.exit(3)}fs.writeFileSync(o,s.replace(a,b))' \
    "$GOC/db/migrations/129_ghi_tam_lo.sql" "$2" "$3" "$t"
  dung "$t"; rm -f "$t"
  if kiem >/dev/null; then echo "HỎNG đột biến «$1»: thước vẫn xanh"; hong=1
  else echo "đỏ đúng AC-4 «$1»: $4 — $(kiem | head -1)"; fi
}
dotbien "gộp hai lô đêm thành một" "WHEN ep.run_id LIKE 'enrich-%' AND ep.field = 'block_raw'     THEN 'truoc-doc-lap-toa'" \
  "WHEN ep.run_id LIKE 'enrich-%' AND ep.field = 'block_raw'     THEN 'truoc-doc-lap-loai-hinh'" "lô truoc-doc-lap-toa thiếu"
dotbien "đảo doc_lap lô đọc toàn bộ" "'doc-toan-bo 03–05/11', true," "'doc-toan-bo 03–05/11', false," "lô doc-toan-bo-loai-hinh doc_lap lệch"
exit $hong
