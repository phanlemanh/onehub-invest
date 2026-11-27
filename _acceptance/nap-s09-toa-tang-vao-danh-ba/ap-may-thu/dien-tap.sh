#!/usr/bin/env bash
# Diễn tập TRỌN chuỗi lệnh của ap-may-thu.md (DA42) trên bản chép DB máy thu — đúng các lệnh của hồ sơ, đổi mỗi tên DB — rồi đi trọn
# đường lùi và so dấu vân tay với lúc trước áp. Không chạm DB `oneinvest`: DB của lượt là oneinvest_suite_s09ap, xoá khi xong.
#   bash _acceptance/nap-s09-toa-tang-vao-danh-ba/ap-may-thu/dien-tap.sh            # bản chép từ bản mẫu oneinvest_suite_mau (nhanh)
#   BAN=chep bash …/dien-tap.sh                                                      # bản chép mới của oneinvest qua db/db-thu.sh (sát máy thu)
#   GIU=1 … giữ DB sau khi xong; OUT=<thư mục> nơi ghi tệp trung gian (mặc định thư mục tạm).
# Chạy nặng (nạp 6.951 dòng, dựng danh bạ hai lần): chỉ khi giữ khoá s4 hoặc tải 1 phút < 12 và không dãy nào giữ s4 (luật GS 24/11).
set -euo pipefail
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel); cd "$ROOT"
A=_acceptance/nap-s09-toa-tang-vao-danh-ba/ap-may-thu
L33=_acceptance/nap-s16-vao-danh-ba/lui
DB=oneinvest_suite_s09ap
URL=postgres://oneinvest:oneinvest@localhost:5433/$DB
SNAP=${S09_SNAP:-/Users/manhphan/dev/onehub-invest/collector/snapshots/vn}
OUT=${OUT:-$(mktemp -d)}; mkdir -p "$OUT"
DX(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db "$@"; }
P(){ DX psql -U oneinvest -h localhost -d "$DB" -v ON_ERROR_STOP=1 -q; }
Q(){ DX psql -U oneinvest -h localhost -d "$DB" -Atc "$1"; }
buoc(){ printf '\n== %s (%s)\n' "$1" "$(date -u +%H:%M:%SZ)"; }
loi(){ echo "✗ $*"; exit 1; }

buoc "dựng bản chép ($DB, BAN=${BAN:-mau})"
if [ "${BAN:-mau}" = chep ]; then bash db/db-thu.sh "$DB" >/dev/null
else DX dropdb -U oneinvest -h localhost --if-exists --force "$DB"; DX createdb -U oneinvest -h localhost -T oneinvest_suite_mau "$DB"; fi
[ "${GIU:-0}" = 1 ] || trap 'DX dropdb -U oneinvest -h localhost --if-exists --force "$DB" >/dev/null 2>&1 || true' EXIT
echo "tệp trung gian: $OUT"

buoc "0. sao lưu trước + bằng chứng trước áp"
r=$(Q "SELECT concat_ws('|', to_regclass('public.stg_s09_danh_ba'), to_regclass('public.v_s09_db_item_moi'), to_regclass('public.v_s09_db_du_an'),
       to_regclass('public.v_s09_db_toa'), to_regclass('public.v_s09_db_tang'))")
[ -z "$r" ] || loi "đã có đối tượng của 115 trước áp: $r"; echo "to_regclass năm đối tượng: rỗng"
bash $A/dau-van-tay.sh "$DB" > "$OUT/van-tay-truoc.txt"
Q "COPY (SELECT * FROM project_links WHERE source = 'S09' ORDER BY source_project_id) TO STDOUT" > "$OUT/project-links-truoc.tsv"
echo "project_links S09 trước: $(wc -l < "$OUT/project-links-truoc.tsv" | tr -d ' ') dòng · bản thu S09 danh bạ: $(Q "SELECT count(*) FROM airbnb_snapshots WHERE starts_with(snapshot_id, 'vn__s09-danh-ba__')")"

buoc "1. áp 115 rồi 125, mỗi tệp hai lần"
P < db/migrations/115_stg_s09_danh_ba.sql; P < db/migrations/125_v_s09_db_du_an_ma_tinh.sql
l1=$(bash $A/dau-van-tay.sh "$DB" | head -1)
P < db/migrations/115_stg_s09_danh_ba.sql; P < db/migrations/125_v_s09_db_du_an_ma_tinh.sql
l2=$(bash $A/dau-van-tay.sh "$DB" | head -1)
[ "$l1" = "$l2" ] || loi "lược đồ đổi giữa lần áp một và hai"; echo "lược đồ lần một = lần hai: $l1"
r=$(Q "SELECT (pg_get_viewdef('v_s09_db_du_an'::regclass) LIKE '%province_code%')::text")
[ "$r" = true ] || loi "v_s09_db_du_an chưa đọc province_code"; echo "v_s09_db_du_an đọc province_code: $r"
DATABASE_URL=$URL node pipeline/scripts/danh-ba-s09-toa-that.mjs --dem --ghi-truoc "$OUT/moc-truoc.json"

buoc "2. nạp ba bản thu hợp lệ (máy thu: thêm --may-thu)"
for b in 2026-11-19T004959637 2026-11-20T015947402 2026-11-20T052953464; do
  DATABASE_URL=$URL node pipeline/import-s09-danh-ba.mjs "$SNAP/vn__s09-danh-ba__$b"
