# Review findings: db-tu-khoi-dong (round 1)

## Trong hợp đồng

- **run_restart: các đường lỗi dùng `return` làm sót container dind có đặc quyền, vì trap EXIT chạy khi biến local của hàm đã mất**
  file: `scripts/check-db-autostart.sh:116`
  severity: medium
  AC: AC-6
  source: bugs
  detail: `cleanup() { docker rm -fv "$name" ...; rm -rf "$t"; }` được đăng ký bằng `trap cleanup EXIT`, nhưng `name` và `t` là biến `local` trong run_restart. Bốn đường lỗi chạy sau khi `docker run` đã tạo container rồi `return`: dòng 125 (wait_dockerd), dòng 149 (compose up), dòng 159 (docker restart) và dòng 160 (wait_dockerd sau khởi động lại). Ở mỗi đường, run_restart trả về, script chính chạy tới `exit $FAIL`, và trap EXIT chạy ngoài phạm vi hàm. Lúc đó `$name` và `$t` rỗng nên trap chạy `docker rm -fv ""`, lỗi âm thầm vì `>/dev/null 2>&1`. Container au7-dind-* có đặc quyền, volume ẩn danh và thư mục tạm bị bỏ lại, không báo gì. Đã tái hiện bằng script tối thiểu cùng cấu trúc: với `return` trap in `name=[]`; với `exit` trong hàm hoặc `exit 143` từ trap TERM thì in `name=[abc]`. Chế độ `cleanup` (E6/AC-6) chỉ chạy `exit 3` trong hàm (AU7_FAIL_AFTER) và SIGTERM lúc `wait`; cả hai còn biến local trong phạm vi nên báo PASS trong khi các đường lỗi thật bị sót. Cách sửa: đưa `name` và `t` thành biến toàn cục (hoặc bung giá trị vào chuỗi trap lúc đặt trap, ví dụ `trap "docker rm -fv '$name' ..." EXIT`), hoặc thay mỗi `return` sau `docker run` bằng `exit`.
  rationale: AC-6 đòi không còn container au7-dind-* sau khi lệnh thoát kể cả khi lượt đo thoát lỗi giữa chừng sau khi đã dựng daemon cách ly; các đường lỗi dùng return làm container sót lại, tức AC-6 thất bại.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **runtime-map nói scripts/migrate-export.sh chạy `docker compose up -d`, nhưng script không chạy lệnh đó**
  Người dùng thấy gì: Sổ vận hành nêu nhầm một script là nơi sẽ tạo lại container DB. Người đọc có thể tưởng chạy script đó là DB đã nhận cấu hình mới, nhưng DB đang chạy vốn đã có chế độ tự bật lại nên không mất gì.
  Căn cứ: Chỉ là một dòng chú thích sai trong tài liệu, không làm hỏng hay mất dữ liệu, và DB đang sống đã mang sẵn chế độ tự bật lại; sửa sau rất rẻ.
  file: `docs/ops/runtime-map.md`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): E5 ghi «chiều đỏ ở E9» cho cả bộ live, nhưng E9 chỉ có đột biến cho 2 trên 4 assert của check_live**
  Người dùng thấy gì: Phép kiểm máy thật chỉ được thử chiều đỏ cho hai trong bốn điều kiện. Nếu việc kiểm colima có nạp trong hệ thống bị gõ sai thì phép kiểm vẫn báo xanh mà không ai biết.
  Căn cứ: Hai điều kiện quan trọng nhất đã có đối chứng đỏ, phần còn lại chỉ là lớp phụ và chỉ ảnh hưởng độ tin của phép kiểm chứ không làm DB hỏng hay mất dữ liệu; bổ sung sau không đắt.
  file: `scripts/check-db-autostart.sh`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
