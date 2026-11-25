#!/usr/bin/env bash
# xung-dot.sh — E5 (AC-5): năm ô của view offer_building trên DB thử, rồi từng bản đột biến phải làm đỏ đúng ca.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
MIG=db/migrations/117_ghep_toa_tren_tin.sql
TEST=pipeline/tests/ghep-tin-danh-muc-117.itest.mjs
TAM="$(mktemp -d)"; trap 'rm -rf "$TAM"' EXIT
chay() { bash db/db-thu.sh oneinvest_suite_pl20_xd --chay node --test --test-name-pattern='^view' "$TEST" >"$TAM/log" 2>&1; }

echo "== Mã thật"
chay || { cat "$TAM/log"; echo "ĐỎ: năm ô của view không xanh trên mã thật"; exit 1; }
grep -E '^ℹ (tests|pass|fail) ' "$TAM/log"

dot_bien() { # tên · ca phải đỏ · chuỗi gốc · chuỗi thay
  node -e '
    const fs = require("fs"); const [mig, ra, goc, thay] = process.argv.slice(1);
    const s = fs.readFileSync(mig, "utf8");
    if (!s.includes(goc)) { console.error("đột biến không tìm thấy chuỗi gốc: " + goc); process.exit(3); }
    fs.writeFileSync(ra, s.replace(goc, thay));' "$MIG" "$TAM/dot.sql" "$3" "$4"
  if GHEP_MIG_117="$TAM/dot.sql" chay; then echo "ĐỎ: đột biến «$1» không làm ca nào đỏ"; exit 1; fi
  grep -q "$2" "$TAM/log" || { cat "$TAM/log"; echo "ĐỎ: đột biến «$1» không làm đỏ ca «$2»"; exit 1; }
  echo "đột biến «$1» → ca «$2» đỏ"
}

echo "== Đột biến"
dot_bien hai-toa-van-gan "hai-toa-khac-nhau" "COALESCE(cardinality(g.upis) = 1 AND" "COALESCE(cardinality(g.upis) >= 1 AND"
dot_bien bo-kiem-vung-chua-toa "toa-va-vung-khong-chua-no" "(g.vungs IS NULL OR COALESCE(g.vungs <@ c.ds, false))" "true"
dot_bien hai-vung-roi-van-gan "hai-vung-khong-long-nhau" "WHERE g.vungs <@ c.ds" "WHERE true"
dot_bien nhan-moi-rule-id "view-bo-qua-rule-id-khac" "AND f.rule_id IN ('ghep-toa-cot', 'ghep-toa-cot-chuan', 'ghep-toa-chu-model', 'ghep-toa-model')" ""
dot_bien nhan-toa-ngung "view-bo-qua-toa-da-ngung-hoat-dong" "AND (f.field <> 'universal_property_id' OR b.status = 'active')" ""
echo "XANH: năm ô và năm đột biến"
