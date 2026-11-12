# Review findings: au11-ac3-postgis-tam-chap-chon (round 1)

## Trong hợp đồng

- **Log gộp kiểu stdout + stderr nối đuôi làm daQuaKhoiDongLai báo true sớm, không kiểm được thứ tự đã hứa**
  AC: AC-2
  file: `scripts/ci-test-module.test.mjs:45`
  severity: medium
  source: bugs
  detail: docLog trả `${r.stdout}${r.stderr}`, tức nối hai luồng chứ không xen theo thời gian. Chạy thử kartoza/postgis:17-3.5 thật: stdout chỉ có dòng mốc «Postgres initialisation process completed», còn stderr có cả ba dòng: ready lần 1, mốc, ready lần 2. Khi nối lại, indexOf(MOC) bắt trúng dòng mốc ở phần stdout đứng trước, và ngay sau nó là dòng «ready to accept connections» LẦN 1 ở đầu phần stderr. Vì vậy daQuaKhoiDongLai ra true ngay khi mốc vừa in, chưa cần có dòng ready lần 2. Luật «sau mốc phải có dòng sẵn sàng» trong scripts/lib/cho-postgis-tam.mjs:13-16 thành vô hiệu, thực tế chỉ còn hai lần SELECT 1 liền nhau là chặn. Probe duoi-tai.mjs (dòng 41-44) ghép log y như vậy nên «LOG THAT KHOP MOC» đạt cả khi thứ tự sai, và AC-3 không chứng được điều nó nói. Cách sửa: chỉ đọc stderr, hoặc gộp có xen theo thời gian (docker logs 2>&1 qua shell, hoặc --timestamps rồi sắp lại), hoặc tìm dòng ready bằng lastIndexOf rồi so với lastIndexOf của mốc.
  rationale: AC-2 quy định before() đọc log bằng docker logs 2>&1 (xen theo thời gian), còn code nối stdout rồi stderr nên khác hợp đồng.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): LOG_KARTOZA xếp theo thời gian, còn bên ghi docLog nối stdout rồi mới tới stderr nên mất thứ tự**
  AC: AC-2
  file: `scripts/ci-test-module.test.mjs:63`
  severity: high
  source: measurement
  detail: Fixture LOG_KARTOZA (dòng 63) gõ tay, các dòng xen kẽ đúng thứ tự thời gian: ready lần 1, shutdown, mốc, ready lần 2. Đúng khuôn mà daQuaKhoiDongLai cần. Nhưng bên ghi thật ở dòng 45 là `${r.stdout}${r.stderr}`. Chạy kartoza/postgis:17-3.5 thật cho thấy dòng mốc nằm ở STDOUT (dòng 55), còn mọi dòng «ready to accept connections» ở STDERR, gồm cả ready LẦN 1 (dòng 26 của stderr). Ngay khi entrypoint in mốc, tức là sau lần tắt và TRƯỚC lần khởi động lại, chuỗi nối đã có mốc đứng trước một dòng ready. daQuaKhoiDongLai trả true sớm, đúng lỗi mà thay đổi này muốn sửa. Không ca nào lấy log qua đúng đường docLog thật (round-trip từ bên ghi sang bên đọc), nên các ca «qua được lần khởi động lại» và choPostgisTam vẫn xanh trong khi bước chờ thật trả về trước lần khởi động lại. Chỉ còn bước SELECT 1 hai lần che bớt.
  rationale: Cùng gốc với finding trên: cách lấy log không đúng docker logs 2>&1 nên bước chờ có thể trả về trước lần khởi động lại.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe duoi-tai xoá mọi container 'au11-*' trên máy, kể cả container của phiên hay worktree khác**
  Người dùng thấy gì: Khi chạy phép đo dưới tải, công cụ có thể xoá nhầm máy chủ cơ sở dữ liệu tạm của một lượt kiểm khác đang chạy cùng lúc trên máy. Lượt kia sẽ đỏ vô cớ, chạy lại là hết.
  Căn cứ: Chỉ ảnh hưởng người chạy phép đo thủ công trên máy dùng chung, không mất dữ liệu và chạy lại là xong.
  file: `_acceptance/au11-ac3-postgis-tam-chap-chon/probes/duoi-tai.mjs`
  severity: medium
  Đề xuất: known-limits

