---
schema_version: 1
slug: thuoc-tinh-danh-muc-s08-s09
feature: Thuộc tính trong danh mục S08 và S09 thành phát biểu ở đúng cấp: dự án (quy mô, loại hình, chủ đầu tư, bàn giao, loại căn và số căn, phí), phân khu, toà (tầng, hầm, thang máy, toạ độ, bàn giao), căn (diện tích kèm cách tính, phòng, hướng, loại căn)
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

Kế hoạch 08/11 chỉ dựng toà–trục–căn từ S08; thuộc tính dự án, toà, căn trong S08 (60.131 dòng) và S09 chưa thành phát biểu nào.

Hàng DA16 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Dãy B. Phần S09 chỉ chạy cho dự án đã có snapshot S09; dự án chưa có thì chỉ S08. Đơn vị một chuẩn: m², VND, ngày ISO.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Mỗi dự án S08 có ít nhất một phát biểu phân loại–quy mô và một phát biểu chủ đầu tư; nạp lại snapshot không nhân phát biểu, snapshot sau đổi giá trị thì phát biểu cũ hết hiệu lực; S08 và S09 nói khác nhau thì lên thẻ, không đè?
- Kết quả nào là SỐNG: [đề xuất] Mỗi dự án S08 có ít nhất một phát biểu phân loại–quy mô và một phát biểu chủ đầu tư; nạp lại snapshot không nhân phát biểu, snapshot sau đổi giá trị thì phát biểu cũ hết hiệu lực; S08 và S09 nói khác nhau thì lên thẻ, không đè
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
