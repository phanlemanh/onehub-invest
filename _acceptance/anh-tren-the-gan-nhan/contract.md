---
schema_version: 1
feature: Màn gắn nhãn hiện ảnh bài S03 ngay trong thẻ thay cho dòng link, xem lớn được để đọc chữ trên ảnh
slug: anh-tren-the-gan-nhan
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api]
status: approved
design_doc: docs/superpowers/specs/2026-11-05-anh-tren-the-gan-nhan-design.md
approved_by: Mạnh
approved_at: 2026-11-05
---

# Acceptance Contract: anh-tren-the-gan-nhan

## Context

Mạnh báo khi gắn nhãn: ảnh chỉ là một dòng link. 180/367 bài của lát chỉ có link. Việc này hiện ảnh trong thẻ, ẩn link, giữ gắn mù. Lệch lời giao ở một chỗ: ảnh chỉ có URL đi qua máy chủ, không tải thẳng từ trình duyệt (Hỏi-2). Giao diện duyệt bằng chữ, chưa có bản mẫu bấm được (Hỏi-3).

Source input: lời Mạnh 05/11 qua giám sát.

## Criteria

- AC-1: Given bài có `http(s)://`, `www.` hay dạng tên miền trong chữ, When tính chữ hiện, Then chúng biến khỏi chữ hiện; bài chỉ có link cho chữ rỗng, chữ lẫn ảnh giữ phần chữ, link không thuộc ảnh được đếm; chữ lưu và băm chữ khi ghi nhãn vẫn tính trên chữ gốc.
- AC-2: Given bài có tệp đã lưu, có URL gốc, có dòng lỗi tải hoặc không có ảnh, When dựng danh sách ảnh, Then tệp đã lưu đứng trước, URL chỉ dùng khi không có tệp, không trùng, và dữ liệu xuống trình duyệt không chứa URL gốc hay tên miền.
- AC-3: Given chế độ `?nhan=&anh=` của `/api/zalo-media`, When gọi bằng tham số hợp lệ, Then trả tệp đã lưu, không có tệp thì máy chủ lấy hộ; tham số sai, thứ tự ngoài khoảng, `file` trong DB có `..` hay symlink ra ngoài, vai Người xem, chưa đăng nhập, bảng vắng trên cloud đều không trả ảnh; cây snapshot không đổi byte nào. (cross-layer)
- AC-4: Given bài có ảnh, When mở thẻ, Then thấy ô tải rồi ảnh; bấm ảnh mở hộp xem lớn không cắt ảnh, đóng được bằng Esc, ô ảnh dùng được bằng bàn phím, lượt hai cũng thấy ảnh.
- AC-5: Given ảnh không tải được, bài chỉ có link khác, hoặc bài không gì, When mở thẻ, Then thấy «Ảnh không tải được» kèm Thử lại, hoặc «Bài có N liên kết khác», hoặc câu trống; biểu mẫu vẫn lưu được nhãn.
- AC-6: Given người gắn chưa lưu bài và các bảng mang giá trị máy đọc (`silver_labels`, `field_assertions`, `enrichment_proposals`) có mồi đặc trưng, When tải thẻ, Then kết quả truy vấn, HTML và phản hồi của trang không có giá trị mồi; đối chiếu lượt hai giữ nguyên trừ trường ảnh. (cross-layer)
- AC-7: Given mã, hồ sơ, ảnh chứng, When quét, Then không có tên miền hay URL nguồn; fixture dùng ảnh giả và `example.test`; mẫu đã sinh không đổi dòng nào.
- AC-8: Given Hỏi-1 chọn thêm, When áp 075 hai lần trên DB thử rồi bấm căn cứ «Ảnh» trên màn và lưu, Then API lưu `anh`, bảng so vẫn tính, nhãn cũ không đổi, giá trị lạ bị từ chối, và `oneinvest` không đổi. (cross-layer)
- AC-9: Given 367 bài thật của lát, đọc qua kết nối chỉ đọc, When chạy hàm thật, Then 283 bài có ảnh, 199 có tệp và cả 199 tệp qua đường phục vụ trả ảnh, 84 chỉ có URL với số lấy được và không lấy được in ra, 0 bài còn tên miền trong chữ hiện.

## Coverage

Thước là đo 05/11 trên 367 bài của lát (design doc):

- Loại bài: chỉ link (AC-1) · chữ lẫn ảnh (AC-1, AC-4) · có tệp, chỉ URL, lỗi tải (AC-2, AC-3, AC-5) · không gì (AC-5) · link khác (AC-1).
- Trạng thái ảnh: tải, có, lỗi, trống, xem lớn (AC-4, AC-5).
- Ranh giới: vai, cloud, đường dẫn, gắn mù, tên nguồn (AC-3, AC-6, AC-7).
- Dữ liệu thật: khuôn `media`, `media_files` và đường lấy hộ trên 367 bài (AC-9).

Later: nhiều ảnh mỗi bài đang là 1, vẫn hiện dải được. Never: đọc giá trị máy đọc ảnh lên màn.

## Out of scope

- Sửa `ops/review-photos.tsx` và `/ops/review`.
- Tải lại ảnh lỗi về snapshot: snapshot bất biến.
- Xoá hay sửa mẫu đã sinh, nhãn đã lưu.
- Áp 075 lên DB thật: xin giám sát kèm `pg_dump`.

## Notes

- Dùng cổng dev 3463 của dãy P4 cho phép đo giao diện, DB thử `oneinvest_anh_nhan`.
- 36/84 bài chỉ có URL đã mất ảnh ở nguồn (URL gốc trả 400), không phục hồi được; các bài này hiện «Ảnh không tải được».
- Thứ tự triển khai: áp 075 trên DB thật trước khi gộp, xin giám sát kèm `pg_dump`. Nhãn đang gắn dùng `chu_bai` không bị ảnh hưởng.
