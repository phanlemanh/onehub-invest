---
schema_version: 1
slug: khoa-gom-hai-tang
feature: "Bộ đọc S03 gom bài thành tin theo hai tầng: bài cùng người, cùng chữ chuẩn hoá thành một bản chữ; các bản chữ chỉ gộp khi khớp người, loại, số phòng, diện tích, phân khu và mã toà/căn; bộ tìm mã nhận chữ thường và 1–4 chữ số"
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh — nguyên văn «Làm cả năm», trả lời câu «Cổng Đáng gom năm hàng mở sau cuộc soát S03 (GT8, GT5, GT6, DA45, DA46) cho làm cả năm không?» ở phiên giám sát
decided_at: 2026-11-18T23:13:44Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: GT5
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng GT5 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/dinh-vi-gom-tin-s03.md#b77428029e34624bf732a2bb51a21f1ef40976b6` — chưa có trang: trang đợt dinh-vi-gom-tin-s03-1011
Mốc: Một căn là một dòng: bài đăng lại và đổi giá của cùng người bán không thành dòng mới trên Căn giá tốt — chưa có ngày.

Bộ đọc S03 gom bài thành tin theo hai tầng: bài cùng người, cùng chữ chuẩn hoá thành một bản chữ; các bản chữ chỉ gộp khi khớp người, loại, số phòng, diện tích, phân khu và mã toà/căn; bộ tìm mã nhận chữ thường và 1–4 chữ số

Vì sao: Audit 09–10/11: trong 900 tin S03 có nhiều bản chữ khác nhau, 25% [17–35%] gộp nhầm khác căn (đọc tay 80 tin), 15% [5–36%] theo đồng thuận hai model lớn; 16/20 ca do khoá thiếu phân khu (ori, rb, bs, gh…) hoặc bộ tìm mã bỏ mã như S203, s1006.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên thước GT4 (120 nhãn audit 09–10/11), gộp nhầm ở tin nhiều bản chữ dưới 5% và tách nhầm không tăng, báo số trước và sau kèm cận Wilson; hai bản chữ khác phân khu không bao giờ chung tin; mọi offer_id cũ có đường nối sang tin mới» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên thước GT4 (120 nhãn audit 09–10/11), gộp nhầm ở tin nhiều bản chữ dưới 5% và tách nhầm không tăng, báo số trước và sau kèm cận Wilson; hai bản chữ khác phân khu không bao giờ chung tin; mọi offer_id cũ có đường nối sang tin mới
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên thước GT4 (120 nhãn audit 09–10/11), gộp nhầm ở tin nhiều bản chữ dưới 5% và tách nhầm không tăng, báo số trước và sau kèm cận Wilson; hai bản chữ khác phân khu không bao giờ chung tin; mọi offer_id cũ có đường nối sang tin mới» khi hết timebox
- Timebox: …