- **Chiều đỏ của AC-1 tự khẳng định trên một hàm chép lại trong test, không chạy bước chờ cũ thật**
  Người dùng thấy gì: Một ca kiểm trông như chứng minh được lỗi cũ nhưng thật ra luôn xanh. Bằng chứng thật chỉ nằm ở phép đo dưới tải.
  Căn cứ: Không ảnh hưởng người dùng sản phẩm, chỉ cần ghi rõ giới hạn của bằng chứng, sửa sau rẻ.
  file: `scripts/ci-test-module.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Probe dọn xoá mọi container có tên chứa 'au11-', kể cả của lượt test đang chạy song song**
  Người dùng thấy gì: Chạy phép đo dưới tải có thể làm sập cơ sở dữ liệu tạm của lượt kiểm khác đang chạy song song, khiến lượt đó đỏ nhầm.
  Căn cứ: Chỉ gây đỏ nhất thời cho lượt kiểm khác, không mất dữ liệu, chạy lại là hết.
  file: `_acceptance/au11-ac3-postgis-tam-chap-chon/probes/duoi-tai.mjs`
  severity: medium
  Đề xuất: known-limits

- **Còn sót container sau lượt chỉ được in ra, không làm probe đỏ**
  Người dùng thấy gì: Nếu phép đo để sót máy chủ tạm, nó vẫn báo đạt và chỉ in một dòng cảnh báo. Máy có thể dần đầy container thừa.
  Căn cứ: Hậu quả nhẹ, người chạy tự xoá container thừa được, không ảnh hưởng dữ liệu.
  file: `_acceptance/au11-ac3-postgis-tam-chap-chon/probes/duoi-tai.mjs`
  severity: low
  Đề xuất: known-limits

- **choPostgisTam bỏ mất lỗi thật của SELECT khi hết hạn**
  Người dùng thấy gì: Khi kiểm tra đỏ vì cơ sở dữ liệu tạm không ổn định, thông báo không nói rõ nguyên nhân thật, người sửa khó chẩn đoán hơn.
  Căn cứ: Chỉ làm chậm việc tìm nguyên nhân khi đỏ, không gây đỏ thêm hay mất dữ liệu, thêm sau rẻ.
  file: `scripts/lib/cho-postgis-tam.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2/1: probe «LOG THAT KHOP MOC» không kiểm thứ tự trên log thật, còn vế thứ ba chỉ grep nguồn test**
  Người dùng thấy gì: Phép đo có thể báo log thật khớp dù thứ tự dòng sai, nên bằng chứng yếu hơn vẻ ngoài.
  Căn cứ: Chỉ làm bằng chứng nghiệm thu kém chặt, không ảnh hưởng người dùng, siết lại sau rẻ.
  file: `_acceptance/au11-ac3-postgis-tam-chap-chon/probes/duoi-tai.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét cả lớp nhưng chỉ bắt được một phần): cho-tinh tuyên «mọi thông điệp assert cũ còn nguyên» mà regex bỏ sót nhiều thông điệp, chặn bằng ngưỡng ≥10 chứ không có ma trận viết trước**
  Người dùng thấy gì: Phép kiểm xác nhận các thông điệp báo lỗi cũ còn nguyên chỉ phủ một phần, nên có thể bỏ sót khi có thông điệp bị đổi.
  Căn cứ: Rủi ro chỉ là bỏ sót thay đổi nhỏ ở thông điệp kiểm thử, không ảnh hưởng người dùng, bổ sung danh sách sau rẻ.
  file: `_acceptance/au11-ac3-postgis-tam-chap-chon/probes/cho-tinh.mjs`
  severity: high
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
