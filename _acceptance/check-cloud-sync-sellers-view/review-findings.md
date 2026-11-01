# Review findings: check-cloud-sync-sellers-view (round 3)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: local mô phỏng biến view sellers thành BẢNG 022, nên đường «sync đổ từ view» không bao giờ được đo**
  Người dùng thấy gì: Phép thử đồng bộ chạy trên bản sao dạng bảng chứ không phải đúng danh sách người bán dạng view của máy thu. Nếu đồng bộ thật xử lý view khác bảng, phép thử vẫn báo xanh và lỗi chỉ lộ khi chạy thật.
  Căn cứ: Đây là lựa chọn đã chốt từ đầu, phần đọc view đã được đo ở hồ sơ trước; nguy cơ thấp, không mất dữ liệu và không ảnh hưởng người dùng cuối.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — assert cột cloud = CLOUD_ALLOW.sellers chỉ đo lại cái fixture tự áp**
  Người dùng thấy gì: Một bước kiểm tra cột của bản sao cloud thực chất chỉ so danh sách với chính danh sách đã dùng để dựng nó. Nó chỉ bắt được trường hợp thiếu bảng, không bắt được cột cloud thật lệch.
  Căn cứ: Chỉ làm phép thử yếu hơn vẻ ngoài, không làm hỏng hay lộ dữ liệu của ai; các ca khác như rò cột vẫn có phép kiểm riêng nên sửa không gấp.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — nhánh 'TRIGGER LA' chỉ có khẳng định âm, không có đối chứng dương**
  Người dùng thấy gì: Chưa có phép thử nào chứng minh thước báo lỗi đúng khi gặp một cơ chế lịch sử lạ. Nếu cơ chế báo lỗi đó hỏng, thước có thể lặng lẽ bỏ qua thứ lạ.
  Căn cứ: Chỉ ảnh hưởng công cụ kiểm của đội, không chạm người dùng hay dữ liệu thật; lỗi nếu có sẽ lộ ra khi thước gãy và thử lại được.
  file: `_acceptance/check-cloud-sync-sellers-view/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 — 'thước không gọi cloud thật' được đo bằng grep văn bản tệp thước, không đo hành vi**
  Người dùng thấy gì: Việc xác nhận thước không chạm cloud thật chỉ dựa vào đọc chữ trong mã, không quan sát lúc chạy. Về lý thuyết có thể có đường vòng tới cloud mà kiểm tra này không thấy.
  Căn cứ: Rủi ro thấp vì thước chạy trên container tạm và không có chứng cứ gọi cloud; nếu có sự cố thì dữ liệu cloud cũng được bảo vệ bởi các lớp khác.
  file: `_acceptance/check-cloud-sync-sellers-view/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): sellers ở hai DB mô phỏng do thước tự dựng thành bảng theo DDL 022, rồi lại assert đúng hình đó (r2)**
  Người dùng thấy gì: Bước kiểm đồng bộ lên cloud chỉ chứng minh việc chép từ bảng sang bảng. Nó không chạy thử đường đọc từ khung nhìn người bán thật của máy thu. Nếu đường đó hỏng riêng thì bước kiểm này vẫn báo xanh.
  Căn cứ: Hợp đồng đã chủ ý loại phần này, và đường đọc khung nhìn thật đã được đo ở hồ sơ khác, nên rủi ro cho người dùng thấp và không mất dữ liệu.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): 'không ca nào in TRIGGER LA' và 'dump() ném TRIGGER LA' không có đối chứng dương (r2)**
  Người dùng thấy gì: Nếu sau này máy thu có thêm một cơ chế ghi lịch sử mới, bước kiểm có thể không báo lỗi đúng như hứa mà vẫn xanh. Người dùng cuối không bị ảnh hưởng trực tiếp, chỉ người vận hành có thể tin nhầm là bước kiểm đã quét sạch.
  Căn cứ: Đây là công cụ kiểm nội bộ chạy trên máy thu, không đụng dữ liệu người dùng, và người vận hành tự phát hiện được khi bước kiểm gãy vì phụ thuộc thiếu.
  file: `_acceptance/check-cloud-sync-sellers-view/evals.yaml`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
