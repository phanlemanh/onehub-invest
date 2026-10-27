# Review findings: test-nen-on22-on12 (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **card.html (thẻ Cổng 1 trình Mạnh) cũ so với đầu dò E1: ghi là đã sửa bằng «NEN BAN» thoát 3, nhưng mã không có**
  Người dùng thấy gì: Thẻ người ký đọc còn mô tả một cơ chế bảo vệ đã bị bỏ, nên người ký có thể tưởng hồ sơ được bảo vệ nhiều hơn thực tế.
  Căn cứ: Chỉ là chữ trên thẻ, không ảnh hưởng người dùng cuối hay dữ liệu, và sinh lại thẻ trước khi ký là việc rẻ, làm lúc nào cũng được.
  file: `_acceptance/test-nen-on22-on12/card.html`
  severity: low
  Đề xuất: known-limits

- **Kiểm mã thoát của bên ghi trước khi đọc payload mới làm ở writerSide (ON22-AC-5); ON22-AC-3 và AC-9 vẫn đọc payload khi chưa kiểm mã**
  Người dùng thấy gì: Khi bước ghi số liệu hỏng, vài ca kiểm thử báo lỗi khó hiểu thay vì nêu đúng nguyên nhân; ca vẫn đỏ chứ không bị che.
  Căn cứ: Chỉ làm thông báo lỗi khó đọc hơn ở môi trường kiểm thử, không mất hay lộ dữ liệu, và không ảnh hưởng người dùng sản phẩm.
  file: `app/tests/ops-facts-so-tong-hop.test.tsx`
  severity: low
  Đề xuất: known-limits

- **--test-concurrency=8 làm TĂNG số tệp test chạy song song trên CI (ubuntu-latest 4 vCPU), ngược với mục đích giảm áp lực kết nối**
  Người dùng thấy gì: Trên máy chạy kiểm thử tự động ít nhân, bộ test có thể chạy dồn nhiều hơn trước, làm các ca nhạy nhịp dễ đỏ ngẫu nhiên trở lại.
  Căn cứ: Hậu quả chỉ là đỏ ngẫu nhiên khi kiểm thử, chạy lại là qua, không ảnh hưởng người dùng sản phẩm; nên theo dõi vài lượt CI trước khi quyết có cần chỉnh.
  file: `app/package.json`
  severity: medium
  Đề xuất: known-limits

- **Đỉnh kết nối «riêng» của AC-1 đếm thiếu: tiến trình con push-ops-facts không nhận PGAPPNAME**
  Người dùng thấy gì: Con số đỉnh kết nối báo cáo có thể thấp hơn thực tế vì bỏ sót một số tiến trình phụ, nên mức dư địa kết nối trông rộng hơn thật.
  Căn cứ: Chỉ làm số đo kiểm thử lạc quan hơn một chút, không đụng dữ liệu hay người dùng; có thể ghi rõ giới hạn khi ký và đo lại nếu lỗi quá tải tái diễn.
  file: `_acceptance/test-nen-on22-on12/probes/dinh-ket-noi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Thử lại bên ghi theo deadlock gần như không bao giờ kích hoạt: measure() nuốt lỗi truy vấn rồi thoát mã 0**
  Người dùng thấy gì: Nếu bước ghi số liệu gặp xung đột tạm thời giữa chừng, ca kiểm thử sẽ đỏ thay vì tự thử lại; chạy lại sẽ qua.
  Căn cứ: Chỉ gây đỏ hiếm gặp ở môi trường kiểm thử và tự hết khi chạy lại, không mất dữ liệu; sửa đòi đụng mã thu số liệu nên tốn hơn nhiều so với hậu quả.
  file: `app/tests/ops-facts-so-tong-hop.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Phép đo k=∞ của probe AC-3 luôn khớp «53300» nhờ chính dòng log thử lại, không kiểm thông điệp đỏ**
  Người dùng thấy gì: Bằng chứng nói rằng ca đỏ vì quá tải kết nối nhưng thực ra chưa chứng được đúng nguyên nhân đỏ.
  Căn cứ: Chỉ làm bằng chứng kiểm thử yếu hơn vẻ ngoài, không ảnh hưởng người dùng; siết lại đầu dò là việc nhỏ có thể làm sau.
  file: `_acceptance/test-nen-on22-on12/probes/cau-truc.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (kèm 1): ON22-AC-5 trong E3 chỉ kiểm chuỗi có mặt trong mã nguồn test, trong khi lời hứa là hành vi thử lại và thứ tự kiểm mã**
  Người dùng thấy gì: Cam kết bước ghi số liệu tự thử lại khi gặp lỗi tạm mới được kiểm bằng cách đọc mã, chưa được chạy thử thật.
  Căn cứ: Hợp đồng đã chấp nhận đo cấu trúc cho ca này, không có rủi ro cho người dùng; chỉ cần ghi rõ giới hạn để người ký biết mức chứng.
  file: `_acceptance/test-nen-on22-on12/probes/cau-truc.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: ca đối chứng ON7-AC-6 (a) chỉ đòi đỏ, không ghim thông điệp và không có mốc dương k=0**
  Người dùng thấy gì: Ca đối chứng có thể đỏ vì lý do khác chứ không phải vì lỗi quá tải được tiêm, nên chưa chứng chắc cơ chế thử lại có tác dụng.
  Căn cứ: Chỉ làm bằng chứng kiểm thử kém chặt, không ảnh hưởng người dùng hay dữ liệu; siết lại sau không tốn nhiều.
  file: `_acceptance/test-nen-on22-on12/probes/cau-truc.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: E3 chỉ tiêm lỗi vào lần connect ĐẦU, trong khi ON12-AC-7 tuyên mọi lần chạm DB đều đi qua thuLaiDbTam**
  Người dùng thấy gì: Một số điểm chạm cơ sở dữ liệu trong ca kiểm thử chưa được thử với lỗi quá tải, nên nếu mất lớp thử lại ở đó thì chưa chắc bị phát hiện.
  Căn cứ: Chỉ là khoảng trống bằng chứng ở môi trường kiểm thử, không ảnh hưởng người dùng; mất thử lại chỉ làm đỏ ngẫu nhiên, chạy lại là qua.
  file: `_acceptance/test-nen-on22-on12/probes/cau-truc.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: test của laLoiBenGhiTam chỉ phủ 2 trong 6 nhánh regex mà vẫn tuyên «stderr bên ghi nhận lỗi tạm»**
  Người dùng thấy gì: Một vài kiểu lỗi tạm phía bước ghi số liệu chưa có ca kiểm thử riêng, nên nếu ai làm hỏng nhận diện ở đó thì chưa chắc bị bắt.
  Căn cứ: Rủi ro rất thấp và chỉ nằm trong kiểm thử nội bộ, không chạm người dùng hay dữ liệu; thêm ca là việc nhỏ nhưng giá trị thấp so với công sức.
  file: `app/tests/db-tam-thoi.test.tsx`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
