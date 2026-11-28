#!/usr/bin/env bash
# lui-4c-thu.sh — chạy thử cách lùi của hồ sơ áp DA56 (ap-may-thu.md mục 4) trên DB của riêng lượt, ở máy thu:
#   bash db/db-thu.sh oneinvest_suite_lui_da56 --chay bash _acceptance/nap-s09-quy-can-va-can-cao-tang/probes/lui-4c-thu.sh
# Kịch bản = lượt áp thật trên bản chép DB máy thu: dấu trước → sao lưu mục 1 → áp 130 hai lần + nạp mọi bản thu v16 của thư mục
# chờ (mục 2) → 4a bỏ view → ĐỐI CHỨNG lệnh 4c cũ (pg_restore --clean, kèm --exit-on-error) phải hỏng → 4c mới (lui-4c.sh) →
# dấu sau phải bằng dấu trước, ở cả phạm vi S09 lẫn số dòng 14 bảng stg trỏ khoá ngoại tới airbnb_snapshots.
# Thoát 0 = lùi đúng; 1 = lệch. Chỉ in số đếm và md5. Không chạm DB oneinvest: tên DB lấy từ DATABASE_URL của db-thu, chặn khác suite.
set -uo pipefail
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$GOC"
HS=_acceptance/nap-s09-quy-can-va-can-cao-tang
D=$(node -e 'console.log(new URL(process.env.DATABASE_URL).pathname.slice(1))')
[[ "$D" =~ ^oneinvest_suite_[a-z0-9_]+$ ]] || { echo "lui-4c-thu: từ chối DB '$D' — chỉ DB của lượt" >&2; exit 2; }
CHO=${S09_V16:-/Users/manhphan/dev/onehub-zk/research-local/s09-snapshot-cho/vn}
X=${D}_phu; T=$(mktemp -d); trap 'docker exec -e PGPASSWORD=oneinvest one-invest-db dropdb -U oneinvest -h localhost --if-exists "$X" >/dev/null 2>&1; rm -rf "$T"' EXIT
ps(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$1" -v ON_ERROR_STOP=1 -q "${@:2}"; }
S09="snapshot_id LIKE 'vn\\_\\_s09-danh-ba\\_\\_%'"
DAU="SELECT (SELECT count(*) || ':' || coalesce(md5(string_agg(a::text, '|' ORDER BY a.snapshot_id)), '') FROM airbnb_snapshots a WHERE a.$S09)
  || ' ' || (SELECT count(*) || ':' || coalesce(md5(string_agg(s::text, '|' ORDER BY s.snapshot_id, s.dong)), '') FROM stg_s09_danh_ba s)"
FK="SELECT string_agg(c.conrelid::regclass::text || '=' || (xpath('/row/n/text()', query_to_xml('SELECT count(*) AS n FROM ' || c.conrelid::regclass, false, true, '')))[1]::text, ' ' ORDER BY 1)
  || ' airbnb_snapshots=' || (SELECT count(*) FROM airbnb_snapshots) FROM pg_constraint c WHERE c.contype = 'f' AND c.confrelid = 'airbnb_snapshots'::regclass"
loi=0
DAU0=$(ps "$D" -Atc "$DAU"); FK0=$(ps "$D" -Atc "$FK")
echo "trước : $DAU0"; echo "trước : $FK0"
# mục 1 — sao lưu hai bảng
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -Fc -t stg_s09_danh_ba -t airbnb_snapshots "$D" > "$T/truoc.dump"
echo "sao lưu: $(wc -c < "$T/truoc.dump" | tr -d ' ') byte"
# mục 2 — áp 130 hai lần + nạp
ps "$D" < db/migrations/130_v_s09_db_quy_can.sql && ps "$D" < db/migrations/130_v_s09_db_quy_can.sql || { echo "FAIL áp 130"; exit 1; }
n=0; for d in "$CHO"/vn__s09-danh-ba__*; do
  node -e 'process.exit(require(process.argv[1]+"/manifest.json").schemaVersion===16?0:1)' "$d" || continue
  node pipeline/import-s09-danh-ba.mjs "$d" > "$T/nap.log" 2>&1 || { echo "FAIL nạp $(basename "$d")"; tail -3 "$T/nap.log"; exit 1; }
  n=$((n + 1))
done
DAU1=$(ps "$D" -Atc "$DAU"); echo "sau áp: $n bản v16 · $DAU1"
[ "$DAU1" != "$DAU0" ] || { echo "FAIL lượt áp không đổi gì — kịch bản thử rỗng"; exit 1; }
# 4a
ps "$D" -c "DROP VIEW IF EXISTS v_s09_db_quy_can; DROP VIEW IF EXISTS v_s09_db_quy_can_doi_soat; DROP VIEW IF EXISTS v_s09_db_can_cao_tang"
echo "4a    : view còn $(ps "$D" -Atc "SELECT count(*) FROM pg_views WHERE viewname LIKE 'v\\_s09\\_db\\_%'")"
# đối chứng — lệnh 4c cũ trên một BẢN SAO của DB lượt (createdb -T), không phải trên D: lượt đầu 27/11 cho thấy nó DROP được
# stg_s09_danh_ba (4a đã bỏ view nên không còn gì chặn) rồi mới hỏng ở airbnb_snapshots — bảng stg mất trắng.
DC=${D}_dc; trap 'docker exec -e PGPASSWORD=oneinvest one-invest-db dropdb -U oneinvest -h localhost --if-exists "$X" >/dev/null 2>&1; docker exec -e PGPASSWORD=oneinvest one-invest-db dropdb -U oneinvest -h localhost --if-exists "$DC" >/dev/null 2>&1; rm -rf "$T"' EXIT
docker exec -e PGPASSWORD=oneinvest one-invest-db createdb -U oneinvest -h localhost -T "$D" "$DC"
docker exec -i -e PGPASSWORD=oneinvest one-invest-db pg_restore -U oneinvest -h localhost -d "$DC" --clean --exit-on-error \
  -t stg_s09_danh_ba -t airbnb_snapshots < "$T/truoc.dump" > "$T/cu.log" 2>&1; ma=$?
echo "4c cũ (trên bản sao): thoát $ma · $(grep -o 'cannot drop[^:]*' "$T/cu.log" | head -1) · stg_s09_danh_ba sau lệnh: $(ps "$DC" -Atc "SELECT coalesce(to_regclass('public.stg_s09_danh_ba')::text, 'MẤT')")"
[ $ma -ne 0 ] && echo "đối chứng: lệnh 4c cũ hỏng như finding" || { echo "FAIL đối chứng: lệnh 4c cũ không hỏng"; loi=1; }
docker exec -e PGPASSWORD=oneinvest one-invest-db dropdb -U oneinvest -h localhost "$DC"
# 4c mới
docker exec -e PGPASSWORD=oneinvest one-invest-db createdb -U oneinvest -h localhost "$X"
docker exec -i -e PGPASSWORD=oneinvest one-invest-db pg_restore -U oneinvest -h localhost -d "$X" --exit-on-error --no-owner < "$T/truoc.dump" || { echo "FAIL khôi phục dump vào DB phụ"; exit 1; }
bash "$HS/lui-4c.sh" "$D" "$X" || { echo "FAIL lui-4c.sh"; loi=1; }
DAU2=$(ps "$D" -Atc "$DAU"); FK2=$(ps "$D" -Atc "$FK")
echo "sau lùi: $DAU2"; echo "sau lùi: $FK2"
[ "$DAU2" = "$DAU0" ] && echo "PASS phạm vi S09 về đúng dấu trước" || { echo "FAIL phạm vi S09 lệch dấu trước"; loi=1; }
[ "$FK2" = "$FK0" ] && echo "PASS 14 bảng stg trỏ airbnb_snapshots và airbnb_snapshots giữ nguyên số dòng" || { echo "FAIL số dòng bảng nguồn khác đổi"; loi=1; }
exit $loi
