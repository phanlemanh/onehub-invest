# Review findings: noi-design-floor

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Glob thẳng `app/src/components/*.tsx` bỏ sót tệp .ts ở cấp gốc components, và bài test chạy trên CI không bắt được**
  Người dùng thấy gì: Nếu sau này có người thêm một tệp bảng màu dạng .ts đặt thẳng ở thư mục components, sàn kiểm màu thô sẽ không quét tệp đó và trên CI không có cảnh báo nào. Hôm nay chưa có tệp nào như vậy.
  Căn cứ: Hậu quả nhẹ và chưa xảy ra: chỉ là một lỗ hổng kiểm tra màu thô cho tệp chưa tồn tại, không mất dữ liệu hay hỏng giao diện; ghi lại làm hạn chế đã biết rồi bổ sung khi có tệp đầu tiên như thế thì rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **napKit không `--require` design-floor-bac.mjs mà NDF-AC-4 lại nạp tệp này**
  Người dùng thấy gì: Nếu bản công cụ kiểm tra trên máy thiếu một tệp, bài test vẫn báo đỏ nhưng bằng thông báo lỗi khó đọc hơn thay vì câu giải thích rõ ràng. Người làm chỉ mất thêm chút thời gian tìm nguyên nhân.
  Căn cứ: Chỉ ảnh hưởng độ rõ của thông báo lỗi trong tình huống hiếm, bài test vẫn đỏ đúng chỗ nên không có rủi ro lọt lỗi; chi phí sửa nhỏ nhưng lợi ích cũng rất nhỏ.
  file: `scripts/design-floor-vung.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Glob `components/*.tsx` loại im lặng tệp không phải .tsx nằm thẳng trong components; ở CI không test nào bắt**
  Người dùng thấy gì: Một tệp .ts hay .css mới đặt thẳng ở thư mục components sẽ nằm ngoài vùng kiểm màu thô mà không ai được báo, và trên CI bài test vẫn xanh. Hôm nay kho chỉ có tệp .tsx ở vị trí đó nên chưa ảnh hưởng ai.
  Căn cứ: Hậu quả nhẹ, chưa xảy ra và người dùng cuối không thấy gì; nếu lọt thì chỉ là một màu thô chưa bị bắt, dọn lại sau rất dễ, nên ghi làm hạn chế đã biết là đủ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

