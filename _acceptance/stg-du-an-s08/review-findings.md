## Trong hợp đồng

- **Hình dạng 5 — tuyên quét lớp nhưng chỉ kiểm điểm: AC-4 hứa «cột sinh liên quan NULL, các cột còn lại bằng payload» mà chỉ assert vài cột mỗi mẫu**
  AC: AC-4
  file: `pipeline/scripts/s08-du-an.itest.mjs:181`
  severity: medium
  source: measurement
  detail: evals.yaml E4 hứa rằng với sáu dòng mồi, cột sinh liên quan đều NULL và các cột còn lại bằng payload. Nhưng vòng assert chỉ đi qua `m.ky` (bản đồ thưa viết tay) cộng với `project_code`. Cụ thể m2 và m3 (iframe rỗng, iframe /maps/d/embed) chỉ kiểm point_lat, không kiểm point_lng. Không mẫu nào kiểm project_name, project_address, project_type, total_area_raw, progress_raw. Investor chỉ kiểm ở m1 và m6, ownership_type_raw chỉ ở m1 và m2. Không có ma trận viết trước kiểu 6 mẫu × 10 cột sinh (số assert = số phần tử). Một cột sinh sai biểu thức ở những ô không được kiểm vẫn lọt qua.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thiếu 094 thì ROLLBACK cả snapshot S08 chỉ có căn, ngược với chính comment và điều kiện boHetS08**
  Người dùng thấy gì: Trên máy thu chưa áp bước nâng cấp bảng dự án, một lượt thu S08 chỉ có căn sẽ bị huỷ trọn và báo thành công. Dữ liệu căn S08 đó không vào hệ thống mà không có cảnh báo.
  Căn cứ: Mất dữ liệu căn S08 một cách im lặng cho tới khi áp nâng cấp, nhưng thu lại được và sửa nhỏ nên nên giao ZCode xử lý trong việc riêng.
  file: `pipeline/import-airbnb.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lỗi khi dò bảng 094 bị nuốt bằng .catch(() => false) trong lúc đang mở transaction**
  Người dùng thấy gì: Nếu bước kiểm tra bảng dự án gặp lỗi hiếm, lượt nạp sẽ hỏng theo cách khó hiểu thay vì rơi về chế độ cũ. Chỉ xảy ra khi cơ sở dữ liệu có sự cố thật.
  Căn cứ: Khả năng xảy ra thấp, hậu quả nhẹ vì chạy lại lượt nạp được, nên chỉ cần ghi lại làm hạn chế đã biết.
  file: `pipeline/import-airbnb.mjs`
  severity: low
  Đề xuất: known-limits

- **Thiếu 094 thì mọi snapshot S08 bị rollback và thoát 0, kể cả snapshot chỉ có căn (không có project_catalog)**
  Người dùng thấy gì: Khi máy thu chưa áp nâng cấp bảng dự án, các lượt thu S08 chỉ có căn bị huỷ trọn mà không báo lỗi. Người vận hành tưởng đã nạp nhưng dữ liệu không có.
  Căn cứ: Trùng lỗi với mục đầu: mất dữ liệu im lặng nhưng thu lại được, nên sửa trong việc riêng của làn thu thập.
  file: `pipeline/import-airbnb.mjs`
  severity: high
  Đề xuất: new-contract

- **Lỗi khi dò bảng 094 bị nuốt thành «chưa áp 094»**
  Người dùng thấy gì: Lỗi cơ sở dữ liệu thật có thể bị báo nhầm thành thiếu bước nâng cấp bảng dự án, làm người vận hành tìm sai hướng.
  Căn cứ: Chỉ gây hiểu nhầm khi có sự cố hiếm, thử lại được và không làm sai dữ liệu đã có, nên chỉ cần ghi lại.
  file: `pipeline/import-airbnb.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: test bộ nạp tự dựng bảng stg_s08_project thay vì áp 094**
  Người dùng thấy gì: Bài kiểm tra bộ nạp dùng bảng tự dựng nên có thể không phát hiện nếu bảng thật và bộ nạp lệch nhau. Lỗi lệch sẽ chỉ lộ khi chạy trên máy thu.
  Căn cứ: Rủi ro nằm ở khâu kiểm chứng của phần việc ZCode sau này, chưa mất dữ liệu nào, nên bổ sung khi làm bộ nạp chính thức.
  file: `pipeline/tests/s08-danh-muc-nap.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 4 — assertion âm tính đứng một mình: «KHÔNG có dòng airbnb_snapshots» không có ca đối chứng dương**
  Người dùng thấy gì: Bài kiểm tra chỉ xác nhận trường hợp thiếu bảng và không xác nhận trường hợp bình thường, nên có thể xanh dù bộ nạp không bao giờ ghi nhận lượt thu.
  Căn cứ: Chỉ là độ tin cậy của bài kiểm tra, không ảnh hưởng dữ liệu hiện tại; sửa rẻ khi làm bộ nạp chính thức.
  file: `pipeline/tests/s08-danh-muc-nap.test.mjs`
  severity: medium
  Đề xuất: new-contract

⚠ Cụm ngoài vùng phủ: 6/7 lỗi rơi vào file không bộ đo nào phủ (pipeline/import-airbnb.mjs, pipeline/tests/s08-danh-muc-nap.test.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
