# Review findings: nap-s09 (round 1)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **import-s09 bỏ qua kiểm sha256 và schemaVersion của manifest, đọc items theo glob thư mục thay cho manifest.files (lệch khuôn mọi bộ nạp khác)**
  Người dùng thấy gì: Nếu tệp bản thu bị hỏng hoặc bị sửa, dữ liệu dự án vẫn được nạp vào bảng mà không có cảnh báo nào.
  Căn cứ: Hậu quả nhẹ đến vừa: bản thu do mình tự thu và chỉ nạp thủ công trên máy thu, dữ liệu sai có thể nạp lại; sửa sau không đắt nhưng nên làm trước khi nạp tự động.
  file: `pipeline/import-s09.mjs`
  severity: medium
  Đề xuất: known-limits

- **Test import-s09 bị bỏ qua lặng lẽ trên CI (thoát 0), nên E1–E3 không bao giờ chạy ở CI**
  Người dùng thấy gì: Máy kiểm tự động hiển thị xanh nhưng thực ra không chạy các ca kiểm bộ nạp S09, nên lỗi sau này có thể lọt qua mà không ai biết.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, các ca vẫn chạy được trên máy làm việc; rủi ro là mất lưới an toàn về sau, sửa tương đối rẻ nhưng chạm vào cấu hình kiểm chung.
  file: `pipeline/tests/import-s09.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion chỉ âm tính): ca «không dòng mồ côi» ở S09-1 không bao giờ đỏ được, cũng không có đối chứng dương**
  Người dùng thấy gì: Một phép kiểm trong bộ test luôn cho kết quả đạt nên không thêm bảo đảm gì, nhưng không làm sai dữ liệu hay trải nghiệm của ai.
  Căn cứ: Chỉ là một dòng kiểm thừa, phần quan trọng đã được kiểm chỗ khác; sửa không mang lại lợi ích đáng kể.
  file: `pipeline/tests/import-s09.test.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
