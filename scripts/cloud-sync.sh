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
exit "$JOB_RC"

