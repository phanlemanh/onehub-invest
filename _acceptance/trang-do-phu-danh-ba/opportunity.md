---
schema_version: 1
slug: trang-do-phu-danh-ba
feature: Người vận hành mở trang Danh bạ trên Ops và thấy cây dự án → toà với số căn, số đã xác nhận, số có tin, số off-market, biết toà nào còn thiếu
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh chốt gói danh bạ dự án toàn diện 09/11 «Theo khuyến nghị» (Q1–Q9) và bảo «Gửi cho Giám Sát mở phiên thực hiện»; giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-09T15:25:52Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Mạnh 03/11 hỏi có bảng xem dự án, toà, căn chưa; đo: chưa có trang nào. Trả lời «Danh bạ phủ tới đâu».

Hàng DN2 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Slug registry và thuật ngữ off-market vào CONTEXT.md cùng hàng này. Đọc ở máy thu trước; thông tin dự án S08 là công khai từ 08/11 (mục 38). Off-market không dùng trạng thái S08.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] ?
- Kết quả nào là SỐNG: [đề xuất] 
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
