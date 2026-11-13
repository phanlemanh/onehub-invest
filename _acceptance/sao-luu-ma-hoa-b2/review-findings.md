# Review findings: sao-luu-ma-hoa-b2 (round 2)

## Trong hợp đồng

- **chay lỗi ở bước kiểm trước (mã 3–6) không ghi trạng thái: check-freshness vẫn báo «ok» tới 36 giờ**
  AC: AC-7
  file: `scripts/lib/sao-luu-ngoai-may.mjs:229`
  severity: medium
  detail: `chay` trả `{ma: k.ma}` ngay khi `kiemTruoc` hỏng, trước khi dựng `tt` và trước `loi()`/`ghiTrangThai`. Vì vậy trang-thai.json vẫn giữ `ket_qua: "ok"` của lượt trước. Các ca bị ảnh hưởng: mục Keychain mất (6), tệp b2.env bị đổi quyền hay chuyển vào kho (4), restic bị gỡ hay PATH của launchd không có restic (5). Khi đó lượt hằng ngày hỏng mỗi ngày mà `docTrangThaiSaoLuu` vẫn trả «ok — bản tốt cuối cách N giờ», `xau=false`. Cảnh báo chỉ hiện khi tuổi vượt 36 giờ, và hiện là «quá hạn» chứ không phải «lượt cuối lỗi ở bước …». Ca này trái AC-7 («Given lượt chay xong hay lỗi … tệp trạng thái có ket_qua»). Nó cũng trái nhánh `ket_qua === "loi"` của bộ đọc, nhánh được viết ra để báo ngay khi lượt cuối lỗi. Ca mã 3 (tệp xác nhận bị xoá) cũng không đổi trạng thái.
  source: bugs

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cờ --luc của lệnh chay không được kiểm, khác cách check-freshness kiểm --now**
  Người dùng thấy gì: Nếu người vận hành gõ sai giờ ở cờ phụ khi chạy tay, lượt sao lưu có thể báo lỗi hoặc ghi trạng thái lệch. Dùng bình thường (không truyền cờ này) thì không bị ảnh hưởng.
  Căn cứ: Chỉ chạm khi tự gõ cờ phụ sai; nhẹ, không mất dữ liệu, chạy lại đúng lệnh là xong.
  file: `scripts/lib/sao-luu-ngoai-may.mjs`
  severity: low
  Đề xuất: known-limits

- **Chú thích executor sl_db trong config.yaml tả sai cách test dựng DB**
  Người dùng thấy gì: Một dòng ghi chú mô tả sai cách bài thử dựng cơ sở dữ liệu, có thể khiến người đọc tưởng bài thử đụng vào DB dùng chung. Thực tế bài thử không đụng.
  Căn cứ: Chỉ là chữ ghi chú, không ảnh hưởng người dùng hay dữ liệu, sửa lúc nào cũng rẻ nhưng không đáng mở việc riêng.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **kiem-db coi pg_restore thoát khác 0 là thành công khi stderr không có khối «pg_restore: error:»**
  Người dùng thấy gì: Phép thử khôi phục cơ sở dữ liệu có thể báo đạt dù bước khôi phục bị cắt giữa chừng sau khi dữ liệu đã nạp xong, khiến người vận hành tin bản sao lưu dùng được khi chưa chắc.
  Căn cứ: Hiếm gặp vì phải hỏng đúng khâu cuối, dữ liệu bảng vẫn đủ; ghi hạn chế đã biết, thử lại được.
  file: `scripts/lib/sao-luu-ngoai-may.mjs`
  severity: medium
  Đề xuất: known-limits

- **kiem và chay đọc trạng thái lúc đầu rồi ghi đè lúc cuối: chạy chồng nhau làm mất kết quả của lượt kia**
  Người dùng thấy gì: Nếu lượt sao lưu và lượt thử khôi phục chạy trùng giờ, kết quả của một lượt có thể bị ghi đè, làm cảnh báo tuổi bản sao lưu sai hoặc báo đỏ giả.
  Căn cứ: Chưa có lịch tự chạy nên chưa xảy ra; nếu có thì chỉ lệch cảnh báo, không mất bản sao lưu, chạy lại là đúng.
  file: `scripts/lib/sao-luu-ngoai-may.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (quét LỚP, chỉ có điểm-case): E4 tuyên chặn 5 lệnh tải nhưng đối chứng chỉ gài curl**
  Người dùng thấy gì: Bài kiểm tra chặn các lệnh tải dữ liệu ra ngoài chỉ được thử kỹ với một lệnh, nên nếu sau này ai đó viết nhầm bộ chặn cho bốn lệnh còn lại thì bài kiểm tra vẫn xanh.
  Căn cứ: Hiện không có lệnh tải nào lọt thật, rủi ro chỉ nằm ở tương lai; bổ sung ca thử sau rẻ.
  file: `scripts/sao-luu-ngoai-may.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (quét LỚP, chỉ có điểm-case): E7 hứa đủ trường và không lộ gì ở cả lượt ok lẫn lượt lỗi, nhưng chỉ đo lượt ok**
  Người dùng thấy gì: Bài kiểm tra chưa chứng minh rằng bản ghi trạng thái của lượt sao lưu lỗi cũng sạch khoá và đủ thông tin như lượt thành công.
  Căn cứ: Chưa có bằng chứng rò thật; thiếu kiểm chứng chứ không phải lỗi, bổ sung ca thử sau rẻ.
  file: `scripts/sao-luu-ngoai-may.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): C12 tự dựng trang-thai.json thay vì đọc tệp do chay ghi ra**
  Người dùng thấy gì: Bài kiểm tra cảnh báo quá hạn dùng tệp trạng thái viết tay nên chưa chứng minh được phần ghi và phần đọc thật sự khớp nhau khi chạy thật.
  Căn cứ: Nếu lệch định dạng thì cảnh báo sai, không mất dữ liệu; lộ ra ngay khi chạy thật lần đầu.
  file: `scripts/check-freshness.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
