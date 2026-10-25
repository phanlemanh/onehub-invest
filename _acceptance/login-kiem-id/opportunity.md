---
schema_version: 1
slug: login-kiem-id
feature: Route POST /api/v1/ops/zalo/login từ chối accountId không có trong danh sách tài khoản trước khi spawn openclaw channels login
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build       # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh (qua giám sát đợt dot0-cam-mau, P3-34)
decided_at: 2026-10-24T10:10:00Z   # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Hàng phát sinh của dãy P3, chưa có trong `docs/plan/lo-trinh.json` (giám sát cắt vào lộ trình ở mốc khép).
Nguồn: ON14 `go-tai-khoan-kiem-id` — mục Out of scope, cùng loại lỗ YC1 (sự cố P1-7 23/10).

Route `POST /api/v1/ops/zalo/login` nhận `accountId` tuỳ ý (chỉ kiểm khác rỗng) rồi `startZaloLogin` spawn
`openclaw channels login --channel zalouser --account <id>` — id lạ, id có khoảng trắng, id dạng cờ đều tới openclaw.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] gọi POST login với id rỗng, id có khoảng trắng, id dạng cờ, id lạ có trả 400 mà openclaw giả không nhận lệnh nào; id có thật có spawn đúng một lệnh login?
- Kết quả nào là SỐNG: [đề xuất] mọi id không gỡ/đăng nhập được → 400, openclaw giả 0 lệnh; id thật → đúng một lệnh login với argv đúng; phép thử tĩnh: mọi lời gọi `channels login` đứng sau bước kiểm id.
- Kết quả nào là CHẾT: [đề xuất] còn một lớp id lọt tới openclaw khi hết timebox.
- Timebox: …

## Quyết định Cổng Đáng

- 2026-10-24 — **build**. Căn cứ: yêu cầu P3-34 (hang-moi, đề xuất T3); Mạnh «Đồng ý» — giám sát chuyển
  24/10: «P3-34: Mạnh «Đồng ý». Hàng `login-kiem-id` (T3) đã xếp vào P3, ngay sau ON14 và trước ON8.»
