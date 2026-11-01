## Trong hợp đồng

- **Hình dạng 3 (đo chuỗi/đếm thay cho quan hệ): AC-3 hứa «chỉ hai câu đọc schema đổi» nhưng probe chỉ đếm hiệu số chữ 'public', và đã để lọt một chỗ đổi thứ ba**
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs:200`
  severity: medium
  AC: AC-3
  source: measurement
  detail: Dòng 198-200: `docPublic(cu) - docPublic(moi) === 2` chỉ đếm số lần xuất hiện `'public'(::regnamespace)?` trong phần thân ca, chứ không so thân ca của bản cũ với bản mới. Lời hứa của AC-3 là một quan hệ giữa hai phiên bản: ngoài hai câu đọc schema, không gì khác trong thân ca được đổi. Chính diff đã có chỗ đổi thứ ba mà probe không bắt: ca «SD-AC-1 đỏ» (bait-gap-sellers.test.mjs:185) đổi đối số sql060 từ `sai.replace("CREATE OR REPLACE VIEW sellers", "DROP VIEW IF EXISTS sellers; CREATE VIEW sellers")` thành `sai`. Thay đổi này không chứa 'public' nên hiệu số vẫn bằng 2 và E3 vẫn in ASSERT OK. Kể cả khi có thêm câu đổi 'public' ở chỗ khác bù cho chỗ khác, phép đếm cũng không thấy.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **pham-vi.sh does not check the exit status of git diff, so a failed listing gives a false 'PHAM VI OK'**
  Người dùng thấy gì: Nếu việc liệt kê tệp đổi bị hỏng giữa chừng, bước kiểm phạm vi có thể báo «đạt» dù chưa kiểm tệp nào. Người dùng cuối không bị ảnh hưởng, chỉ là một lần kiểm có thể cho kết quả xanh giả.
  Căn cứ: Chỉ xảy ra khi kho git hỏng hiếm gặp, không mất dữ liệu, và các cổng khác cùng kho vẫn chặn được; sửa sau rẻ nên chấp nhận ghi lại là han chế đã biết.
  file: `_acceptance/sd3-test-chiu-song-song/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): E2 khẳng định 'không khoá mạnh trên public' và 'không khoá trên view public' mà không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm «bộ test không giữ khoá trên dữ liệu dùng chung» có thể báo đạt ngay cả khi bộ lọc đo bị sai. Người dùng cuối không thấy gì, nhưng niềm tin vào kết quả xanh yếu hơn.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng, chỉ làm bằng chứng nghiệm thu kém chặt; bổ sung đối chứng sau là việc nhỏ và rẻ.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3/4 (ngưỡng tuyệt đối thay cho quan hệ, không có đường nền): «đã chờ đúng lúc DDL» được đo bằng `giay >= 2.5`, không so với thời gian chạy khi không bị chặn**
  Người dùng thấy gì: Phép kiểm xác nhận bộ test thực sự chờ khi có thay đổi cấu trúc dữ liệu có thể xanh nhầm nếu bộ test vốn đã chạy chậm. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm một lần đo kém chặt chứ không gây lỗi cho người dùng; ngưỡng đã đúng theo hợp đồng và có thể siết sau với chi phí thấp.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Trần cả probe là 900 s trong code, nhưng hồ sơ cam kết 180 s (r2)**
  Người dùng thấy gì: Bước kiểm tra có thể chạy tới 15 phút thay vì 3 phút như hồ sơ ghi. Chỉ phần chạy trên DB thử riêng không ảnh hưởng máy thu, nên lệch này làm hồ sơ ghi sai chứ không làm hỏng sản phẩm.
  Căn cứ: Hậu quả nhẹ: không mất dữ liệu, chỉ lệch giữa lời ghi và thực tế, người dùng không gặp gì; sửa sau vẫn rẻ nên ghi lại là đủ.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Comment đầu tệp probe còn mô tả phiên chặn trên DB dùng chung, trong khi `chan` nay chạy trên DB thử riêng (r2)**
  Người dùng thấy gì: Chú thích đầu tệp kiểm tra mô tả sai phạm vi an toàn, người đọc sau này có thể hiểu nhầm. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là lời chú thích cũ, không ảnh hưởng hoạt động hay dữ liệu; chi phí sửa không đáng mở thêm việc.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: low
  Đề xuất: wont-fix

- **pham-vi.sh: git diff lỗi thì vòng lặp rỗng và probe vẫn in PHAM VI OK (r2)**
  Người dùng thấy gì: Nếu kho git hỏng, bước kiểm phạm vi có thể báo đạt mà thực ra không kiểm tệp nào. Hiện tại nó chạy đúng, chỉ là rủi ro báo xanh giả trong tình huống hiếm.
  Căn cứ: Hậu quả nhẹ và hiếm: chỉ xảy ra khi kho git lỗi, lúc đó người dùng thấy ngay các lỗi khác; chạy lại là biết, nên chấp nhận và ghi lại.
  file: `_acceptance/sd3-test-chiu-song-song/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): hai phép đo 'khoá mạnh trên public' và 'khoá trên view public' của E2 không có đối chứng dương (r2)**
  Người dùng thấy gì: Phép đo xác nhận bộ test không giữ khoá trên dữ liệu dùng chung có thể đang mù mà vẫn báo đạt. Người dùng không thấy gì trực tiếp, nhưng độ tin cậy của lời cam kết giảm.
  Căn cứ: Không mất dữ liệu và không lộ ra cho người dùng; độ tin cậy của bằng chứng thấp hơn mong muốn nhưng bổ sung đối chứng sau này không đắt.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (đếm thay cho quan hệ): «chỉ hai câu đọc schema đổi từ public sang lược đồ riêng» chỉ đo bằng hiệu số lần xuất hiện 'public' (r2)**
  Người dùng thấy gì: Cách kiểm xem chỉ hai câu truy vấn được đổi hơi lỏng, nên một thay đổi lệch có thể lọt mà không bị phát hiện. Sản phẩm hiện tại không bị ảnh hưởng.
  Căn cứ: Chỉ làm bằng chứng kém chặt, không gây hại cho người dùng hay dữ liệu; người ký có thể tự soát lại bản đổi và sửa sau rẻ.
  file: `_acceptance/sd3-test-chiu-song-song/probes/song-song.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
