## Trong hợp đồng

- **Đối chứng «khoá phụ rồi tên» của AC-2 dựa vào giả định Postgres giữ thứ tự chèn, điều Postgres không bảo đảm**
  AC: AC-2
  file: `app/tests/api-markets-khong-s02.test.tsx:21`
  severity: low
  source: conventions
  detail: Ghi chú mới (dòng 21-22) và câu đối chứng `theoChen` (dòng 89-91) cho rằng nếu route bỏ khoá phụ `m.name` thì «sort ổn định giữ thứ tự chèn» nên AC-2 sẽ đỏ. Câu `theoChen` lại sắp xếp mảng `TT` bằng JS (`Array.prototype.sort` ổn định), không đo hành vi của DB. Với `ORDER BY m.listing_count DESC` không có khoá phụ, Postgres không bảo đảm thứ tự giữa các dòng bằng nhau. Thứ tự đó phụ thuộc thứ tự quét heap của `areas`, kế hoạch truy vấn và thuật toán sắp xếp (với LIMIT có thể chuyển sang top-N heapsort, vốn không ổn định). Vì vậy đột biến «bỏ rồi tên» chỉ đỏ một cách tình cờ. `assert.notDeepEqual(theoChen, MONG)` luôn xanh nên tạo cảm giác ca kiểm phân biệt được khoá phụ trong khi nó chỉ kiểm thứ tự của mảng cố định viết tay. Muốn đo thật thì cần cách không dựa vào thứ tự vật lý, ví dụ chèn theo nhiều thứ tự khác nhau, chạy đột biến (bỏ `, m.name`) chắc chắn đỏ, hoặc soát văn bản SQL có khoá phụ.
  rationale: AC-2 đòi thứ tự «bằng nhau thì theo tên» có chiều đỏ; đối chứng của nửa này không đo hành vi thật của DB nên AC-2 chưa được chứng minh đầy đủ.

- **Hình dạng 2 — đối chứng khoá phụ «rồi tên» là mô hình JS viết tay về route lỗi, không chạy SQL lỗi trên DB**
  AC: AC-2
  file: `app/tests/api-markets-khong-s02.test.tsx:90`
  severity: medium
  source: measurement
  detail: Dòng 90–91 (`const theoChen = [...TT].sort((a, b) => b.tin - a.tin)...; assert.notDeepEqual(theoChen, MONG, ...)`) chỉ sort mảng fixture TT bằng Array.prototype.sort của JS (ổn định) rồi so với MONG. Nó không chạy câu SQL của route khi bỏ `, m.name` trên DB thử. Đối chứng S02 ngay phía trên thì có chạy thật: SQL_CU dựng từ JOIN_S02_CU được ghim ở bộ soát và gọi `q(...)` trên DB. Chú thích ở dòng 21–22 hứa rằng nếu route bỏ khoá phụ thì «sort ổn định giữ thứ tự chèn và AC-2 đỏ», nhưng ORDER BY của Postgres không bảo đảm ổn định; thứ tự vào bước sắp xếp cũng phụ thuộc kế hoạch quét, không phụ thuộc thứ tự mảng TT. Vì vậy assert này chỉ chứng rằng fixture khác MONG theo một mô hình tự giả định về bên đọc, không chứng rằng route mất khoá phụ thì test đỏ. Muốn có thì chạy biến thể SQL bỏ `, m.name` trên cùng DB, như cách đã làm với SQL_CU.
  rationale: Cùng một điểm yếu: nửa «bằng nhau thì theo tên» của AC-2 không có đối chứng chạy trên đầu ra thật, nên chiều đỏ của AC-2 chưa đạt.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thẻ nghiệm thu tả sai cách rào đối xử với db.ts (nói 'chỉ bỏ qua đoạn đổi tên', mã thật quét trọn không ngoại lệ) (r2 · tệp đã đổi)**
  Người dùng thấy gì: Thẻ người ký đọc tả cách rào kiểm tra khác với thực tế, nên người ký có thể hiểu sai mức kiểm tra. Số liệu thị trường trả ra cho người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là chữ trên thẻ, không làm lộ hay sai dữ liệu của người dùng, và sửa lại chữ sau này rất rẻ.
  file: `_acceptance/api-markets-khong-tra-so-s02/card-plain.json`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

