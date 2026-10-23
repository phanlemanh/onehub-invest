#!/bin/bash
# check-cloud-url.sh — thước đo hồ sơ ops-ingest-url-onehub-invest.
#   static : code/config không còn trỏ project Vercel cũ; 3 chỗ trỏ prod mới.
#   mutation: bản sao 3 tệp quay về URL cũ → kiểm phải đỏ cả 3 (should-NOT-fire).
#   live   : /api/v1/ops/ingest trên prod mới — không token → 401; có token + payload rỗng → 400
#            (token khớp, route chặn trước khi ghi — KHÔNG ghi gì vào DB cloud).
set -uo pipefail
cd "$(dirname "$0")/.."
OLD="app-lilac-one-49.vercel.app"
NEW="https://onehub-invest.vercel.app"
FAIL=0
ok()  { echo "ok   $1"; }
bad() { echo "FAIL $1"; FAIL=1; }

# 3 chỗ trỏ cloud, đọc dưới thư mục gốc $1
check_files() {
  grep -q "process.env.INGEST_URL ?? \"$NEW/api/v1/ops/ingest\"" "$1/pipeline/push-ops-facts.mjs" \
    && ok "push-ops-facts: INGEST_URL mặc định = prod mới, env INGEST_URL vẫn đè được" \
    || bad "push-ops-facts: INGEST_URL mặc định sai"
  grep -q "^CLOUD=\"$NEW\"$" "$1/scripts/audit-all.sh" && ok "audit-all: CLOUD = prod mới" || bad "audit-all: CLOUD sai"
  node -e "const j=require(process.argv[1]); process.exit(j.cloud_base_url==='$NEW'?0:1)" "$(cd "$1" && pwd)/app/docs/api/mcp-tools.json" 2>/dev/null \
    && ok "mcp-tools.json: JSON hợp lệ, cloud_base_url = prod mới" || bad "mcp-tools.json: sai hoặc không phải JSON"
}

case "${1:-}" in
  static)
    # Chỉ ghi chú lịch sử trong docs/ và hồ sơ _acceptance/ được nhắc tên cũ.
    HITS=$(git ls-files -z | xargs -0 grep -l "$OLD" 2>/dev/null | grep -v '^docs/' | grep -v '^_acceptance/' | grep -v '^scripts/check-cloud-url.sh$')
    [ -z "$HITS" ] && ok "không tệp code/config nào còn trỏ $OLD" || bad "còn trỏ $OLD: $HITS"
    check_files .
    node --check pipeline/push-ops-facts.mjs && bash -n scripts/audit-all.sh \
      && ok "cú pháp push-ops-facts.mjs + audit-all.sh" || bad "lỗi cú pháp"
    ;;
  mutation)
    # should-NOT-fire: bản sao 3 tệp quay về URL cũ → cả 3 kiểm phải ĐỎ.
    TMP=$(mktemp -d); mkdir -p "$TMP/pipeline" "$TMP/scripts" "$TMP/app/docs/api"
    for f in pipeline/push-ops-facts.mjs scripts/audit-all.sh app/docs/api/mcp-tools.json; do
      sed "s#$NEW#https://$OLD#" "$f" > "$TMP/$f"
    done
    OUT=$(FAIL=0; check_files "$TMP"); rm -rf "$TMP"
    N=$(printf '%s\n' "$OUT" | grep -c '^FAIL')
    [ "$N" = "3" ] && ok "URL cũ bị bắt ở cả 3 tệp (3/3 đỏ)" || bad "chỉ bắt $N/3 tệp khi quay về URL cũ"
    ;;
  live)
    U="$NEW/api/v1/ops/ingest"
    T=$(grep '^CLOUD_OPS_API_TOKEN=' ~/.oneinvest/cloud.env 2>/dev/null | cut -d= -f2-)
    [ -n "$T" ] || { echo "FAIL thiếu CLOUD_OPS_API_TOKEN trong ~/.oneinvest/cloud.env"; exit 2; }
    C1=$(curl -s -o /dev/null -w "%{http_code}" -m 30 -X POST -H 'content-type: application/json' -d '{}' "$U")
    [ "$C1" = "401" ] && ok "không token → 401 (should-NOT-fire: không ai ngoài máy thu ghi được)" || bad "không token → $C1 (mong 401)"
    C2=$(curl -s -o /dev/null -w "%{http_code}" -m 30 -X POST -H "Authorization: Bearer $T" -H 'content-type: application/json' -d '{}' "$U")
    unset T
    [ "$C2" = "400" ] && ok "token cloud + payload rỗng → 400 (token khớp prod mới, không ghi)" || bad "token cloud + payload rỗng → $C2 (mong 400)"
    ;;
  *) echo "dùng: $0 static|mutation|live"; exit 2 ;;
esac

M=$(echo "$1" | tr a-z A-Z)
[ $FAIL -eq 0 ] && echo "CLOUD-URL $M PASS" || { echo "CLOUD-URL $M FAIL"; exit 1; }
