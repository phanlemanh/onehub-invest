---
schema_version: 1
slug: sua-cay-danh-ba
feature: Người vận hành gộp hai nút danh bạ, tách, đổi cha, đổi loại giữa dự án con và phân khu, hay rút một nút sai trên Ops, và mọi bí danh, liên kết tin, phát biểu kế thừa phía sau đi theo
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

Danh bạ hôm nay chỉ có chiều thêm; S06, S08, S09, S07 và nút ứng viên cùng tạo nút nên trùng là chắc chắn trước khi danh bạ lên Invest. ADR-0016 §3 và §7.5 đã có luật gộp, tách, rút dây chuyền.

Hàng DA19 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). Dãy C. Hạng T3: sửa dữ liệu danh bạ đã lên cloud. DA8 là ca đầu (ba nút Grand Park) và giữ riêng vì đã duyệt.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Gộp hai nút thử: bí danh, toà, liên kết tin chuyển sang nút còn lại, merged_into ghi; hoàn tác ra y nguyên; phát biểu kế thừa phía sau rút kèm lý do; chạy lại lệnh dựng danh bạ không tái sinh nút đã gộp?
- Kết quả nào là SỐNG: [đề xuất] Gộp hai nút thử: bí danh, toà, liên kết tin chuyển sang nút còn lại, merged_into ghi; hoàn tác ra y nguyên; phát biểu kế thừa phía sau rút kèm lý do; chạy lại lệnh dựng danh bạ không tái sinh nút đã gộp
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
