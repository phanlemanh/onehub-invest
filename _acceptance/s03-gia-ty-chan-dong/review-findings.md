## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thẻ Cổng 1 và sổ quyết định vẫn ghi «không thêm thước trước → sau trên bài thật», trong khi AC-6/E6 chính là thước đó**
  Người dùng thấy gì: Người ký đọc thẻ sẽ thấy hai câu trái nhau về việc có so sánh trước/sau trên bài thật hay không, dễ ký trong tình trạng hiểu sai. Tính năng chạy đúng, chỉ phần giải thích cho người ký bị mâu thuẫn.
  Căn cứ: Nhẹ với người dùng cuối vì không ảnh hưởng dữ liệu, nhưng có thể làm người ký hiểu nhầm; sửa chữ rồi sinh lại thẻ thì rẻ.
  file: `_acceptance/s03-gia-ty-chan-dong/card.html`
  severity: medium
  Đề xuất: known-limits

- **Thước AC-6 chỉ so giá và SĐT, không so các trường khác của parsePost cũng đọc từ gatSo**
  Người dùng thấy gì: Phép so trước/sau trên tin thật chỉ kiểm giá và số điện thoại, nên nếu diện tích hay số phòng ngủ đổi theo thì phép đo vẫn báo đạt. Trường hợp này hiếm và hiện chưa có bài thật nào dính.
  Căn cứ: Rủi ro thấp vì dữ liệu hiện tại không có bài thuộc dạng này và lỗi nếu có chỉ làm sai vài số liệu, nạp lại là chỉnh được.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: low
  Đề xuất: known-limits

- **gatSo vẫn nuốt giá tỷ chẵn khi ngay sau giá là khoảng trắng/xuống dòng rồi tới số 1–2 chữ số**
  Người dùng thấy gì: Tin ghi giá tròn tỷ rồi xuống dòng hoặc cách ra một chút trước diện tích, số tầng, số phòng ngủ vẫn có thể bị đọc thành không có giá. Đo thực tế hôm nay chưa có bài thật nào bị, nhưng tin sau này viết kiểu đó sẽ mất giá một cách im lặng.
  Căn cứ: Mất giá thật nhưng không làm sai số liệu khác, hiện 0 bài thật dính, và nạp lại sau khi sửa là khôi phục được; đáng làm một việc riêng vì cùng loại lỗi hợp đồng này nhắm tới.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **AC-6 đạt suông khi bảng stg_zalo_posts rỗng hoặc trỏ nhầm DB, lượt đối chứng không chặn được**
  Người dùng thấy gì: Nếu chạy phép đo trên cơ sở dữ liệu rỗng hoặc nhầm máy, nó vẫn in đạt dù chưa so sánh bài thật nào, khiến bằng chứng nghiệm thu có thể trống mà không ai biết. Người chạy cần tự xem số bài đã so.
  Căn cứ: Không làm hỏng dữ liệu người dùng, chỉ làm bằng chứng nghiệm thu kém tin cậy; người ký tự kiểm số bài được so là thấy ngay.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Nhãn TY_CHAN của thước AC-6 lệch với điều gatSo thực sự giữ lại, nên báo sai «khac»**
  Người dùng thấy gì: Một số bài có giá hơi khác dạng tròn tỷ, hoặc có dấu phẩy sau giá, có thể làm phép đo báo trượt dù việc đọc giá mới là đúng. Hậu quả chỉ là báo động giả, người chạy sẽ phải xem lại bằng tay.
  Căn cứ: Chỉ gây báo lỗi thừa chứ không làm sai hay mất dữ liệu nào; hiện chưa có bài thật nào kích hoạt và dễ nhận ra khi gặp.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert «chuỗi có mặt» thay cho QUAN HỆ): nhãn 'gia-ty-chan-dong' của AC-6 chỉ kiểm chữ bài có chứa một số tỷ chẵn**
  Người dùng thấy gì: Phép đo chỉ xác nhận bài có chứa một giá tròn tỷ ở đâu đó, chưa chứng minh giá đổi chính vì giá ấy. Một bài đổi giá vì lý do khác nhưng tình cờ có số tròn tỷ vẫn lọt qua.
  Căn cứ: Khả năng gặp thấp, hậu quả chỉ là bỏ sót một thay đổi giá không mong muốn ở vài bài, không mất dữ liệu và nạp lại sửa được.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ đo vài phần tử): AC-6 hứa «so đầu ra parsePost» nhưng chỉ so priceVnd, pricePerm2Vnd và phones**
  Người dùng thấy gì: Phép so trước/sau trên tin thật chỉ xem giá và số điện thoại, không xem diện tích, số phòng ngủ hay loại nhà, nên thay đổi ở các mục đó sẽ không bị phát hiện. Cần ghi rõ để người ký biết phạm vi phép đo.
  Căn cứ: Nhẹ vì dữ liệu thật hiện không có bài thuộc dạng thay đổi và sai số nếu có chỉ ở vài trường mô tả; ghi rõ phạm vi đo là đủ.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
