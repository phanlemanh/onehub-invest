---
schema_version: 1
slug: nguoi-noi-theo-sdt
feature: Danh bạ Người gộp người đăng theo SĐT, trước trong cùng nguồn rồi khác nguồn, mỗi lần gộp có vết và đảo được
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T23:19:54Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: HD13
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD13 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1` — chưa có trang: trang đợt hang-duyet-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Danh bạ Người gộp người đăng theo SĐT, trước trong cùng nguồn rồi khác nguồn, mỗi lần gộp có vết và đảo được

Vì sao: Audit hàng duyệt 30/10 (docs/research/audit-hang-duyet-3010.md §3b, H16, §7; docs/research/audit-bang-nguoi-sdt-3010.md): 0 Người khác nguồn; Mạnh chốt SĐT là khoá chính để nối Người.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Dựng lại danh bạ trong giao dịch ROLLBACK: mọi cặp tài khoản cùng SĐT về một Người; lượt hai gộp 0; không Người nào gộp hai SĐT khác nhau mà không có bí danh nối; tách lại một lần gộp không mất dữ liệu» chưa?
- Kết quả nào là SỐNG: [đề xuất] Dựng lại danh bạ trong giao dịch ROLLBACK: mọi cặp tài khoản cùng SĐT về một Người; lượt hai gộp 0; không Người nào gộp hai SĐT khác nhau mà không có bí danh nối; tách lại một lần gộp không mất dữ liệu
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Dựng lại danh bạ trong giao dịch ROLLBACK: mọi cặp tài khoản cùng SĐT về một Người; lượt hai gộp 0; không Người nào gộp hai SĐT khác nhau mà không có bí danh nối; tách lại một lần gộp không mất dữ liệu» khi hết timebox
- Timebox: …

## Cổng 0

- **decision = build** Căn cứ: Mạnh 30/10 ở §7 docs/research/audit-hang-duyet-3010.md (PR #217), nguyên văn «Các điều còn lại theo đề xuất» — cắt ba đợt, HD13 thuộc đợt 3; giám sát giao tay cho P3 ngày 31/10 sau khi SD3 (#247) gộp.
- **disposition = (không có bản mẫu)**
