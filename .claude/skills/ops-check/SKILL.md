---
name: ops-check
description: Kiểm sức khoẻ vận hành dữ liệu onehub-invest buổi sáng — độ tươi từng nguồn so với SLO, audit toàn hệ thống, cảnh báo watchdog Zalo, log chạy đêm. Chỉ đọc. Dùng khi user hỏi "hệ thống có khoẻ không", "đêm qua thu được gì", "soi ops", "ops check".
allowed-tools: Bash(node scripts/check-freshness.mjs) Bash(bash scripts/audit-all.sh) Bash(tail *) Bash(ls *) Bash(grep *)
---

# /ops-check — chỉ đọc, không sửa gì

1. **Độ tươi** — `node scripts/check-freshness.mjs` (exit 1 = có ô quá SLO, chưa có dữ liệu, hoặc nguồn
   active chưa khai SLO; `--json` in từng ô `{code, city, last, ageHours, sloHours, status}`). Mỗi mã đo ở
   bảng nạp thật của nó, chỉ ở thành phố nó có dữ liệu, và tính tuổi theo GIỜ THU (nạp lại bản cũ không làm
   nguồn trông tươi): S01 ≤ 8 ngày · S03 ≤ 3 ngày · S05 ≤ 96 giờ (2 lượt/tuần) · S06 ≤ 36 giờ — đều theo
   `airbnb_snapshots.collected_at` (S03/S05 lấy snapshot chứa bài của mã trong `stg_zalo_posts`, tách theo
   `agent_id`; S06 lấy snapshot chứa tin `stg_chotot_ads`) · S02 ≤ 35 ngày theo `airdna_markets.captured_at`
   (giờ tải). S04 không đo — địa giới đã thu xong. Định nghĩa: `scripts/lib/freshness.mjs`.
   Trang `/ops` và `/ops/collections` dùng CÙNG định nghĩa từng ô nguồn × thành phố này — bản của app ở
   `app/src/lib/freshness.ts`, giữ khớp từng hằng và câu truy vấn bằng `scripts/freshness-parity.test.mjs`.
   Hai trang cùng hiện con số «x/y nguồn đạt SLO»: một nguồn đạt khi MỌI thành phố có dữ liệu của nó đạt,
   `y` = nguồn active có SLO (S04 xong rồi và nguồn chưa khai SLO không đếm). CLI không in x/y — nó liệt
   từng ô; ô nào CLI báo lỗi thì trên trang nguồn đó không đạt.
2. **Audit toàn hệ thống** — `bash scripts/audit-all.sh` (thu thập, DB + cloud sync, Invest,
   Ops, public API). Tóm các dòng ❌ và ⚠️. Đọc ba mục dễ hiểu nhầm:
   - **Backup tuần**: chưa cài job, job lỗi, chưa đặt `BACKUP_DIR`, hay không có `db-*.sql.gz` trong
     8 ngày đều là ❌ — chỉ ✅ khi thấy tệp sao lưu (tên tệp in kèm).
   - **Trang `/ops`**: kiểm ở `OPS_BASE_URL` (mặc định `http://localhost:3456`, app dev). Audit chỉ
     đọc, không đăng nhập: 307 là ⚠️ «chưa đăng nhập» — chỉ biết trang sống, chưa thấy nội dung.
     Muốn kiểm trang thật sau đăng nhập: `bash scripts/dev-ops-login-check.sh`.
   - **Membership nhóm S03**: ⚠️ «không kiểm được» khi không có CLI OpenClaw — không phải ✅.
3. **An toàn Zalo** — `tail -20 pipeline/logs/zalo-watchdog-alerts.log` (thiếu file = chưa
   từng có cảnh báo). KHÔNG chạy `scripts/zalo-watchdog.sh`: script đó kill OpenClaw khi
   phát hiện vi phạm.
4. **Ống Zalo có chảy không** — `grep -c "drop no mention" ~/Library/Logs/openclaw/gateway.log`
   và số tin tới hook hôm nay; 0 tin/24h khi nhóm đang bật = "collection starved"
   (xem `docs/ops/runtime-map.md`).
5. **Job đêm** — `ls -lt pipeline/logs | head` để xem job nào chạy/lỗi đêm qua
   (lịch: ROADMAP §2.4).

## Báo cáo

Một dòng kết luận (khoẻ / có vấn đề), rồi bảng: hạng mục · trạng thái · chi tiết · việc nên làm.
Chỉ đề xuất cách sửa, không tự chạy collect/transform hay đổi cấu hình.
