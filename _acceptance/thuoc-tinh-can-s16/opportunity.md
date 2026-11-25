---
schema_version: 1
slug: thuoc-tinh-can-s16
feature: Người vận hành mở trang một dự án trong Danh bạ Ops máy thu và thấy diện tích thông thuỷ, tim tường, phòng ngủ, WC, hướng, loại hình, tầng, giá chủ đầu tư của từng căn S16 (nguồn S16, mốc thu) cùng ô phủ của dự án — thuộc tính lưu theo trường RESO, đọc được theo khoá căn
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build
decided_by: Mạnh
decided_at: 2026-11-18T00:00:00Z
prototype:
  base_commit:
  disposition:
lo_trinh_ma: DA40
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Cổng Đáng: «build» theo lời Mạnh gõ ở phiên điều phối liên làn ngày 18/11 (nguyên văn):
«đưa bộ thuộc tính căn S16 (enrich từ chủ đầu tư) vào pipeline» ·
«Tôi muốn dữ liệu được hiển thị trong danh bạ để tôi có thể kiểm tra.» ·
«Vậy đưa vào kế hoạch thực hiện».
Giám sát đợt ghi theo bản ghi đó, không có lượt hỏi mới.

Mở từ hàng DA40 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`, PR #482 chưa gộp).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/dot/thuoc-tinh-can-s16-1811.md#62fdd5c5781f03e36d2a894bc8d58a73b3162684`

Người gặp: Mạnh / người vận hành Ops máy thu — danh bạ có 111.329 căn S16 nhưng không căn nào có diện tích hay giá, không kiểm
được dữ liệu chủ đầu tư đã thu.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] ô phủ trên trang dự án Danh bạ máy thu có đi từ 0 lên đúng lệnh đếm trên dữ liệu thật chưa?
- Kết quả nào là SỐNG: [đề xuất] ô phủ của dự án từ 0 lên đúng lệnh đếm (đo 18/11 trên căn danh bạ: grand-park 37.589/37.997,
  smart-city 2.546/22.119; star-city chưa có căn danh bạ); căn danh bạ có diện tích khoảng 84.800 (95.798 trên toàn tệp thu),
  có giá chủ đầu tư khoảng 11.850 (14.911 trên toàn tệp thu); căn chưa có thuộc tính hiện trống có nhãn; dữ liệu không rời máy;
  chạy lại không đổi số.
- Kết quả nào là CHẾT: [đề xuất] số trên màn khác lệnh đếm độc lập, hoặc thuộc tính S16 xuất hiện ở bảng/route lên cloud.
- Timebox: theo nhịp đợt dot0-cam-mau.

## Ghi chú

Số lộ trình («khoảng 95.800 diện tích, 14.900 giá») đếm trên toàn tệp thu; trên căn đã có trong danh bạ là 84.820 và 11.852 —
10.978 khoá có thuộc tính nằm ở bốn dự án S16 chưa nối hoặc mã chưa có căn (bảng phủ ca §1).
