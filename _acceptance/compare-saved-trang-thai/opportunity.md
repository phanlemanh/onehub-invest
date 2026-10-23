---
schema_version: 1
slug: compare-saved-trang-thai
feature: Nhà đầu tư mở So sánh ở /compare (301 từ /so-sanh) và Đã lưu, cả hai có PageHeader, trạng thái tải/trống/lỗi, Đã lưu trống dùng c-empty-11
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 23/10 ở phiên giám sát dot0: «Mở mới cho dãy giao diện vì phiên điều phối có cơ chế đổi tài khoản nên hạn mức là cảnh báo chứ không phải giới hạn.» — theo kế hoạch dot1-giao-dien đã duyệt (nhóm A: UI1–UI7)
decided_by: Mạnh
decided_at: 2026-10-23T15:17:32Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: UI4
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng UI4 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

Nhà đầu tư mở So sánh ở /compare (301 từ /so-sanh) và Đã lưu, cả hai có PageHeader, trạng thái tải/trống/lỗi, Đã lưu trống dùng c-empty-11

Vì sao: Hàng đầu tiên thêm redirect 301 vào next.config.ts — làm mẫu cho UI2, UI3. 4 vi phạm lint.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: …
- Kết quả nào là CHẾT: …
- Timebox: …
