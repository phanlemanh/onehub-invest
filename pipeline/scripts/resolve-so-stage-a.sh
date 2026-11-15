#!/usr/bin/env bash
# resolve-so-stage-a.sh — hàng resolve-stage-a-theo-tap: dựng bản chép DB máy thu (db/db-thu.sh, chỉ đọc oneinvest),
# rồi so Stage A cũ ↔ mới (resolve-so-stage-a.mjs). Xoá DB thử khi xong.
#   bash pipeline/scripts/resolve-so-stage-a.sh so [--mau K] [--pha]   so tập; --mau K giữ list_id % K = 0 (bản cũ chạy hàng giờ trên đủ dữ liệu)
#   bash pipeline/scripts/resolve-so-stage-a.sh gio [--tran-giay N]    chỉ bản mới trên bản chép đủ dữ liệu: trần giây + lần 2
# --truoc <mốc>: trước khi so, xoá căn và link tạo từ mốc trở đi (mặc định lượt đêm 14/11 22:30Z) — đưa bản chép về trạng
#   thái trước lượt đêm để đường chèn căn và link thật sự chạy (gap-probe P1); --truoc '' để giữ nguyên.
# --toi-thieu-link N: thoát 1 khi bản mới chèn ít hơn N link (mặc định 1; gio dùng 1000).
# --pha: sau khi dựng, bản «mới» chạy với một offer_id bị gắn sẵn sai căn → bộ so phải đỏ (chiều đỏ của E1).
set -euo pipefail
GOC="$(cd "$(dirname "$0")/../.." && pwd)"
CHE="${1:?so|gio}"; shift
MAU=""; PHA=0; TRAN=300; TRUOC="2026-11-14 22:30:00+00"; TOI=""
# Bản cũ ghim ở mốc nhánh d2b4beaf (Stage A vòng mỗi cụm), không ở origin/main: sau khi hàng gộp, origin/main là chính bản
# theo tập và phép so sẽ thành so bản mới với chính nó. --rev để đổi mốc.
REV=d2b4beaf
while [ $# -gt 0 ]; do case "$1" in --mau) MAU="$2"; shift 2;; --pha) PHA=1; shift;; --tran-giay) TRAN="$2"; shift 2;; --truoc) TRUOC="$2"; shift 2;; --toi-thieu-link) TOI="$2"; shift 2;; --rev) REV="$2"; shift 2;; *) echo "lạ: $1"; exit 2;; esac; done
P=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -q -At -v ON_ERROR_STOP=1)
CU=oneinvest_suite_rsa_cu_$$; MOI=oneinvest_suite_rsa_moi_$$
don() { for t in "$CU" "$MOI"; do "${P[@]}" -d postgres -c "DROP DATABASE IF EXISTS $t WITH (FORCE)" >/dev/null 2>&1 || true; done; }
trap don EXIT
bash "$GOC/db/db-thu.sh" "$CU" >/dev/null
[ -n "$MAU" ] && "${P[@]}" -d "$CU" -c "DELETE FROM stg_chotot_ads WHERE list_id % $MAU <> 0"
if [ -n "$TRUOC" ]; then
  # chỉ trên DB thử: property_offers có FK ON DELETE CASCADE tới properties
  "${P[@]}" -d "$CU" -c "DELETE FROM property_offers WHERE linked_at >= '$TRUOC'" -c "DELETE FROM properties WHERE created_at >= '$TRUOC'"
fi
"${P[@]}" -d postgres -c "CREATE DATABASE $MOI TEMPLATE $CU"
cd "$GOC/pipeline"
if [ "$CHE" = gio ]; then
  node scripts/resolve-so-stage-a.mjs --moi "$MOI" --chi-moi --tran-giay "$TRAN" --toi-thieu-link "${TOI:-1000}"
else
  if [ "$PHA" = 1 ]; then
    # gắn trước MỘT tin chưa gắn, NẰM NGOÀI tập Stage A (không còn dòng stg sau --mau), vào căn id nhỏ nhất ở bản «mới» —
    # Stage A không đụng tin đó nên hai bên lệch nhau đúng một link, không lan sang tập căn; ORDER BY cho tất định.
    "${P[@]}" -d "$MOI" -c "INSERT INTO property_offers (property_id, offer_id, score, signals)
      SELECT (SELECT min(id) FROM properties), o.offer_id, 1.0, '{}'::jsonb FROM sale_offers o
      WHERE o.source='S06' AND NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id=o.offer_id)
        AND o.offer_id NOT IN (SELECT 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
                               FROM stg_chotot_ads s)
      ORDER BY o.offer_id LIMIT 1"
  fi
  node scripts/resolve-so-stage-a.mjs --cu "$CU" --moi "$MOI" --rev "$REV" --toi-thieu-link "${TOI:-1}"
fi
