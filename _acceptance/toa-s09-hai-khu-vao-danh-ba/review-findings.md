## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thẻ duyệt toà S09 dùng item_type 'entity_match' nhưng route quyết định ở /ops/review chỉ nhận khuôn 'pair:<offer_a>|<offer_b>', nên thẻ không bao giờ quyết được (r1)**
  Người dùng thấy gì: Các thẻ duyệt toà mơ hồ của S09 hiện hiện ra trong hàng chờ duyệt nhưng người duyệt bấm Khớp, Bác hay Hoãn đều bị từ chối, và quyết định cũng chưa được áp vào danh bạ.
  Căn cứ: Thẻ chỉ có ở những ca toà mơ hồ nên số lượng nhỏ, không làm mất hay sai dữ liệu danh bạ; sửa cần đụng tới màn duyệt của Ops nên là một việc riêng.
  file: `pipeline/lib/s09-dung.mjs`
  severity: high
  Đề xuất: new-contract

- **View v_toa_nut_vung tách tiền tố cụm theo luật khác hàm JS tienToCum/khoaTenS09, nên nút vùng hiệu lực có thể lệch với region_node_id của toà vừa đúc (r1)**
  Người dùng thấy gì: Một số toà có tên viết có khoảng trắng giữa hai số có thể được xếp vào phân khu thay vì cụm toà trong cách xem vùng, dù lúc tạo toà lại xếp vào cụm.
  Căn cứ: Chỉ ảnh hưởng vài cách viết tên hiếm, toà không mất và vẫn nằm đúng phân khu; có thể tính lại và sửa sau với chi phí thấp.
  file: `db/migrations/097_stg_s09_item.sql`
  severity: medium
  Đề xuất: known-limits

- **Nối dự án S09 → khu là hằng cứng trong code, lệch pattern bảng nối có trạng thái của S08 (r1)**
  Người dùng thấy gì: Muốn thêm khu thứ ba hoặc sửa nối sai giữa dự án nguồn và khu thì phải sửa mã rồi gộp lại, không chỉnh được bằng dữ liệu.
  Căn cứ: Hiện chỉ có hai khu nên không ảnh hưởng người dùng; việc mở rộng sang khu khác đã nằm trong hàng sau.
  file: `pipeline/lib/s09-du-an.mjs`
  severity: low
  Đề xuất: known-limits

- **Biên nạp stg_s09_item không kiểm schemaVersion và kiểu fetchedAt/payload; DATA-CONTRACT chưa có S09 (r1)**
  Người dùng thấy gì: Nếu bản thu S09 có thời điểm thu hay nội dung sai dạng thì cả lượt nạp có thể lỗi thay vì chỉ bỏ dòng hỏng đó.
  Căn cứ: Lỗi hiện ra ngay và không ghi dữ liệu sai, chạy lại được sau khi sửa nguồn; hợp đồng dữ liệu S09 sẽ được làm ở hàng của làn thu.
  file: `pipeline/lib/s09-du-an.mjs`
  severity: low
  Đề xuất: known-limits

- **v_toa_nut_vung: tiền tố cụm tính trên tên thô, khác khoá gộp JS; DISTINCT ON không phá hoà nên nút vùng của toà có thể bất định (r1)**
  Người dùng thấy gì: Với toà có nhiều mã nguồn S09 viết khác nhau, vùng hiển thị của toà có thể lúc là cụm lúc là phân khu giữa các lần xem.
  Căn cứ: Hiếm gặp, chỉ lệch cấp vùng chứ không sai khu, và có thể tự khỏi khi tính lại; sửa nhỏ nhưng không chặn việc ship.
  file: `db/migrations/097_stg_s09_item.sql`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm tính đứng một mình (hình dạng 4): ten_nguon=0 không có đối chứng dương cho bộ dò (r1)**
  Người dùng thấy gì: Bộ kiểm tra tên nguồn thật có thể im lặng nếu chính nó hỏng, nên một tên nguồn lọt vào thay đổi có thể không bị báo.
  Căn cứ: Rủi ro lộ tên nguồn có thật nhưng chỉ xảy ra khi bộ kiểm hỏng, và còn các lớp chặn khác của dự án; thêm ca thử là việc nhỏ làm sau.
  file: `pipeline/scripts/s09-ranh-gioi.mjs`
  severity: low
  Đề xuất: known-limits

