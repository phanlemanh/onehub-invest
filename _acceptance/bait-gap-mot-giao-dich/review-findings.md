## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **JSDoc của buocDem vẫn ghi phần bait gap «tự-commit như trước», trái với thay đổi**
  Người dùng thấy gì: Một đoạn ghi chú trong mã còn mô tả cách chạy cũ nên người sau đọc có thể hiểu sai. Người dùng cuối không thấy gì khác đi.
  Căn cứ: Chỉ là lời ghi chú sai chứ không ảnh hưởng dữ liệu hay màn hình nào, sửa lúc nào cũng rẻ nên không đáng mở việc riêng.
  file: `pipeline/refresh-bait-gap.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hai executor mới trong config.yaml lệch mẫu của mọi entry còn lại (không trích dẫn, không chú thích slug/eval)**
  Người dùng thấy gì: Hai dòng cấu hình kiểm thử thiếu chú thích như các dòng khác, nên người bảo trì khó biết bài kiểm này cần dữ liệu thật. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm khó người đọc cấu hình, không làm mất hay sai dữ liệu, và thêm chú thích sau này rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Bản chép đột biến của refresh-bait-gap (có bản bỏ khoá) nằm trong pipeline/ suốt cả lượt test, không gitignore**
  Người dùng thấy gì: Nếu lượt kiểm thử bị ngắt giữa chừng, các tệp tạm có thể còn sót và vô tình bị đưa vào một lần lưu mã. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Rủi ro chỉ xảy ra khi kiểm thử bị ngắt và người làm bất cẩn, dễ phát hiện khi xem danh sách thay đổi và dễ xoá tay.
  file: `pipeline/scripts/refresh-bait-gap-khoa.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **AC-8 quét lời gọi bỏ sót gọi thẳng refreshBaitGap trong chính refresh-bait-gap.mjs (cờ daBegin tính theo cả tệp)**
  Người dùng thấy gì: Bộ canh việc ai đó thêm đường gọi tính chỉ số mới ngoài giao dịch có vài kẽ hở, nên một đường gọi sai trong tương lai có thể lọt mà không báo đỏ. Hiện chưa có đường gọi sai nào.
  Căn cứ: Chưa có dữ liệu nào hỏng, chỉ là lưới an toàn cho thay đổi tương lai còn thủng vài chỗ, và người duyệt mã vẫn có thể bắt được.
  file: `pipeline/scripts/refresh-bait-gap-goi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Thước AC-3/AC-4: hết giờ hoặc ném lỗi thì vòng hỏi 10 ms không dừng, tiến trình test treo thay vì đỏ**
  Người dùng thấy gì: Khi bài kiểm về khoá bị lỗi hoặc quá giờ, nó có thể treo mãi thay vì báo đỏ rõ ràng. Chỉ ảnh hưởng người chạy kiểm thử.
  Căn cứ: Không đụng tới dữ liệu hay người dùng, chỉ làm lượt kiểm hỏng khó đọc hơn, người chạy tự tắt và chạy lại được.
  file: `pipeline/scripts/refresh-bait-gap-khoa.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm-tính/không đối chứng): RB-AC-2 «còn chạy sau 3 s» không phân biệt được chờ khoá với lượt chậm sẵn**
  Người dùng thấy gì: Bài kiểm xác nhận lượt cập nhật chờ khi khoá bị giữ có thể vẫn xanh dù lượt đó thật ra không chờ khoá mà chỉ chạy chậm. Nên chưa chắc bắt được lỗi bỏ khoá.
  Căn cứ: Không gây hỏng dữ liệu hiện tại, chỉ làm một bằng chứng kiểm thử kém chắc; các bài kiểm khác vẫn bắt được trường hợp hai lượt chạy chồng nhau.
  file: `pipeline/scripts/refresh-bait-gap-khoa.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (có mặt thay vì quan hệ): RB-AC-5 kiểm «có khoá trong pg_locks lúc buocDem trả về», không kiểm phần bait gap chạy dưới khoá**
  Người dùng thấy gì: Bài kiểm chỉ thấy khoá có đang được giữ chứ chưa chứng minh phần tính chỉ số chạy bên trong khoá khi nằm trong giao dịch của bên gọi. Một lỗi bỏ khoá ở trường hợp này có thể không bị phát hiện.
  Căn cứ: Trường hợp này hiếm, hiện mã chạy đúng và không ai dùng đường này, nên chỉ là bằng chứng kiểm thử còn mỏng chứ chưa có hậu quả.
  file: `pipeline/scripts/refresh-bait-gap-khoa.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): đối chứng dương của bộ quét AC-8 chỉ dùng lời gọi một dòng khớp regex**
  Người dùng thấy gì: Bộ canh đường gọi chỉ nhận ra cách viết gọn một dòng, nên một đường gọi viết nhiều dòng có thể lọt mà không ai biết. Hiện chưa có đường gọi như vậy.
  Căn cứ: Chưa gây hậu quả nào cho dữ liệu, chỉ là lưới canh tương lai chưa kín và người duyệt mã vẫn là lớp chặn thứ hai.
  file: `pipeline/scripts/refresh-bait-gap-goi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (có mặt thay vì quan hệ): «sau BEGIN» của AC-8 là cờ toàn tệp, không phải lời gọi nằm trong giao dịch đang mở**
  Người dùng thấy gì: Bộ canh coi mọi lời gọi nằm dưới một lệnh mở giao dịch là hợp lệ, kể cả khi giao dịch đã đóng. Một đường gọi sai trong tương lai có thể lọt.
  Căn cứ: Đây đúng là mức chặt đã chốt trong hợp đồng, chưa có đường gọi sai nào và hậu quả nếu có chỉ là chỉ số rỗng tạm thời, tự sửa ở lượt sau.
  file: `pipeline/scripts/refresh-bait-gap-goi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm-tính-một-mình): kiểm «không dòng audit bait-gap mới» ở RB-AC-1 không có đối chứng dương**
  Người dùng thấy gì: Một bước kiểm xác nhận không có dòng nhật ký mới luôn xanh vì không có ca nào chứng minh nhật ký đó thường được ghi. Nên bước này chưa thực sự chứng minh được gì thêm.
  Căn cứ: Điều chính cần chứng minh, giá trị chỉ số còn nguyên khi bị khoá chặn, đã được kiểm riêng, nên phần này chỉ là lớp bằng chứng phụ còn mỏng.
  file: `pipeline/scripts/refresh-bait-gap-khoa.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

