# Review findings: nap-s09-toa-tang-vao-danh-ba (round 1)

## Trong hợp đồng

- **Hình dạng 3: bảng ba cột E2 in tổng toà, tổng tầng nhưng gán cứng ok=true, nên quan hệ stg = đếm thẳng = manifest không được assert ở dòng tổng**
  AC: AC-2
  file: `pipeline/scripts/danh-ba-s09-toa-that.mjs:139`
  severity: medium
  source: measurement
  detail: AC-2 và E2 hứa một quan hệ: số dự án, toà, tầng trong stg bằng bộ đếm độc lập và bằng manifest, lệch một ô thì thoát 1. Dòng dự án (136) có so ba giá trị. Còn hai dòng `o("E2 toà", …, true)` (139) và `o("E2 tầng", …, true)` (140) chỉ in ba tổng, cờ đạt gán cứng `true`, nên tổng lệch nhau vẫn ĐẠT. Phần đỡ lại là vòng so từng ô (142–149), nhưng nó có hai lỗ: (a) chỉ duyệt khoá của `dem.tang` / `dem.toa`, tức khoá đọc từ tệp bản thu. Một toà hay dự án có trong stg mà không có trong ba bản thu (ví dụ chạy `--dem` trên DB máy thu sau khi đã nạp thêm lượt thu khác) không vào ô nào, và tổng lệch cũng bị che vì dòng tổng luôn true. (b) Vế manifest bị bỏ im lặng khi `meta.soTang` / `meta.soToa` thiếu: `Number.isFinite(k) && …` biến ô đó thành chỉ so hai cột. Tóm lại, quan hệ ba chiều mà hợp đồng hứa chỉ được kiểm một chiều, phía tệp, còn dòng tổng chỉ trình bày số mà không đo.
  rationale: AC-2 đòi số dự án, toà, tầng trong stg bằng bộ đếm và manifest, lệch một ô thì thoát 1; dòng tổng toà, tầng luôn đạt nên không giữ được lời hứa này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Test bộ nạp rơi về DB chung oneinvest khi thiếu DATABASE_URL và chạy DDL trên đó**
  Người dùng thấy gì: Nếu ai chạy thẳng bài thử của bộ nạp trên máy thu khi chưa áp bản cập nhật, bài thử có thể tự dựng bảng sai chỗ trên dữ liệu thật và làm bước áp sau đó giữ lại bảng sai.
  Căn cứ: Chỉ xảy ra khi chạy sai cách ngoài lệnh kiểm chuẩn, có thể dọn tay, và là mã của làn thu nên sửa sau cũng rẻ.
  file: `pipeline/import-s09-danh-ba.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **lui-nap.sql xoá MỌI bản thu s09-danh-ba, không chỉ ba bản thu mà hồ sơ áp nạp**
  Người dùng thấy gì: Khi lùi việc nạp, hệ thống có thể xoá luôn các bản thu S09 khác được nạp thêm giữa chừng, nhiều hơn ba bản mà hồ sơ đã nói.
  Căn cứ: Xoá nhầm dữ liệu thu là việc khó lùi và chữ ký chỉ phủ đúng những gì hồ sơ ghi, nên cần chỉnh hồ sơ hoặc câu lệnh trước khi áp thật; sửa lúc này rẻ.
  file: `_acceptance/nap-s09-toa-tang-vao-danh-ba/ap-may-thu/lui-nap.sql`
  severity: medium
  Đề xuất: new-contract

- **`.catch` trên truy vấn iso_regions trong giao dịch của dung() là vô hiệu**
  Người dùng thấy gì: Nếu bảng vùng tỉnh bị lỗi khi đọc, lượt dựng sẽ dừng với thông báo khó hiểu thay vì chạy tiếp, nhưng bảng này luôn có sẵn nên hầu như không gặp.
  Căn cứ: Không mất hay lộ dữ liệu, lỗi chỉ hiện khi môi trường hỏng sẵn và chạy lại được, nên không đáng tốn công sửa.
  file: `pipeline/lib/s09-dung.mjs`
  severity: low
  Đề xuất: wont-fix

- **Slug nút ứng viên S09 lệch khuôn có sẵn, nhúng mã nguồn S09 và mảnh mã nguồn vào slug**
  Người dùng thấy gì: Khi sau này các dự án ứng viên được đưa lên cổng công khai, đường dẫn trang có thể mang mã nguồn nội bộ thay vì dạng tên dễ đọc như các dự án khác.
  Căn cứ: Hiện nút ứng viên chưa lên cổng nên chưa lộ gì; sửa trước khi đưa lên cổng thì rẻ, sau khi đã có đường dẫn công khai thì đắt hơn.
  file: `pipeline/lib/s09-dung.mjs`
  severity: low
  Đề xuất: new-contract

- **card-plain.json/card.html không khớp hợp đồng đã thu phạm vi (vẫn có AC-7 thấp tầng, thiếu AC-11)**
  Người dùng thấy gì: Thẻ người ký đọc vẫn ghi cả nhà thấp tầng và thiếu một tiêu chí cuối, nên người ký có thể hiểu sai phạm vi lượt này.
  Căn cứ: Chỉ gây hiểu nhầm khi đọc, không đụng dữ liệu, và sửa lại thẻ là việc nhỏ trước lúc ký.
  file: `_acceptance/nap-s09-toa-tang-vao-danh-ba/card-plain.json`
  severity: low
  Đề xuất: known-limits

- **Thẻ luật S09: bất kỳ luật S09 nào chưa đảo cũng tự nối mọi dự án trùng tên về sau, không xét mau_bam, và không phát thẻ mới**
  Người dùng thấy gì: Sau khi duyệt một luật nối dự án S09, các dự án trùng tên xuất hiện ở bản danh mục sau có thể bị nối tự động mà không ai duyệt riêng và không ra thẻ mới.
  Căn cứ: Nối nhầm dự án sẽ kéo toà vào sai dự án, gây lẫn dữ liệu danh bạ; hiện chưa xảy ra vì chưa có luật nào được duyệt, nên nên làm một việc riêng trước khi bật luật đầu tiên.
  file: `pipeline/lib/s09-dung.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bộ nạp: tệp items có khuôn sai (object không có `items`) bị đếm im lặng thành 1 item phi_object, lượt vẫn thoát 0**
  Người dùng thấy gì: Nếu một tệp thu có khuôn sai, cả tệp có thể bị bỏ qua mà chỉ báo bỏ một mục và lượt nạp vẫn coi là thành công.
  Căn cứ: Có thể mất cả một tệp mà không ai biết, nhưng chỉ khi làn thu đổi khuôn tệp, có thể nạp lại, và việc thuộc làn thu.
  file: `pipeline/import-s09-danh-ba.mjs`
  severity: low
  Đề xuất: known-limits

