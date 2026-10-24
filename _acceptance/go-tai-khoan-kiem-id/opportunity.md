---
schema_version: 1
slug: go-tai-khoan-kiem-id
feature: Route gỡ tài khoản thu DELETE /api/v1/ops/zalo/accounts từ chối id rỗng hoặc không có trong danh sách tài khoản trước khi gọi openclaw
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build       # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P3-33) theo lệnh Mạnh 24/10
decided_at: 2026-10-24T09:30:31Z   # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON14
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON14 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Route gỡ tài khoản thu DELETE /api/v1/ops/zalo/accounts từ chối id rỗng hoặc không có trong danh sách tài khoản trước khi gọi openclaw

Vì sao: YC1 — sự cố P1-7 23/10: ma trận phép đo gọi DELETE với id rỗng, route chạy openclaw channels logout --account "" (deleteZaloAccount ở app/src/lib/zalo-admin.ts:145 không kiểm). Đã kiểm không hại (watchdog ok), lỗ còn nguyên.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Gọi với id rỗng, id có khoảng trắng, id lạ: 400, openclaw giả không nhận lệnh nào; id có thật: openclaw giả nhận đúng một lệnh logout; phép thử tĩnh: mọi lời gọi logout đứng sau bước kiểm id» chưa?
- Kết quả nào là SỐNG: [đề xuất] Gọi với id rỗng, id có khoảng trắng, id lạ: 400, openclaw giả không nhận lệnh nào; id có thật: openclaw giả nhận đúng một lệnh logout; phép thử tĩnh: mọi lời gọi logout đứng sau bước kiểm id
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Gọi với id rỗng, id có khoảng trắng, id lạ: 400, openclaw giả không nhận lệnh nào; id có thật: openclaw giả nhận đúng một lệnh logout; phép thử tĩnh: mọi lời gọi logout đứng sau bước kiểm id» khi hết timebox
- Timebox: …

## Quyết định Cổng Đáng

- 2026-10-24T09:30:31Z — **build** (yêu cầu P3-33, giám sát đợt dot0-cam-mau duyệt). Căn cứ, lời Mạnh 24/10 nguyên văn:
  «Xếp ON14 trước, rồi ON8, ON12, ON13, ON9, ON5 vào dãy P3 và cho P3 chạy lại».
