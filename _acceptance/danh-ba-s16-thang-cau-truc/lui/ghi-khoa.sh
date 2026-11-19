#!/usr/bin/env bash
# DA37: ghi ra tệp danh sách khoá do CHÍNH lượt dựng tạo hay đổi. Bộ dựng chạy một giao dịch; mọi dòng nó chèn, mọi thẻ nó cho
# nghỉ mang cùng mốc now() — bước S16 in mốc ấy («S16: khoá mới n, mốc <t>», tong_ket.s16.moc). Ghi theo mốc đúng bằng t:
#   buildings, stacks, units, registry_aliases, review_queue (dòng mới) · gop = căn S08 lượt này gộp vào căn S16 mới ·
#   the = thẻ lượt này cho nghỉ (decided_by 'may-da37', decided_at = t) · field_assertions theo run_id `dbv-…` duy nhất trong [T0, T1].
# Chỉ đọc. Dùng: bash ghi-khoa.sh '<mốc t>' '<T0>' '<T1>' > ~/onehub-backups/db/khoa-da37-<thời điểm>.tsv   [DB ở biến DB]
set -euo pipefail
T=$1; T0=$2; T1=$3; DB=${DB:-oneinvest}
Q(){ docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$DB" -Atc "$1"; }
[ -n "$T" ] || { echo "thiếu mốc giao dịch — lấy từ dòng «S16: khoá mới n, mốc t» của lượt dựng" >&2; exit 2; }
echo "# db	$DB"
echo "# moc	$T"
Q "SELECT 'buildings', building_key FROM buildings WHERE created_at = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'stacks', stack_key FROM stacks WHERE created_at = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'units', unit_key FROM units WHERE created_at = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'registry_aliases', id FROM registry_aliases WHERE first_seen = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'review_queue', id FROM review_queue WHERE created_at = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'gop', u.unit_key FROM units u JOIN units m ON m.unit_key = u.merged_into
    WHERE u.status = 'merged' AND m.created_at = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'the', id FROM review_queue WHERE decided_by = 'may-da37' AND decided_at = '$T' ORDER BY 2" | tr '|' '\t'
RUN=$(Q "SELECT string_agg(DISTINCT run_id, ',') FROM field_assertions WHERE run_id LIKE 'dbv-%' AND created_at BETWEEN '$T0' AND '$T1'")
case "$RUN" in *,*) echo "field_assertions trong khoảng mang nhiều run_id ($RUN) — DỪNG" >&2; exit 3;; esac
echo "# run_id	${RUN:--}"
[ -z "$RUN" ] || Q "SELECT 'field_assertions', id FROM field_assertions WHERE run_id = '$RUN' AND retracted_at IS NULL ORDER BY 2" | tr '|' '\t'
