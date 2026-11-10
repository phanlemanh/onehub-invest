#!/bin/bash
# doc-gop-hang-ngay.sh — PL34 `doc-gop-hang-ngay`: bước đêm đọc gộp S03 cho HÔM QUA rồi HÔM KIA (giờ VN). Hôm kia để vớt bài thu
# muộn (posted_at hôm kia, captured_at hôm qua); bài đã đọc không gọi lại nên bước vớt rẻ. Trần tính theo ngày chi nên hai bước
# chia chung một trần. Gắn vào lịch (plist / chuỗi đêm) là làn ZCode: chạy SAU job S03 đêm, TRƯỚC bước mau-soat của DO1.
#   bash pipeline/doc-gop-hang-ngay.sh
# Biến: DOC_GOP_TRAN_NGAY_USD (mặc định 20) · DOC_GOP_BAY_GIO (ISO, mặc định bây giờ — để test) · DOC_GOP_NODE (lệnh node,
# mặc định node — để test). Mỗi bước hỏng in `JOB FAIL [doc-gop-hang-ngay] bước <nhãn> mã <n>`; tệp thoát bằng mã hỏng đầu tiên
# (3 = chạm trần, 1 = mọi lời gọi hỏng, 2 = đầu vào sai). Bước kia vẫn chạy.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="$HOME/.local/node-v24.21.0/bin"
export PATH="$NODE_BIN:$PATH"
NODE="${DOC_GOP_NODE:-node}"
TRAN="${DOC_GOP_TRAN_NGAY_USD:-20}"

# Ngày giờ VN lùi n ngày từ DOC_GOP_BAY_GIO (hay bây giờ). Dùng node để không phụ thuộc cờ `date` của macOS/GNU.
ngay_vn() {
  node -e 'const b=process.env.DOC_GOP_BAY_GIO?new Date(process.env.DOC_GOP_BAY_GIO):new Date();console.log(new Date(b.getTime()+7*3600e3-Number(process.argv[1])*86400e3).toISOString().slice(0,10))' "$1"
}
HOM_QUA="$(ngay_vn 1)" || exit 2
HOM_KIA="$(ngay_vn 2)" || exit 2

ENV_FILE=()
[ -f "$ROOT/.env" ] && ENV_FILE=(--env-file="$ROOT/.env")

. "$ROOT/scripts/lib/job-step.sh"
doc() { (cd "$ROOT/agent" && "$NODE" "${ENV_FILE[@]}" --import tsx scripts/doc-gop-s03.ts hang-ngay --ngay "$1" --tran-ngay-usd "$TRAN"); }
job_run doc-gop-hang-ngay hom-qua doc "$HOM_QUA"
job_run doc-gop-hang-ngay hom-kia doc "$HOM_KIA"
exit "$JOB_RC"
