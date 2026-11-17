#!/usr/bin/env bash
# DA37: lùi có đích một lượt dựng theo tệp của ghi-khoa.sh, một giao dịch; mỗi bước số dòng đổi phải bằng số khoá trong tệp,
# lệch → ROLLBACK cả giao dịch. Thứ tự: căn S08 đã gộp trở lại active (rào 082 cho đổi status, merged_into) → thẻ đã cho nghỉ
# về pending → khẳng định của lượt RÚT (retracted_at + 'lui-da37'; rào 045 cấm xoá, cho rút — Ngoài-5 DA33) → tạm tắt rào
# chỉ-thêm của buildings, stacks, units, registry_aliases, gỡ khoá mới, bật lại trước COMMIT. Tắt rào là sửa luật an toàn danh
# bạ: chỉ chạy khi Mạnh gõ lời lùi lúc đó. Dùng: bash go-khoa.sh <tệp khoá> [DB]
set -euo pipefail
TEP=$1; DB=${2:-oneinvest}
DB_TEP=$(awk -F'\t' '$1=="# db"{print $2}' "$TEP")
[ -n "$DB_TEP" ] || { echo "go-khoa: tệp khoá thiếu dòng «# db» — không rõ của DB nào; DỪNG" >&2; exit 4; }
[ "$DB_TEP" = "$DB" ] || { echo "go-khoa: tệp khoá của DB «$DB_TEP», DB đích «$DB» — từ chối" >&2; exit 4; }
{
  echo "\\set ON_ERROR_STOP on"
  echo "BEGIN;"
  echo "CREATE TEMP TABLE k (bang text, khoa text) ON COMMIT DROP;"
  echo "COPY k FROM STDIN;"
  grep -v '^#' "$TEP"
  echo "\\."
  cat <<'SQL'
DO $$
DECLARE n bigint; can bigint;
BEGIN
  SELECT count(*) INTO can FROM k WHERE bang = 'gop';
  UPDATE units SET status = 'active', merged_into = NULL WHERE unit_key IN (SELECT khoa FROM k WHERE bang = 'gop') AND status = 'merged';
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'go-khoa gop: tệp % · trả %', can, n;
  IF n <> can THEN RAISE EXCEPTION 'go-khoa: gop lệch (tệp %, trả %) — lùi trọn', can, n; END IF;
  SELECT count(*) INTO can FROM k WHERE bang = 'the';
  UPDATE review_queue SET status = 'pending', decision_note = NULL, decided_by = NULL, decided_at = NULL
   WHERE id::text IN (SELECT khoa FROM k WHERE bang = 'the') AND decided_by = 'may-da37';
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'go-khoa the: tệp % · trả %', can, n;
  IF n <> can THEN RAISE EXCEPTION 'go-khoa: the lệch (tệp %, trả %) — lùi trọn', can, n; END IF;
  SELECT count(*) INTO can FROM k WHERE bang = 'field_assertions';
  UPDATE field_assertions SET retracted_at = now(), retract_reason = 'lui-da37'
   WHERE id::text IN (SELECT khoa FROM k WHERE bang = 'field_assertions') AND retracted_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'go-khoa field_assertions: tệp % · rút %', can, n;
  IF n <> can THEN RAISE EXCEPTION 'go-khoa: field_assertions lệch (tệp %, rút %) — lùi trọn', can, n; END IF;
END $$;
ALTER TABLE buildings DISABLE TRIGGER buildings_chi_them_dong;
ALTER TABLE stacks DISABLE TRIGGER stacks_chi_them_dong;
ALTER TABLE units DISABLE TRIGGER units_chi_them_dong;
ALTER TABLE registry_aliases DISABLE TRIGGER registry_aliases_chi_them_dong;
DO $$
DECLARE r record; n bigint; can bigint;
BEGIN
  FOR r IN SELECT * FROM (VALUES (1,'review_queue','id'),(2,'registry_aliases','id'),(3,'units','unit_key'),
                                 (4,'stacks','stack_key'),(5,'buildings','building_key')) v(o, bang, cot) ORDER BY o LOOP
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
