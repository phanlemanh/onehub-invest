#!/usr/bin/env bash
# Lùi bước 1e có đích: gỡ đúng các khoá trong tệp của ghi-khoa.sh, một giao dịch. Mỗi bảng: số dòng xoá phải bằng số khoá trong
# tệp, lệch → ROLLBACK cả giao dịch, không gỡ gì. Không chạm dòng nào ngoài tệp. Dùng: bash go-khoa.sh <tệp khoá> [DB]
# Bốn bảng buildings, stacks, units, registry_aliases mang rào «chỉ thêm» (055, 082): giao dịch TẮT rào hàng của đúng bốn bảng ấy,
# xoá, rồi BẬT lại trước COMMIT — ALTER TABLE … DISABLE TRIGGER là giao dịch, lỗi giữa chừng thì rào về nguyên trạng. Tắt rào là
# sửa luật an toàn danh bạ: chỉ chạy khi chữ ký Cổng Bằng chứng ghi rõ đã cho đường lùi này.
set -euo pipefail
TEP=$1; DB=${2:-oneinvest}
# Tệp khoá ghi tên DB nơi lượt dựng chạy; khác DB đích → từ chối, không mở giao dịch nào.
DB_TEP=$(awk -F'\t' '$1=="# db"{print $2}' "$TEP")
[ -n "$DB_TEP" ] || { echo "go-khoa: tệp khoá thiếu dòng «# db» — không rõ của DB nào; DỪNG" >&2; exit 4; }
[ "$DB_TEP" = "$DB" ] || { echo "go-khoa: tệp khoá của DB «$DB_TEP», DB đích «$DB» — từ chối" >&2; exit 4; }
# field_assertions mang rào chỉ-thêm riêng (field_assertions_guard, 045) mà đường lùi này KHÔNG tắt: lượt dựng đã ghi khẳng định thì
# gỡ có đích không làm trọn được — từ chối từ đầu, lùi bằng khôi phục bản sao lưu (phần 4 hồ sơ áp).
FA=$(awk -F'\t' '$1=="field_assertions"' "$TEP" | wc -l | tr -d ' ')
[ "$FA" = 0 ] || { echo "go-khoa: tệp khoá có $FA khẳng định (field_assertions) — đường lùi có đích không gỡ được; dùng pg_restore" >&2; exit 5; }
{
  echo "\\set ON_ERROR_STOP on"
  echo "BEGIN;"
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
  -- thứ tự theo khoá ngoại: thẻ, bí danh, khẳng định → căn → trục → toà → nút
  FOR r IN SELECT * FROM (VALUES (1,'review_queue','id'),(2,'registry_aliases','id'),(3,'field_assertions','id'),
                                 (4,'units','unit_key'),(5,'stacks','stack_key'),(6,'buildings','building_key'),
                                 (7,'asset_nodes','id')) v(o, bang, cot) ORDER BY o LOOP
    SELECT count(*) INTO can FROM k WHERE k.bang = r.bang;
    EXECUTE format('DELETE FROM %I WHERE %I::text IN (SELECT khoa FROM k WHERE bang = %L)', r.bang, r.cot, r.bang);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'go-khoa % : tệp % · xoá %', r.bang, can, n;
    IF n <> can THEN RAISE EXCEPTION 'go-khoa: % lệch (tệp %, xoá %) — lùi trọn giao dịch', r.bang, can, n; END IF;
  END LOOP;
END $$;
ALTER TABLE buildings ENABLE TRIGGER buildings_chi_them_dong;
ALTER TABLE stacks ENABLE TRIGGER stacks_chi_them_dong;
ALTER TABLE units ENABLE TRIGGER units_chi_them_dong;
ALTER TABLE registry_aliases ENABLE TRIGGER registry_aliases_chi_them_dong;
COMMIT;
SQL
} | docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$DB" -q
