#!/usr/bin/env bash
# ham-gan.sh — E1, E2, E3 (AC-1, AC-2, AC-3): ma trận hàm gắn xanh, rồi từng bản đột biến phải làm đỏ đúng ca của nó.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT/pipeline"
LIB=lib/ghep-tin-danh-muc.mjs
TEST=scripts/ghep-tin-danh-muc.test.mjs
TAM="lib/.dot-bien-ghep-$$.mjs"
trap 'rm -f "$TAM"' EXIT

echo "== Ma trận trên mã thật"
node --test "$TEST" >/tmp/ham-gan-$$.log 2>&1 || { cat /tmp/ham-gan-$$.log; echo "ĐỎ: ma trận không xanh trên mã thật"; exit 1; }
grep -E '^ℹ (tests|pass|fail) ' /tmp/ham-gan-$$.log

dot_bien() { # tên · ca phải đỏ · chuỗi gốc · chuỗi thay
  node -e '
    const fs = require("fs"); const [lib, ra, goc, thay] = process.argv.slice(1);
    const s = fs.readFileSync(lib, "utf8");
    if (!s.includes(goc)) { console.error("đột biến không tìm thấy chuỗi gốc: " + goc); process.exit(3); }
    fs.writeFileSync(ra, s.replace(goc, thay));' "$LIB" "$TAM" "$3" "$4"
  if GHEP_LIB="$PWD/$TAM" node --test "$TEST" >/tmp/ham-gan-$$.log 2>&1; then
    echo "ĐỎ: đột biến «$1» không làm ca nào đỏ"; exit 1
  fi
  grep -q "$2" /tmp/ham-gan-$$.log || { cat /tmp/ham-gan-$$.log; echo "ĐỎ: đột biến «$1» không làm đỏ ca «$2»"; exit 1; }
  echo "đột biến «$1» → ca «$2» đỏ"
}

echo "== Đột biến"
dot_bien chon-toa-dau-o-mo-ho "ô «cot-mo-ho»" 'if (a?.size > 1) return { muc: "mo_ho" };' 'if (a?.size > 1) return { muc: "toa", k: [...a][0], cach: "dung" };'
dot_bien bo-loc-du-an "mã S1.01 của tin dự án 16" 'const d = danhBaTheoDuAn.get(String(tin.du_an));' 'const d = danhBaTheoDuAn.has(String(tin.du_an)) ? [...danhBaTheoDuAn.values()][0] : undefined;'
dot_bien nhan-kien-thuc-nghe "ô «can-cu-kien-thuc-nghe-coi-nhu-chua-doc»" 'x.cc === "chu_bai" && ' ''
dot_bien bo-kiem-ten-trong-trich "ô «model-mot-minh-ten-ngoai-trich»" 'if (!coTenTrongTrich(x, k, d)) return { ly_do: "trich-khong-co-ten" };' ''
dot_bien bo-chan-nhieu-toa "ô «cot-khop-nhung-chu-neu-hai-toa»" 'if (luat.t.size > 1) return { ly_do: "chu-nhieu-toa" };' ''
dot_bien bo-chan-nhieu-can "ô «cot-khop-nhung-model-bao-nhieu-can»" 'if (banDoc?.multi_unit?.v === "yes") return { ly_do: "bai-nhieu-can" };' ''
rm -f /tmp/ham-gan-$$.log
echo "XANH: ma trận và sáu đột biến"
