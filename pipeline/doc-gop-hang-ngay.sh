#!/bin/bash
# doc-gop-hang-ngay.sh — PL34 `doc-gop-hang-ngay`: bước đêm đọc gộp S03 cho HÔM QUA rồi HÔM KIA (giờ VN). Hôm kia để vớt bài thu
# muộn (posted_at hôm kia, captured_at hôm qua); bài đã đọc không gọi lại nên bước vớt rẻ. Trần tính theo ngày chi nên hai bước
# chia chung một trần. Gắn vào lịch (plist / chuỗi đêm) là làn ZCode: chạy SAU job S03 đêm, TRƯỚC bước mau-soat của DO1.
#   bash pipeline/doc-gop-hang-ngay.sh
# Biến: DOC_GOP_TRAN_NGAY_USD (mặc định 20) · DOC_GOP_BAY_GIO (ISO, mặc định bây giờ — để test) · DOC_GOP_NODE (lệnh node,
# mặc định node — để test). Mỗi bước hỏng in `JOB FAIL [doc-gop-hang-ngay] bước <nhãn> mã <n>`; tệp thoát bằng mã hỏng đầu tiên
# (0 xong · 1 = mọi lời gọi hỏng hoặc khoá sai · 2 = đầu vào sai · 3 = chạm trần · 4 = hết tiền · 5 = thiếu khoá). Bước kia vẫn
# chạy — trừ khi bước hôm qua thoát 4 (hết tiền) hay 5 (thiếu khoá) (goi-thang-anthropic): bước hôm kia chắc chắn cũng hỏng nên
# bỏ, thoát ngay bằng mã đó, dòng `JOB FAIL [doc-gop-hang-ngay] het-tien|thieu-khoa: bo buoc hom-kia`.
# HT6 doc-gop-song-song-va-luot-bu: DOC_GOP_SONG_SONG (mặc định 4) lời model cùng lúc; DOC_GOP_TRAN_GIAY (mặc định 9000) giây cho CẢ
# HAI bước — một mốc hết giờ tính một lần, truyền cho node qua DOC_GOP_HET_GIO. Hết giờ: node thoát 75 («dừng đúng hẹn, đi tiếp» —
# thống nhất với ZCode qua LL: zalo-import-daily.sh coi 75 là đi tiếp). Bước hôm qua hết giờ thì bỏ hôm kia, dòng
# `JOB WARN [doc-gop-hang-ngay] het-gio: bo buoc hom-kia <ngày> con lai <n>` (n đếm bằng --thu, không gọi model), tệp thoát 75.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="$HOME/.local/node-v24.21.0/bin"
export PATH="$NODE_BIN:$PATH"
NODE="${DOC_GOP_NODE:-node}"
TRAN="${DOC_GOP_TRAN_NGAY_USD:-20}"
export DOC_GOP_SONG_SONG="${DOC_GOP_SONG_SONG:-4}"
TRAN_GIAY="${DOC_GOP_TRAN_GIAY:-9000}"

# Ngày giờ VN lùi n ngày từ DOC_GOP_BAY_GIO (hay bây giờ). Dùng node để không phụ thuộc cờ `date` của macOS/GNU.
ngay_vn() {
  node -e 'const b=process.env.DOC_GOP_BAY_GIO?new Date(process.env.DOC_GOP_BAY_GIO):new Date();console.log(new Date(b.getTime()+7*3600e3-Number(process.argv[1])*86400e3).toISOString().slice(0,10))' "$1"
}
HOM_QUA="$(ngay_vn 1)" || exit 2
HOM_KIA="$(ngay_vn 2)" || exit 2
# Mốc hết giờ: bây giờ THẬT (không theo DOC_GOP_BAY_GIO — biến đó chỉ dời ngày bài) + trần giây; một mốc cho cả hai bước.
DOC_GOP_HET_GIO="$(node -e 'console.log(new Date(Date.now()+Number(process.argv[1])*1e3).toISOString())' "$TRAN_GIAY")" || exit 2
export DOC_GOP_HET_GIO

ENV_FILE=()
[ -f "$ROOT/.env" ] && ENV_FILE=(--env-file="$ROOT/.env")

. "$ROOT/scripts/lib/job-step.sh"
# ${ENV_FILE[@]+…}: /bin/bash 3.2 của macOS coi mảng rỗng là biến chưa đặt dưới `set -u` (kho không có .env thì
# bước chết «unbound variable» trước lời gọi đầu) — hồ sơ doc-gop-env-rong.
doc() { (cd "$ROOT/agent" && "$NODE" ${ENV_FILE[@]+"${ENV_FILE[@]}"} --import tsx scripts/doc-gop-s03.ts hang-ngay --ngay "$1" --tran-ngay-usd "$TRAN"); }
job_run doc-gop-hang-ngay hom-qua doc "$HOM_QUA"
if [ "$JOB_RC" -eq 4 ] || [ "$JOB_RC" -eq 5 ]; then
  if [ "$JOB_RC" -eq 4 ]; then LY_DO=het-tien; else LY_DO=thieu-khoa; fi
  echo "JOB FAIL [doc-gop-hang-ngay] $LY_DO: bo buoc hom-kia" >&2
  exit "$JOB_RC"
fi
if [ "$JOB_RC" -eq 75 ]; then
  # Đếm phần hôm kia bị bỏ (chạy thử, không gọi model) để người biết ngày nào cần bù trước khi nó rơi khỏi cửa sổ.
  CON="$(cd "$ROOT/agent" && "$NODE" ${ENV_FILE[@]+"${ENV_FILE[@]}"} --import tsx scripts/doc-gop-s03.ts hang-ngay --ngay "$HOM_KIA" --thu 2>/dev/null | sed -n 's/.* \([0-9][0-9]*\) can goi.*/\1/p' | head -1)"
  echo "JOB WARN [doc-gop-hang-ngay] het-gio: bo buoc hom-kia $HOM_KIA con lai ${CON:-?}" >&2
  exit 75
fi
job_run doc-gop-hang-ngay hom-kia doc "$HOM_KIA"
exit "$JOB_RC"
