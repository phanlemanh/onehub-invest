---
schema_version: 1
feature: PL4 — hook Zalo đẩy mọi tin tới collector kèm điểm Kev (meta.kev), không bỏ tin theo điểm
slug: kev-thanh-nhan
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, config]
status: verified
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: kev-thanh-nhan

## Context

Hook Zalo (`collector/openclaw/handler.js`) hỏi Kev-4B :8009 «có phải tin rao BĐS?» rồi bỏ mọi tin có p < 0.9. Đo 23/10 cho thấy hook bỏ khoảng 70% tin (1270 skip so với 549 post), mà mẫu p 0.5–0.9 gần như đều là tin rao thật. Khi gate chết, hook lại giả p = 1.0, làm bẩn dữ liệu dùng để đo ngưỡng.

Q1 đã chốt: Kev thành NHÃN. Mọi tin vào raw kèm `meta.kev {p, model, threshold, at}`, còn quyết định dùng p nằm ở transform. Snapshot lên schemaVersion 3, `import-airbnb.mjs` nhận các phiên bản {1,2,3}.

Hàng PL4 của lộ trình (`docs/plan/lo-trinh.json`, hạng T3).

Source input: prompt (brief phiên điều phối liên làn local_5d0e32a0…, 23/10/2026). Nhánh `zcode/kev-nhan` @ 7271b32 (claudedp-2310-11).

## Criteria

- AC-1: Given Kev trả p dưới ngưỡng (vd 0.2) hoặc trên ngưỡng (vd 0.95) cho một tin có chữ của kênh zalouser, When hook xử lý tin, Then tin được POST tới collector `/agent-report` trong cả hai trường hợp, và log hook không còn dòng bỏ tin theo điểm.
- AC-2: Given Kev không nghe, trả lỗi 500, hoặc trả kết quả thiếu điểm, When hook xử lý tin, Then tin vẫn được đẩy với `p = null`, không còn giả 1.0, và log ghi gate-down khi Kev không nghe.
- AC-3: Given hook đẩy một tin, When collector nhận POST, Then tin mang `kev` đủ bốn trường: `p`, `model` = `kev-latest`, `threshold` = 0.9, `at` là thời điểm ISO.
- AC-4: Given collector nhận một tin có `kev` và một tin không có, When flush thành snapshot, Then `RawItem.meta.kev` của tin đầu nguyên vẹn, còn tin sau không bị gắn `kev` giả; suite collector vẫn xanh.
- AC-5: Given snapshot mới, When đọc manifest, Then `schemaVersion` = 3; `DATA-CONTRACT.md` ghi schemaVersion 3 và yêu cầu bên import chấp nhận `{1,2,3}`.
- AC-6: Given snapshot hợp lệ có schemaVersion 1, 2, 3 hoặc 4, When chạy `import-airbnb.mjs`, Then v1–v3 qua bước kiểm phiên bản và sha256; v4 bị từ chối trước khi đọc dữ liệu.
- AC-7: Given lớp L1 của watchdog (grep API gửi tin trong hook), When áp mẫu grep nguyên văn của watchdog lên `handler.js` mới, Then không khớp (watchdog không kill OpenClaw); bản cấy `sendMessage(`, `reply(` hay `send-message` thì khớp.

## Coverage

- Bỏ coverage-scan vì AC lấy từ brief và hàng PL4. Các trục đã phủ bằng tay:
  - điểm Kev: dưới ngưỡng / trên ngưỡng;
  - Kev: sống / 500 / thiếu noul / không nghe;
  - tin: có chữ / rỗng không ảnh / kênh khác;
  - phiên bản snapshot: 1 / 2 / 3 / 4;
  - L1: handler thật / bản cấy ba dạng.

## Out of scope

- Số đo một ngày chạy thật (cột `bat_khi` của PL4: số tin hook nhận = số tin có snapshot, mọi tin có meta.kev). Chỉ đo được sau khi cài hook vào `~/.openclaw` và restart :9210, tức sau triển khai do ZCode làm qua kênh tin.
- Cài hook vào `~/.openclaw`, restart Collector API :9210, `launchctl`.
- Transform dùng p để lọc hoặc xếp hạng; lưu `meta.kev` xuống stg (chưa có cột — cần migration của Claude khi transform cần).
- Đổi ngưỡng 0.9 hay model Kev.

## Notes

- T3 vì `collector/openclaw/**` ∈ `t3_paths` (an toàn Zalo); lộ trình cũng ghi T3.
- Hợp đồng dựng SAU khi code xong (ZCode) nên `gate1_skipped: true`.
- Eval chạy `handler.js` thật trong tiến trình con với HOME giả (khoá và log nằm trong thư mục tạm), Kev và collector giả trên cổng ngẫu nhiên. Không chạm `~/.openclaw`, :8009, :9210.
- Cùng nhánh với hồ sơ `sourceid-tin-anh` (ZC1), tách slug.
