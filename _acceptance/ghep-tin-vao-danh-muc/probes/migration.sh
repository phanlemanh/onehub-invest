#!/usr/bin/env bash
# migration.sh — E4 (AC-4): khuôn phát biểu của migration 117 trên DB thử áp 113 → 118 → 117, rồi từng bản đột biến phải làm đỏ đúng ca.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
MIG=db/migrations/117_ghep_toa_tren_tin.sql
TEST=pipeline/tests/ghep-tin-danh-muc-117.itest.mjs
TAM="$(mktemp -d)"; trap 'rm -rf "$TAM"' EXIT
chay() { bash db/db-thu.sh oneinvest_suite_pl20_mig --chay node --test "$TEST" >"$TAM/log" 2>&1; }

echo "== Mã thật"
chay || { cat "$TAM/log"; echo "ĐỎ: itest 117 không xanh trên mã thật"; exit 1; }
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
dot_bien nhan-gia-tri-la "tu-choi-gia-tri-khong-phai-upi" "SELECT 1 FROM buildings b WHERE b.upi = NEW.value AND b.status = 'active') THEN" "SELECT 1) AND false THEN"
dot_bien nhan-toa-ngung-hoat-dong "tu-choi-upi-cua-toa-ngung-hoat-dong" "b.upi = NEW.value AND b.status = 'active'" "b.upi = NEW.value"
dot_bien nhan-resource-can "tu-choi-truong-tren-resource-can" "IF NEW.field = 'universal_property_id' AND NEW.resource_name <> 'Property' THEN" "IF false THEN"
dot_bien mat-truong-113 "bon-truong-cua-113-van-ghi-duoc" "'living_area', 'building_area_total', 'direction_faces', 'lot_size_area', 'universal_property_id'));" "'universal_property_id'));"
echo "XANH: itest 117 và bốn đột biến"
