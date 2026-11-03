
# Review findings: s06-duong-du-an-len-tin (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thước AC-7 tự viết phép khớp tên nguồn, không dùng lõi chung của bộ soát tầng A, nên có thể báo 0 khi bộ soát sync vẫn trúng**
  Người dùng thấy gì: Phép đo trước khi gộp có thể báo không có tên nguồn thật trong tên đường trong khi bộ kiểm lúc đồng bộ lên cloud vẫn bắt được. Khi đó lượt đồng bộ sẽ dừng lại, dữ liệu không bị lộ.
  Căn cứ: Cổng đồng bộ vẫn chặn trước khi dữ liệu rời máy nên không lộ tên nguồn. Hậu quả nhẹ là lượt đồng bộ dừng, tự thử lại được sau khi sửa.
  file: `pipeline/scripts/do-duong-s06.mjs`
  severity: medium
  Đề xuất: known-limits

- **Mục enrichment_log mới dùng khoá thời gian `at`, lệch khoá `t` của các bộ ghi có sẵn**
  Người dùng thấy gì: Khoảng 39.000 mục nhật ký làm giàu dữ liệu sẽ mang tên khoá thời gian khác với các mục cũ. Các báo cáo đọc nhật ký theo một tên khoá sẽ bỏ sót hoặc phải xử lý hai dạng.
  Căn cứ: Không mất hay lộ dữ liệu, chỉ lệch định dạng. Nhật ký chỉ thêm nên sửa sau gộp đắt hơn nhiều so với sửa trước gộp.
  file: `pipeline/lib/duong-can.mjs`
  severity: low
  Đề xuất: known-limits

- **Cờ `--nguong-duong` không kiểm giá trị: NaN tắt ngầm hai ngưỡng 90% và thước vẫn thoát 0**
  Người dùng thấy gì: Nếu người vận hành gõ sai giá trị ngưỡng khi chạy phép đo bằng tay, phép đo sẽ im lặng bỏ qua ngưỡng 90% và vẫn báo đạt.
  Căn cứ: Chỉ ảnh hưởng người chạy tay gõ sai, chạy lại là thấy đúng. Không chạm dữ liệu người dùng.
  file: `pipeline/scripts/do-duong-s06.mjs`
  severity: low
  Đề xuất: known-limits

- **docDuong giữ chuỗi chứa SĐT làm tên đường, số lọt lên danh sách công khai của cổng Invest**
  Người dùng thấy gì: Một số tin có thể hiện số điện thoại người bán ngay trong tên đường trên danh sách công khai, trong khi chủ trương là chỉ hiện số khi người xem bấm Xem số. Số lượng hiện rất ít nhưng sẽ lên cloud ở lượt đồng bộ đầu sau gộp.
  Căn cứ: Là lộ số điện thoại ngoài đường bấm Xem số, trái quy định đã chốt, nhưng chỉ vài tin và số vốn là thông tin rao công khai. Sửa trước khi số lên cloud rẻ hơn nhiều so với thu hồi sau.
  file: `pipeline/lib/dac-trung-s06.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 — Assertion âm-tính-một-mình: «dòng legacy còn đủ» đếm cả dòng đã rút trên bảng cấm DELETE, nên không thể đỏ**
  Người dùng thấy gì: Bài kiểm có thể không phát hiện nếu bước xử lý vô hiệu hoá nhầm giá trị gốc đã lưu của một tin. Sản phẩm chưa được chứng minh là sai.
  Căn cứ: Chỉ làm bài kiểm kém nhạy, không có dữ liệu hỏng đã quan sát. Bổ sung phép kiểm sau này rẻ và không ảnh hưởng người dùng.
  file: `pipeline/scripts/s06-duong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Assert chuỗi trong khi lời hứa là quan hệ: hàng «nguồn cùng chữ» của AC-3 không phân biệt được nguồn thắng hay legacy thắng**
  Người dùng thấy gì: Bài kiểm không phân biệt được trường hợp nguồn và giá trị cũ cùng chữ đang dùng giá trị nào làm gốc. Người dùng thấy cùng một tên đường trong cả hai trường hợp.
  Căn cứ: Kết quả người dùng thấy không đổi, chỉ nguồn gốc ghi chú khác. Không mất hay lộ dữ liệu.
  file: `pipeline/scripts/s06-duong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm-tính-một-mình: dòng «sáu trường không giảm quá 1 điểm %» và dòng ngưỡng «đường ở căn» không có chiều đỏ, dù evals tuyên mỗi phép đo có ca đỏ**
  Người dùng thấy gì: Phép đo sau gộp có hai dòng chưa được thử xem có biết báo đỏ khi vi phạm hay không. Nếu một dòng hỏng, ta có thể tin nhầm là đạt.
  Căn cứ: Rủi ro chỉ là bỏ sót cảnh báo, chưa có sai lệch dữ liệu. Phép đo chạy lại và bổ sung ca đỏ được ở bất kỳ lúc nào.
  file: `pipeline/scripts/do-duong-s06.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Không ghim được thông điệp: chuỗi ghim «đường chứa tên nguồn» khớp cả dòng thông tin luôn được in**
  Người dùng thấy gì: Một ca thử của phép đo có thể báo đúng thông điệp ngay cả khi lỗi thật là lỗi khác. Phép đo tổng thể vẫn báo đỏ khi có vi phạm.
  Căn cứ: Mức thấp: vi phạm khác vẫn làm phép đo đỏ nên không bỏ sót lỗi. Sửa không đáng kể so với hậu quả.
  file: `pipeline/scripts/do-duong-s06.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
