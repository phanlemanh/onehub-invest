# Dấu lược đồ bản mẫu phủ constraint, index, trigger, enum, độ dài kiểu — thiết kế

Hồ sơ: `_acceptance/dau-luoc-do-ban-mau/`. Nguồn: mục Ngoài-5 của `test-suite-db-thu` (Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 06/11),
giám sát giao 06/11 sau khi #326 gộp.

## Vấn đề

`db/db-thu.sh --chay` chép DB của lượt từ bản mẫu `oneinvest_suite_mau`. Bản mẫu được giữ tới 24 giờ nếu **dấu lược đồ** của DB chung không đổi.
Dấu hiện là md5 của: cột (tên + `data_type` của `information_schema`), định nghĩa view, thân hàm. Nó bỏ sót:

- constraint (99 CHECK, 47 `ADD CONSTRAINT` trong migration), index (65), trigger (14), giá trị enum, RLS (037);
- độ dài và độ chính xác kiểu: `data_type` chỉ ghi `character varying`, `numeric` — không có `(n)`, `(p,s)`;
- NOT NULL, DEFAULT, cột generated, identity; chữ ký hàm (hai bản overload cùng thân là một dòng);
- schema ngoài `public` do migration tạo (`sync_stage`, 038), extension.

Hậu quả: migration kiểu đó vào DB chung thì test vẫn chạy trên cấu trúc cũ tới 24 giờ — đỏ oan hoặc xanh oan.

## Thiết kế

1. **Câu dấu ra tệp riêng `db/dau-luoc-do.sql`.** `db-thu.sh` đọc tệp này; test đọc CÙNG tệp. Giữ chuỗi trong `.sh` thì test phải bóc chuỗi khỏi mã
   shell bằng regex hoặc chép lại câu — hai nguồn sẽ lệch.
2. **Câu dấu đọc thẳng catalog `pg_*`**, mỗi loại một nhóm dòng có tiền tố, rồi `md5(string_agg(… ORDER BY …))`:
   - `s` schema · `x` extension + phiên bản · `r` quan hệ (bảng, view, matview, bảng ngoài, kiểu composite; bật RLS, ép RLS, quyền `relacl`);
   - `c` cột: `format_type(atttypid, atttypmod)` (có độ dài, độ chính xác, kiểu PostGIS kèm SRID), `attnotnull`, `attidentity`, `attgenerated`,
     collation khác mặc định, biểu thức DEFAULT/generated;
   - `k` constraint: `pg_get_constraintdef` (đã in `NOT VALID`) · `i` index: `pg_get_indexdef` · `t` trigger: `pg_get_triggerdef` + `tgenabled`, bỏ trigger nội bộ của FK;
   - `k` cũng gồm CHECK của domain · `d` domain: kiểu nền, NOT NULL, DEFAULT · `q` sequence: kiểu, start, increment, min, max, cycle (không `last_value`);
   - `p` policy RLS · `v` view/matview: md5 `pg_get_viewdef` · `e` enum: nhãn theo `enumsortorder` · `f` hàm: tên + đối số định danh + kiểu trả + quyền + md5 thân.
3. **Phạm vi schema:** mọi schema trừ hệ thống (`pg_*`, `information_schema`), schema thuộc extension (`cron`, `topology`) và **schema rác của test** — tên đuôi
   `_<số>` (DB chung đang có 26 schema như `au12_cloud_48383`, `on22_pipe_38267`, mang pid của lượt tạo). Phủ chúng thì mỗi lượt test tạo/xoá schema làm dấu đổi,
   bản mẫu dựng lại liên tục; dọn một lần cũng không đủ vì 86 executor đơn tệp vẫn chạy thẳng trên DB chung và sinh rác tiếp; danh sách cứng `public`, `sync_stage`
   thì schema do migration mới tạo bị sót im lặng. Đối tượng thuộc extension (hàm PostGIS, `spatial_ref_sys`) bỏ, vì đã có dòng `x` của extension.
4. **Chỉ đọc theo cấu trúc:** lời gọi dấu trên DB chung là `docker exec -e PGOPTIONS='-c default_transaction_read_only=on' …` — cờ nằm trong đối số của
   `docker exec` (biến môi trường của tiến trình gọi không vào container), câu lỡ ghi thì Postgres từ chối. `--dau` in thêm `chi_doc=<giá trị>` đọc bằng chính lời gọi đó.
5. **Chế độ `bash db/db-thu.sh --dau`** in dấu hiện tại của DB chung một dòng (cùng hàm `dau_chung` mà `--chay` dùng) — để đo thật trên DB chung mà không chép
   câu ra lệnh khác, và để người vận hành so với COMMENT của bản mẫu.
6. **Chi phí đã biết:** công thức đổi nên lần `--chay` đầu tiên sau gộp ở mỗi máy dựng lại bản mẫu một lần (pg_dump ≈ vài phút). Không giữ dấu cũ song song.

## Bàn đo

- Ma trận viết trước, mỗi phần tử khai: câu DDL, AC, và «câu cũ: bắt|sót» kèm lý do theo công thức cũ. Mỗi ca đo ba điểm: dấu trước ca bằng gốc,
  sau ca khác gốc, sau `ROLLBACK` bằng gốc — ca lỡ commit làm lệch nền thì ca kế đỏ ngay ở điểm một. Lược đồ mẫu có PostGIS, một CHECK `NOT VALID`, một domain có
  CHECK, một kiểu composite, một sequence, một policy, schema `sync_stage`.
- Ma trận chạy trên **Postgres thật**: test nối DB bảo trì `postgres` của máy chủ :5433 (máy: container `one-invest-db`; CI: service PostGIS của job `scripts`),
  `CREATE DATABASE oneinvest_suite_dau_<pid>` (rỗng, từ `template1`), dựng một lược đồ mẫu đủ loại đối tượng, rồi với MỖI thay đổi trong ma trận: tính dấu,
  áp thay đổi trong giao dịch, tính dấu, `ROLLBACK`, tính lại dấu phải về giá trị gốc. Xoá DB khi xong. Không nối DB `oneinvest` lần nào.
  Tên DB mang đuôi pid nên `don_mo_coi` dọn khi lượt chết giữa chừng.
- Docker giả trả md5 cố định nên không đo được câu dấu — giữ nó cho các ca luồng (dựng lại hay không), thêm kiểm lời gọi dấu mang cờ chỉ đọc.
- Đối chứng: chạy cùng ma trận với **câu dấu cũ** (chép trong test, ghi rõ là bản trước vòng này) — kết quả phải khớp từng ô cột «câu cũ». Thêm hai bản
  đột biến của câu mới (bỏ `tgenabled`; bỏ typmod của `format_type`): mỗi bản làm đúng các ca của phần ấy sai, để hai phần tinh của câu có ca riêng chứng minh.
  `convalidated` không cần: `pg_get_constraintdef` đã in `NOT VALID`. Thiếu đối chứng thì ma trận xanh không phân biệt
  được «câu mới phủ» với «ma trận không chạy».
- Máy không có server Postgres → ca bỏ qua có lời; `CI=true` mà không nối được → đỏ.

## Không làm

Comment và owner: không đổi kết quả câu lệnh nào của test; bản mẫu dựng bằng `pg_dump --no-owner` nên owner luôn là `oneinvest`. Không đổi luồng dựng mẫu (khoá, tuổi 24 giờ, VACUUM ANALYZE). Không dọn 26 schema rác trên DB chung.
