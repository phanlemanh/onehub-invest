---
schema_version: 1
slug: gan-nhan-theo-nhom-s03
feature: Người gắn nhãn mở mẫu của từng nhóm S03 trên /ops/labels cùng thẻ nhóm, gắn điều người trong nhóm hiểu gồm phân khu, trục, tầng, số WC, bài nhiều căn, người bán, SĐT, mỗi trường ghi căn cứ, bài phải dùng ngữ cảnh ghi lý do, rồi xem máy đọc gì để ghi loại trường hợp, và thấy bảng trường hợp theo nhóm
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # Mạnh gõ «Làm luôn GC0» trong phiên, chiều 04/11
decided_by: Mạnh 04/11 «Làm luôn GC0»; ngưỡng dưới là đề xuất của máy, chưa được duyệt riêng
decided_at: 2026-11-04T09:00:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: GC0
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng GC0 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt gan-can-s03-0411, mã GC0
Mốc: Việc đầu tiên sau 05/11: tin căn hộ S03 gắn được toà hoặc trục, diện tích suy ra hiện có nhãn, bắt đầu từ Ocean Park — chưa có ngày.

Người gắn nhãn mở mẫu của từng nhóm S03 trên /ops/labels cùng thẻ nhóm, gắn điều người trong nhóm hiểu gồm phân khu, trục, tầng, số WC, bài nhiều căn, người bán, SĐT, mỗi trường ghi căn cứ, bài phải dùng ngữ cảnh ghi lý do, rồi xem máy đọc gì để ghi loại trường hợp, và thấy bảng trường hợp theo nhóm

Vì sao: Đo 04/11: chưa có nhãn người nào, số độ đúng đều do tác tử Claude gắn. Màn PL7 đã có nhưng thiếu các trường trên và chưa có lượt ghi trường hợp. PL13, PL20, GC2 đều chấm trên tập test có nhãn người. Mạnh 04/11: chỉ nhìn chữ thì không biết tin thuộc đâu (`RB` là Rainbow, nhóm mặc định Grand Park); 2.629/3.583 tin căn hộ không nêu dự án trong chữ.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Chọn mẫu theo nhóm chạy lại không thêm dòng; lượt xem máy đọc không đổi được nhãn mù; bảng trường hợp khớp đếm SQL độc lập; 0 nhãn rời máy thu» chưa?
- Kết quả nào là SỐNG: [đề xuất] Mạnh và đội gắn trọn 30 bài của một nhóm trên màn mới, đủ phân khu, trục, tầng, WC, người bán, SĐT, căn cứ và lý do, không phải dùng bảng tính; bảng trường hợp theo nhóm ra được danh sách để viết quy ước.
- Kết quả nào là CHẾT: [đề xuất] người gắn vẫn phải ghi ngoài màn, hoặc nhãn mù bị đổi sau khi xem máy đọc, hoặc nhãn rời máy thu.
- Timebox: [đề xuất] đọc kết quả ngay sau lượt gắn đầu tiên trên màn mới.
