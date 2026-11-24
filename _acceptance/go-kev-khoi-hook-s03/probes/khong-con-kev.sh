#!/bin/bash
# khong-con-kev.sh — KEV1 (go-kev-khoi-hook-s03) AC-5, AC-6, AC-8: chốt TĨNH rằng phần làn thu không còn canh/gọi/cài cổng
# chấm nhãn Kev :8009. Chỉ đọc tệp trong cây; không chạy watchdog (watchdog thật có thể tắt gateway — luật 8), không mạng.
#   bash khong-con-kev.sh <ROOT>            → kiểm cây ROOT; in «KHONG-CON-KEV PASS» hoặc từng dòng FAIL <mốc>, thoát 1
#   bash khong-con-kev.sh --tu-thu <ROOT>   → chép các tệp đo sang thư mục tạm, phá từng mốc, đòi probe ĐỎ đúng thông điệp
set -uo pipefail
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"

kiem() {
  local R="$1" F=0
  local W="$R/scripts/zalo-watchdog.sh"
  # [watchdog] — L5: khối canh :8009 gỡ, nhịp ghi kev:off (K1), cú pháp còn chạy được
  bash -n "$W" 2>/dev/null || { echo "FAIL watchdog-cu-phap: bash -n scripts/zalo-watchdog.sh lỗi"; F=1; }
  if grep -nE '8009|Kev gate|kev:DOWN' "$W" >/dev/null; then
    echo "FAIL watchdog-con-canh-kev: $(grep -nE '8009|Kev gate|kev:DOWN' "$W" | head -1 | cut -c1-120)"; F=1
  fi
  grep -q '^KEV_NOTE="kev:off (K1)"$' "$W" || { echo "FAIL watchdog-thieu-nhip-kev-off: không có KEV_NOTE=\"kev:off (K1)\""; F=1; }
  grep -qE '^echo .*ok — .*\$KEV_NOTE' "$W" || { echo "FAIL watchdog-nhip-ok-mat-kev-note: dòng nhịp «ok —» không còn \$KEV_NOTE"; F=1; }
  # [plist] — cổng chấm không còn được cài từ kho
  [ ! -e "$R/pipeline/cron/com.oneinvest.kev-gate.plist" ] || { echo "FAIL plist-kev-gate-con: pipeline/cron/com.oneinvest.kev-gate.plist còn"; F=1; }
  if grep -lE '8009|kev-serve|kev-gate' "$R"/pipeline/cron/*.plist >/dev/null 2>&1; then
    echo "FAIL plist-tro-kev: $(grep -lE '8009|kev-serve|kev-gate' "$R"/pipeline/cron/*.plist | head -1 | sed "s|$R/||")"; F=1
  fi
  # [hook] — mã hook không còn đường tới cổng chấm
  if grep -nE 'ONEINVEST_KEV_URL|8009|kevScore|/v1/systemone' "$R/collector/openclaw/handler.js" >/dev/null; then
    echo "FAIL hook-con-goi-kev: $(grep -nE 'ONEINVEST_KEV_URL|8009|kevScore|/v1/systemone' "$R/collector/openclaw/handler.js" | head -1 | cut -c1-120)"; F=1
  fi
  # [tai-lieu] — HOOK.md, README hook, runtime-map không còn mô tả hook đi qua Kev
  local d
  for d in collector/openclaw/HOOK.md collector/openclaw/README.md docs/ops/runtime-map.md; do
    if grep -nE '→ Kev|Kev gate :8009|Kev :8009|chấm decision model Kev' "$R/$d" >/dev/null; then
      echo "FAIL tai-lieu-con-kev: $d: $(grep -nE '→ Kev|Kev gate :8009|Kev :8009|chấm decision model Kev' "$R/$d" | head -1 | cut -c1-100)"; F=1
    fi
  done
  [ $F = 0 ] && echo "KHONG-CON-KEV PASS"
  return $F
}

tu_thu() {
  local R="$1" T F=0 out
  T=$(mktemp -d "${TMPDIR:-/tmp}/kev1-tu-thu.XXXXXX") || exit 2
  trap 'rm -rf "$T"' RETURN
  moi() { rm -rf "$T/r"; mkdir -p "$T/r/scripts" "$T/r/pipeline/cron" "$T/r/collector/openclaw" "$T/r/docs/ops"
    cp "$R/scripts/zalo-watchdog.sh" "$T/r/scripts/"; cp "$R"/pipeline/cron/*.plist "$T/r/pipeline/cron/"
    cp "$R"/collector/openclaw/{handler.js,HOOK.md,README.md} "$T/r/collector/openclaw/"; cp "$R/docs/ops/runtime-map.md" "$T/r/docs/ops/"; }
  ca() { # <tên> <mốc mong đỏ> <lệnh phá>
    moi; bash -c "$3" _ "$T/r"; out=$(bash "$SELF" "$T/r"); local rc=$?
    if [ $rc = 1 ] && grep -q "^FAIL $2" <<<"$out"; then echo "PASS phá $1 → FAIL $2"; else echo "FAIL tu-thu $1: mong đỏ «$2», được mã $rc «$(head -1 <<<"$out")»"; F=1; fi; }
  moi; out=$(bash "$SELF" "$T/r"); [ $? = 0 ] && echo "PASS đối chứng: bản chép lành → $out" || { echo "FAIL tu-thu đối chứng: bản chép lành đỏ «$out»"; F=1; }
  ca chen-probe-8009 watchdog-con-canh-kev 'printf "%s\n" "KEV_OK=\$(curl -s -o /dev/null -w \"%{http_code}\" --max-time 3 http://127.0.0.1:8009/v1/models)" >> "$1/scripts/zalo-watchdog.sh"'
  ca bo-kev-note watchdog-thieu-nhip-kev-off 'sed -i "" "s/^KEV_NOTE=\"kev:off (K1)\"$/KEV_NOTE=\"kev:ok\"/" "$1/scripts/zalo-watchdog.sh"'
  ca nhip-mat-note watchdog-nhip-ok-mat-kev-note 'sed -i "" "s/, \$KEV_NOTE,/,/" "$1/scripts/zalo-watchdog.sh"'
  ca vo-cu-phap watchdog-cu-phap 'printf "if then\n" >> "$1/scripts/zalo-watchdog.sh"'
  ca tra-plist plist-kev-gate-con 'printf "<plist/>\n" > "$1/pipeline/cron/com.oneinvest.kev-gate.plist"'
  ca plist-khac-tro plist-tro-kev 'printf "<string>http://127.0.0.1:8009</string>\n" > "$1/pipeline/cron/com.oneinvest.x.plist"'
  ca hook-goi-lai hook-con-goi-kev 'printf "%s\n" "const KEV = process.env.ONEINVEST_KEV_URL ?? \"http://127.0.0.1:8009\";" >> "$1/collector/openclaw/handler.js"'
  ca doc-tra-kev tai-lieu-con-kev 'printf "%s\n" "→ processMessage → internal hook → Kev → :9210" >> "$1/docs/ops/runtime-map.md"'
  [ $F = 0 ] && echo "KHONG-CON-KEV TU-THU PASS"
  return $F
}

if [ "${1:-}" = "--tu-thu" ]; then tu_thu "${2:?thiếu ROOT}"; else kiem "${1:?thiếu ROOT}"; fi
