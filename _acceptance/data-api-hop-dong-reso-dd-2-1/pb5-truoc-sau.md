# Rào tên nguồn của PB5 sau khi gộp `data-api/db` thành `schema.sql` (PB2 AC-9)

GS cho 27/11 (CÂU B): trỏ ca PB5 sang `data-api/db/schema.sql`; mỗi ca khẳng định đúng điều cũ. Tệp: `scripts/data-api-ten-nguon.test.mjs`.
`schema.sql` giữ nguyên câu của 19 tệp cũ theo thứ tự cũ, mỗi khúc mở bằng `-- ═════ <tệp cũ> ═════`, nên ca nào cần một
tệp cũ thì đọc đúng khúc đó (`khuc()`) hoặc bỏ đúng khúc đó (`boKhuc()`). Đo 27/11 trên M5: 16/16 xanh, 0 bỏ qua
(`DATABASE_URL` trỏ PostGIS :5433; ca tự tạo rồi xoá DB `pb5_<pid>_<n>`).

| Ca PB5 | Khẳng định cũ | Đo trên gì trước | Đo trên gì sau | Đột biến chứng |
|---|---|---|---|---|
| PB5-AC-1 | Toàn cây `data-api/` không có tên nguồn thật ngoài định danh đã biết; thước thấy định danh (> 0) | 19 tệp `db/*.sql` + phần còn lại của cây (88 định danh lúc PB2 bắt đầu) | `db/schema.sql` + phần còn lại (74 định danh — ít hơn vì các tệp có bảng S01 trong tên đã gộp, đếm theo cụm) | Không đổi ca; các ô cấy của AC-3 là đột biến của nó |
| PB5-AC-2 (thuần) | Thư mục migration không có dòng `source_registry` → bộ rút tên ném «không rút được tên nào» | Chép `data-api/db` bỏ tệp 012, 013, 014 | Một `schema.sql` bỏ ba khúc 012, 013, 014 | Thêm đối chứng cùng ca: `schema.sql` đủ khúc → rút được tên (ca đỏ vì đúng ba khúc, không vì tệp hỏng) |
| PB5-AC-2 (CLI) | Không có migration → thoát ≠ 0; đủ migration → thoát 0 «SẠCH» | Bản sao cây data-api | Không đổi (bản sao cây nay chứa `schema.sql`) | Không đổi |
| PB5-AC-3 · chú thích SQL | Tên S02 trong chú thích SQL → đúng một vi phạm `chu-thich S02 <tệp>` | Cấy vào `db/001_init.sql` | Cấy vào `db/schema.sql` | Chính ca là đột biến: tên cấy vào `schema.sql` → đỏ đúng thông điệp |
| PB5-AC-3 · chuỗi SQL | Tên S03 trong chuỗi SQL → `chuoi S03 <tệp>` | Cấy vào `db/018_ops_audit.sql` | Cấy vào `db/schema.sql` | như trên |
| PB5-AC-3 · định danh mới | Bảng mới mang dạng định danh S02 ngoài danh sách biết → `dinh-danh S02 <tệp>` | Cấy vào `db/018_ops_audit.sql`; dạng định danh đọc từ `db/009_s02_ref.sql` | Cấy vào `db/schema.sql`; dạng định danh đọc từ khúc `009_s02_ref.sql` của `schema.sql` | như trên |
| PB5-AC-3 · tên tệp | Tệp mang tên nguồn thật → `ten-tep S04 <tệp>` | Đổi tên `db/005_stg_s04.sql` | Cấy một tệp mới `db/stg_<S04>.sql` cạnh `schema.sql` | Chính ca là đột biến: tệp mới → đỏ `ten-tep S04 data-api/db/stg_«S04».sql` |
| PB5-AC-3 · TS, README, Dockerfile | (năm ca còn lại) | `src/routes/deals.ts`, `README.md`, `Dockerfile` | Không đổi | Không đổi |
| PB5-AC-4 · cây thật | Lược đồ mẫu dựng ra cùng bảng/view, cùng lỗi, cùng mặc định cột, `source_registry` đúng ánh xạ trước → sau | Danh sách 30 bảng/view viết tay; ba lỗi có sẵn (012 `42P01`, seed lỗi theo); 29 mặc định | Bảng/view **rút từ `schema.sql`** (mọi `CREATE TABLE`/`VIEW` + ba đối tượng PostGIS); **0 lỗi** (mạnh hơn: bản cũ áp lỗi); đủ 29 mặc định cũ, mặc định mới chỉ được thuộc bảng của khúc PB2; `NGUON_TRUOC` giữ nguyên | Thêm ca: cấy tên nguồn thật S03 vào `source_registry` ở `schema.sql` → dòng S03 lệch ánh xạ, đỏ đúng một dòng |
| PB5-AC-4 · bỏ 018 | Thiếu tệp ops_audit → thiếu đúng `ops_audit` | Xoá `db/018_ops_audit.sql` | Bỏ khúc 018 khỏi `schema.sql` | Chính ca là đột biến |
| PB5-AC-4 · đổi 013 | `s03-groups` → `s03-group` ở 013 → dòng S03 lệch ánh xạ | Sửa `db/013_…sql` | Sửa khúc 013 của `schema.sql` | Chính ca là đột biến |
