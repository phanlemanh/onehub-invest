# Review findings: api-markets-khong-tra-so-s02 (round 2)

## Trong hợp đồng

- **Hình dạng 3 (lời hứa là QUAN HỆ, tập thử không ép được nửa «bằng nhau thì theo tên» của AC-2)**
  AC: AC-2
  file: `app/tests/api-markets-khong-s02.test.tsx:86`
  severity: medium
  source: measurement
  detail: AC-2 hứa hai khoá xếp: số tin giảm dần, «bằng nhau thì theo tên». Mảng TT được chèn theo đúng thứ tự tên (Aaa, Alpha, Beta, Gamma), nên seq scan trả các dòng theo thứ tự tên. Với 4 dòng, qsort của Postgres dùng insertion sort (n<7), là sort ổn định, nên nếu route bỏ `, m.name` và chỉ còn `ORDER BY m.listing_count DESC` thì vẫn ra đúng MONG = [Alpha, Beta, Aaa, Gamma]. Như vậy `assert.deepEqual(thuTu, MONG)` vẫn xanh. Phép đối chứng `notDeepEqual(theoTen, MONG)` chỉ phân biệt «chỉ theo tên» với «theo số tin», không phân biệt «chỉ theo số tin» với «theo số tin rồi tên». Đột biến bỏ khoá phụ vì thế không bị bắt. Cần thêm một cặp bằng số tin mà thứ tự chèn ngược với thứ tự tên (ví dụ chèn Beta trước Alpha), hoặc đối chứng thêm với SQL chỉ có khoá số tin.
  rationale: AC-2 hứa rõ «bằng nhau thì theo tên» nhưng tập thử không phân biệt được nửa này, nên AC-2 chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thẻ nghiệm thu tả sai cách rào đối xử với db.ts (nói 'chỉ bỏ qua đoạn đổi tên', mã thật quét trọn không ngoại lệ)**
  Người dùng thấy gì: Thẻ người ký đọc tả cách rào kiểm tra khác với thực tế, nên người ký có thể hiểu sai mức kiểm tra. Số liệu thị trường trả ra cho người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là chữ trên thẻ, không làm lộ hay sai dữ liệu của người dùng, và sửa lại chữ sau này rất rẻ.
  file: `_acceptance/api-markets-khong-tra-so-s02/card-plain.json`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

