## Trong hợp đồng

none — không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Trần cả probe là 900 s trong code, nhưng hồ sơ cam kết 180 s**
  Người dùng thấy gì: Bước kiểm tra có thể chạy tới 15 phút thay vì 3 phút như hồ sơ ghi. Chỉ phần chạy trên DB thử riêng không ảnh hưởng máy thu, nên lệch này làm hồ sơ ghi sai chứ không làm hỏng sản phẩm.
  Căn cứ: Hậu quả nhẹ: không mất dữ liệu, chỉ lệch giữa lời ghi và thực tế, người dùng không gặp gì; sửa sau vẫn rẻ nên ghi lại là đủ.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Comment đầu tệp probe còn mô tả phiên chặn trên DB dùng chung, trong khi `chan` nay chạy trên DB thử riêng**
  Người dùng thấy gì: Chú thích đầu tệp kiểm tra mô tả sai phạm vi an toàn, người đọc sau này có thể hiểu nhầm. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là lời chú thích cũ, không ảnh hưởng hoạt động hay dữ liệu; chi phí sửa không đáng mở thêm việc.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: low
  Đề xuất: wont-fix

- **pham-vi.sh: git diff lỗi thì vòng lặp rỗng và probe vẫn in PHAM VI OK**
  Người dùng thấy gì: Nếu kho git hỏng, bước kiểm phạm vi có thể báo đạt mà thực ra không kiểm tệp nào. Hiện tại nó chạy đúng, chỉ là rủi ro báo xanh giả trong tình huống hiếm.
  Căn cứ: Hậu quả nhẹ và hiếm: chỉ xảy ra khi kho git lỗi, lúc đó người dùng thấy ngay các lỗi khác; chạy lại là biết, nên chấp nhận và ghi lại.
  file: `_acceptance/sd3-test-chiu-song-song/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): hai phép đo 'khoá mạnh trên public' và 'khoá trên view public' của E2 không có đối chứng dương**
  Người dùng thấy gì: Phép đo xác nhận bộ test không giữ khoá trên dữ liệu dùng chung có thể đang mù mà vẫn báo đạt. Người dùng không thấy gì trực tiếp, nhưng độ tin cậy của lời cam kết giảm.
  Căn cứ: Không mất dữ liệu và không lộ ra cho người dùng; độ tin cậy của bằng chứng thấp hơn mong muốn nhưng bổ sung đối chứng sau này không đắt.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (đếm thay cho quan hệ): «chỉ hai câu đọc schema đổi từ public sang lược đồ riêng» chỉ đo bằng hiệu số lần xuất hiện 'public'**
  Người dùng thấy gì: Cách kiểm xem chỉ hai câu truy vấn được đổi hơi lỏng, nên một thay đổi lệch có thể lọt mà không bị phát hiện. Sản phẩm hiện tại không bị ảnh hưởng.
  Căn cứ: Chỉ làm bằng chứng kém chặt, không gây hại cho người dùng hay dữ liệu; người ký có thể tự soát lại bản đổi và sửa sau rẻ.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
