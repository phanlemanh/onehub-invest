---
schema_version: 1
slug: danh-ba-len-cloud
feature: Bản chiếu Danh bạ lên cloud gồm toà, trục, căn, bảng nối dự án, phát biểu thuộc tính dự án và tin sơ cấp, không mang tên nguồn thật, và trang Danh bạ đọc được trên cloud
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

ADR-0016 §9 sửa 03/11 (Mạnh duyệt). Đội vận hành làm việc từ xa theo ADR-0015.

Hàng DN4 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Hạng T3: đổi đường dữ liệu lên cloud; DDL cloud xin Mạnh duyệt. Viết lại 08/11 theo mục 38: thông tin dự án công khai, bỏ phép bắt «0 giá trị chỉ có từ S08»; giữ leakGate cho stg_* và bộ soát tên nguồn ở cửa ra; sửa lý do trong sync-pii.test.mjs. Bộ quét DBV-AC-11 quét kho git công khai, không phải cloud, nên giữ. Sửa 09/11 (mục 40): thêm phát biểu dự án (DA15) và tin sơ cấp (DA17).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Trang Danh bạ đọc được trên cloud; cấy tên nguồn thật vào một dòng danh bạ thì bộ soát đỏ; 0 bảng stg_* có dòng trên cloud; phát biểu resource Subdivision, Complex và tin sơ cấp có trên cloud, bộ soát tầng A phủ cả hai?
- Kết quả nào là SỐNG: [đề xuất] Trang Danh bạ đọc được trên cloud; cấy tên nguồn thật vào một dòng danh bạ thì bộ soát đỏ; 0 bảng stg_* có dòng trên cloud; phát biểu resource Subdivision, Complex và tin sơ cấp có trên cloud, bộ soát tầng A phủ cả hai
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
