# Review findings: db-chi-nghe-noi-bo-va-chinh-postgres (round 1)

## Trong hợp đồng

- **Hình dạng 4 (âm tính một mình): «PASS mọi truy vấn chạy xong» không bao giờ thấy lỗi của Q3**
  AC: AC-5
  file: `scripts/check-db-noi-bo.sh:297`
  severity: high
  source: measurement
  detail: Trong do_bo, chỉ Q1/Q2 ghi dòng `LOI` (dòng 301). Nhánh Q3 (create index, dòng 297) gom `2>&1` rồi chỉ sed lấy `Time:`; nếu create index lỗi (vd `could not resize shared memory segment` — đúng lỗi E5 hứa bắt, và Q3 là truy vấn chạm maintenance_work_mem=1GB / dựng chỉ mục song song) thì ms rỗng, w=0, không có `LOI`. Dòng 312 `grep -q '^LOI' ... || pass "mọi truy vấn chạy xong ở cả hai bộ"` chỉ là phép vắng mặt, không có đối chứng dương rằng lỗi Q3 sẽ làm đỏ. E5 hứa «truy vấn lỗi → FAIL tên truy vấn + lỗi» nhưng với Q3 thước không thể đỏ.
  rationale: AC-5 đòi mọi truy vấn chạy xong không lỗi ở cả hai bộ; truy vấn dựng chỉ mục lỗi mà thước vẫn xanh nên điều kiện này không được kiểm thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Executor db_noi_bo_live chạy live-ba, và live-ba ghim one-invest-db phải ĐỎ, nên E8 hỏng vĩnh viễn ngay sau khi áp**
  Người dùng thấy gì: Sau khi áp lên máy thật, lần chạy lại bộ kiểm của hồ sơ này sẽ báo đỏ dù máy đã đúng. Người vận hành có thể tưởng việc áp bị hỏng.
  Căn cứ: Chỉ gây báo đỏ giả ở lần chấm lại sau áp, không mất hay lộ dữ liệu, và người vận hành tự phân biệt được nếu được dặn trước.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Cách lùi riêng phần cổng bảo sửa tay compose trong checkout chính**
  Người dùng thấy gì: Nếu phải lùi riêng phần cổng, hướng dẫn bảo sửa tay tệp cấu hình ngay trên máy chạy thật, làm bản chính bị lệch so với kho. Việc này chỉ xảy ra khi phải lùi.
  Căn cứ: Hậu quả nhẹ và chỉ xuất hiện ở đường lùi hiếm dùng, không mất dữ liệu, và đã có cách lùi toàn phần đúng khuôn để thay thế.
  file: `_acceptance/db-chi-nghe-noi-bo-va-chinh-postgres/ap-may-thu.md`
  severity: low
  Đề xuất: known-limits

- **Design doc ghi effective_cache_size của base là 5 GB, số đo ghi 4GB**
  Người dùng thấy gì: Hai tài liệu ghi hai con số khác nhau cho mức bộ nhớ đệm trước khi chỉnh, người đọc có thể phân vân số nào đúng. Máy chạy không bị ảnh hưởng.
  Căn cứ: Chỉ là lệch chữ giữa hai tài liệu, không ảnh hưởng máy chạy hay dữ liệu, sửa sau rẻ.
  file: `docs/superpowers/specs/2026-11-24-db-chi-nghe-noi-bo-va-chinh-postgres-design.md`
  severity: low
  Đề xuất: known-limits

- **Hồ sơ áp nói `up -d --force-recreate` tự chờ healthcheck, nhưng thiếu `--wait` nên lệnh trả về ngay; chạy lệnh kiểm sau liền đó dễ đỏ giả**
  Người dùng thấy gì: Khi áp thật, nếu chạy lệnh kiểm ngay sau khi tạo lại DB thì DB còn đang khởi động và kiểm báo đỏ giả. Người áp có thể dừng việc dù mọi thứ đúng.
  Căn cứ: Gây dừng nhầm và mất thời gian chứ không mất dữ liệu, người áp chờ vài chục giây rồi chạy lại là hết, nhưng hồ sơ nên dặn rõ.
  file: `_acceptance/db-chi-nghe-noi-bo-va-chinh-postgres/ap-may-thu.md`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): phép so «compose khớp base ngoài cổng, tham số, shm» không có đột biến đỏ**
  Người dùng thấy gì: Bộ kiểm có thể không bắt được một thay đổi lạ ở phần cấu hình ngoài cổng và tham số, như đổi ảnh DB. Thay đổi kiểu đó có thể lọt qua mà vẫn báo xanh.
  Căn cứ: Rủi ro chỉ khi có người sửa nhầm phần cấu hình khác, hiếm và thấy được khi xem lịch sử sửa, không mất dữ liệu.
  file: `scripts/check-db-noi-bo.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): soát plist launchd không có đối chứng cấy**
  Người dùng thấy gì: Phần soát các tác vụ tự chạy của máy có thể báo sạch dù thực ra không đọc được tệp nào. Nếu sau này có tác vụ nối DB qua mạng ngoài thì có thể bị bỏ sót.
  Căn cứ: Hiện không có tác vụ sai nào, chỉ là thước kiểm chưa tự chứng minh nhạy, dữ liệu không bị mất và bổ sung sau rẻ.
  file: `scripts/check-db-noi-bo.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP, chỉ có điểm-case): khuôn bên nối ngoài loopback**
  Người dùng thấy gì: Phần soát các bên nối DB bắt được vài kiểu nối ra ngoài thường gặp nhưng có thể bỏ sót cách viết khác. Một bên nối kiểu lạ có thể không bị phát hiện.
  Căn cứ: Là giới hạn của phép soát tự động, bên nối kiểu lạ hiếm và đã có danh sách tệp để người rà thêm, không gây mất dữ liệu ngay.
  file: `scripts/check-db-noi-bo.sh`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
