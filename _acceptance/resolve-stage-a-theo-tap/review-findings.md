## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **resolve-so-stage-a.mjs mặc định --rev origin/main, ngược với chỗ ghim d2b4beaf ở .sh**
  Người dùng thấy gì: Nếu ai đó chạy thẳng công cụ so sánh mà không chỉ rõ bản cũ, sau khi gộp nó sẽ so bản mới với chính nó và báo xanh dù chưa chứng minh được gì. Đường chạy chính thức không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng người chạy tay công cụ kiểm, không đụng dữ liệu hay người dùng cuối, và chỉ cần ghi chú cách dùng đúng.
  file: `pipeline/scripts/resolve-so-stage-a.mjs`
  severity: medium
  Đề xuất: known-limits

- **Chú thích executor rsa_so trong config.yaml vẫn ghi bản cũ là origin/main**
  Người dùng thấy gì: Một dòng chú thích trong cấu hình nghiệm thu còn ghi sai mốc bản cũ. Người dùng không thấy gì, chỉ có thể làm người bảo trì hiểu nhầm.
  Căn cứ: Không ảnh hưởng dữ liệu hay hành vi nào, chỉ là chữ chú thích, sửa lúc nào cũng rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **resolve-so-stage-a.sh không kiểm đầu vào: chế độ lạ vẫn chạy nhánh so, --mau và --truoc được nối thẳng vào SQL**
  Người dùng thấy gì: Gõ nhầm tham số khi chạy công cụ đo sẽ khiến nó chạy phép so nặng hàng giờ thay vì phép đo nhanh. Chỉ chạm cơ sở dữ liệu thử, không chạm dữ liệu thật.
  Căn cứ: Công cụ nội bộ chỉ người vận hành chạy tay, hậu quả tối đa là tốn thời gian máy, không mất hay lộ dữ liệu.
  file: `pipeline/scripts/resolve-so-stage-a.sh`
  severity: low
  Đề xuất: wont-fix

- **resolve-so-stage-a.mjs mặc định --rev origin/main: sau khi gộp, chạy trực tiếp sẽ so bản mới với chính nó và vẫn báo xanh**
  Người dùng thấy gì: Chạy thẳng công cụ so sánh sau khi gộp có thể cho kết quả đạt mà thực ra không so với bản cũ nào. Đường chạy chính thức vẫn đúng.
  Căn cứ: Lỗi lọt im lặng nhưng chỉ khi gọi sai cách một công cụ kiểm nội bộ, không ảnh hưởng người dùng cuối.
  file: `pipeline/scripts/resolve-so-stage-a.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: kiểm «có chứa chuỗi» trong khi lời hứa là mệnh đề lọc giữ nguyên chữ bản cũ**
  Người dùng thấy gì: Phép kiểm điều kiện lọc có thể không bắt được trường hợp ai đó thêm hoặc bớt một điều kiện ngoài các mẩu đã ghim, nên vẫn báo khớp. Kết quả so dữ liệu thật vẫn là lưới chính bắt lệch.
  Căn cứ: Là lớp kiểm phụ cho ca hiếm mà dữ liệu thật hầu như không chạm tới, nên ghi thành giới hạn đã biết là đủ.
  file: `pipeline/scripts/resolve-so-stage-a.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
