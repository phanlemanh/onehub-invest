---
schema_version: 1
slug: luoi-toa-ho-so-can
feature: Người vận hành mở một toà thấy lưới trục × tầng với trạng thái từng ô, mở một căn thấy tin đang rao, người đăng, lịch sử giá chào, độ chắc từng trường và bằng chứng
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

Kiểm phủ tới từng căn; tra căn cho vận hành. Tra căn khi giao dịch ở Quỹ hàng (Mạnh chốt 03/11).

Hàng DN3 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Không làm lộ mã căn người đăng đã che ra ngoài Ops. Ô chưa có bằng chứng là ô trống, không tính vào số căn.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] ?
- Kết quả nào là SỐNG: [đề xuất] 
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
