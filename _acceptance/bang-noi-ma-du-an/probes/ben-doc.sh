#!/usr/bin/env bash
# E7 (AC-7): đầu ra các bên đọc bằng nhau trước áp, sau áp, sau đảo.
#   Phần 1 (một giao dịch ROLLBACK trên bản chép): năm view, napS16TheoKhu và bản đồ bí danh toà S09, S08 bằng SQL của probe.
#   Phần 2 (bên đọc THẬT, finding vòng 1): dung() của danh-ba-vat-the.mjs, gọi luôn buocS09DanhBa của lib/s09-dung.mjs, chạy trên bản
#   chép DB máy thu dùng một lần cho từng mốc. Lệnh dựng vật thể tự COMMIT nên không bọc được trong giao dịch lùi. Ba bản tóm tắt
#   phải bằng nhau. Chiều đỏ: ở mốc áp, cho nghỉ một bí danh toà S09 mà buocS09DanhBa đọc thì tóm tắt khác mốc trước.
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
chay_db e7 pipeline node scripts/noi-du-an-nguon-that.mjs ben-doc
LOG="$(mktemp -t da3-e7)"; trap 'rm -f "$LOG"' EXIT
if chay_db e7do pipeline node scripts/noi-du-an-nguon-that.mjs ben-doc --cay-do >"$LOG" 2>&1; then
  cat "$LOG"; echo "ĐỎ: cấy bí danh S09 dạng toà mà phép so bản đồ bí danh không đỏ"; exit 1
fi
grep -q 'LỆCH bên đọc bi-danh-toa-S09 (SQL)' "$LOG" || { tail -20 "$LOG"; echo "ĐỎ: chiều đỏ không gọi tên bản đồ bí danh toà S09"; exit 1; }
echo "chiều đỏ phần 1: cấy bí danh S09 dạng toà → phép so bản đồ bí danh toà S09 đỏ"

# Phần 2: bên đọc thật trên bản chép riêng từng mốc.
tom_tat() { # tom_tat <mốc> [--cay-do] → in dòng JSON tóm tắt của dung()
  local moc="$1"; shift
  local t="oneinvest_suite_da3_e7_${moc}_$$" ra
  bash "$DB_THU" "$t" >/dev/null
  ra="$(cd "$ROOT/pipeline" && DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$t" \
    node scripts/noi-du-an-nguon-that.mjs ben-doc-that --moc "$moc" "$@" 2>&1)" || { bash "$DB_THU" "$t" --xoa >/dev/null 2>&1; echo "$ra" >&2; return 1; }
  bash "$DB_THU" "$t" --xoa >/dev/null 2>&1 || true
  echo "$ra" | grep '^TOM_TAT ' | head -1
}
T0="$(tom_tat truoc)" || { echo "ĐỎ: bên đọc thật lỗi ở mốc trước áp"; exit 1; }
T1="$(tom_tat ap)" || { echo "ĐỎ: bên đọc thật lỗi ở mốc sau áp"; exit 1; }
T2="$(tom_tat dao)" || { echo "ĐỎ: bên đọc thật lỗi ở mốc sau đảo"; exit 1; }
[ -n "$T0" ] || { echo "ĐỎ: không đọc được tóm tắt dung()"; exit 1; }
echo "dung() trước áp: ${T0#TOM_TAT }"
[ "$T1" = "$T0" ] || { echo "sau áp: ${T1#TOM_TAT }"; echo "LỆCH bên đọc danh-ba-vat-the + s09-dung (dung thật) sau áp"; exit 1; }
[ "$T2" = "$T0" ] || { echo "sau đảo: ${T2#TOM_TAT }"; echo "LỆCH bên đọc danh-ba-vat-the + s09-dung (dung thật) sau đảo"; exit 1; }
echo "bằng danh-ba-vat-the + s09-dung (dung thật) ở ba mốc"
TD="$(tom_tat ap --cay-do)" || { echo "ĐỎ: bên đọc thật lỗi ở mốc chiều đỏ"; exit 1; }
[ "$TD" != "$T0" ] || { echo "ĐỎ: cho nghỉ một bí danh toà S09 mà tóm tắt dung() không đổi — phép so bên đọc thật không phân biệt"; exit 1; }
echo "chiều đỏ phần 2: cho nghỉ một bí danh toà S09 → tóm tắt dung() khác mốc trước"
