#!/bin/bash
# khoi-phuc-s16.sh <tệp sao lưu> — lùi bước 1: đặt lại dòng S16 ĐÚNG như trong bản sao lưu (không viết cứng giá trị).
set -euo pipefail
TEP="${1:?dùng: khoi-phuc-s16.sh <tệp sao lưu của sao-luu.sh>}"
DONG=$(grep "^INSERT INTO public.source_registry" "$TEP" | grep "'S16'" || true)
[ -n "$DONG" ] || { echo "bản sao lưu không có dòng S16 — dừng"; exit 2; }
{ echo "BEGIN;"; echo "DELETE FROM source_registry WHERE code = 'S16';"; echo "$DONG"; echo "COMMIT;"; } \
  | docker exec -i one-invest-db psql -U oneinvest -d oneinvest -v ON_ERROR_STOP=1 -q
echo "đã khôi phục dòng S16 từ $TEP"
