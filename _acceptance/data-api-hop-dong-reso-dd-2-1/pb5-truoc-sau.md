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

## Gộp main sau khi PB5 vào main (#564, squash → 30c13f6e0) — «lấy bên PB2» cho 16 tệp xung đột

PB2 dựng trên chính commit ký Cổng 2 của PB5 (fc472587c, chứa ae72cec34), nên mọi thay đổi PB5 đã có trong cây PB2; xung
đột chỉ vì PB5 vào main bằng squash (git thấy cùng thay đổi hai lần). Đo 27/11 (`git fetch`, chỉ đọc):

- 14 tệp `data-api/db/*.sql` (kể cả các đường tên cũ trước khi PB5 đổi tên): bản trên main bằng từng byte bản fc472587c, và
  **cả 19 tệp** của main có mặt nguyên văn trong khúc `-- ═════ <tệp> ═════` của `schema.sql` (so chuỗi: 0 khúc lệch). Lấy
  bên PB2 = xoá.
- `data-api/test/dong-ba-route.test.ts`: bản main bằng fc472587c; bản PB2 giữ `BANG_BAI_S03` (3 chỗ), `TIEN_TO_S02` (3 chỗ)
  và tên năm ca DRL-AC-1…5 y hệt main, chỉ đổi phần gọi sang `/v1/listings`. Lấy bên PB2.
- `scripts/data-api-ten-nguon.test.mjs`: bản PB2 là tập cha của bản main — bảng dưới. Lấy bên PB2.
- `PRODUCT-MAP.md`, `LO-TRINH.html`: sinh lại sau gộp.

| Ca trên main (PB5) | Ca trên PB2 |
|---|---|
| PB5-AC-1 cây thật: ngoài định danh lược đồ đã biết 0 cụm, tên tệp 0 | giữ nguyên tên và khẳng định |
| PB5-AC-2 danh sách tên rỗng thì thước dừng | giữ tên; đo trên schema.sql bỏ khúc 012–014, thêm đối chứng đủ khúc |
| PB5-AC-2 CLI: thoát khác 0 / thoát 0 «SẠCH» | giữ nguyên |
| PB5-AC-3 bản sao chưa phá: 0 vi phạm | giữ nguyên |
| PB5-AC-3 tám ca phá (chú thích SQL, chuỗi SQL, chú thích TS, chuỗi TS, định danh mới, README, Dockerfile, tên tệp) | đủ tám, cùng nhãn; ba ca SQL cấy vào schema.sql, ca tên tệp cấy tệp mới cạnh schema.sql |
| PB5-AC-4 cây thật: bảng/view, lỗi, mặc định cột, source_registry | giữ tên; bảng/view rút từ schema.sql, 0 lỗi, đủ 29 mặc định cũ, ánh xạ nguồn giữ nguyên |
| PB5-AC-4 đối chứng: bỏ 018 → thiếu ops_audit | giữ, bỏ khúc 018 |
| PB5-AC-4 đối chứng: s03-groups → s03-group ở 013 | giữ, sửa trong khúc 013 |
| — | thêm: cấy tên nguồn thật vào source_registry ở schema.sql → dòng S03 lệch ánh xạ |

Main 11 ca → PB2 12 ca; không ca nào mất.
