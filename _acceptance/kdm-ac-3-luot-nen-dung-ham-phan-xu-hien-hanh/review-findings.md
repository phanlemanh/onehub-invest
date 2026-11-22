# Review findings: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **CHUOI_PHAN_XU chỉ là danh sách khai, napPhatBieu không đọc nó; chú thích mô tả sai regex của ca canh**
  Người dùng thấy gì: Chú thích trong công cụ đo hứa một lớp canh mạnh hơn thực tế. Người đọc sau này có thể tin rằng thêm migration mới sẽ luôn bị bắt, trong khi thực ra chỉ có phép so bản hàm ở ca khác bắt được.
  Căn cứ: Chỉ là chú thích sai, không làm sai số liệu hay mất dữ liệu; một lớp canh khác vẫn bắt được lỗi thật, và sửa sau rất rẻ.
  file: `pipeline/lib/nap-045.mjs`
  severity: low
  Đề xuất: known-limits

- **Thước không kiểm --pha có hợp với chế độ: chiều đỏ có thể chạy ra xanh, chiều chưa khai vẫn chạy**
  Người dùng thấy gì: Nếu người chạy công cụ đo gõ nhầm tổ hợp tuỳ chọn, công cụ có thể báo xanh dù đang ở chiều thử lỗi, hoặc chạy một chiều chưa được khai. Chỉ ảnh hưởng người vận hành công cụ nội bộ.
  Căn cứ: Chỉ gây hiểu nhầm khi gõ sai lệnh, không đụng dữ liệu thật và người dùng cuối không thấy; chạy lại đúng lệnh là xong.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo CHỈ DẪN thay vì ĐẦU RA): HT5-AC-1 đối chiếu hằng CHUOI_PHAN_XU, mà napPhatBieu không hề đọc hằng này**
  Người dùng thấy gì: Ca kiểm danh sách migration chỉ đo lời khai, không đo việc nạp lại thật. Một migration mới có thể làm ca này xanh dù chưa được áp lại, và chỉ ca so bản hàm sau đó mới bắt được.
  Căn cứ: Lỗ này vẫn bị ca so bản hàm trên DB bịt lại nên không lọt ra dữ liệu thật; chỉ là lớp canh sớm kém hơn lời hứa, sửa sau không gấp.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 1 (đo CHỈ DẪN thay vì ĐẦU RA): eval E7 chỉ chạy `--kiem` trên so-cat-chuyen.md đã commit, không chạy lại phat-bieu-cat-chuyen**
  Người dùng thấy gì: Phép kiểm so sánh hai bản cắt chuyển chỉ đọc tệp ghi kết quả cũ, không chạy lại. Nếu mã đổi sau đó làm kết quả lệch thì phép kiểm này vẫn báo xanh.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng; chỉ làm bằng chứng nghiệm thu cũ đi, và có thể chạy lại bằng tay khi cần.
  file: `_acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): ô «DB chưa có phần chèn 068, 099: không cấy thêm» thiếu đối chứng dương, và không kiểm rằng trạng thái «chưa chèn» đã dựng được thật**
  Người dùng thấy gì: Một ô kiểm có thể báo xanh dù bước dựng trạng thái thử không thật sự gỡ được phần cần gỡ. Khi đó ô này không chứng minh được điều nó nói.
  Căn cứ: Chỉ làm phép đo yếu đi, không gây mất hay lộ dữ liệu; phép đo chính vẫn có chiều đỏ, thêm đối chứng sau là rẻ.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
