#!/bin/bash
# db-thu-chac.sh — dựng DB thử bằng db/db-thu.sh rồi KIỂM đủ: db-thu.sh chạy `pg_dump | psql` không pipefail, nên khi
# pg_dump gãy giữa chừng (phiên khác đang tạo/xoá schema tạm trên :5433 — «cache lookup failed», «schema … does not
# exist») DB thử vẫn được báo dựng xong mà thiếu bảng (S4 r1 của hồ sơ này). Ở đây: số bảng/view của schema public
# trong DB thử phải bằng máy thu, và đủ các bảng phép đo đọc; không thì dựng lại, tối đa 4 lần, rồi thoát 3 có tên.
#   bash db-thu-chac.sh <tên>        (xoá: bash db/db-thu.sh <tên> --xoa)
set -uo pipefail
TEN="${1:?thiếu tên DB thử}"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
DX=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -At -v ON_ERROR_STOP=1)
DEM="SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r','v','m','p')"
CAN="SELECT count(*) FROM unnest(ARRAY['sale_offer_records','registry_aliases','parties','party_roles','sellers','properties','stg_zalo_posts','ref_lookup']) t WHERE to_regclass('public.'||t) IS NULL"
ERR=$(mktemp)
for lan in 1 2 3 4; do
  bash db/db-thu.sh "$TEN" >/dev/null 2>"$ERR"
  goc=$("${DX[@]}" -d oneinvest -c "$DEM" 2>/dev/null)
  thu=$("${DX[@]}" -d "$TEN" -c "$DEM" 2>/dev/null)
  thieu=$("${DX[@]}" -d "$TEN" -c "$CAN" 2>/dev/null)
  if [ -n "$thu" ] && [ "$thu" = "$goc" ] && [ "$thieu" = "0" ]; then
    rm -f "$ERR"; echo "db-thu-chac: $TEN đủ ($thu bảng/view public, lần $lan)" >&2; exit 0
  fi
  echo "db-thu-chac: lần $lan thiếu (public $thu/$goc, thiếu bảng đọc ${thieu:-?}): $(grep -m1 -i error "$ERR")" >&2
  sleep $((lan * 5))
done
rm -f "$ERR"
echo "DB THU KHONG DU: $TEN sau 4 lần" >&2
exit 3
