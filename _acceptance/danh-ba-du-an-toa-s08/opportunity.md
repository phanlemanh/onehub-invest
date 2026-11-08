---
schema_version: 1
slug: danh-ba-du-an-toa-s08
feature: "Danh bạ dự án–toà–trục–căn mở ra toàn bộ 150 dự án của danh mục S08: mọi dự án có trạng thái nối, 83 dự án cao tầng có toà–trục–căn, mỗi dự án gắn xã/phường hiện hành"
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PX2
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PX2 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt danh-ba-0811, mã PX2
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Danh bạ dự án–toà–trục–căn mở ra toàn bộ 150 dự án của danh mục S08: mọi dự án có trạng thái nối, 83 dự án cao tầng có toà–trục–căn, mỗi dự án gắn xã/phường hiện hành

Vì sao: Mạnh 08/11 «Đồng ý»: hiện mới có 20 dự án, 3 toà dùng chung; DB1 mới đo ở Ocean Park 1 và Grand Park. S08 có 39.888 căn của 150 dự án.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Lệnh dựng DB1 chạy cho cả 150 dự án trên DB máy thu, chạy lại ra 0 mã mới; mỗi dự án có xã/phường; số toà/trục/căn theo dự án có trên /ops; 150/150 dự án có trạng thái nối (noi hoặc tu_choi có lý do); 83 dự án cao tầng có toà khớp số toà S08; 67 dự án thấp tầng chỉ có nút dự án, lô chờ DA12» chưa?
- Kết quả nào là SỐNG: [đề xuất] Lệnh dựng DB1 chạy cho cả 150 dự án trên DB máy thu, chạy lại ra 0 mã mới; mỗi dự án có xã/phường; số toà/trục/căn theo dự án có trên /ops; 150/150 dự án có trạng thái nối (noi hoặc tu_choi có lý do); 83 dự án cao tầng có toà khớp số toà S08; 67 dự án thấp tầng chỉ có nút dự án, lô chờ DA12
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Lệnh dựng DB1 chạy cho cả 150 dự án trên DB máy thu, chạy lại ra 0 mã mới; mỗi dự án có xã/phường; số toà/trục/căn theo dự án có trên /ops; 150/150 dự án có trạng thái nối (noi hoặc tu_choi có lý do); 83 dự án cao tầng có toà khớp số toà S08; 67 dự án thấp tầng chỉ có nút dự án, lô chờ DA12» khi hết timebox
- Timebox: [đề xuất] một vòng feature-loop (≤3 lượt chấm S4) cộng lần dựng đầu trên DB máy thu ngay sau gộp (lời riêng của Mạnh + pg_dump trước), tính từ khi DA1 và DA3 đã ký

## Phụ thuộc chưa xong (máy soát 08/11)

- Lộ trình khai PX2 `dung_tren` DB1b, PX1, DA1, DA3. DB1b (`dung-danh-ba-may-thu`) và PX1 (`danh-ba-phuong-xa-toan-quoc`) đã ký; DA1 (`danh-ba-vat-the-toan-quoc`) và DA3 (`bang-noi-ma-du-an`) CHƯA có hồ sơ.
- Ngưỡng sống «150/150 dự án có trạng thái nối» cần thẻ nối của DA3 cho 142 dự án chưa nối; dự án ngoài Hà Nội, TP.HCM cần mã tỉnh, mã toà của DA1. Làm PX2 trước hai hàng này thì ngưỡng không đạt được trong timebox.
- Khuyến nghị: [đề xuất] park tới khi DA1 và DA3 đã ký, rồi build với ngưỡng như trên. Lối khác: build ngay với ngưỡng thu hẹp (dựng 150 dự án và gắn xã/phường, trạng thái nối và toà ngoài HN/HCM để lại cho DA1, DA3); giá là đổi lời ngưỡng đã duyệt ở lộ trình và làm lại một phần khi DA1 đổi khuôn mã.
