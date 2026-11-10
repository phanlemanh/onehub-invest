---
schema_version: 1
slug: danh-ba-vat-the-toan-quoc
feature: Danh bạ vật thể dựng được toà ở cả 34 tỉnh/thành: mã tỉnh và mã định danh toà nhận mọi mã ISO qua bảng tra, và chủ đầu tư ghi đúng phương pháp nguồn
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

Migration 082 chỉ nhận VN-HN, VN-SG và lệnh dựng viết cứng bản đồ ISO hai thành phố, chặn PX2 (150 dự án toàn quốc). Lệnh tay của DB1 ghi builder_name lớp hitl mà không có người duyệt.

Hàng DA1 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Mã ISO tỉnh sau sáp nhập = mã ISO cũ của tỉnh mang tên được giữ; UPI đúc một lần nên bảng tra nằm trong migration và có test đủ 34 tỉnh. Làm sau khi DB1b gộp (DB1b thêm kiemDich, buocVatTheDem, cờ --db-that vào hai tệp này). Kế hoạch: DR1 + DB1c.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Bảng tra đủ 34 dòng khớp danh bạ xã/phường; toà thử ở mỗi mã ISO qua CHECK, mã lạ bị từ chối; dựng lại Ocean Park 1 và Grand Park ra 0 UPI đổi; 0 phát biểu hitl có changed_by trống?
- Kết quả nào là SỐNG: [đề xuất] Bảng tra đủ 34 dòng khớp danh bạ xã/phường; toà thử ở mỗi mã ISO qua CHECK, mã lạ bị từ chối; dựng lại Ocean Park 1 và Grand Park ra 0 UPI đổi; 0 phát biểu hitl có changed_by trống
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
