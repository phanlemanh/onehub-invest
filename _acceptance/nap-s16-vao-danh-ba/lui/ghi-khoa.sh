#!/usr/bin/env bash
# Sau bước 1e: ghi ra tệp danh sách khoá do CHÍNH lượt dựng tạo. Bộ dựng chạy một giao dịch, nên mọi dòng nó chèn vào năm bảng
# danh bạ mang cùng một mốc now() của giao dịch ấy (mốc T). T lấy từ toà mới nhất tạo sau T0 (lúc bắt đầu 1e); mỗi bảng chỉ lấy
# dòng có created_at/first_seen ĐÚNG bằng T — dòng do tiến trình khác ghi trong cùng khoảng có mốc khác, không bị gom.
# field_assertions (mốc clock_timestamp riêng từng dòng) lấy theo run_id `dbv-…` duy nhất của lượt trong khoảng [T0, T1]. Chỉ đọc. Dùng:
#   bash ghi-khoa.sh '<T0>' '<T1>' > ~/onehub-backups/db/khoa-da33-<thời điểm>.tsv   [DB ở biến DB, mặc định oneinvest]
set -euo pipefail
T0=$1; T1=$2; DB=${DB:-oneinvest}
Q(){ docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$DB" -Atc "$1"; }
T=$(Q "SELECT max(created_at) FROM buildings WHERE created_at >= '$T0'")
[ -n "$T" ] || { echo "không có toà nào tạo sau $T0 — không có gì để ghi" >&2; exit 2; }
n=$(Q "SELECT count(DISTINCT created_at) FROM buildings WHERE created_at >= '$T0'")
[ "$n" = 1 ] || { echo "toà tạo sau $T0 mang $n mốc khác nhau — không phải một lượt; DỪNG" >&2; exit 3; }
echo "# db	$DB"
echo "# moc	$T"
Q "SELECT 'buildings', building_key FROM buildings WHERE created_at = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'stacks', stack_key FROM stacks WHERE created_at = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'units', unit_key FROM units WHERE created_at = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'registry_aliases', id FROM registry_aliases WHERE first_seen = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'review_queue', id FROM review_queue WHERE created_at = '$T' ORDER BY 2" | tr '|' '\t'
Q "SELECT 'asset_nodes', id FROM asset_nodes WHERE created_at = '$T' ORDER BY 2" | tr '|' '\t'
RUN=$(Q "SELECT string_agg(DISTINCT run_id, ',') FROM field_assertions WHERE run_id LIKE 'dbv-%' AND created_at BETWEEN '$T0' AND '$T1'")
case "$RUN" in *,*) echo "field_assertions trong khoảng mang nhiều run_id ($RUN) — DỪNG" >&2; exit 3;; esac
echo "# run_id	${RUN:--}"
[ -z "$RUN" ] || Q "SELECT 'field_assertions', id FROM field_assertions WHERE run_id = '$RUN' ORDER BY 2" | tr '|' '\t'
