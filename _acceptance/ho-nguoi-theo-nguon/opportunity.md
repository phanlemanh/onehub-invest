---
schema_version: 1
slug: ho-nguoi-theo-nguon
feature: Mỗi tin có người đăng gắn với một người trong danh bạ Người của đúng nguồn ấy qua vai «người đăng» là một phát biểu có bằng chứng, và nạp lại không nhân người
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build           # Mạnh duyệt «Xếp theo bốn làn» 30/10 (LUAT đợt dot0-cam-mau, mục Bốn làn lõi)
decided_by: Mạnh
decided_at: 2026-10-30T04:47:57Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DB2b
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DB2b của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt danh-ba-2910, mã DB2b
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Mỗi tin có người đăng gắn với một người trong danh bạ Người của đúng nguồn ấy qua vai «người đăng» là một phát biểu có bằng chứng, và nạp lại không nhân người

Vì sao: ADR-0016 §8, §10 Đợt 2b: vai trò là quan hệ có phát biểu, không phải thuộc tính; bảng sellers cũ một vai, không bí danh. Điều kiện PL15 đã gộp nên sẵn sàng; song song Đợt 1.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Nạp lại mọi nguồn hai lần: số người và số vai không đổi; mọi dòng sellers cũ có người tương ứng kèm bí danh nguồn» chưa?
- Kết quả nào là SỐNG: [đề xuất] Nạp lại mọi nguồn hai lần: số người và số vai không đổi; mọi dòng sellers cũ có người tương ứng kèm bí danh nguồn
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Nạp lại mọi nguồn hai lần: số người và số vai không đổi; mọi dòng sellers cũ có người tương ứng kèm bí danh nguồn» khi hết timebox
- Timebox: …
