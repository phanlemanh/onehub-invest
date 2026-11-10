---
schema_version: 1
slug: ops-bang-yeu-cau
feature: Người vận hành mở /ops/inquiries và lọc Yêu cầu theo dịch vụ, dự án, số phòng, ngân sách, người đăng, thời gian, trạng thái; mở một Yêu cầu thấy tiêu chí kèm câu trích và cách đọc, các bài đã đăng, người đăng nối sang /ops/people, và đánh dấu «Không phải Yêu cầu»
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh trả lời 5 câu Bảng Yêu cầu 10/11 ở phiên phân tích (PR #396); giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-10T00:26:09Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Chưa có chỗ nào xem Yêu cầu: 11.616 bài S03 chỉ hiện là một nhánh trên Sankey DF6.

Hàng YC5 trong `docs/plan/lo-trinh.json` (PR #396, bản phạm vi `docs/plan/pham-vi-bang-yeu-cau-1011.md`). Q3: người đăng Yêu cầu là tầng C như người bán — chỉ hiện trên Ops, SĐT qua «Xem số»; ghi sửa đổi ADR-0007 trong cùng PR. Khuôn bảng có lọc + ngăn chi tiết như /ops/deals, /ops/people; bản phác ở research-local/bang-yeu-cau/phac-ops-inquiries.html. YC3, YC4 làm cột đầy hơn, không chặn.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Trên dữ liệu máy thu: số dòng của bảng khớp đếm SQL ở mỗi bộ lọc; trạng thái tải, trống, lỗi có Thử lại; SĐT người đăng không có trong HTML, chỉ qua «Xem số»; trên cloud trang hiện cảnh báo chỉ có ở local; route-slugs xanh?
- Kết quả nào là SỐNG: [đề xuất] Trên dữ liệu máy thu: số dòng của bảng khớp đếm SQL ở mỗi bộ lọc; trạng thái tải, trống, lỗi có Thử lại; SĐT người đăng không có trong HTML, chỉ qua «Xem số»; trên cloud trang hiện cảnh báo chỉ có ở local; route-slugs xanh
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
