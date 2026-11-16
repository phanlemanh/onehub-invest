#!/bin/bash
# cloud-sync.sh — C4: đẩy dữ liệu local → Supabase mỗi 15' (launchd).
# Outbound-only qua HTTPS (mạng này chặn TLS Postgres thẳng — xem sync-cloud.mjs).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="$HOME/.local/node-v24.21.0/bin"
export PATH="$NODE_BIN:$PATH"

# Các bước luôn chạy hết (push-ops-facts là nhịp tim cho /ops, không tắt khi sync hỏng);
# mã thoát là mã hỏng ĐẦU TIÊN, mỗi bước hỏng in `JOB FAIL [cloud-sync] bước <nhãn> mã <n>` (AU13).
# Bước đầu: máy hạ chế độ thu Bùng quá hạn → Duy trì kèm ops_audit (C7 che-do-thu-tren-ops). Chỉ ghi DB local:
# source_groups là tầng A, KHÔNG lên cloud — đứng đầu chỉ để lượt 15′ nào cũng hạ trước khi làm việc khác.
. "$ROOT/scripts/lib/job-step.sh"
job_run cloud-sync ha-bung-het-han node "$ROOT/pipeline/ha-bung-het-han.mjs"
job_run cloud-sync sync-cloud node "$ROOT/pipeline/sync-cloud.mjs"
# DF1 `dong-chay-len-cloud`: làm tươi bảng số «Dòng chảy dữ liệu» (data_flow_snapshot, chỉ ở máy thu) TRƯỚC khi
# push-ops-facts chở nó lên thành khối `dataFlow`. Hỏng thì khối mang computed_at cũ → trang cloud báo số cũ (ADR-0014).
job_run cloud-sync refresh-data-flow node "$ROOT/pipeline/refresh-data-flow.mjs" "$ROOT/pipeline/sql/600_data_flow.sql"
job_run cloud-sync push-ops-facts node "$ROOT/pipeline/push-ops-facts.mjs"
# s03-len-nhanh-nac-1 (nấc 1, Mạnh 10/11): bảy bước đo dưới đây đã có job riêng mỗi giờ (scripts/cloud-sync-do.sh). Cờ tự
# nhận: dấu pipeline/logs/cloud-sync-do.last (job giờ ghi khi chạy TRỌN) dưới CLOUD_SYNC_DO_TUOI_GIAY (mặc định 7200) → bỏ
# bảy bước trong lượt này; dấu vắng, cũ hay không phải số → chạy như trước, dưới CÙNG khoá với job giờ (khoá đang giữ bởi
# PID sống → bỏ, lượt sau chạy). Không ai phải bật tay: job giờ chạy trọn lần đầu là cờ đổi; job giờ chết hơn 2 giờ thì
# cloud-sync tự chạy lại bước đo.
LOGS="$ROOT/pipeline/logs"
mkdir -p "$LOGS"
DAU_DO="$LOGS/cloud-sync-do.last"
KHOA_DO="$LOGS/cloud-sync-do.lock"
luc_do=""; [ -f "$DAU_DO" ] && read -r luc_do < "$DAU_DO"
lay_khoa_do() {
  mkdir "$KHOA_DO" 2>/dev/null && return 0
  local pid=""; [ -f "$KHOA_DO/pid" ] && read -r pid < "$KHOA_DO/pid"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then return 1; fi
  rm -rf "$KHOA_DO"
  mkdir "$KHOA_DO" 2>/dev/null
}
if [[ "$luc_do" =~ ^[0-9]+$ ]] && [ $(( $(date +%s) - luc_do )) -lt "${CLOUD_SYNC_DO_TUOI_GIAY:-7200}" ]; then
  echo "bước đo: job giờ chạy lúc $(date -r "$luc_do" '+%Y-%m-%d %H:%M' 2>/dev/null || echo "$luc_do"), bỏ trong lượt này"
