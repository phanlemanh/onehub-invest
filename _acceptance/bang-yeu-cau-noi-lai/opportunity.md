---
schema_version: 1
slug: bang-yeu-cau-noi-lai
feature: Transform S03 và S05 ghi mỗi Yêu cầu vào bảng inquiry_records (dịch vụ, loại hình, số phòng, diện tích, ngân sách với đầu dưới ở ListPriceLow, khu, bài nguồn, bằng chứng ý định); ý định lấy từ phát biểu lớp cao nhất giữa luật laYeuCau và nhãn model đọc tin, Kev thêm vào khi PL5 giao
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

Bảng đã dựng và ký Cổng Bằng chứng 30/10 ở nhánh feat/bang-yeu-cau nhưng đứng trên PL5 (kẹt ở phần thu) và chậm main gần 2.000 commit; Q1 (10/11) cho nối ngay bằng luật xác định cộng nhãn model.

Hàng YC0 trong `docs/plan/lo-trinh.json` (PR #396, bản phạm vi `docs/plan/pham-vi-bang-yeu-cau-1011.md`). Q1: hồ sơ mới thay _acceptance/bang-yeu-cau; sửa AC-4, AC-7 từ «phát biểu Kev» thành «phát biểu ý định lớp cao nhất», giữ các tiêu chí khác đã ký. Migration lấy số kế tiếp trên main (058 đã bị bỏ qua). Bảng chỉ ở local tới YC8. Áp lên máy thu cần lời Mạnh (DDL thật).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Trên DB máy thu: số Yêu cầu trong bảng khớp đếm SQL độc lập theo luật laYeuCau trừ bài đã thành tin rao (10/11: 11.616 bài S03); chạy lại transform hai lần số dòng không đổi; cột source chỉ mang mã S0x; bài người duyệt đánh «Không phải Yêu cầu» không vào bảng ở lượt sau?
- Kết quả nào là SỐNG: [đề xuất] Trên DB máy thu: số Yêu cầu trong bảng khớp đếm SQL độc lập theo luật laYeuCau trừ bài đã thành tin rao (10/11: 11.616 bài S03); chạy lại transform hai lần số dòng không đổi; cột source chỉ mang mã S0x; bài người duyệt đánh «Không phải Yêu cầu» không vào bảng ở lượt sau
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
