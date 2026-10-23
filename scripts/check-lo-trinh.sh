#!/usr/bin/env bash
# check-lo-trinh.sh — thước đo hồ sơ lo-trinh-2310 (bật gói road-map + lộ trình máy đọc + quy định «một chỗ»).
#   static   : cấu hình, idempotent khởi tạo, trang khớp, răng phủ xanh, bản chép kit đúng, quy định có mặt
#   mutation : lộ trình hỏng từng kiểu → răng phủ đỏ (should-NOT-fire)
# Dùng: bash scripts/check-lo-trinh.sh static|mutation      (AG=<gốc gói acceptance-gate> để chọn bản kit)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AG="${AG:-$(ls -d "$HOME"/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/*/ 2>/dev/null | sort -V | tail -1)}"
AG="${AG%/}"
LT="docs/plan/lo-trinh.json"
SCOPES=(docs/plan/pham-vi-phan-loai-2310.md docs/plan/pham-vi-cam-mau-2310.md)
fail=0
ok()  { echo "ok   $*"; }
bad() { echo "FAIL $*"; fail=1; }

static() {
  cd "$ROOT" || exit 2
  # 1. settings.json: chỉ thêm road-map, mọi thứ khác giữ như nền
  base="$(git merge-base HEAD origin/main 2>/dev/null || echo origin/main)"
  if node -e '
    const fs=require("fs"),cp=require("child_process");
    const cur=JSON.parse(fs.readFileSync(".claude/settings.json","utf8"));
    const old=JSON.parse(cp.execSync("git show '"$base"':.claude/settings.json").toString());
    if(cur.enabledPlugins?.["road-map@acceptance-gate-kit"]!==true) process.exit(1);
    delete cur.enabledPlugins["road-map@acceptance-gate-kit"];
    process.exit(JSON.stringify(cur)===JSON.stringify(old)?0:2);'; then
    ok "settings.json: bật road-map@acceptance-gate-kit, quyền/hook/khác giữ nguyên như nền"
  else bad "settings.json: thiếu road-map hoặc đổi thứ khác ngoài enabledPlugins"; fi
  # 2. config
  if grep -qE '^lo_trinh:' _acceptance/config.yaml && grep -qE '^  tep: docs/plan/lo-trinh.json' _acceptance/config.yaml; then
    ok "config: lo_trinh.tep = $LT"; else bad "config: thiếu lo_trinh.tep"; fi
  if grep -qE '^\s+- "LO-TRINH.html"' _acceptance/config.yaml; then ok "config: LO-TRINH.html trong t1_skip_globs"
  else bad "config: LO-TRINH.html chưa miễn trừ T1"; fi
  # 3. khởi tạo chạy lại không đổi gì
  out="$(node "$AG/scripts/lo-trinh-khoi-tao.mjs" --root . 2>&1)"
  if echo "$out" | grep -q 'lộ trình đã sẵn — không đổi gì'; then ok "lo-trinh-khoi-tao chạy lại: không đổi gì"
  else bad "lo-trinh-khoi-tao còn việc: $out"; fi
  # 4. trang khớp
  pm="$(node scripts/product-map.mjs --check 2>&1)"; rc=$?
  if [ $rc -eq 0 ] && echo "$pm" | grep -q 'LO-TRINH.html khớp'; then ok "product-map --check: PRODUCT-MAP + LO-TRINH khớp"
  else bad "product-map --check: $pm"; fi
  # 5. răng phủ từng đợt
  for s in "${SCOPES[@]}"; do
    r="$(node "$AG/scripts/cat-luot.mjs" --root . --pham-vi "$s" --lo-trinh "$LT" 2>&1)"; rc=$?
    n="$(echo "$r" | grep -c ' → ')"
    if [ $rc -eq 0 ] && ! echo "$r" | grep -qE '^(lỗi|cảnh báo):'; then ok "răng phủ $(basename "$s"): xanh, $n mã, 0 lỗi, 0 cảnh báo"
    else bad "răng phủ $(basename "$s"): $(echo "$r" | grep -E '^(lỗi|cảnh báo):' | head -3)"; fi
  done
  # 6. bản chép kit đúng nguyên
  for f in scripts/lo-trinh.mjs scripts/ho-so-tom-tat.cjs scripts/gio-may.mjs lib/chan-lo-trinh.cjs; do
    if cmp -s "$f" "$AG/$f"; then :; else bad "bản chép khác kit: $f"; fi
  done
  [ $fail -eq 0 ] && ok "4 bản chép kit trùng byte với $(basename "$AG")"
  # 7. quy định «mỗi loại thông tin một chỗ»
  if sed -n '1,12p' AGENTS.md | grep -q 'docs/plan/lo-trinh.json' && grep -q 'Mỗi loại thông tin một chỗ' docs/ROADMAP.md \
     && grep -q 'Việc phát triển sắp làm + mốc\*\* | \*\*`docs/plan/lo-trinh.json`' docs/ROADMAP.md; then
    ok "quy định: AGENTS.md đầu tệp + ROADMAP §0 trỏ docs/plan/lo-trinh.json"
  else bad "quy định «một chỗ» thiếu ở AGENTS.md hoặc ROADMAP §0"; fi
  [ $fail -eq 0 ] && echo "LO-TRINH STATIC PASS" || { echo "LO-TRINH STATIC FAIL"; exit 1; }
}

mutation() {
  tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
  caught=0; total=0
  run_case() { # $1 tên, $2 đoạn node sửa j (lo-trinh)
    total=$((total+1)); d="$tmp/c$total"; mkdir -p "$d/docs/plan"
    cp "$ROOT/docs/plan/"*.md "$d/docs/plan/"
    node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));'"$2"';fs.writeFileSync(process.argv[2],JSON.stringify(j,null,2)+"\n")' \
      "$ROOT/$LT" "$d/$LT"
    (cd "$d" && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm t)
    red=0
    for s in "${SCOPES[@]}"; do
      node "$AG/scripts/cat-luot.mjs" --root "$d" --pham-vi "$s" --lo-trinh "$LT" >/dev/null 2>&1 || red=1
    done
    if [ $red -eq 1 ]; then caught=$((caught+1)); echo "ok   đỏ: $1"; else echo "FAIL không đỏ: $1"; fi
  }
  run_case "bỏ mã L19a khỏi PL1 (mã không có chỗ)" 'j.hang.find(r=>r.ma==="PL1").phu=[]'
  run_case "mã A1.2 nằm ở hai hàng" 'j.hang.find(r=>r.ma==="AU10").phu.push("A1.2")'
  run_case "việc nền AU1 mất bat_khi" 'delete j.hang.find(r=>r.ma==="AU1").bat_khi'
  run_case "PL7 câu giao không mở bằng vai" 'j.hang.find(r=>r.ma==="PL7").cau_giao="Màn gắn nhãn mù"'
  run_case "PL9 dùng dữ liệu giả mà không đứng trên hàng sinh" 'j.hang.find(r=>r.ma==="PL9").dung_tren=["PL7"]'
  run_case "AU9 cỡ 14 tiêu chí (phải tách)" 'j.hang.find(r=>r.ma==="AU9").tieu_chi=14'
  echo "bắt $caught/$total bản đột biến"
  [ "$caught" -eq "$total" ] && echo "LO-TRINH MUTATION PASS" || { echo "LO-TRINH MUTATION FAIL"; exit 1; }
}

case "${1:-}" in
  static) static ;;
  mutation) mutation ;;
  *) echo "dùng: $0 static|mutation" >&2; exit 4 ;;
esac
