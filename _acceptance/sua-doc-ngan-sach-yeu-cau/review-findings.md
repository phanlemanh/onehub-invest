# Review findings: sua-doc-ngan-sach-yeu-cau (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E7 hứa một chiều đỏ (min > max với bộ đọc gốc) mà lệnh đo không có đường chạy nào**
  Người dùng thấy gì: Phép đo ngân sách trên dữ liệu thật chưa có ca thử chứng minh nó biết báo đỏ khi đầu dưới lớn hơn đầu trên. Người dùng cuối không bị ảnh hưởng, chỉ là độ tin của lần kiểm thấp hơn mô tả.
  Căn cứ: Chỉ làm yếu bằng chứng kiểm, không làm sai dữ liệu của ai, và bổ sung ca thử sau này rẻ.
  file: `_acceptance/sua-doc-ngan-sach-yeu-cau/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Lệnh đo AC-7 đọc dịch vụ và tập bài khác đường chạy thật của tieuChiYeuCau**
  Người dùng thấy gì: Con số kiểm trên dữ liệu thật có thể không phản ánh hoàn toàn cách hệ thống đọc ngân sách khi ghi nhu cầu. Một số bài có thể bị đo như chưa rõ mua hay thuê.
  Căn cứ: Số đo có thể lệch nhẹ chứ không làm mất hay sai dữ liệu thật, và có thể đo lại sau khi chỉnh lệnh đo.
  file: `pipeline/scripts/do-ngan-sach-yeu-cau.mjs`
  severity: medium
  Đề xuất: known-limits

- **Khoảng có phần lẻ viết rời ở đầu dưới («2 tỷ 5 - 3 tỷ») bị đọc sai thành trần 2 tỷ**
  Người dùng thấy gì: Khi khách viết khoảng như «2 tỷ 5 - 3 tỷ», ngân sách bị ghi thành trần 2 tỷ thay vì 2,5 đến 3 tỷ, mà không có cảnh báo nào.
  Căn cứ: Ngân sách ghi sai âm thầm nhưng cách viết này khá hiếm, và sửa sau đòi một vòng riêng có ca thử.
  file: `pipeline/lib/yeu-cau.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lệnh đo AC-7 lấy dịch vụ chỉ từ chữ (docDichVu), không theo phát biểu thắng như đường nạp thật**
  Người dùng thấy gì: Phép kiểm trên dữ liệu thật có thể báo xanh ở vài bài mà khi ghi thật bộ đọc cho kết quả khác. Người dùng không thấy ngay, chỉ là mức chắc chắn thấp hơn.
  Căn cứ: Ảnh hưởng chỉ ở độ chính xác của lần đo, không mất dữ liệu, và đo lại được khi chỉnh lệnh.
  file: `pipeline/scripts/do-ngan-sach-yeu-cau.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình (hình 4): E7 đòi 0 bài thuê từ 100 triệu và 0 bài min lớn hơn max trên DB thật, nhưng hai bộ dò này chưa từng được cho đỏ**
  Người dùng thấy gì: Kết quả «không có bài nào sai» trên dữ liệu thật chưa có đối chứng, nên nếu bộ dò viết sai thì vẫn in ra 0 và tạo cảm giác an toàn giả.
  Căn cứ: Không làm hỏng dữ liệu nhưng làm người ký tin vào con số chưa được thử, và thêm ca thử là việc nhỏ nên nên làm thành vòng riêng.
  file: `pipeline/scripts/do-ngan-sach-yeu-cau.mjs`
  severity: high
  Đề xuất: new-contract

- **Assertion âm-tính-một-mình, thông điệp không ghim (hình 4): chiều đỏ của kiemBangCa không bao giờ chạm tới THIEU CA**
  Người dùng thấy gì: Phép kiểm bảng ca báo đỏ khi thiếu ca nhưng không chứng minh được nó chỉ ra đúng mã nào bị thiếu. Người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là nhãn lỗi trong công cụ kiểm nội bộ, không động tới dữ liệu và sửa lúc nào cũng được.
  file: `pipeline/scripts/yeu-cau-ngan-sach.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Tuyên quét lớp nhưng đếm gộp (hình 5): luật «mỗi mã có ít nhất hai ca» bị LOP gộp làm yếu, Ngoài-7 và Ngoài-9 mỗi mã chỉ có một ca**
  Người dùng thấy gì: Hai loại lỗi đầu dưới lớn hơn đầu trên chỉ có một ca thử mỗi loại dù mô tả nói ít nhất hai. Cách đọc ngân sách vẫn đúng với các ca đã nêu.
  Căn cứ: Chỉ là độ phủ ca thử mỏng hơn mô tả, không gây sai cho người dùng và thêm ca về sau rất rẻ.
  file: `pipeline/scripts/yeu-cau-ngan-sach.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
