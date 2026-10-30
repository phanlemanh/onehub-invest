---
schema_version: 1
slug: sellers-them-dong-lai
feature: Bước tổng hợp người bán thêm dòng cho mọi SĐT mới trên tin, không chỉ cập nhật và xoá dòng đã có
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T16:42:21Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: SD1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng SD1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/nguoi-va-sdt.md#829234f6062a7e911b8cf66d79cdddbf88551945` — chưa có trang: trang đợt nguoi-sdt-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.
Cổng Đáng: build — Mạnh duyệt ở phiên giám sát, nguyên văn «Cổng Đáng build 6 hàng audit Người theo thứ tự đề xuất» (`docs/plan/pham-vi-nguoi-sdt-3010.md`); giám sát chuyển SD1 từ dãy P3 sang U2 (30/10).

Bước tổng hợp người bán thêm dòng cho mọi SĐT mới trên tin, không chỉ cập nhật và xoá dòng đã có

Vì sao: Audit bảng Người theo trục SĐT 30/10 (docs/research/audit-bang-nguoi-sdt-3010.md §0 N3, Hỏi-C bước 1): commit 907f4bd4 bỏ INSERT ở transform, refresh-bait-gap chỉ UPDATE/DELETE nên sellers teo còn 19 dòng; chip môi giới /ops/deals thiếu 142/161 SĐT.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Chạy bước bait gap trên DB hiện tại: số dòng sellers bằng số SĐT khác nhau trên sale_offers (hôm nay 19 so với 161); chạy lại lần hai không đổi số dòng; test đỏ khi bỏ lệnh thêm dòng» chưa?
- Kết quả nào là SỐNG: [đề xuất] Chạy bước bait gap trên DB hiện tại: số dòng sellers bằng số SĐT khác nhau trên sale_offers (hôm nay 19 so với 161); chạy lại lần hai không đổi số dòng; test đỏ khi bỏ lệnh thêm dòng
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Chạy bước bait gap trên DB hiện tại: số dòng sellers bằng số SĐT khác nhau trên sale_offers (hôm nay 19 so với 161); chạy lại lần hai không đổi số dòng; test đỏ khi bỏ lệnh thêm dòng» khi hết timebox
- Timebox: …
