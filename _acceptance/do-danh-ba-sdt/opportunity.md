---
schema_version: 1
slug: do-danh-ba-sdt
feature: Mỗi đêm đo trục SĐT của danh bạ Người và ghi vào dq_check_results để /ops/quality hiện
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T17:29:45Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: SD5
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng SD5 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/nguoi-va-sdt.md#829234f6062a7e911b8cf66d79cdddbf88551945` — chưa có trang: trang đợt nguoi-sdt-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Mỗi đêm đo trục SĐT của danh bạ Người và ghi vào dq_check_results để /ops/quality hiện

Vì sao: Audit bảng Người theo trục SĐT 30/10 (docs/research/audit-bang-nguoi-sdt-3010.md §0): mọi số của audit đo bằng tay; cần số đêm để đối chứng trước và sau SD1–SD3, HD13.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Chạy trên DB 30/10 ra đúng số của audit §0: SĐT nối 1–1 chưa gộp S03 129 · S05 13; người theo SĐT không vai 150; sellers 19/161; tin nhiều SĐT 11; bài sót 46. Chạy hai lần cùng ngày không nhân dòng» chưa?
- Kết quả nào là SỐNG: [đề xuất] Chạy trên DB 30/10 ra đúng số của audit §0: SĐT nối 1–1 chưa gộp S03 129 · S05 13; người theo SĐT không vai 150; sellers 19/161; tin nhiều SĐT 11; bài sót 46. Chạy hai lần cùng ngày không nhân dòng
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Chạy trên DB 30/10 ra đúng số của audit §0: SĐT nối 1–1 chưa gộp S03 129 · S05 13; người theo SĐT không vai 150; sellers 19/161; tin nhiều SĐT 11; bài sót 46. Chạy hai lần cùng ngày không nhân dòng» khi hết timebox
- Timebox: …

## Cổng 0

- **decision = build** Căn cứ: Mạnh ở phiên giám sát 30/10, nguyên văn «Cổng Đáng build 6 hàng audit Người theo thứ tự đề xuất» (giám sát trả lời P4-103).
- **disposition = (không có bản mẫu)**
