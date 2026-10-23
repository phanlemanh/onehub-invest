# Review findings: db-tu-khoi-dong (round 2)

## Trong hợp đồng

Không có finding trong hợp đồng ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **runtime-map nói scripts/migrate-export.sh chạy `docker compose up -d`, nhưng script không chạy lệnh đó (r1)**
  Người dùng thấy gì: Sổ vận hành nêu nhầm một script là nơi sẽ tạo lại container DB. Người đọc có thể tưởng chạy script đó là DB đã nhận cấu hình mới, nhưng DB đang chạy vốn đã có chế độ tự bật lại nên không mất gì.
  Căn cứ: Chỉ là một dòng chú thích sai trong tài liệu, không làm hỏng hay mất dữ liệu, và DB đang sống đã mang sẵn chế độ tự bật lại; sửa sau rất rẻ.
  file: `docs/ops/runtime-map.md`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): E5 ghi «chiều đỏ ở E9» cho cả bộ live, nhưng E9 chỉ có đột biến cho 2 trên 4 assert của check_live (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm máy thật chỉ được thử chiều đỏ cho hai trong bốn điều kiện. Nếu việc kiểm colima có nạp trong hệ thống bị gõ sai thì phép kiểm vẫn báo xanh mà không ai biết.
  Căn cứ: Hai điều kiện quan trọng nhất đã có đối chứng đỏ, phần còn lại chỉ là lớp phụ và chỉ ảnh hưởng độ tin của phép kiểm chứ không làm DB hỏng hay mất dữ liệu; bổ sung sau không đắt.
  file: `scripts/check-db-autostart.sh`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
