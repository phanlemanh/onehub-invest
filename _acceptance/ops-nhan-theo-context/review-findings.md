# Review findings — ops-nhan-theo-context (round 2)

## Trong hợp đồng

Không có phát hiện nào trong hợp đồng ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 5 — tuyên sửa cả lớp 4 chỗ nhãn dự phòng nhưng phép đo chỉ có điểm-case cho 3 chỗ (thiếu feeds-grid)**
  Người dùng thấy gì: Trên trang Thu thập, nếu một nguồn có trạng thái lạ, nhãn «Giá trị khác» kèm mã gốc hiện đang đúng nhưng chưa có phép đo giữ nó. Sau này nếu ai đó vô tình làm mất mã gốc ở đó, người vận hành chỉ thấy nhãn chung chung mà không biết trạng thái thật là gì.
  Căn cứ: Hậu quả nhẹ: chỉ ảnh hưởng một chỗ hiển thị nhãn khi gặp trạng thái nguồn lạ, không mất hay lộ dữ liệu, và bản hiện tại đang đúng; thêm phép đo sau này rẻ.
  file: `app/tests/ops-nhan-theo-context.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — vòng thu S02 rỗng thì test tự dựng fixture theo khuôn bên đọc, bỏ qua hàm nạp**
  Người dùng thấy gì: Khi máy kiểm không có dữ liệu vòng thu thật, phần tên thị trường trong vòng thu S02 được kiểm trên dữ liệu dựng sẵn thay vì dữ liệu thật. Nếu dữ liệu thật lệch khuôn, lỗi tên không dấu hay hiện mã trên trang vẫn có thể lọt qua mà bài kiểm báo xanh.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra khi máy kiểm thiếu dữ liệu vòng thu; trang chạy thật vẫn được smoke 7 trang soi lại, và người vận hành tự thấy lỗi tên khi mở trang.
  file: `app/tests/ops-nhan-theo-context.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Nhãn tác vụ trên cổng Ops ở máy chủ vẫn tiếng Anh: bản sao nhãn trong push-ops-facts.mjs chưa được đổi (r1)**
  Người dùng thấy gì: Trên bản chạy thật (cloud), lưới «Máy móc» ở trang Thu thập vẫn hiện vài nhãn tiếng Anh cũ như «rotation 6 market» hay «Kev gate». Bản chạy trên máy thu đã đúng tiếng Việt.
  Căn cứ: Chỉ là chữ hiển thị, không mất hay lộ dữ liệu, người vận hành vẫn hiểu được; hợp đồng đã ghi đây là hạn chế có tên, và sửa sau cũng rẻ.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: known-limits

- **Smoke tạo user admin và phiên trên bất kỳ DB nào mà DATABASE_URL trỏ tới, không chặn khi không phải localhost (r1)**
  Người dùng thấy gì: Nếu máy đang trỏ nhầm vào cơ sở dữ liệu thật khi chạy bài kiểm này, nó sẽ tạo tạm một tài khoản quản trị trên hệ thống thật. Tài khoản này được xoá cuối lượt nhưng vẫn là ghi vào dữ liệu thật.
  Căn cứ: Hậu quả có thể nghiêm trọng nếu chạy nhầm môi trường, nhưng chỉ xảy ra khi người chạy đang giữ khoá cloud trong shell; sửa rất rẻ nên nên làm thành việc riêng.
  file: `scripts/smoke-ops-nhan.mjs`
  severity: low
  Đề xuất: new-contract

- **getAreaNames nuốt mọi lỗi truy vấn và trả bảng rỗng, không ghi log (r1)**
  Người dùng thấy gì: Khi cơ sở dữ liệu lỗi tạm thời, các trang Ops vẫn mở bình thường nhưng mọi tên thị trường hiện «chưa có tên Việt». Người vận hành không biết đó là lỗi hệ thống.
  Căn cứ: Nhẹ: không mất dữ liệu, tải lại trang là hết khi DB phục hồi, và các truy vấn khác cùng trang vẫn báo lỗi nên sự cố lớn vẫn lộ ra.
  file: `app/src/lib/ops-queries.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

