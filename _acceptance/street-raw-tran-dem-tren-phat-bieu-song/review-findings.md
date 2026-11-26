## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính một mình): ca 50 của TD-AC-5 chỉ khẳng định «không có chữ vượt trần», nên vẫn xanh khi transform sập vì lỗi khác**
  file: `pipeline/scripts/street-raw-tran-dem.test.mjs:83`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Ở nhánh 50, TD-AC-5 hứa «50 thì không dừng vì trần», nhưng phép đo chỉ có `assert.doesNotMatch(r50.loi ?? "", /vượt trần/, ...)`. Không có đối chứng dương nào cho thấy lượt đã đi qua chỗ kiểm trần và chạy tiếp: không ghim `r50.loi === null`, không kiểm `r50.ghi` có câu ghi mong đợi (ví dụ UPDATE rút 50 phát biểu), không ghim thông điệp lỗi nào khác. Chạy lại đúng client giả này trên HEAD 851d52a4f: ca 50 ném `TypeError: Cannot read properties of undefined (reading 'r')`, tức lượt sập sau chỗ kiểm trần vì client giả trả `rows: []` cho mọi câu khác, vậy mà assertion vẫn xanh. Vì vậy bất kỳ lỗi nào làm transform dừng, kể cả lỗi xảy ra trước chỗ kiểm trần mà không mang chữ «vượt trần», đều qua được ca này. Nó chỉ bắt được đúng một kiểu lỗi: so trần lệch một đơn vị (>= thay cho >). Phải có chiều dương thì ca này mới đo được lời hứa «không dừng».
  rationale: AC-4 đòi test có ca «51 mới vào trần và dừng (50 đi tiếp)» và «phá từng nhánh thì đúng ca giữ nó đỏ»; ca 50 chỉ có assertion âm tính nên không chứng minh được lượt đi tiếp.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khi sổ nguồn thêm mục mới, trần bỏ qua phuong_raw/district_raw đang lưu của tin cũ, nên lượt chạy xanh mà không báo (r1)**
  Người dùng thấy gì: Khi danh sách tên nguồn cần che được thêm mục mới, các tin đã thu từ trước vẫn có thể giữ chữ mang tên nguồn ở ô phường và quận. Job vẫn chạy xanh và không báo lỗi nào, nên không ai biết ngay.
  Căn cứ: Chỉ xảy ra khi danh sách tên nguồn đổi, hiếm và do người soát danh sách chủ động làm. Dữ liệu vẫn bị chặn ở bước gửi lên cloud nên không lộ ra ngoài, và sửa sau thì rẻ.
  file: `pipeline/transform-chotot.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
