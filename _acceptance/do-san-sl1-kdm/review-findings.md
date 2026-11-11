## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — fixture viết tay, không round-trip qua bên ghi: KDM-PX1 so vị từ của thước với chính hàm nó dùng**
  Người dùng thấy gì: Bài kiểm này chỉ chắc chắn rằng bộ đo khu vực của tin rao khớp với luật hiện tại. Nếu sau này luật ghi dữ liệu đổi sang cách khác mà bộ đo không đổi theo thì bài kiểm vẫn xanh. Người dùng cuối không thấy ảnh hưởng ngay, chỉ là một lỗi lệch có thể lọt qua.
  Căn cứ: Hậu quả nhẹ vì chỉ làm bộ kiểm bỏ sót một lần lệch trong tương lai, không làm mất hay lộ dữ liệu; sửa sau không đắt và lệch sẽ lộ ra ở các bước đo khác.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét cả LỚP «không ghi DB ngoài giao dịch» nhưng chỉ bắt câu SQL viết thẳng trong hai tệp**
  Người dùng thấy gì: Phép quét chỉ bắt được các lệnh ghi viết thẳng trong hai tệp. Nếu ai đó dời bước ghi gián tiếp ra ngoài vùng giao dịch thì phép quét không báo, và dữ liệu dùng chung có thể bị ghi nhầm khi chạy thử.
  Căn cứ: Nguy cơ có thật nhưng chỉ xảy ra nếu có người sửa tệp theo cách đặc biệt, và lỗi nằm ở máy thử chứ không ở dữ liệu người dùng; ghi rõ giới hạn là đủ.
  file: `_acceptance/do-san-sl1-kdm/probes/khong-db-chung.sh`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — E1 chỉ assert âm tính (0 tin sai), còn chiều đỏ trỏ sang E2 vốn không gọi hàm đếm**
  Người dùng thấy gì: Con số 0 tin sai khu vực chưa có đối chứng dương cho thấy bộ đếm thật sự phát hiện được tin sai. Nếu bộ đếm hỏng ngầm thì vẫn báo xanh và tin trỏ sai khu vực có thể không bị phát hiện.
  Căn cứ: Rủi ro thấp vì các ca chiều đỏ khác của hồ sơ trước đã chứng minh phần lớn đường đo, và bổ sung đối chứng sau này rẻ, không làm mất dữ liệu.
  file: `_acceptance/do-san-sl1-kdm/evals.yaml`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
