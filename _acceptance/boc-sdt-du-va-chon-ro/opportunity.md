---
schema_version: 1
slug: boc-sdt-du-va-chon-ro
feature: Bộ bóc SĐT của S03/S05 bắt đủ các dạng viết tách lạ, bỏ số 11 chữ số, trả số dạng +84…, và tin chọn SĐT theo luật rõ trên mọi bài của tin
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T16:50:23Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: SD2
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng SD2 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/nguoi-va-sdt.md#829234f6062a7e911b8cf66d79cdddbf88551945` — chưa có trang: trang đợt nguoi-sdt-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Bộ bóc SĐT của S03/S05 bắt đủ các dạng viết tách lạ, bỏ số 11 chữ số, trả số dạng +84…, và tin chọn SĐT theo luật rõ trên mọi bài của tin

Vì sao: Audit bảng Người theo trục SĐT 30/10 (docs/research/audit-bang-nguoi-sdt-3010.md §2, N4–N6): bộ bóc bắt 99,6% số trong chữ nhưng sót bốn dạng lạ, nhận số 11 chữ số, và tin chỉ giữ số đầu của bài đầu (11 tin S03 có nhiều số).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên toàn bộ bài S03 ở stg: bài sót theo bộ dò rộng từ 46 xuống 0; 0 bài nhận số 11 chữ số; mọi số trả về khớp ^\+84[35789]\d{8}$; 3 tin S03 rỗng SĐT mà bài có số thành có; test cố định bốn dạng sót (•, (+84), (0xx), hai ký tự tách)» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên toàn bộ bài S03 ở stg: bài sót theo bộ dò rộng từ 46 xuống 0; 0 bài nhận số 11 chữ số; mọi số trả về khớp ^\+84[35789]\d{8}$; 3 tin S03 rỗng SĐT mà bài có số thành có; test cố định bốn dạng sót (•, (+84), (0xx), hai ký tự tách)
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên toàn bộ bài S03 ở stg: bài sót theo bộ dò rộng từ 46 xuống 0; 0 bài nhận số 11 chữ số; mọi số trả về khớp ^\+84[35789]\d{8}$; 3 tin S03 rỗng SĐT mà bài có số thành có; test cố định bốn dạng sót (•, (+84), (0xx), hai ký tự tách)» khi hết timebox
- Timebox: …
