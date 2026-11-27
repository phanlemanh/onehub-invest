## Trong hợp đồng

- **Cách lùi 4c (pg_restore --clean -t airbnb_snapshots) không chạy được: DROP TABLE bị chặn vì phụ thuộc, rồi COPY chèn trùng khoá**
  AC: AC-10
  file: `_acceptance/nap-s09-quy-can-va-can-cao-tang/ap-may-thu.md:67`
  severity: medium
  source: bugs
  detail: Mục 4c, «lối cuối» của hồ sơ áp, chạy `pg_restore --clean -t stg_s09_danh_ba -t airbnb_snapshots` vào DB máy thu đang sống. `--clean` phát `DROP TABLE` không kèm CASCADE. Có 11 migration tạo FK `REFERENCES airbnb_snapshots(snapshot_id)` (ví dụ 115 cho stg_s09_danh_ba), nên `DROP TABLE airbnb_snapshots` báo lỗi «other objects depend on it». Ba view của 130 cũng phụ thuộc stg_s09_danh_ba, nên `DROP TABLE stg_s09_danh_ba` cũng hỏng, trừ khi đã chạy 4a trước, mà hồ sơ không ghi bước đó là bắt buộc. Lệnh không có `--exit-on-error`, nên pg_restore chạy tiếp: CREATE TABLE báo «already exists», COPY chèn lại các dòng đã có và hỏng vì trùng PK. Kết quả: bảng không về trạng thái trước lượt áp, và lỗi chỉ hiện ở cuối thành số lỗi bị bỏ qua. Một trong năm thứ bắt buộc của lời áp (cách lùi) không dùng được như đã ghi. Cách sửa: khôi phục bằng `--data-only` sau khi TRUNCATE có kiểm soát, hoặc khôi phục vào DB phụ rồi chép dòng; nếu vẫn dùng pg_restore thì bắt buộc chạy 4a trước và thêm `--exit-on-error`.
  lý do vào hợp đồng: AC-10 đòi hồ sơ áp có đủ năm thứ gồm cách lùi; cách lùi cuối ghi không chạy được nghĩa là thứ bắt buộc này không dùng được.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **locTangA bỏ qua bảng kiểm kê của kind can-cao-tang: khoá lạ vào stg mà không ném lỗi**
  Người dùng thấy gì: Nếu sau này nguồn thêm một trường mới vào căn cao tầng (ví dụ ảnh hoặc toạ độ), trường đó sẽ lặng lẽ vào kho tạm mà hệ thống không báo. Với dữ liệu hiện có thì chưa có gì lọt.
  Căn cứ: Chưa có dữ liệu nào bị lộ vì bản thu hiện tại của căn cao tầng chỉ có bốn trường an toàn; rủi ro chỉ xuất hiện khi nguồn đổi cấu trúc và sửa sau cũng không đắt.
  file: `pipeline/lib/s09-danh-ba-v16.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bộ lọc tầng A chỉ xét khoá cấp một: lá lồng mới trong trường "giu" lọt vào stg**
  Người dùng thấy gì: Nếu nguồn thêm một đường dẫn ảnh vào sâu bên trong các trường lồng của quỹ căn, nó có thể vào kho tạm mà không bị chặn. Dữ liệu hiện có đã được kiểm và sạch.
  Căn cứ: Chỉ xảy ra khi nguồn đổi cấu trúc, kho tạm chỉ ở máy thu không lên cổng hay cloud, nên hậu quả nhẹ và dọn lại được.
  file: `pipeline/lib/s09-danh-ba-v16.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion một mình, không đối chứng): phép băm E6 «một · nạp lại · ngược» không thể đỏ trước đột biến ORDER BY ngược mà evals tuyên bố**
  Người dùng thấy gì: Phép kiểm chứng việc kết quả không phụ thuộc thứ tự nạp luôn cho kết quả xanh, nên nếu sau này có người sửa cách chọn bản thu sai thì phép kiểm này không báo. Kết quả hiện tại vẫn đúng.
  Căn cứ: Dữ liệu hiện tại không sai và người dùng chưa thấy ảnh hưởng, chỉ mất một lớp canh gác cho lần sửa sau; bổ sung phép kiểm sau không đắt.
  file: `pipeline/scripts/s09-v16-that.mjs`
  severity: high
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
