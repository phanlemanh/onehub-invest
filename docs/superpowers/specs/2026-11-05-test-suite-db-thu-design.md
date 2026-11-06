# Ba bộ test chạy trên DB của riêng lượt

Hồ sơ `_acceptance/test-suite-db-thu/` (T2). Giám sát giao 05/11 sau khi một lượt test làm job S06 chậm khoảng 25 phút
và `SD-AC-6` đỏ deadlock 40P01.

## Vấn đề

`cd app && npm test`, `cd pipeline && npm test`, `cd agent && npm test` mặc định chạy trên DB `oneinvest` mà job thu thập cũng ghi. Số đo log
máy chủ (`docker logs one-invest-db`, chỉ đọc): deadlock trên bảng thật của DB chung tăng từ 2 ca ngày 30/10 lên 199 ca ngày 05/11 (tới 18:30).
117 ca có câu `INSERT INTO property_offers` của job, tức job thật bị huỷ câu rồi thử lại. Các phiên phải xếp hàng khoá S4 để tránh nhau.

## Cách làm

Thêm chế độ `--chay` vào `db/db-thu.sh`, không thêm công cụ mới:

```
bash ../db/db-thu.sh oneinvest_suite_<bộ> --chay <lệnh…>
```

1. `DATABASE_URL` đã trỏ DB khác `oneinvest` thì chạy thẳng lệnh: hồ sơ tự dựng DB thử giữ nguyên hành vi.
2. Không có container `one-invest-db`: `CI=true` thì chạy thẳng lên Postgres của CI; trên máy thì dừng, không rơi về DB chung.
3. Giữ bản mẫu `oneinvest_suite_mau`, dựng bằng đúng đường pg_dump sẵn có của `db-thu.sh`, dựng lại khi dấu lược đồ public của DB chung đổi hoặc
   mẫu quá 24 giờ. Mẫu khoá kết nối, dấu và giờ dựng nằm ở `COMMENT ON DATABASE`.
4. Mỗi lượt `createdb -T` một DB `oneinvest_suite_<bộ>_<pid>`, đặt `DATABASE_URL` và `TEST_DATABASE_URL_ADMIN`, chạy lệnh, xoá DB khi lệnh dừng
   (kể cả đỏ, SIGTERM). Lượt bị SIGKILL để lại DB thì lượt kế dọn theo pid.

## Vì sao một DB mỗi lượt, không một DB dùng lại

Đo trên máy: pg_dump 2 phút 41 giây, `createdb -T` 3 giây, `dropdb` 0,2 giây. Dùng chung một DB thử cho mọi phiên thì các bộ test vẫn tranh khoá
nhau (khoá tư vấn 33033, DDL trong giao dịch), chỉ chuyển chỗ tranh. Một DB mỗi lượt cắt hết tranh khoá giữa các phiên với giá 3 giây và 1,4 GB đĩa
trong lúc chạy (VM còn 46 GB). Một DB dùng lại cho mỗi phiên cũng không đủ: một lượt chấm chạy ba bộ của cùng phiên song song, vẫn tranh 33033 và DDL trong
một database. Đĩa VM dùng chung với DB của job nên `--chay` dừng khi đĩa còn dưới 10 GB, không chép tiếp.

## Ranh giới

- `npm test` đổi lối vào, nên `executors.test.*` trong `_acceptance/config.yaml` giữ nguyên chuỗi lệnh và làn ghim lại không đổi.
- Ca bỏ qua khi không ở DB thử (`s03-len-cong`, `trang-chi-tiet-tin-db`) nay chạy thật trong `npm test` trên máy.
- Eval `sellers_chip` đi qua `--chay` vì là ca gốc của việc này; 86 executor đơn tệp còn lại vẫn vào DB chung, là việc riêng.
- CPU và đĩa vẫn chung một Postgres: phần chậm vì tải máy (khác tranh khoá) không hết.
