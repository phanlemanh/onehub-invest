#!/usr/bin/env bash
# lui-4c.sh <db-đích> <db-phụ> — DA56 hồ sơ áp, cách lùi 4c (lối cuối), sửa sau S4 vòng 2 (finding AC-10).
# Khôi phục DỮ LIỆU của phạm vi S09 trong hai bảng về đúng bản dump mục 1 (đã pg_restore vào <db-phụ>), trong MỘT giao dịch:
#   · airbnb_snapshots: chỉ dòng snapshot_id 'vn__s09-danh-ba__%' — xoá dòng không có trong dump (dây chuyền xoá stg của chính
#     các bản ấy), chèn lại dòng dump có mà đích mất. KHÔNG DROP, KHÔNG TRUNCATE, KHÔNG đụng dòng nguồn khác: 14 bảng stg trỏ
#     khoá ngoại ON DELETE CASCADE tới bảng này, nên --clean hay xoá cả bảng là xoá dây chuyền mọi nguồn.
#   · stg_s09_danh_ba: thay trọn bằng nội dung dump (không bảng nào trỏ khoá ngoại tới nó; ba view của 130 đã bỏ ở 4a hoặc vẫn
#     đứng — DELETE/INSERT không vướng view).
# Cuối giao dịch so dấu (số dòng + md5 từng dòng theo khoá) của đích với bản dump; lệch → RAISE, giao dịch lùi trọn, thoát ≠ 0.
# Chỉ in số đếm và md5, không in giá trị. Xoá dữ liệu trên DB máy thu → cần lời riêng của Mạnh như 4b.
set -euo pipefail
[ $# -eq 2 ] || { echo "dùng: lui-4c.sh <db-đích> <db-phụ>" >&2; exit 2; }
D=$1; X=$2
ps(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$1" -v ON_ERROR_STOP=1 -q "${@:2}"; }
S09="snapshot_id LIKE 'vn\\_\\_s09-danh-ba\\_\\_%'"
dau(){ # $1 bảng snapshot, $2 bảng stg
  echo "(SELECT count(*) || ':' || coalesce(md5(string_agg(a::text, '|' ORDER BY a.snapshot_id)), '') FROM $1 a WHERE a.$S09)
    || ' ' || (SELECT count(*) || ':' || coalesce(md5(string_agg(s::text, '|' ORDER BY s.snapshot_id, s.dong)), '') FROM $2 s)"
}
echo "lui-4c: dấu dump   $(ps "$X" -Atc "SELECT $(dau airbnb_snapshots stg_s09_danh_ba)")"
echo "lui-4c: dấu đích trước $(ps "$D" -Atc "SELECT $(dau airbnb_snapshots stg_s09_danh_ba)")"
{
  cat <<SQL
BEGIN;
CREATE TEMP TABLE t_snap (LIKE airbnb_snapshots) ON COMMIT DROP;
CREATE TEMP TABLE t_stg (LIKE stg_s09_danh_ba) ON COMMIT DROP;
COPY t_snap FROM STDIN;
SQL
  ps "$X" -c "COPY (SELECT * FROM airbnb_snapshots WHERE $S09) TO STDOUT"
  printf '\\.\nCOPY t_stg FROM STDIN;\n'
  ps "$X" -c "COPY stg_s09_danh_ba TO STDOUT"
  printf '\\.\n'
  cat <<SQL
DELETE FROM airbnb_snapshots a WHERE a.$S09 AND NOT EXISTS (SELECT 1 FROM t_snap t WHERE t.snapshot_id = a.snapshot_id);
INSERT INTO airbnb_snapshots SELECT * FROM t_snap ON CONFLICT (snapshot_id) DO NOTHING;
DELETE FROM stg_s09_danh_ba;
INSERT INTO stg_s09_danh_ba SELECT * FROM t_stg;
DO \$\$ BEGIN
  IF ($(dau airbnb_snapshots stg_s09_danh_ba)) IS DISTINCT FROM ($(dau t_snap t_stg)) THEN
    RAISE EXCEPTION 'lui-4c: dấu đích lệch bản dump sau khôi phục — giao dịch lùi trọn';
  END IF;
END \$\$;
COMMIT;
SQL
} | ps "$D"
echo "lui-4c: dấu đích sau  $(ps "$D" -Atc "SELECT $(dau airbnb_snapshots stg_s09_danh_ba)")"
