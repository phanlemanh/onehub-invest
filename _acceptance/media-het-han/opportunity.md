---
schema_version: 1
slug: media-het-han
feature: Ảnh tin không tải được (đường dẫn hết hạn, không có tệp) được đánh dấu, và Ops, Invest không vẽ ô ảnh vỡ cho các ảnh đó
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh duyệt 09/11 qua phiên DA «Truy kẹt S03: trường lõi + tin không ảnh» («Đồng ý»); giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-08T23:40:36Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Đo 09/11: 5.933 dòng media dạng đường dẫn zpc, chỉ 141 có tệp; 136 tin S03 chỉ có loại ảnh này nên hiện ảnh vỡ. ZCode trả lời không tải lại được (ZC9 hạ ưu tiên).

Hàng NH2 trong `docs/plan/lo-trinh.json` (PR #379). Mạnh duyệt 09/11 qua phiên DA truy kẹt S03. Cần cột cờ mới thì lên T3 và xin số migration ở giám sát. Không tải lại ảnh (làn ZCode).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Số ảnh đánh dấu khớp đếm SQL độc lập (ảnh không có tệp); tin chỉ có ảnh hết hạn hiện như tin không ảnh; ảnh có tệp không đổi?
- Kết quả nào là SỐNG: [đề xuất] ảnh không có tệp được đánh dấu; tin chỉ có ảnh hết hạn hiện như tin không ảnh; ảnh có tệp không đổi
- Kết quả nào là CHẾT: [đề xuất] Ops hay Invest còn vẽ ô ảnh vỡ cho ảnh đã đánh dấu
- Timebox: một vòng
