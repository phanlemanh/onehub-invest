---
schema_version: 1
slug: thuoc-tinh-can-s16-rut-khi-mo-ho
feature: Căn S16 đã có thuộc tính mà lần thu sau chuyển sang nhóm mơ hồ toà thì phát biểu thuộc tính cũ bị rút với lý do riêng và trang dự án Danh bạ không còn hiện thuộc tính cũ
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-18T21:46:59Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DA48
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DA48 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/sau-soat-s03-1911.md#6b2ffa5d717b660a7cc8fdae18fd2f08d9de63b7` — chưa có trang: mã DA48
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Căn S16 đã có thuộc tính mà lần thu sau chuyển sang nhóm mơ hồ toà thì phát biểu thuộc tính cũ bị rút với lý do riêng và trang dự án Danh bạ không còn hiện thuộc tính cũ

Vì sao: Ngoài-7 ở Cổng Bằng chứng DA40: Mạnh chọn «mở hợp đồng mới» (18/11 21:46Z). Hôm nay 0 căn bị ảnh hưởng; lỗi lộ từ lần ghi thứ hai.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Ca cấy trên DB thử (căn có thuộc tính, lần thu sau vào nhóm mơ hồ toà) đỏ trước khi sửa, xanh sau; phát biểu bị rút mang lý do riêng, khác lý do rút thường; chạy lại cùng lần thu rút 0 dòng; trên DB máy thu hôm nay 0 căn bị ảnh hưởng, số căn có thuộc tính không đổi» chưa?
- Kết quả nào là SỐNG: [đề xuất] Ca cấy trên DB thử (căn có thuộc tính, lần thu sau vào nhóm mơ hồ toà) đỏ trước khi sửa, xanh sau; phát biểu bị rút mang lý do riêng, khác lý do rút thường; chạy lại cùng lần thu rút 0 dòng; trên DB máy thu hôm nay 0 căn bị ảnh hưởng, số căn có thuộc tính không đổi
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Ca cấy trên DB thử (căn có thuộc tính, lần thu sau vào nhóm mơ hồ toà) đỏ trước khi sửa, xanh sau; phát biểu bị rút mang lý do riêng, khác lý do rút thường; chạy lại cùng lần thu rút 0 dòng; trên DB máy thu hôm nay 0 căn bị ảnh hưởng, số căn có thuộc tính không đổi» khi hết timebox
- Timebox: …

## Quyết định Cổng Đáng

Mạnh chọn tại Cổng Bằng chứng của `thuoc-tinh-can-s16` (DA40), nguyên văn: «Ngoài-7: mở hợp đồng mới». Mục đó là: căn chuyển sang mơ hồ toà ở lần thu sau vẫn giữ phát biểu cũ.
