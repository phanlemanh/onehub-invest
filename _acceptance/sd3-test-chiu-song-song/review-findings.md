# Review findings: sd3-test-chiu-song-song (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe E1 khoá DB dùng chung `oneinvest` (33033, khoá dòng, ACCESS EXCLUSIVE) thay vì dùng DB thử như các probe khác**
  Người dùng thấy gì: Lúc nghiệm thu, phép thử có thể giữ khoá trên cơ sở dữ liệu máy thu thật trong vài chục giây, làm đồng bộ đêm hoặc app dev chạy cùng lúc bị chậm hoặc tạm kẹt. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ và tự hết vì phiên chặn có hạn tự nhả, không mất dữ liệu; chỉ xảy ra khi chạy nghiệm thu nên ghi lại để lưu ý là đủ.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Probe gán cứng DB cho phiên chặn nhưng để tiến trình test con tự đọc DATABASE_URL từ môi trường**
  Người dùng thấy gì: Nếu máy chạy nghiệm thu trỏ sang cơ sở dữ liệu khác, phép thử có thể báo đạt dù không thật sự bị chặn, nên kết quả nghiệm thu có thể lạc quan hơn thực tế. Không ảnh hưởng người dùng cuối.
  Căn cứ: Chỉ làm chứng cứ nghiệm thu kém tin cậy trong cấu hình môi trường lạ, không mất dữ liệu, chạy lại với môi trường đúng là kiểm được ngay.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Tệp test bản merge-base chép tạm vào pipeline/scripts/*.test.mjs có thể bị bỏ lại và lọt vào `npm test`**
  Người dùng thấy gì: Nếu phép thử bị ngắt giữa chừng, một tệp kiểm tạm cũ có thể nằm lại và làm lượt kiểm tự động sau đó chậm hoặc treo lại như lỗi đang sửa. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ xảy ra khi phép thử bị ngắt bất thường, nhân viên thấy ngay và xoá tay được, không mất dữ liệu.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: low
  Đề xuất: known-limits

- **Probe E3 không bao giờ rút được regex của assert.rejects: đổi thông điệp regex vẫn ra ASSERT OK**
  Người dùng thấy gì: Phép kiểm 'giữ nguyên lời hứa cũ' không phát hiện được nếu ai đó đổi câu mô tả lỗi của một ca kiểm, nên một thay đổi nhỏ có thể lọt qua nghiệm thu. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Hậu quả chỉ là một thay đổi lời mô tả trong ca kiểm có thể không bị bắt; không mất dữ liệu và người xem lại mã vẫn thấy được.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): E3 nói so cả regex của assert.rejects nhưng bộ rút không bắt được regex nào**
  Người dùng thấy gì: Phép kiểm tuyên bố so cả lời mô tả của ca kiểm 'phải báo lỗi' nhưng thực tế bỏ sót phần này, nên độ tin cậy của nghiệm thu thấp hơn lời tuyên bố. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Chỉ làm chứng cứ nghiệm thu yếu hơn quảng cáo ở một phần nhỏ, không mất dữ liệu, ghi lại để người ký biết giới hạn là đủ.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