elif ! lay_khoa_do; then
  echo "bước đo: lượt đo khác đang chạy, bỏ trong lượt này"
else
  echo $$ > "$KHOA_DO/pid"
  trap 'rm -rf "$KHOA_DO" 2>/dev/null' EXIT
  # PL19 `thoi-gian-va-hieu-luc`: ghi bằng chứng + phân xử trạng thái chào cho mọi tin, chỉ ghi DB local — ngay TRƯỚC ảnh
  # chụp bậc để vị từ B5 đọc trạng thái mới. Chỉ lỗi chạy (DB, SQL) làm job ≠0.
  job_run cloud-sync trang-thai-chao node "$ROOT/pipeline/trang-thai-chao.mjs"
  # PL16 `de-xuat-thanh-phat-bieu-bac` (Hỏi-3): chụp phân bố bậc B0–B5 + hai dòng kiểm, chỉ ghi DB local — bước CUỐI để
  # không làm chậm nhịp tim /ops. Dòng kiểm `fail` không đổi mã thoát; chỉ lỗi chạy mới làm job ≠0.
  job_run cloud-sync bac-du-lieu node "$ROOT/pipeline/bac-du-lieu.mjs" --write
  # SD5 `do-danh-ba-sdt` (Hỏi-3): năm kiểm trục SĐT của danh bạ Người, một dòng mỗi kiểm mỗi ngày (giờ máy thu), chỉ ghi DB
  # local; bước cuối. Dòng kiểm `fail` không đổi mã thoát; chỉ lỗi chạy mới làm job ≠0.
  job_run cloud-sync do-danh-ba-sdt node "$ROOT/pipeline/do-danh-ba-sdt.mjs" --write
  # HD11 `do-the-duyet-du-du-lieu` (Hỏi-3): bốn kiểm độ đủ dữ liệu thẻ ghép căn chờ duyệt, một dòng mỗi kiểm mỗi ngày (giờ
  # máy thu), chỉ ghi DB local; bước cuối — dòng lên cloud ở lượt sync-cloud kế. Dòng `fail` không đổi mã thoát.
  job_run cloud-sync do-the-duyet node "$ROOT/pipeline/do-the-duyet.mjs" --write
  # DO1 `do-hieu-qua-hang-ngay` (Hỏi-3, giám sát làm sau gộp #359), hai bước cuối: rút 20 bài S03 hôm qua vào lát s03-cuon-chieu và chụp
  # nháp (đọc gộp Haiku chỉ cho bài chưa đọc, trần 0,05 USD/ngày; ngày đã có thẻ thì không rút, không gọi), rồi dòng chuyển
  # bậc + bốn nhóm số do1-* vào dq_check_results (đọc ảnh bậc của bac-du-lieu bên trên). Chỉ ghi DB local; số gộp lên cloud
  # ở lượt sync-cloud kế. Dòng `fail` không đổi mã thoát; chỉ lỗi chạy làm job ≠0.
  job_run cloud-sync mau-soat-cuon-chieu node "$ROOT/pipeline/mau-soat-cuon-chieu.mjs"
  job_run cloud-sync do-hang-ngay node "$ROOT/pipeline/do-hang-ngay.mjs" --write
  # DO3 `do-lam-giau`: thay đổi theo ngày của từng đường làm giàu (thêm, đổi, máy rút, người sửa/rút) và kiểm ngược bỏ-một-ra
  # khi tuần ISO chưa có dòng, không gọi model; chỉ ghi DB local (086 + do3-* vào dq_check_results), số lên cloud ở lượt sync-cloud
  # kế. Chưa áp 086 thì in CHUA-AP-086 và thoát 0. Dòng `fail` không đổi mã thoát; chỉ lỗi chạy làm job ≠0.
  job_run cloud-sync do-lam-giau node "$ROOT/pipeline/do-lam-giau.mjs" --write
  rm -rf "$KHOA_DO"
  trap - EXIT
fi
exit "$JOB_RC"

