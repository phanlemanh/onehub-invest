#!/usr/bin/env bash
# chay-thu-lui.sh — DA3: chạy thử cách lùi (hồ sơ áp mục 4) trên DB THỬ chép từ DB máy thu (db/db-thu.sh), KHÔNG chạm `oneinvest`.
# Chụp trạng thái → dựng thẻ, áp S07, S10, S16 bằng CLI (giữ rule_id lệnh in ra) → đảo đúng danh sách rule_id ấy → so với trước áp.
# Thoát 1 ở kiểm đầu tiên sai. Chạy từ gốc worktree, dưới khoá s4: bash _acceptance/bang-noi-ma-du-an/lui/chay-thu-lui.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
T=oneinvest_p4_da3_lui
[ "$T" != oneinvest ] || exit 2
export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$T"
Q(){ docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$T" -Atc "$1"; }
RA="$ROOT/.acceptance-runs/bang-noi-ma-du-an/lui"; mkdir -p "$RA"
trap 'bash "$ROOT/db/db-thu.sh" "$T" --xoa >/dev/null 2>&1 || true' EXIT
hong(){ echo "LUI DO: $*"; exit 1; }
# Trạng thái so sánh: số dòng bốn bảng, băm dòng S08/S09 của project_links, băm asset_nodes, băm bí danh còn hiệu lực, dòng nối DA3.
trang_thai(){
  Q "SELECT (SELECT count(*) FROM project_links)||' '||(SELECT count(*) FROM project_link_rules)||' '||(SELECT count(*) FROM registry_aliases)||' '||(SELECT count(*) FROM asset_nodes)"
  Q "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM (SELECT * FROM project_links WHERE source IN ('S08','S09')) t"
  Q "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM (SELECT id, node_type, name, slug, parent_id, aliases, area_ids, meta, catalog_tier FROM asset_nodes) t"
  Q "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM (SELECT object_key, kind, value, source FROM registry_aliases WHERE retired_at IS NULL) t"
  Q "SELECT count(*) FROM project_links WHERE source IN ('S07','S10','S16') AND status = 'noi'"
}

echo "== dựng $T ($(date -u +%H:%M:%SZ))"; bash "$ROOT/db/db-thu.sh" "$T"
TRUOC="$(trang_thai)"; echo "trước:"; echo "$TRUOC"
cd "$ROOT/pipeline"
LUAT=()
for n in S07 S10 S16; do
  dong="$(node noi-du-an-nguon.mjs --nguon "$n" --the "$RA/the-$n.md")"; echo "$dong"
  bam="$(echo "$dong" | grep -oE 'băm [0-9a-f]{64}' | cut -d' ' -f2)"; [ -n "$bam" ] || hong "không đọc được băm thẻ $n"
  ap="$(node noi-du-an-nguon.mjs --ap --nguon "$n" --bam "$bam" --nguoi chay-thu-lui)"; echo "$ap"
  for id in $(echo "$ap" | grep -oE '#[0-9]+' | tr -d '#'); do LUAT+=("$id"); done
done
[ "${#LUAT[@]}" -gt 0 ] || hong "lệnh áp không in rule_id nào"
echo "luật của lượt: ${LUAT[*]}"
SAU_AP="$(trang_thai)"; echo "sau áp:"; echo "$SAU_AP"
NOI_SAU="$(echo "$SAU_AP" | sed -n 5p)"; [ "$NOI_SAU" -gt 0 ] || hong "áp không ghi dòng nối nào"
for id in "${LUAT[@]}"; do node noi-du-an-nguon.mjs --dao "$id" --nguoi chay-thu-lui; done
SAU="$(trang_thai)"; echo "sau đảo:"; echo "$SAU"
echo "== kiểm mục 4"
[ "$(echo "$SAU" | sed -n 5p)" = 0 ] || hong "còn dòng noi S07, S10, S16 sau đảo"
[ "$(echo "$SAU" | sed -n 4p)" = "$(echo "$TRUOC" | sed -n 4p)" ] || hong "bí danh còn hiệu lực khác trước áp"
[ "$(echo "$SAU" | sed -n 3p)" = "$(echo "$TRUOC" | sed -n 3p)" ] || hong "asset_nodes đổi"
[ "$(echo "$SAU" | sed -n 2p)" = "$(echo "$TRUOC" | sed -n 2p)" ] || hong "dòng project_links S08, S09 đổi"
read -r a b c d <<<"$(echo "$TRUOC" | sed -n 1p)"; read -r e f g h <<<"$(echo "$SAU" | sed -n 1p)"
[ "$e" -ge "$a" ] && [ "$f" -ge "$b" ] && [ "$g" -ge "$c" ] && [ "$h" = "$d" ] || hong "số dòng giảm (lùi không được xoá dòng)"
DAO="$(Q "SELECT count(*) FROM project_link_rules WHERE id IN ($(IFS=,; echo "${LUAT[*]}")) AND dao_at IS NOT NULL AND dao_by = 'chay-thu-lui'")"
[ "$DAO" = "${#LUAT[@]}" ] || hong "chỉ $DAO/${#LUAT[@]} luật có dấu đảo"
echo "LUI XANH ($(date -u +%H:%M:%SZ)): ${#LUAT[@]} luật đảo, $NOI_SAU dòng nối về chua_noi, bí danh còn hiệu lực và dòng S08/S09 như trước áp"
