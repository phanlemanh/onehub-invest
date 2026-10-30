---
schema_version: 1
slug: the-duyet-du-can-cu
feature: Người duyệt mở /ops/review và thấy mọi trường kèm căn cứ, ảnh tin và toàn văn tin, không có «AI tự tin %», rồi quyết kèm lý do được ghi audit cùng giao dịch
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T04:47:57Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL3
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL3 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã C0.2, mã C0.3
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người duyệt mở /ops/review và thấy mọi trường kèm căn cứ, ảnh tin và toàn văn tin, không có «AI tự tin %», rồi quyết kèm lý do được ghi audit cùng giao dịch

Vì sao: L04/L15: thẻ hiện % thay căn cứ, gợi ý «apply» gắn cứng, audit sau COMMIT. Backend ảnh đã có (PR #16).

Cổng Đáng: build — Mạnh duyệt 30/10 câu «Xếp theo bốn làn» (sổ đợt dot0-cam-mau, dòng giám sát 2026-10-30T04:47:57Z: «U1 PL3 … Cổng Đáng build cho … PL3»); giám sát giao làn «thẻ duyệt» cho U1, ảnh lấy từ bảng media chung của NH1 (#192).

## Ngưỡng chết / ngưỡng UAT

Mạnh chốt ở Cổng Phạm vi 30/10 (Hỏi-3, nhận khuyến nghị).

- Câu hỏi phép đo trả lời: người duyệt có quyết được thẻ chỉ bằng những gì sheet /ops/review hiện ra, và mọi quyết định có lý do ghi audit không?
- Kết quả nào là SỐNG: trong 7 ngày kể từ khi app ở máy thu chạy bản đã gộp, ≥ 10 thẻ được quyết ở máy thu; 100% dòng `ops_audit` `review.decide` mới có `ly_do` không rỗng; phiên nghiệm thu ghi 0 thẻ người duyệt phải mở tin gốc ngoài /ops/review mới quyết được.
- Kết quả nào là CHẾT: có dòng `review.decide` mới thiếu `ly_do`, hoặc từ 2 thẻ trở lên phải mở tin gốc ngoài /ops/review.
- Timebox: 7 ngày kể từ khi app ở máy thu chạy bản đã gộp (phiên nghiệm thu ghi sha + giờ khởi động lại).
