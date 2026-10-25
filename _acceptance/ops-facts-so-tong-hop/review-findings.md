# Review findings: ops-facts-so-tong-hop (round 2)

## Trong hợp đồng

Không có finding trong hợp đồng ở round 2.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 5 (ma trận viết trước nhưng số ca thực chạy không ghim bằng số phần tử): WANT ở AC-6 lặng lẽ rụng hàng**
  Người dùng thấy gì: Nếu sau này một job nền bị đổi tên hoặc gỡ đi, bài kiểm tra tự động cho phần trạng thái job có thể vẫn báo xanh dù không còn kiểm job đó nữa. Người dùng trang Ops không thấy ảnh hưởng ngay, chỉ là lưới an toàn phát hiện lỗi về sau lỏng hơn.
  Căn cứ: Hậu quả nhẹ và không chạm số liệu người dùng: số trên trang vẫn đúng hôm nay, chỉ có nguy cơ một lỗi tương lai lọt qua bài kiểm tra; ghi lại để biết và sửa rẻ khi có dịp chạm lại phần này.
  file: `pipeline/scripts/ops-facts-so-tong-hop.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assert phủ định đứng một mình, không ghim thông điệp): chiều đỏ «lỗi dây chuyền» chỉ đòi tập khối lỗi khác tập đúng**
  Người dùng thấy gì: Bài kiểm tra mô phỏng một khối số bị lỗi kéo theo khối khác chỉ xác nhận «có khác đi», chưa xác nhận đúng khối nào bị kéo theo. Người dùng không thấy ảnh hưởng, chỉ là bài kiểm tra có thể xanh trong khi thực ra không bắt đúng lỗi định bắt.
  Căn cứ: Hậu quả nhẹ, không làm mất hay sai số liệu trên trang Ops; chỉ làm bài kiểm tra kém sắc hơn một chút và có thể siết lại rẻ khi mở lại tệp kiểm tra này.
  file: `pipeline/scripts/ops-facts-so-tong-hop.test.mjs`
  severity: low
  Đề xuất: known-limits

- **ops-local.mjs hardcode tên luồng thu (literal nguồn) thay vì đọc source_ids từ source_registry (r1)**
  Người dùng thấy gì: Danh sách luồng thu dùng để đếm bản ghi 24 giờ được viết cứng ở một chỗ nữa. Nếu sau này một nguồn đổi tên luồng, số bản ghi theo nguồn trên trang Ops sẽ lệch mà không ai được báo.
  Căn cứ: Hiện số đúng và không lộ dữ liệu nhạy cảm; rủi ro chỉ xảy ra khi có người đổi cấu hình nguồn, và sửa sau không đắt.
  file: `scripts/lib/ops-local.mjs`
  severity: low
  Đề xuất: known-limits

- **sourceRunsQ bắt mọi lỗi của truy vấn đầy đủ, không ghi log, rồi lặng lẽ trả last_run/items_24h/offers = null (r1)**
  Người dùng thấy gì: Khi truy vấn chạy gần nhất của từng nguồn gặp lỗi bất kỳ, hệ thống vẫn gửi lên với số trống và không để lại dấu vết. Trang Ops có thể hiện thiếu thông tin về lần chạy mà không ai biết vì sao.
  Căn cứ: Cloud hiện chỉ đọc tên và nhãn của phần này nên người dùng gần như không thấy ảnh hưởng, và sau này thêm cảnh báo thì không mất dữ liệu.
  file: `pipeline/push-ops-facts.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
