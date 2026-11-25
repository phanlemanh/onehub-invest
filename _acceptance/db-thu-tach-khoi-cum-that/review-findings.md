# Review findings: db-thu-tach-khoi-cum-that (round 1)

## Trong hợp đồng

- **Với --chay-trong, hai tệp test của pipeline_b tạo DB tạm trên cụm dùng một lần nhưng lại nối vào cụm thật ở :5433, nên nửa B đỏ và lệnh test chạm one-invest-db**
  AC: AC-2
  file: `pipeline/package.json:337`
  severity: high
  source: bugs
  detail: Diff chuyển `test:b` từ `--chay` sang `--chay-trong` (db/db-thu.sh). Ở nhánh mới, db-thu.sh đặt `DATABASE_URL` và `TEST_DATABASE_URL_ADMIN` trỏ vào `127.0.0.1:<cổng ngẫu nhiên>`. Nửa B gồm pipeline/scripts/cong-tac-that.test.mjs và pipeline/scripts/s06-region-tinh.test.mjs (xem `node chay-nua.mjs b --liet`). Cả hai tệp viết cùng một khuôn:
  ```js
  const DB_ROOT = process.env.TEST_DATABASE_URL_ADMIN ?? "<url-kết-nối>";
  const DB = `<url-kết-nối>`;
  ```
  Hook `test.before` chạy `CREATE DATABASE ${TAMP_DB}` qua DB_ROOT, tức là trên cụm dùng một lần. Ngay sau đó nó nối `DB`, mà `DB` ghim cứng localhost:5433, tức là cụm thật one-invest-db. DB tạm không có ở đó, nên lời nối báo `database ... does not exist`; nếu cổng 5433 không mở thì báo ECONNREFUSED. Hook before đỏ thì mọi ca của hai tệp đỏ theo, nên `executors.suite.pipeline_b` đỏ.
  Trước diff, `--chay` đặt TEST_DATABASE_URL_ADMIN về `localhost:5433/<db suite>`, cùng cụm với `DB`, nên hai tệp xanh. CI cũng xanh vì service của CI nằm đúng ở 5433. Lỗi chỉ hiện trên lượt chấm local, và vì `--chay-trong` mới thêm nên hai tệp này mới gãy.
  Ngoài chuyện đỏ, hồ sơ cam kết «không lệnh nào nhắm cụm thật one-invest-db» bị vi phạm: test vẫn mở kết nối vào cụm thật.
  Cách sửa: dựng `DB` từ DB_ROOT, đổi pathname thành TAMP_DB, thay cho việc ghim cứng `localhost:5433`. Hai tệp nằm ngoài vùng vật, nhưng gãy là do thay đổi ở pipeline/package.json và db/db-thu.sh trong vùng vật.
  rationale: Nửa B đỏ trên cụm dùng một lần làm AC-2 (hai nửa thoát 0) thất bại, đồng thời vi phạm điều kiện AC-1 là không lệnh nào nhắm cụm thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **db-thu-trong.test.mjs sẽ đỏ trên job `scripts` của CI: cần container one-invest-db nhưng không bỏ qua khi chạy CI**
  Người dùng thấy gì: Khi đẩy lên CI, bộ kiểm tra của hàng này sẽ báo đỏ vì máy CI không có sẵn cụm dữ liệu thử mà các ca cần. Việc gộp PR có thể bị chặn dù tính năng không hỏng.
  Căn cứ: Chỉ làm đỏ CI chứ không mất hay lộ dữ liệu, người dùng cuối không thấy gì; sửa rẻ nhưng nằm ngoài các tiêu chí đã ký nên cần một việc nhỏ riêng.
  file: `scripts/db-thu-trong.test.mjs`
  severity: high
  Đề xuất: new-contract

- **JSDoc mồ côi trong pipeline-that-hang-ngay.mjs mô tả một hàm không còn ở đó**
  Người dùng thấy gì: Một dòng ghi chú trong công cụ nội bộ mô tả sai hàm, chỉ có thể làm người đọc mã hiểu nhầm. Không ảnh hưởng gì tới kết quả hay người dùng.
  Căn cứ: Chỉ là chú thích sai, không ảnh hưởng chạy hay dữ liệu; sửa lúc nào cũng được và chi phí mở việc riêng vượt hậu quả.
  file: `scripts/pipeline-that-hang-ngay.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 — đo chỉ dẫn thay vì đầu ra: E2c grep mã nguồn chay-nua.mjs, không đo tập ca mà chay-nua thật sự bỏ qua dưới CI=true**
  Người dùng thấy gì: Phép kiểm tra rằng hai nửa suite bỏ đúng 30 ca dữ liệu thật mới chỉ soi chữ trong mã, chưa chạy thật. Nếu mối nối sai thì bộ kiểm vẫn báo xanh nhưng lượt chấm sẽ chạy nhầm ca và chậm hoặc đỏ.
  Căn cứ: Rủi ro chỉ là tốn thời gian chấm hoặc báo xanh giả, không mất dữ liệu; lượt chạy thật sẽ lộ ra khi có sự cố, nên ghi lại là đủ.
  file: `scripts/pipeline-that.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: đầu ra node --test giả dùng đơn vị «s» mà spec reporter không in**
  Người dùng thấy gì: Dòng báo ca đỏ của lệnh kiểm hằng ngày mới được thử trên đầu ra tự viết, chưa trên đầu ra thật. Có thể có lần ca đỏ thật nhưng dòng báo không gọi đúng tên ca.
  Căn cứ: Chỉ ảnh hưởng chữ báo cáo của lệnh kiểm hằng ngày, không mất hay lộ dữ liệu; người vận hành vẫn thấy lần đỏ và tự mở sổ xem được.
  file: `scripts/pipeline-that-hang-ngay.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
