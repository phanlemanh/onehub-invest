---
schema_version: 1
slug: s03-cam-mau-so-lieu
feature: Transform S03 đọc giá và diện tích từ chữ bài đã bỏ URL và SĐT, chuẩn hoá cách viết giá của môi giới, gom repost theo mã toà/căn khi thiếu phường và diện tích, ghi tên người bán và phường theo thị trường của nhóm
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T01:02:02Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: N1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng N1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/doc-tin-va-anh-s03.md#f8309103b3e889771b9b3a5606cd98bfe0fc13b7` — chưa có trang: trang đợt doc-tin-anh-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Transform S03 đọc giá và diện tích từ chữ bài đã bỏ URL và SĐT, chuẩn hoá cách viết giá của môi giới, gom repost theo mã toà/căn khi thiếu phường và diện tích, ghi tên người bán và phường theo thị trường của nhóm

Vì sao: Đo 30/10 (docs/research/s03-boc-tach-cau-truc-3010.md §3, §9): 579 bài bán đọc ra trên 100 tỷ, giá đọc từ URL ảnh, một offer gom 278 bài với 67 nội dung, seller_name S03 0%, phường chỉ nạp Hà Nội. Cầm máu bằng luật; ý định bán/thuê không vá bằng regex mà đi PL5.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Nạp lại S03: 0 offer thuê giá ≥ 1 tỷ, 0 offer bán trên 100 tỷ, 0 giá đọc từ URL; mọi ca thử số lấy từ bài thật xanh; không offer nào gom quá 10 nội dung khác nhau; seller_name S03 ≥ 95%; bài nhóm TP.HCM có tên phường thì ra phường vn-hcmc-*» chưa?
- Kết quả nào là SỐNG: [đề xuất] Nạp lại S03: 0 offer thuê giá ≥ 1 tỷ, 0 offer bán trên 100 tỷ, 0 giá đọc từ URL; mọi ca thử số lấy từ bài thật xanh; không offer nào gom quá 10 nội dung khác nhau; seller_name S03 ≥ 95%; bài nhóm TP.HCM có tên phường thì ra phường vn-hcmc-*
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Nạp lại S03: 0 offer thuê giá ≥ 1 tỷ, 0 offer bán trên 100 tỷ, 0 giá đọc từ URL; mọi ca thử số lấy từ bài thật xanh; không offer nào gom quá 10 nội dung khác nhau; seller_name S03 ≥ 95%; bài nhóm TP.HCM có tên phường thì ra phường vn-hcmc-*» khi hết timebox
- Timebox: …