- **v_toa_nut_vung tính tiền tố cụm khác bước dựng JS: tên toà viết có khoảng trắng giữa hai số ("S1 01") rơi về phân khu thay vì về cụm (r1)**
  Người dùng thấy gì: Nếu có toà S09 ghi tên kiểu có khoảng trắng giữa hai số, danh bạ có thể xếp toà đó vào phân khu thay vì cụm. Dữ liệu 13/11 chưa có toà nào như vậy nên hiện chưa sai số nào.
  Căn cứ: Hậu quả nhẹ: chỉ xếp toà lên cấp cao hơn một nấc, không mất hay lộ dữ liệu, và dữ liệu hiện có không dính; sửa sau khi gặp ca thật vẫn rẻ.
  file: `db/migrations/097_stg_s09_item.sql`
  severity: low
  Đề xuất: known-limits

- **Migration số 097 nhỏ hơn số lớn nhất trên main (099, 102), và E9 chỉ thử áp 097 trên nền 096 (r1)**
  Người dùng thấy gì: Trên máy thu, bảng S09 mới sẽ được áp sau hai thay đổi có số lớn hơn, khác thứ tự trên DB dựng mới. Hai phần này độc lập nên khả năng gây lỗi rất thấp.
  Căn cứ: Rủi ro thấp vì thay đổi mới không phụ thuộc hai thay đổi kia; nếu có vấn đề sẽ lộ ngay khi áp thật và không mất dữ liệu.
  file: `db/migrations/097_stg_s09_item.sql`
  severity: low
  Đề xuất: known-limits

- **v_toa_nut_vung tính tiền tố cụm khác bộ dựng JS, nên toà thuộc cụm có thể bị trả về nút phân khu (và kết quả không ổn định) (r1)**
  Người dùng thấy gì: Với toà có nhiều cách viết tên, danh bạ có thể báo toà thuộc phân khu thay vì cụm và kết quả có thể đổi giữa các lần chạy. Hiện dữ liệu thật chưa có toà nào như vậy.
  Căn cứ: Chỉ sai mức vùng một nấc và chỉ với cách viết tên hiếm chưa xuất hiện; không mất dữ liệu, dễ phát hiện và sửa khi gặp ca thật.
  file: `db/migrations/097_stg_s09_item.sql`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: «toà hai UPI = 0 / UPI trùng = 0 / bí danh hai toà = 0» do lược đồ bảo đảm, không thể đỏ (r1)**
  Người dùng thấy gì: Phép kiểm không phát hiện được trường hợp một toà bị tạo thành hai dòng riêng, nên kết quả an toàn có thể xanh dù có toà trùng.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp; các phép kiểm khác về số toà vẫn bắt phần lớn trường hợp trùng, và bổ sung kiểm sau không tốn nhiều.
  file: `pipeline/scripts/danh-ba-s09.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: E6 ghi «toà hai UPI 0» bằng câu hỏi bị lược đồ ép bằng 0 (r1)**
  Người dùng thấy gì: Phép đo trên dữ liệu thật báo không có toà hai mã định danh nhưng không thể phát hiện việc cùng một toà bị đúc thành hai bản.
  Căn cứ: Chỉ làm giảm độ tin của một dòng báo cáo, không gây mất hay lộ dữ liệu; số toà đối chứng 115 và 60 vẫn kiểm được trùng lặp gián tiếp.
  file: `pipeline/scripts/danh-ba-s09-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — kiểm ranh giới âm tính không có đối chứng đỏ trong lệnh đã đăng ký (r1)**
  Người dùng thấy gì: Lần kiểm ranh giới theo cấu hình không tự chứng minh rằng nó bắt được tệp nằm ngoài vùng cho phép, nên kết quả xanh chưa chắc đáng tin hoàn toàn.
  Căn cứ: Chỉ ảnh hưởng độ tin của phép kiểm nội bộ, không chạm dữ liệu hay người dùng; có thể chạy riêng với cờ đối chứng bất cứ lúc nào.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
