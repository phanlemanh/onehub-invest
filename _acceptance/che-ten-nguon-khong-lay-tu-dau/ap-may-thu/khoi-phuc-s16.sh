#!/bin/bash
# khoi-phuc-s16.sh <tệp sao lưu> — lùi bước 1: đặt lại dòng S16 ĐÚNG như trong bản sao lưu (không viết cứng giá trị), không in giá trị.
# Dùng UPDATE, không DELETE rồi INSERT: collection_units có khoá ngoại tới source_registry nên xoá dòng sẽ hỏng khi S16 đã có đơn vị thu.
# Chạy TRƯỚC lui-cot.sql (cần cột match_whole). DB_AP chỉ để chạy thử trên DB thử; mặc định DB máy thu.
set -euo pipefail
TEP="${1:?dùng: khoi-phuc-s16.sh <tệp sao lưu của sao-luu.sh>}"
DB="${DB_AP:-oneinvest}"
DONG=$(grep -E "^INSERT INTO public\.source_registry .* VALUES \('S16'," "$TEP" || true)
[ -n "$DONG" ] || { echo "bản sao lưu không có dòng S16 — dừng"; exit 2; }
[ "$(printf '%s\n' "$DONG" | wc -l | tr -d ' ')" = "1" ] || { echo "bản sao lưu có hơn một dòng S16 — dừng"; exit 2; }
{
  echo "BEGIN;"
  echo "CREATE TEMP TABLE s16_sao_luu (LIKE public.source_registry INCLUDING DEFAULTS) ON COMMIT DROP;"
  printf '%s\n' "$DONG" | sed 's/^INSERT INTO public\.source_registry /INSERT INTO s16_sao_luu /'
  echo "UPDATE public.source_registry s SET real_name = t.real_name, label_vi = t.label_vi, status = t.status, since = t.since,"
  echo "  retired_at = t.retired_at, source_ids = t.source_ids, note = t.note, reason = t.reason, resume_when = t.resume_when,"
  echo "  match_whole = false FROM s16_sao_luu t WHERE s.code = t.code AND s.code = 'S16';"
  echo "COMMIT;"
} | docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$DB" -v ON_ERROR_STOP=1 -q >/dev/null
echo "đã khôi phục dòng S16 từ bản sao lưu"
