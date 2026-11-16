#!/bin/bash
# cloud-sync-do.sh — s03-len-nhanh-nac-1 (nấc 1, Mạnh 10/11): bảy bước đo rời khỏi lượt cloud-sync 15′, chạy mỗi giờ
# (plist launchd là làn ZCode — giao sau gộp). Thứ tự và cờ giữ nguyên như trong cloud-sync.sh: trang-thai-chao trước ảnh
# chụp bậc (vị từ B5), bac-du-lieu trước DO1. Chỉ ghi DB local; số lên cloud ở lượt sync-cloud kế.
# Mã thoát = mã hỏng ĐẦU TIÊN (job_run, AU13). Dấu pipeline/logs/cloud-sync-do.last (giây epoch) ghi ở CUỐI lượt và CHỈ
# khi không bước nào lỗi chạy — dấu nghĩa là «job giờ đã chạy trọn»; cloud-sync.sh thấy dấu dưới 2 giờ thì bỏ bảy bước,
# không thì tự chạy chúng dưới CÙNG khoá này (hai bên không bao giờ chạy chồng).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="$HOME/.local/node-v24.21.0/bin"
export PATH="$NODE_BIN:$PATH"

LOGS="$ROOT/pipeline/logs"
mkdir -p "$LOGS"
DAU="$LOGS/cloud-sync-do.last"
KHOA="$LOGS/cloud-sync-do.lock"

# Khoá thư mục + PID: PID còn sống → lượt trước còn chạy, bỏ lượt; PID chết (kill -9, mất điện) → gỡ rồi lấy.
if ! mkdir "$KHOA" 2>/dev/null; then
  pid=""; [ -f "$KHOA/pid" ] && read -r pid < "$KHOA/pid"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "bỏ lượt: lượt đo trước còn chạy (PID $pid)"
    exit 0
  fi
  echo "gỡ khoá đo cũ của PID ${pid:-?} (tiến trình đã chết)"
  rm -rf "$KHOA"
  mkdir "$KHOA" 2>/dev/null || { echo "bỏ lượt: không lấy được khoá $KHOA" ; exit 0; }
fi
echo $$ > "$KHOA/pid"
trap 'rm -rf "$KHOA" 2>/dev/null' EXIT

. "$ROOT/scripts/lib/job-step.sh"
# Chú thích từng bước ở scripts/cloud-sync.sh (khối bước đo) — hai nơi gọi cùng lệnh, cùng thứ tự.
job_run cloud-sync-do trang-thai-chao node "$ROOT/pipeline/trang-thai-chao.mjs"
job_run cloud-sync-do bac-du-lieu node "$ROOT/pipeline/bac-du-lieu.mjs" --write
job_run cloud-sync-do do-danh-ba-sdt node "$ROOT/pipeline/do-danh-ba-sdt.mjs" --write
job_run cloud-sync-do do-the-duyet node "$ROOT/pipeline/do-the-duyet.mjs" --write
job_run cloud-sync-do mau-soat-cuon-chieu node "$ROOT/pipeline/mau-soat-cuon-chieu.mjs"
job_run cloud-sync-do do-hang-ngay node "$ROOT/pipeline/do-hang-ngay.mjs" --write
job_run cloud-sync-do do-lam-giau node "$ROOT/pipeline/do-lam-giau.mjs" --write
if [ "$JOB_RC" -eq 0 ]; then date +%s > "$DAU"; fi
exit "$JOB_RC"