- **Hai toà cùng tên trong một dự án nhưng khác lý do thẻ thì dùng chung một item_id; thẻ thứ hai bị bỏ mà bộ đếm vẫn tăng**
  Người dùng thấy gì: Hiếm khi hai toà cùng tên trong một dự án chỉ ra một thẻ duyệt, nên người duyệt có thể không thấy lý do của toà thứ hai.
  Căn cứ: Không tạo toà sai hay lộ dữ liệu, chỉ thiếu một thẻ cần xem trong ca hiếm, và chạy lại sau khi sửa sẽ bù được.
  file: `pipeline/lib/s09-dung.mjs`
  severity: low
  Đề xuất: known-limits

- **datLink không cập nhật can_cu khi chỉ căn cứ nối đổi (ví dụ the-cap thành noi-tay cùng nút)**
  Người dùng thấy gì: Một dự án nối bằng cách khác sau đó vẫn hiện nhãn căn cứ cũ trong số đếm, nên bảng thống kê có thể xếp sai đường nối.
  Căn cứ: Chỉ lệch nhãn thống kê, dự án vẫn nối đúng nút, không mất dữ liệu và sửa sau rẻ.
  file: `pipeline/lib/s09-dung.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: test bộ nạp tự viết DDL bảng stg_s09_danh_ba và CHECK theo khuôn bên đọc, thay vì đo migration 115 thật**
  Người dùng thấy gì: Bài thử của bộ nạp dùng bảng tự dựng nên có thể vẫn xanh dù bản cập nhật thật lệch đi, tuy đã có bài thử khác chạy trên bản thật.
  Căn cứ: Bài thử chạy trên bản cập nhật thật vẫn bắt được lệch, nên rủi ro thấp và không gây hại đến dữ liệu.
  file: `pipeline/import-s09-danh-ba.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/11 lỗi rơi vào file không bộ đo nào phủ (_acceptance/nap-s09-toa-tang-vao-danh-ba/ap-may-thu/lui-nap.sql, _acceptance/nap-s09-toa-tang-vao-danh-ba/card-plain.json) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
