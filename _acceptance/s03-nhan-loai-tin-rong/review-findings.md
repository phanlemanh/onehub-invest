## Trong hợp đồng

- **DAU_HIEU_BDS coi «<số> năm/nữ/nét…» là dấu hiệu BĐS vì \b của JS không nhận chữ có dấu**
  AC: AC-5
  file: `pipeline/transform-zalo.mjs:254`
  severity: medium
  source: bugs
  detail: Nhánh `\d+\s*n\s*\+?\s*\d?\b` trong DAU_HIEU_BDS dùng để bắt «2n», «2n1». Nhưng `\b` của JS chỉ hiểu ký tự ASCII, kể cả khi có cờ u/i, nên chữ có dấu như ă/ữ/é bị coi là ký tự ngoài từ, và ranh giới từ vẫn khớp ngay sau chữ «n». Hệ quả là «5 năm», «1 năm», «3 nữ» đều được tính là dấu hiệu BĐS. Cửa vào của suyLoai (bắt buộc có giá + dấu hiệu BĐS) vì thế mở cho bài không phải BĐS. Đã chạy thử: coDauHieuBds("Cho vay 500tr thời hạn 1 năm, thu về lãi") = true, và suyLoai trả { kind: 'rent_lt', nguon: 'don-vi-gia' }. Bài cho vay này thành tin thuê và được ghi vào sale_offers mà không có dòng log nào báo. Cách sửa: thay `\b` bằng lookahead âm có chữ có dấu, ví dụ `(?![a-zà-ỹđ])`, giống cách CO_TY đang làm.
  rationale: AC-5 yêu cầu bài thiếu dấu hiệu BĐS không được nhận thành tin; bài cho vay «1 năm» bị nhận thành tin thuê nên AC-5 thất bại.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (âm tính một mình): «tin bán < 300 triệu không tăng» trên DB không có mồi đối chứng dương**
  Người dùng thấy gì: Kiểm tra trên dữ liệu thật chưa chứng minh được rằng sàn giá chặn tin bán dưới 300 triệu, vì có thể lô thật không có bài nào rơi vào dải đó. Người dùng vẫn được bảo vệ bởi luật sàn giá đã kiểm ở mức ma trận viết tay.
  Căn cứ: Hậu quả nhẹ: không làm mất hay lộ dữ liệu, chỉ là bằng chứng đo chưa chặt, và bổ sung bài đối chứng sau này rẻ, không ảnh hưởng người dùng.
  file: `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): SLT-DC-10 kiểm phân tầng bằng số `moiTang` do chính layMau tự báo, không kiểm các dòng đã ghi**
  Người dùng thấy gì: Việc kiểm mẫu gắn nhãn chia ba tầng bằng nhau trên dữ liệu thật dựa vào số tự khai của công cụ lấy mẫu, chưa đọc lại các dòng đã ghi. Nếu công cụ ghi sai tầng mà vẫn báo đúng thì kiểm tra không phát hiện.
  Căn cứ: Hậu quả nhẹ: chỉ ảnh hưởng độ tin cậy của mẫu chấm nhãn nội bộ, không đụng dữ liệu người dùng, và người dùng có thể chạy lại lấy mẫu để thử lại.
  file: `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs`
  severity: low
  Đề xuất: known-limits

- **SLT-DC-10 sẽ đỏ vĩnh viễn ngay khi lát s03-loai-tin được lấy mẫu thật trên DB máy thu (r1 · tệp đã đổi)**
  Người dùng thấy gì: Sau khi lấy mẫu thật để gắn nhãn, một ca kiểm tự động sẽ báo đỏ dù tính năng vẫn đúng. Người dùng không thấy gì khác lạ, chỉ người vận hành thấy báo động giả.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, chỉ gây báo đỏ giả cho người vận hành; sửa lúc nào cũng rẻ.
  file: `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **YEU_CAU gạt nhầm câu mời xem nhà rất thường gặp của người bán («Khách thiện chí xem nhà…») thành Yêu cầu (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một số tin bán có câu mời «khách thiện chí xem nhà» sẽ bị coi là người mua tìm nhà và không thành tin bán. Người dùng thấy thiếu một phần tin bán.
  Căn cứ: Chỉ làm hụt một phần tin bán, không mất dữ liệu gốc vì bài vẫn còn nguyên và có thể nhận lại khi chỉnh luật.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