done
Q "SELECT snapshot_id, kind, count(*) FROM stg_s09_danh_ba GROUP BY 1, 2 ORDER BY 1, 2" | sed 's/^/  /'
tong=$(Q "SELECT count(*) FROM stg_s09_danh_ba"); hong=$(Q "SELECT count(*) FROM stg_s09_danh_ba WHERE snapshot_id = 'vn__s09-danh-ba__2026-11-19T211829028'")
echo "tổng $tong (mong đợi 6951) · bản hỏng $hong (mong đợi 0)"; [ "$tong" = 6951 ] && [ "$hong" = 0 ] || loi "số nạp lệch hồ sơ"
DATABASE_URL=$URL node pipeline/import-s09-danh-ba.mjs "$SNAP/vn__s09-danh-ba__2026-11-19T004959637" | tail -1
[ "$(Q "SELECT count(*) FROM stg_s09_danh_ba")" = 6951 ] || loi "nạp lần hai thêm dòng"; echo "nạp lần hai: 0 dòng mới"

buoc "3. lượt dựng đầu"
r=$(Q "SELECT count(*) FROM registry_aliases WHERE source = 'S09' AND value LIKE 'danh-ba-toa/%'"); [ "$r" = 0 ] || loi "đã có $r bí danh toà gói 1 trước lượt dựng"
T0=$(Q "SELECT now()")
node pipeline/danh-ba-vat-the.mjs --db "$URL" | grep '^tong_ket' | cut -c1-400
T1=$(Q "SELECT now()")
DB=$DB bash $L33/ghi-khoa.sh "$T0" "$T1" > "$OUT/khoa.tsv"
echo "tệp khoá: $(grep -v '^#' "$OUT/khoa.tsv" | cut -f1 | sort | uniq -c | tr '\n' ' ' | tr -s ' ')"

buoc "4. lệnh kiểm sau"
DATABASE_URL=$URL node pipeline/scripts/danh-ba-s09-toa-that.mjs --dem --truoc "$OUT/moc-truoc.json" | tee "$OUT/dem-sau.txt" | tail -40
tail -1 "$OUT/dem-sau.txt" | grep -q 'ĐẠT' || loi "--dem không ĐẠT"
DATABASE_URL=$URL node pipeline/scripts/danh-ba-s09-chuong-ten-lech.mjs
node pipeline/danh-ba-vat-the.mjs --db "$URL" >/dev/null
DATABASE_URL=$URL node pipeline/scripts/danh-ba-s09-toa-that.mjs --dem --truoc "$OUT/moc-truoc.json" > "$OUT/dem-lan-hai.txt" || true
if diff -q <(grep -v '^danh-ba' "$OUT/dem-sau.txt") <(grep -v '^danh-ba' "$OUT/dem-lan-hai.txt") >/dev/null; then echo "dựng lần hai: --dem cùng số"; else loi "dựng lần hai đổi số"; fi

buoc "5a. cách tắt: áp lại 115 → bước S09 gói 1 bỏ qua; áp lại 125 → bật"
P < db/migrations/115_stg_s09_danh_ba.sql
node pipeline/danh-ba-vat-the.mjs --db "$URL" 2>&1 | grep -o 'S09 gói 1 bỏ qua — DB chưa áp 125' | head -1 || loi "áp lại 115 không tắt được bước"
P < db/migrations/125_v_s09_db_du_an_ma_tinh.sql
echo "đã bật lại (125)"

buoc "5b. đường lùi trọn: lui-dung.sh → lui-nap.sql → lui-luoc-do.sql"
# Lượt dựng lần hai và lượt 5a ghi 0 khoá mới (bước dựng tra bí danh trước khi đúc) — nếu không, dấu vân tay ở dưới sẽ lệch.
bash $A/lui-dung.sh "$OUT/khoa.tsv" "$OUT/project-links-truoc.tsv" "$DB" 2>&1 | sed 's/^psql:[^ ]* //'
P < $A/lui-nap.sql; P < $A/lui-luoc-do.sql
if bash $A/dau-van-tay.sh "$DB" | diff "$OUT/van-tay-truoc.txt" - ; then echo "dấu vân tay sau lùi TRÙNG trước áp (lược đồ + 10 bảng)"; else loi "dấu vân tay lệch"; fi
r=$(Q "SELECT count(*) FROM pg_trigger WHERE tgname IN ('buildings_chi_them_dong','stacks_chi_them_dong','units_chi_them_dong','registry_aliases_chi_them_dong') AND tgenabled = 'O'")
[ "$r" = 4 ] || loi "rào chỉ-thêm bật $r/4"; echo "rào chỉ-thêm bật lại 4/4"

buoc "5c. ca hỏng của đường lùi: tệp khoá của DB khác → thoát 4, không mở giao dịch"
sed "s/^# db\t.*/# db\toneinvest/" "$OUT/khoa.tsv" > "$OUT/khoa-sai-db.tsv"
set +e; bash $A/lui-dung.sh "$OUT/khoa-sai-db.tsv" "$OUT/project-links-truoc.tsv" "$DB" 2>&1; rc=$?; set -e
[ "$rc" = 4 ] || loi "ca DB khác thoát $rc (mong đợi 4)"; echo "ca DB khác: thoát 4"

buoc "6. áp lại sau lùi"
P < db/migrations/115_stg_s09_danh_ba.sql; P < db/migrations/125_v_s09_db_du_an_ma_tinh.sql; echo "áp lại 115 + 125 sạch"
echo; echo "dien-tap: ĐẠT"
