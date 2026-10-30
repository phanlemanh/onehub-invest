# Review findings: media-canonical-reso (round 1)

Review hoàn tất: không có finder chết, không có refuter chết.

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ảnh S05 dựng lại ở job zalo-import, không ở job dựng tin S05 (apify-facebook-daily)**
  Người dùng thấy gì: Tin S05 mới có thể chưa hiện ảnh trên Hàng duyệt và hồ sơ tin trong khoảng nửa ngày, tới lượt chạy đêm kế tiếp thì ảnh mới đủ.
  Căn cứ: Chỉ chậm hiện ảnh chứ không mất dữ liệu, tự hết sau lượt chạy kế tiếp, và nguồn S05 hiện đang dừng nên chưa ai gặp.
  file: `scripts/zalo-import-daily.sh`
  severity: low
  Đề xuất: known-limits

- **Ảnh của S05 không được dựng lại sau transform-fb: apify-facebook-daily không gọi transform-media**
  Người dùng thấy gì: Khi nguồn S05 được bật lại, tin S05 mới sẽ hiện «không có ảnh» trong Hàng duyệt và hồ sơ tin cho tới lượt chạy đêm sau, mà không có báo lỗi nào.
  Căn cứ: Hậu quả nhẹ vì chỉ trễ ảnh và tự hết sau lượt kế tiếp, nguồn S05 đang dừng nên chưa ảnh hưởng ai, nhưng cần nhớ khi bật lại nguồn này.
  file: `scripts/apify-facebook-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **Bắt 42P01 làm che lỗi thiếu bảng media ở máy thu: ảnh mất hẳn và UI báo «không có ảnh»**
  Người dùng thấy gì: Nếu bảng ảnh chưa được dựng ở máy thu sau khi gộp, quản trị viên sẽ thấy mọi thẻ duyệt và hồ sơ tin không có ảnh và còn được báo «không có ảnh» thay vì thấy lỗi.
  Căn cứ: Chỉ xảy ra khi bước triển khai sau gộp bị bỏ sót, không mất dữ liệu và hết ngay khi áp bảng và chạy lại bước dựng ảnh; bước này đã có người được giao.
  file: `app/src/lib/ops/review-media.ts`
  severity: medium
  Đề xuất: known-limits

- **config.yaml còn executor review_media_roundtrip trỏ tới tệp đã xoá**
  Người dùng thấy gì: Người dùng cuối không bị ảnh hưởng; chỉ khi ai đó chạy lại phép kiểm cũ của hồ sơ trước thì gặp lỗi không tìm thấy tệp.
  Căn cứ: Không đụng tới người dùng hay dữ liệu, chỉ là một dòng cấu hình dọn dẹp rẻ khi có dịp, hiện chưa có gì chạy vào nó.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Probe khong-lui chấp nhận lớp 3 khi hồ sơ không còn lệnh nào (0/0 coi là xanh)**
  Người dùng thấy gì: Người dùng cuối không thấy gì; chỉ là bộ kiểm không-lùi có thể báo xanh trong một tình huống hiếm mà thực ra nó không đo được gì.
  Căn cứ: Rủi ro chỉ nằm ở công cụ kiểm của đội, không ảnh hưởng dữ liệu hay giao diện, và tình huống kích hoạt rất hiếm.
  file: `_acceptance/media-canonical-reso/probes/khong-lui.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): chiều đỏ của NH-AC-3 không đo đột biến đã khai**
  Người dùng thấy gì: Nếu sau này ai đó làm lệch thứ tự ảnh đã tải và ảnh gốc, bộ kiểm có thể không gọi đúng tên ca bị lệch, nên khó tìm lỗi hơn.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm yếu khả năng phát hiện lỗi thứ tự ảnh sau này, và bổ sung phép đo là việc rẻ khi cần.
  file: `app/tests/media-canonical.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay theo khuôn bên đọc): truy vấn giả bỏ qua MEDIA_SQL, thứ tự media_order bên đọc không được đo**
  Người dùng thấy gì: Nếu thứ tự sắp xếp ảnh khi đọc bị mất, ảnh của tin S06 có thể hiện sai thứ tự mà các bài kiểm vẫn báo xanh.
  Căn cứ: Ảnh vẫn hiện đủ, chỉ có thể lệch thứ tự và quản trị viên nhìn là thấy ngay, không mất dữ liệu; nên ghi lại để hồ sơ sau bổ sung phép đo thứ tự.
  file: `app/tests/media-canonical.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): bộ phân loại dongLa của probe không lùi nuốt dòng VIOLATION lạ theo chuỗi con, và không có đối chứng dương**
  Người dùng thấy gì: Người dùng cuối không thấy gì; bộ kiểm không-lùi có thể bỏ qua một số cảnh báo lạ của cổng kiểm trước khi gộp thay vì báo đỏ.
  Căn cứ: Chỉ làm yếu một lớp rào nội bộ chứ không chạm dữ liệu hay giao diện, và các lớp kiểm khác của cổng vẫn còn.
  file: `_acceptance/media-canonical-reso/probes/khong-lui.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): chiều đỏ của «NH-AC-6 hồ sơ tin S06» là phép so hiển nhiên đúng trên đầu vào cố ý sai**
  Người dùng thấy gì: Người dùng không bị ảnh hưởng; chỉ là một phép thử phụ không chứng minh thêm điều gì so với phép thử chính.
  Căn cứ: Phép thử chính đã đo đúng việc ảnh thuộc tin đang mở, nên sửa phép phụ không thêm bảo vệ đáng kể.
  file: `app/tests/media-canonical.test.tsx`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/9 lỗi rơi vào file không bộ đo nào phủ (scripts/apify-facebook-daily.sh, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
