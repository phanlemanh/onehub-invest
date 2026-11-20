## Trong hợp đồng

- **E1 khẳng định «khoá thật thì lượt 00:00 trả mã khác 0», nhưng test chỉ dùng khoá giả, còn lượt 00:00 thật không có lock_timeout**
  AC: AC-1
  file: `_acceptance/phuong-tu-du-an-chay-that/evals.yaml:10`
  severity: low
  source: conventions
  detail: Phần expected của E1 ghi: «phiên thứ hai giữ khoá thật thì lượt nhanh in BỎ LƯỢT và lượt 00:00 trả mã khác 0». Trong scripts/phuong-tu-du-an-chuoi.test.mjs, khoá thật chỉ được đo ở lượt nhanh, nhờ S03_NHANH_LOCK_TIMEOUT. Ca 00:00 dùng node giả in chuỗi «lock timeout» (FAIL_STEPS `phuong-tu-du-an:1:khoa`). Lượt 00:00 thật không đặt lock_timeout (zalo-import-daily.sh:219 chỉ đặt khi NHANH=1). Vì vậy khi có khoá thật, bước này sẽ chờ vô hạn chứ không thoát khác 0. Bằng chứng nói nhiều hơn điều test đã chứng minh: nên sửa lời expected cho khớp, hoặc đo khoá thật ở lượt 00:00.

- **Lệnh kiểm sau và lệnh lùi trong README dùng `psql -f <đường host>` qua `docker exec`, nên psql trong container không thấy tệp**
  AC: AC-6
  file: `_acceptance/phuong-tu-du-an-chay-that/ap-may-thu/README.md:17`
  severity: high
  source: bugs
  detail: README định nghĩa `psql …` là `docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql …`, rồi gọi `psql … -f _acceptance/phuong-tu-du-an-chay-that/ap-may-thu/lui.sql`, và gọi kiem-sau.sql theo cùng cách ở bước 2 và bước 4. Với `-f`, psql đọc tệp bên trong container. Container `one-invest-db` chỉ gắn volume `onehub_pgdata:/var/lib/postgresql` (đã kiểm bằng `docker inspect` và db/docker-compose.yml), không gắn kho. Vì vậy cả lệnh kiểm sau lẫn cách lùi sẽ báo `No such file or directory` trên máy thu. Các hồ sơ áp khác trong kho đều dùng chuyển hướng `< _acceptance/.../lui.sql`. Probe `ap-lui` không bắt được lỗi này: nó đọc lui.sql và kiem-sau.sql bằng `readFileSync` rồi chạy qua pg client, không chạy đúng lệnh README ghi. Hậu quả: trong năm thứ của hồ sơ, «cách lùi» và «lệnh kiểm sau» không chạy được như đang ghi. Sửa: thay `-f <tệp>` bằng `< <tệp>`, và nên thêm `-1` cho lui.sql như các hồ sơ khác.

- **Hình dạng 2 (trạng thái dựng tay thay vì lấy từ bên ghi): «tin mới» của E4/AC-4 là tin cũ bị rút phát biểu bằng tay, không phải bài do transform-zalo nạp**
  AC: AC-4
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs:144`
  severity: medium
  source: measurement
  detail: AC-4 hứa: «một bài S03 mới được nạp qua transform-zalo thật … chạy bước phường thì cột là phường ấy». Probe lại lấy một tin đã có sẵn (`o.find(...)`). Tin này đã qua apDau. Probe tự rút phát biểu của luật (UPDATE retract_reason='pct-tin-moi'), tự gọi resolve_offer_fields để đưa cột về goc, rồi mới chạy transformZalo() và `--ghi --noi-tiep`. Phát biểu project_node_id của tin có từ trước, transform-zalo trong lượt này không sinh ra nó. Bước phường thực ra chỉ đang ghi lại một phát biểu bị rút bằng tay. Cùng hình dạng ở chot-luot-dau dòng 108–111: «đã áp: cùng lệnh ghi được bài mới» được mô phỏng bằng cách rút dòng có id nhỏ nhất. Đường «bài mới đi từ transform-zalo» chưa được đo trên DB thử.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lùi (lui.sql) có thể bị lượt nạp S03 đang chạy ghi đè: chuỗi chèn lại toàn bộ phát biểu ngay sau khi lùi commit**
  Người dùng thấy gì: Nếu phải lùi đúng lúc một lượt nạp tin đang chạy, phường vừa lùi có thể bị ghi lại ngay, nên lùi coi như không xảy ra. Chỉ xảy ra khi lùi trùng giờ nạp; chạy lại lùi khi không có lượt nạp là xong.
  Căn cứ: Hiếm gặp, không mất dữ liệu và người vận hành tự làm lại được; ghi lời dặn tránh giờ nạp là đủ.
  file: `_acceptance/phuong-tu-du-an-chay-that/ap-may-thu/lui.sql`
  severity: medium
  Đề xuất: known-limits

- **Bước ghi dữ liệu mới chạy mỗi 15 phút nhưng pipeline/CLAUDE.md và docs/ops/runtime-map.md không ghi**
  Người dùng thấy gì: Người vận hành gặp lỗi ở bước suy phường sẽ không có tài liệu nào để tra cách xử lý.
  Căn cứ: Chỉ ảnh hưởng tốc độ xử lý sự cố, không mất dữ liệu, bổ sung tài liệu sau rất rẻ.
  file: `scripts/zalo-import-daily.sh`
  severity: low
  Đề xuất: known-limits

- **JST-AC-9 loại hẳn bước phuong-tu-du-an khỏi phép so với origin/main, và vẫn loại sau khi gộp**
  Người dùng thấy gì: Một thước kiểm thời lượng các bước nạp bỏ qua bước suy phường, nên thay đổi về bước này sau khi gộp có thể không bị phát hiện bởi thước đó.
  Căn cứ: Không ảnh hưởng người dùng, đã có thước khác canh thứ tự; gỡ bộ lọc sau khi gộp là việc nhỏ.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Điều kiện đạt của lệnh kiểm sau so với số không cùng đại lượng, nên lượt áp đúng vẫn bị coi là lệch**
  Người dùng thấy gì: Khi áp thật, phép kiểm sau có thể báo lệch dù lượt áp đúng, khiến người áp dừng lại và báo động giả.
  Căn cứ: Không làm mất hay sai dữ liệu, chỉ gây dừng nhầm; nhưng nên làm rõ điều kiện trước khi áp thật.
  file: `_acceptance/phuong-tu-du-an-chay-that/ap-may-thu/README.md`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 3 (chỉ kiểm chuỗi có mặt): phép kiểm README ở ap-lui không gắn với bước lùi, chữ «cloud» khớp cả câu không liên quan**
  Người dùng thấy gì: Nếu ai đó xoá lệnh kiểm bản cloud khỏi phần lùi, phép kiểm tự động vẫn báo xanh.
  Căn cứ: Chỉ là lưới an toàn yếu, không ảnh hưởng người dùng trực tiếp; siết lại sau rẻ.
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (chỉ kiểm âm, không có đối chứng dương): đối chứng «dự án không có phường giữ nguyên cột» của E4 chụp mốc SAU lượt ghi đầu, và tin ấy không đi qua đường «tin mới»**
  Người dùng thấy gì: Một phép đối chứng phụ có thể bỏ sót việc tin không thuộc phường bị gán nhầm phường ở lượt ghi đầu.
  Căn cứ: Đã có phép đo khác cùng chiều phủ ca này, sửa thêm không đáng chi phí.
  file: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/phuong-tu-du-an-chay-that/evals.yaml, scripts/job-step-thoi-luong.test.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
