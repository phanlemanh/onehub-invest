#!/usr/bin/env bash
# Lùi lượt dựng đầu có đích (mục 3 hồ sơ áp DA42), MỘT giao dịch:
#   1. project_links nguồn S09 về đúng bản chụp trước lượt dựng (tệp COPY của mục 0 — máy thu có 0 dòng S09 ngày 24/11);
#   2. gỡ đúng các khoá trong tệp của ghi-khoa.sh (DA33, cùng mốc giao dịch của lượt dựng): thẻ, bí danh → căn → trục → toà → nút.
# Mỗi bảng: số dòng xoá phải bằng số khoá trong tệp, lệch → lùi trọn giao dịch. Bốn bảng buildings, stacks, units, registry_aliases
# mang rào «chỉ thêm» (055, 082): giao dịch TẮT rào hàng của đúng bốn bảng ấy rồi BẬT lại trước COMMIT (DISABLE TRIGGER là giao
# dịch — lỗi giữa chừng thì rào về nguyên trạng). Tắt rào là sửa luật an toàn danh bạ: CHỈ chạy khi Mạnh gõ lời lùi lúc đó.
#   bash lui-dung.sh <tệp khoá ghi-khoa.sh> <tệp project_links trước> [DB, mặc định oneinvest]
set -euo pipefail
TEP=$1; PL=$2; DB=${3:-oneinvest}
DB_TEP=$(awk -F'\t' '$1=="# db"{print $2}' "$TEP")
[ -n "$DB_TEP" ] || { echo "lui-dung: tệp khoá thiếu dòng «# db»; DỪNG" >&2; exit 4; }
[ "$DB_TEP" = "$DB" ] || { echo "lui-dung: tệp khoá của DB «$DB_TEP», DB đích «$DB» — từ chối" >&2; exit 4; }
FA=$(awk -F'\t' '$1=="field_assertions"' "$TEP" | wc -l | tr -d ' ')
[ "$FA" = 0 ] || { echo "lui-dung: tệp khoá có $FA khẳng định (field_assertions) — đường có đích không gỡ được; dùng pg_restore" >&2; exit 5; }
[ -f "$PL" ] || { echo "lui-dung: thiếu tệp project_links trước ($PL)" >&2; exit 4; }
{
  echo "\\set ON_ERROR_STOP on"
  echo "BEGIN;"
  echo "DELETE FROM project_links WHERE source = 'S09';"
  echo "COPY project_links FROM STDIN;"
  cat "$PL"
  echo "\\."
  echo "CREATE TEMP TABLE k (bang text, khoa text) ON COMMIT DROP;"
  echo "COPY k FROM STDIN;"
  grep -v '^#' "$TEP"
  echo "\\."
  cat <<'SQL'
ALTER TABLE buildings DISABLE TRIGGER buildings_chi_them_dong;
ALTER TABLE stacks DISABLE TRIGGER stacks_chi_them_dong;
ALTER TABLE units DISABLE TRIGGER units_chi_them_dong;
ALTER TABLE registry_aliases DISABLE TRIGGER registry_aliases_chi_them_dong;
DO $$
DECLARE r record; n bigint; can bigint;
BEGIN
  FOR r IN SELECT * FROM (VALUES (1,'review_queue','id'),(2,'registry_aliases','id'),(3,'units','unit_key'),
                                 (4,'stacks','stack_key'),(5,'buildings','building_key'),(6,'asset_nodes','id')) v(o, bang, cot) ORDER BY o LOOP
    SELECT count(*) INTO can FROM k WHERE k.bang = r.bang;
    EXECUTE format('DELETE FROM %I WHERE %I::text IN (SELECT khoa FROM k WHERE bang = %L)', r.bang, r.cot, r.bang);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'lui-dung % : tệp % · xoá %', r.bang, can, n;
    IF n <> can THEN RAISE EXCEPTION 'lui-dung: % lệch (tệp %, xoá %) — lùi trọn giao dịch', r.bang, can, n; END IF;
  END LOOP;
END $$;
ALTER TABLE buildings ENABLE TRIGGER buildings_chi_them_dong;
ALTER TABLE stacks ENABLE TRIGGER stacks_chi_them_dong;
ALTER TABLE units ENABLE TRIGGER units_chi_them_dong;
ALTER TABLE registry_aliases ENABLE TRIGGER registry_aliases_chi_them_dong;
COMMIT;
SQL
} | docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$DB" -q
