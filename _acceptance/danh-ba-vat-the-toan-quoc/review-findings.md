# Review findings: danh-ba-vat-the-toan-quoc (round 1)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tham số `isoTheo` trong dung() là móc chỉ để test nhưng không test nào dùng; evals E5/E5b lại ghi chiều đỏ đi qua nó**
  Người dùng thấy gì: Phần mã dựng danh bạ có một lối phụ chỉ dành cho thử nghiệm mà chưa ai dùng, nên bằng chứng nghiệm thu ghi một phép thử lỗi mà thực tế chưa chạy. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Không làm sai dữ liệu của người dùng, chỉ làm bằng chứng nghiệm thu yếu hơn mô tả; sửa sau rẻ và không mất gì.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bảng mới `iso_regions` đặt cột tên tiếng Việt `ten`, trái luật đặt tên cột bằng tiếng Anh**
  Người dùng thấy gì: Bảng tra tỉnh có một cột tên đặt bằng tiếng Việt, lệch với quy ước tiếng Anh của dự án. Người dùng không thấy gì, nhưng mọi chỗ đọc bảng về sau sẽ mang tên lệch này.
  Căn cứ: Chỉ là chuyện đặt tên, không mất dữ liệu; đổi bây giờ rẻ vì chưa áp lên máy thật, còn sau khi áp thì đắt hơn nhiều.
  file: `db/migrations/088_iso_tinh.sql`
  severity: medium
  Đề xuất: new-contract

- **Comment của buocVatTheDem còn ghi builder_name là `hitl`, trái với thay đổi sang `source_field`**
  Người dùng thấy gì: Một dòng chú thích trong mã còn mô tả cách ghi chủ đầu tư theo kiểu cũ. Người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ gây hiểu nhầm cho người đọc mã, không động tới dữ liệu; sửa lúc nào cũng được và gần như không tốn gì.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: wont-fix

- **Import `node:path` hai lần trong cùng một tệp**
  Người dùng thấy gì: Mã khai báo cùng một thư viện hai lần. Người dùng không thấy khác biệt nào.
  Căn cứ: Không có hậu quả nào với người dùng hay dữ liệu; chi phí sửa tách riêng lớn hơn lợi ích.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: low
  Đề xuất: wont-fix

- **Chiều đỏ của E1 và E5 trong itest là phép so hiển nhiên đúng, không phải chiều đỏ thật như evals mô tả**
  Người dùng thấy gì: Một số phép thử lỗi trong bộ kiểm chỉ tự so với chính nó nên chưa chứng minh được bộ kiểm sẽ báo đỏ khi bảng mã tỉnh bị lệch. Người dùng chỉ bị ảnh hưởng nếu lỗi đó xảy ra mà không ai phát hiện.
  Căn cứ: Không làm sai dữ liệu hiện tại, chỉ làm lưới an toàn mỏng hơn ghi chép; ghi thành hạn chế đã biết là đủ cho đến khi có người viết lại phép thử.
  file: `pipeline/scripts/danh-ba-vat-the-iso.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): chiều đỏ của DA1-AC-5 là phép so tự đúng, không chạy dung() với isoTheo**
  Người dùng thấy gì: Phép kiểm rằng dựng lại khu không làm đổi mã căn có thể vẫn báo xanh ngay cả khi mã tỉnh bị suy sai. Nếu có lỗi, mã định danh của toà có thể lệch mà không ai hay.
  Căn cứ: Hậu quả có thể nặng nếu lỗi xảy ra vì mã định danh sai khó gỡ, nhưng hiện chưa thấy lỗi thật và lưới kiểm khác vẫn còn; ghi rõ giới hạn để người ký biết.
  file: `pipeline/scripts/danh-ba-vat-the-iso.itest.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đối chứng «46 lệch bảng vàng» của DA1-AC-1 không chạy vòng so thật**
  Người dùng thấy gì: Phép thử giả lập bảng tỉnh bị sai chưa chạy qua đúng bước so sánh thật, nên chưa chắc bắt được lệch. Người dùng không thấy gì trừ khi bảng bị lệch thật.
  Căn cứ: Một đường kiểm khác vẫn chạy thật nên rủi ro thấp; sửa sau rẻ và không mất dữ liệu.
  file: `pipeline/scripts/danh-ba-vat-the-iso.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đối chứng «meta.city sai tỉnh» chỉ so hằng số chép tay, không chạy đường cũ**
  Người dùng thấy gì: Bằng chứng rằng cách suy mã tỉnh cũ ra sai cho ba khu Hưng Yên mới là số chép tay, chưa chạy thật. Người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ làm bằng chứng so sánh yếu đi, không động tới dữ liệu; ghi lại là đủ.
  file: `pipeline/scripts/danh-ba-vat-the-iso.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert có mặt thay vì quan hệ): «20/20 nút ra ISO (0 lỗi)» chỉ đếm số ô thành công so với hằng 20**
  Người dùng thấy gì: Phép kiểm rằng mọi dự án đều ra mã tỉnh đang so với con số 20 cố định, nên nếu có thêm dự án lỗi thì vẫn có thể báo xanh. Người dùng có thể bỏ sót một khu không dựng được toà.
  Căn cứ: Rủi ro nhỏ vì dữ liệu hiện đúng 20 nút và lỗi nếu có sẽ lộ ở lần dựng; sửa sau rẻ.
  file: `pipeline/scripts/danh-ba-vat-the-iso.itest.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

