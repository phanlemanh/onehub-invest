---
name: ops-check
description: Kiểm sức khoẻ vận hành dữ liệu onehub-invest buổi sáng — độ tươi từng nguồn so với SLO, audit toàn hệ thống, cảnh báo watchdog Zalo, log chạy đêm. Chỉ đọc. Dùng khi user hỏi "hệ thống có khoẻ không", "đêm qua thu được gì", "soi ops", "ops check".
allowed-tools: Bash(node scripts/check-freshness.mjs) Bash(bash scripts/audit-all.sh) Bash(tail *) Bash(ls *) Bash(grep *)
---

# /ops-check — chỉ đọc, không sửa gì

1. **Độ tươi** — `node scripts/check-freshness.mjs` (exit 1 = có ô quá SLO, chưa có dữ liệu, hoặc nguồn
   active chưa khai SLO; `--json` in từng ô `{code, city, last, ageHours, sloHours, status}`). Mỗi mã đo ở
   bảng nạp thật của nó, chỉ ở thành phố nó có dữ liệu:
   S01 ≤ 8 ngày (`airbnb_snapshots`) · S02 ≤ 35 ngày (`airdna_markets`) · S03 ≤ 3 ngày và S05 ≤ 12 giờ
   (`stg_zalo_posts`, tách theo `agent_id`) · S06 ≤ 36 giờ (`stg_chotot_ads`). S04 không đo — địa giới đã
   thu xong. Định nghĩa: `scripts/lib/freshness.mjs`.
2. **Audit toàn hệ thống** — `bash scripts/audit-all.sh` (thu thập, DB + cloud sync, Invest,
   Ops, public API). Tóm các dòng ❌ và ⚠️.
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
