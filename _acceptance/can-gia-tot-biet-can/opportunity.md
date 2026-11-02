---
schema_version: 1
slug: can-gia-tot-biet-can
feature: "Người vận hành mở một căn trên Căn giá tốt và biết căn nào, ở đâu, ảnh gì, vì sao giá tốt: giá/m² so với thước, số tin dựng thước, mức giảm so với ngưỡng; căn thiếu dữ liệu ghi rõ thiếu gì"
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: CG1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng CG1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt can-gia-tot-0311, mã CG1
Mốc: chưa gắn — Mạnh không nêu hạn; không chen vào mốc ra mắt 05/11, từ 22:00 ngày 04/11 chỉ gộp bản vá đường ống.

Người vận hành mở một căn trên Căn giá tốt và biết căn nào, ở đâu, ảnh gì, vì sao giá tốt: giá/m² so với thước, số tin dựng thước, mức giảm so với ngưỡng; căn thiếu dữ liệu ghi rõ thiếu gì

Vì sao: Phiên nghiệm thu people-hien-so-goc 03/11: Mạnh chấm 3, «Không sử dụng được» (PR #282, docs/plan/pham-vi-can-gia-tot-0311.md). Hợp đồng SD4 để ảnh và chữ bài chỉ cho admin; 3/4 căn hôm nay có dòng ảnh trong bảng media, route ?media= đã mở cho vai Vận hành.

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Biết căn và thấy bằng chứng giá tốt là thứ chặn việc gọi người bán, không phải chỉ thiếu số căn | Làm đẹp 4 căn mà Mạnh vẫn chấm thấp | Cho Mạnh chấm trên 4 căn hôm nay trước khi CG2 giao | Chưa thử |
| 2 | Ảnh và chữ bài đủ để biết căn: S03 không có đường nào, có mã toà ở 815/1.252 tin | Vẫn không biết ở đâu, phải hỏi người bán | Đọc thẻ của mẫu ở Cổng Giá trị | Chưa thử |

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: Chỉ nhìn trang một căn, không mở nguồn nào khác, người vận hành có trả lời được căn nào, ở đâu, ảnh gì, vì sao giá tốt, gọi ai, đủ để chọn căn sẽ gọi không?
- Kết quả nào là SỐNG: [đề xuất] Trên mẫu 20 căn ngẫu nhiên của danh sách (hoặc mọi căn nếu ít hơn), người vận hành trả lời đúng ít nhất 4 trong 5 câu ở từ 80% căn; 100% căn hiện giá/m², thước, số tin dựng thước và mức giảm so với ngưỡng, hoặc ghi rõ thiếu gì; chọn được 5 căn để gọi trong 10 phút; Mạnh chấm kín từ 7/10.
- Kết quả nào là CHẾT: [đề xuất] Mạnh chấm kín từ 5/10 trở xuống; hoặc hơn nửa mẫu vẫn phải mở nguồn ngoài mới biết căn ở đâu; hoặc vai Người xem nhận được ảnh, chữ bài hay SĐT.
- Timebox: [đề xuất] 3 giờ máy; đọc số ở phiên nghiệm thu khi danh sách có từ 20 căn (cần CG2). Hôm nay có 4 căn: đọc sớm trên 4 căn là số định hướng, không phải kết quả.
