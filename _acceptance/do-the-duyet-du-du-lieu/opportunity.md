---
schema_version: 1
slug: do-the-duyet-du-du-lieu
feature: Mỗi đêm scorecard ghi tỉ lệ thẻ ghép căn chờ duyệt có đủ dữ liệu hai bên (ảnh, đặc trưng nhà, người đăng, tin còn sống)
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T23:19:54Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: HD11
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD11 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1` — chưa có trang: trang đợt hang-duyet-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Mỗi đêm scorecard ghi tỉ lệ thẻ ghép căn chờ duyệt có đủ dữ liệu hai bên (ảnh, đặc trưng nhà, người đăng, tin còn sống)

Vì sao: Audit hàng duyệt 30/10 (docs/research/audit-hang-duyet-3010.md §5, H4): 0/8 ứng viên kế có ảnh bên A — đo bằng tay; cần số đêm để biết hàng duyệt có đáng duyệt.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Chạy hai lần cùng ngày không nhân dòng; mỗi thành phần có tỉ lệ riêng; thẻ không còn chờ không được đếm» chưa?
- Kết quả nào là SỐNG: [đề xuất] Chạy hai lần cùng ngày không nhân dòng; mỗi thành phần có tỉ lệ riêng; thẻ không còn chờ không được đếm
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Chạy hai lần cùng ngày không nhân dòng; mỗi thành phần có tỉ lệ riêng; thẻ không còn chờ không được đếm» khi hết timebox
- Timebox: …

## Cổng 0

- **decision = build** Căn cứ: Mạnh 30/10 ở §7 docs/research/audit-hang-duyet-3010.md (PR #217), nguyên văn «Các điều còn lại theo đề xuất» — cắt ba đợt, HD11 thuộc đợt 3 (giám sát trả lời P4-107).
- **disposition = (không có bản mẫu)**
