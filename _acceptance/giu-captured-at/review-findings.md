# Review findings: giu-captured-at (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC — 5/5 eval đạt)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Nạp lại snapshot Chợ Tốt cũ làm giá tin lùi về giá cũ trong khi tin vẫn ghi là của snapshot mới**
  Người dùng thấy gì: Nếu có lượt nạp lại snapshot cũ, giá và nội dung tin Chợ Tốt trên cổng Invest lùi về giá cũ mà không báo, tới lượt nạp đêm sau mới đúng lại.
  Căn cứ: Ảnh hưởng thẳng tới giá người dùng nhìn thấy và khó phát hiện, nhưng chỉ xảy ra khi có người nạp lại snapshot cũ (hiện 0 dòng bị ảnh hưởng, và luật tự kiểm trên bản chép đã cấm nạp lại lên DB thật); nên sửa bằng một việc riêng sau khi khôi phục mốc.
  file: `pipeline/import-chotot.mjs`
  severity: medium
  Đề xuất: new-contract

- **Script khôi phục và importer Zalo dùng hai luật khác nhau khi snapshot nạp lệch thứ tự**
  Người dùng thấy gì: Hiện không thấy gì; chỉ khi một tin xuất hiện ở hai snapshot nạp ngược thứ tự thì hai công cụ đặt hai mốc khác nhau.
  Căn cứ: Trên DB thật chưa tin nào nằm ở hơn một snapshot, nên không có dòng bị ảnh hưởng; ghi lại là đủ.
  file: `pipeline/restore-captured-at.mjs`
  severity: low
  Đề xuất: known-limits

- **Lượt khôi phục đổi cả dòng chỉ lệch vài giây và dòng dữ liệu thử, nhiều hơn số dòng của sự cố**
  Người dùng thấy gì: Số dòng đổi khi khôi phục (khoảng 5.700 Zalo, 17.800 Chợ Tốt) lớn hơn số dòng của sự cố (4.092 và 15.515), vì mọi dòng lệch giờ thu dù vài giây cũng được đưa về giờ thu.
  Căn cứ: Hướng đổi luôn là về đúng giờ thu nên không làm sai dữ liệu, chỉ làm số trước/sau trong sổ khác số sự cố; có sao lưu để hoàn tác.
  file: `pipeline/restore-captured-at.mjs`
  severity: low
  Đề xuất: known-limits

- **Tệp sao lưu chỉ giữ tới mili-giây và không chép snapshot đang trỏ**
  Người dùng thấy gì: Hoàn tác trả lại mốc lệch dưới một phần nghìn giây, và nếu hoàn tác sau một lượt nạp đêm thì một số tin Chợ Tốt có mốc không khớp snapshot đang trỏ.
  Căn cứ: Sai lệch nhỏ hơn mọi phép đo độ tươi và chỉ xảy ra khi phải hoàn tác, việc hiếm; ghi lại là đủ.
  file: `pipeline/restore-captured-at.mjs`
  severity: low
  Đề xuất: known-limits
