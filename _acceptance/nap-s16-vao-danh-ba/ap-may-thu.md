# Áp DA33 lên DB máy thu — năm thứ cho lời áp (ROADMAP §3 mục 50)

Chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp những gì dưới đây lên **DB máy thu** (`oneinvest` :5433) — **gồm BA migration:
088 (mã tỉnh ISO — đã ký ở hồ sơ `danh-ba-vat-the-toan-quoc` ngày 10/11, chưa áp), 103 và 110 của hàng này**. 088 vào hồ sơ này
17/11 (GS): thiếu nó, bước dựng 1e từ chối dựng lần đầu khu chưa có toà (Ocean Park 2, Ocean Park 3, Smart City). Mạnh không muốn
áp 088 lần này thì đi phương án B ở bước 0 — chỉ dựng hai khu đã có toà. 110 thêm sau Cổng Phạm vi (GS cấp số 17/11): nó thay view `v_s16_can` của 103 bằng bản tính một lượt, vì bản 103
treo hàng chục phút trên dữ liệu thật và bước dựng ở 1e đọc view ấy. Cloud không đổi:
bảng `stg_s16_*` và bảng vật thể danh bạ không lên cloud (AC-9, chốt trong `pipeline/sync-cloud.mjs`). Áp sau khi PR DA33 gộp,
từ `main`, ở checkout chính `~/dev/onehub-invest`.

Bộ nạp `pipeline/import-s16.mjs` là của làn ZCode (LL soát đạt 17/11, nhánh `zcode/import-s16-sach @1c6b6738`, đã gộp vào nhánh
này). Nó ghi `stg_s16_*` qua đúng hàm `napS16(c, dongS16(items, snapshot_id))` mà E1, E2 đo.

## 1. Lệnh áp

### 0. Áp 088 (hai lần — lần hai phải sạch), sau bước 3, trước 1a

088 chỉ đổi lược đồ: thêm bảng tra `iso_regions` (34 dòng), thay hai ràng buộc hai mã của 082 trên `buildings` bằng khoá ngoại tới
bảng ấy và khuôn UPI mọi mã tỉnh. Không đổi dòng toà nào, không đổi UPI. Bước dựng 1e đọc `iso_regions` để suy mã tỉnh của khu;
vắng bảng thì nó chỉ dựng lại khu đã có toà.

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/088_iso_tinh.sql
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/088_iso_tinh.sql
docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "
  SELECT (SELECT count(*) FROM iso_regions), count(*) FILTER (WHERE conname IN ('buildings_iso_region_fkey','buildings_upi_khuon')),
         count(*) FILTER (WHERE conname IN ('buildings_iso_region_check','buildings_upi_check'))
    FROM pg_constraint WHERE conrelid = 'buildings'::regclass"                     # phải in 34|2|0
```

**Phương án B (không áp 088 lần này).** Bỏ bước 0; ở 1e khai `--khu vinhomes-ocean-park-1,vinhomes-grand-park` (hai khu đã có toà).
Số B: xem phần 2.


### 1a. Kiểm trước — phải in `t|f`, không thì DỪNG

`t`: migration 100 đã áp (ràng buộc `object_key` nhận `node:<số>`) — 103 chép dòng bí danh có dạng ấy. `f`: 103 chưa áp.

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "
  SELECT (SELECT pg_get_constraintdef(oid) LIKE '%node:%' FROM pg_constraint WHERE conname = 'registry_aliases_object_key_check'),
         to_regclass('stg_s16_can') IS NOT NULL"
```

### 1b. Áp 103 (hai lần — lần hai phải sạch)

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/103_stg_s16.sql
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/103_stg_s16.sql
```

103 tạo bốn bảng mới (`CREATE TABLE IF NOT EXISTS`), một hàm, hai view (`CREATE OR REPLACE`), và nới ràng buộc nguồn của
`registry_aliases` từ `S01–S09` sang `S01–S19` (`DROP … IF EXISTS` rồi `ADD`). Không đổi dòng dữ liệu nào có sẵn.

Số 103 nằm sau 104–107 trên `main`: kho không có bảng sổ migration — `scripts/setup.sh` chạy glob `*.sql` theo thứ tự chữ, mọi
migration viết idempotent — nên áp riêng 103 lên máy thu đã có 104–107 không lệch thứ tự. 103 không phụ thuộc 104–107.

### 1b-bis. Áp 110 ngay sau 103 (hai lần — lần hai phải sạch)

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/110_v_s16_can_nhanh.sql
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/110_v_s16_can_nhanh.sql
```

110 chỉ có một câu `CREATE OR REPLACE VIEW v_s16_can` — cùng tên, kiểu, thứ tự cột với bản 103, không chỉ mục, không đổi dòng
dữ liệu nào. Cần 103 đã áp (view đọc `stg_s16_can` và hàm `s16_chuan_toa`).

**Áp lại 103 thì phải áp lại 110.** Chạy lại riêng tệp 103 (vd sửa tay một lần) đưa view về bản chậm mà không lỗi gì;
`scripts/setup.sh` chạy cả thư mục theo thứ tự nên 110 luôn về sau và tự đè đúng. Ca DA33-AC-1 của itest giữ điều này.

### 1c. Thêm dòng S16 vào sổ nguồn

`real_name` và `source_ids` là **tầng A** — điền tại máy thu, KHÔNG chép vào kho, kênh tin hay PR. Thay ba chỗ `<…>`:

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -c "
  INSERT INTO source_registry (code, real_name, label_vi, status, since, source_ids)
  VALUES ('S16', '<TÊN THẬT>', 'Danh mục căn chủ đầu tư', 'active', '2026-11-13', ARRAY['<MIỀN>', '<MÃ NGUỒN>'])
  ON CONFLICT (code) DO NOTHING"
```

### 1d. Nạp ba bản thu S16 vào `stg_s16_*`

Bộ nạp từ chối mọi DB không phải DB thử `oneinvest_suite_*` trừ khi khai `--may-thu` — cờ ấy chỉ dùng ở bước này:

```bash
cd ~/dev/onehub-invest
for d in collector/snapshots/vn/vn__s16-*; do
  DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node pipeline/import-s16.mjs "$d" --may-thu
done
```

Mỗi bản thu ghi một dòng `airbnb_snapshots` (source `S16`) rồi nạp; chạy lại cùng bản thu ghi 0 dòng mới. Lệnh chỉ in số đếm,
không in mã căn, `toa_id`, `khu_id` hay tên nguồn.

`airbnb_snapshots.manifest` mang manifest thật của bản thu (có tên nguồn — tầng A) và **ở lại máy**: bảng ấy không nằm trong danh
sách đẩy của `sync-cloud`; nếu có ngày lọt vào, `leakGate` (`sync-cloud.mjs` dòng 466–484) chặn vì bảng tầng A phải vắng hoặc 0 dòng ở
cloud. Bộ soát S16 (AC-9) không phủ chỗ này — nó chỉ bắt token S16, không bắt tên nguồn.

### 1e. Dựng toà, căn S16 vào danh bạ — cả năm khu

`--khu` **phải** khai đủ năm: mặc định của bộ dựng (`KHU_MAC_DINH`) chỉ có Ocean Park 1 và Grand Park, thiếu ba khu thì ba khu
ấy không nhận toà, căn S16. `--sao-luu` trỏ tệp ở bước 3.

```bash
cd ~/dev/onehub-invest && node pipeline/danh-ba-vat-the.mjs --db postgres://oneinvest:oneinvest@localhost:5433/oneinvest \
  --db-that --sao-luu <tệp ở bước 3> \
  --khu vinhomes-ocean-park-1,vinhomes-ocean-park-2,vinhomes-ocean-park-3,vinhomes-smart-city,vinhomes-grand-park
```

Lệnh in một dòng `tong_ket {…}`. Chép nguyên dòng ấy vào báo cáo áp.

## 2. Số chạy thử

Ghi ở `do-may-thu.md` của hồ sơ: lượt đo `node pipeline/scripts/danh-ba-s16-that.mjs` (E2, E10) trên bản chép DB máy thu, nạp
ba bản thu qua đúng hàm dùng chung, dựng năm khu, đối chứng bằng bộ đếm độc lập đọc thẳng snapshot. Không ghi gì lên DB máy thu
(phiên đọc đặt `default_transaction_read_only = on`). Số thật sau áp phải bằng số ở đó; lệch thì DỪNG và báo, không tự sửa cho khớp.

Bằng chứng 110 tương đương 103 và thời gian trước/sau: `do-view-110.md` của hồ sơ — `EXCEPT ALL` hai chiều 0 dòng trên 147.266
dòng thật; quét trọn view 35 phút 37 giây → 0,68 giây; lượt đo E2 + E10 trọn 89 phút → 14 giây, cùng số.

Số chạy thử hiện hành (17/11, sau luật toà trùng tên của GS — dòng sổ d-20261117T060050Z-22), là số mà lệnh kiểm sau áp phải ra:

| | Số |
|---|---|
| Tổng toà | 198 → 307 (toà mới 109) |
| Tổng căn | 1.748 → 111.668 |
| Thẻ S16 | 60 (0 mang token S16) |
| Căn nằm trên trục của toà khác | 0 |

**Diễn tập trọn chuỗi lệnh áp trên bản chép DB máy thu (17/11, `db/db-thu.sh`, xoá khi xong).** Đúng các lệnh của phần 1, không
qua mã test:

| Bước | Phương án A (bước 0 → 1e, năm khu) | Phương án B (không 088, `--khu` OP1 + GP) |
|---|---|---|
| 088 ×2 | sạch; `iso_regions` 34 dòng; băm khoá, UPI, mã tỉnh, cha của 198 toà không đổi | — |
| 103 ×2, 110 ×2 | sạch | sạch |
| Nạp ba bản thu | 186.108 dòng căn `stg_s16_can`, 147.266 cặp view; nạp lại bản thu đầu: 0 dòng mới | như A |
| Dựng (1e), 10 giây | toà 198 → **307**, căn 1.748 → **111.668**, thẻ S16 60 (20 thẻ trùng tên), căn trên trục toà khác 0 | toà 198 → **249**, căn 1.748 → **72.537**, thẻ S16 12 (10 thẻ trùng tên), 0 |
| Dựng lần hai | 0 khoá mới | 0 khoá mới |
| Lùi 088 trước 1e | sạch; ràng buộc trùng bản trước áp; `iso_regions` mất; dữ liệu toà không đổi; áp lại 088 sạch | — |
| Lùi 088 sau 1e | lỗi `buildings_iso_region_check`, giao dịch lùi trọn (21 toà `VN-66`) | — |

Theo khu (toà · căn, sau dựng): Grand Park 77 → 89 · 1.430 → 38.135; Ocean Park 1 121 → 160 · 318 → 34.402; Ocean Park 2 0 → 14 ·
12.413; Ocean Park 3 0 → 7 · 4.599; Smart City 0 → 37 · 22.119. Toà mới: 12 + 39 + 14 + 7 + 37 = 109. Phương án B chỉ có hai dòng
đầu; ba khu còn lại chưa vào danh bạ.

**Mã tỉnh của toà Ocean Park 2, 3.** Qua bước 0, 21 toà mới của hai khu này mang mã `VN-66` (Hưng Yên, mã tỉnh 33 — đúng luật DA1),
không phải `VN-HN`. E10 đo bằng mã tỉnh suy theo thành phố nên cho cùng số đếm mà khác mã tỉnh ở 21 toà ấy; số đếm của phần này là
số của đường áp thật.

**Giới hạn đã biết — 20 `toa_id` / 10 tên toà trùng chờ duyệt.** Toà S16 trùng tên chuẩn hoá trong cùng dự án không được đúc;
2.489 căn của chúng chưa vào danh bạ (OP1 6 toa_id / 821 căn, GP 4 / 64, OP2 2 / 178, OP3 8 / 1.426). Mỗi `toa_id` có một thẻ
«toà S16 trùng tên» ở `/ops/review`, mang chỉ mục che của mọi ứng viên và số căn mỗi bên. Đường mở: người duyệt thẻ.

**Giới hạn đã biết — 109 toà S16 mới treo thẳng dưới dự án, 0 dưới phân khu.** Luật tìm phân khu của bước dựng chỉ xét nút loại
`building` khớp tên tuyệt đối: OP1, OP2, OP3, Smart City có 0 nút như vậy; Grand Park có 3 nút nhưng không toà nào khớp tên. Theo dự
án: GP 12, OP1 39, OP2 14, OP3 7, Smart City 37 — cả 109 dưới nút dự án. Sửa ở hàng cấu trúc sau (chờ Mạnh trả lời Q-A/Q-B/Q-C của
bản phân tích cấu trúc danh bạ). Chuyển cha của toà là một `UPDATE buildings SET region_node_id`, lùi được, **không đụng căn**: căn
và trục trỏ toà qua `building_key`; UPI của toà S16 không chứa nút cha; không bước nào chèn lại toà đã có; bước S16 không ghi phường
suy từ nút cha. Trang `/ops/registry` vẽ cây theo `region_node_id`, nên đổi cha xong cây hiện đúng ngay.

## 3. Sao lưu trước áp

Chạy ngay trước bước 0 (phương án B: trước 1b), sau một lượt thu đã xong (bước 4 khôi phục về đúng thời điểm này):

```bash
mkdir -p ~/onehub-backups/db
pg_dump -U oneinvest -h localhost -p 5433 -Fc oneinvest > ~/onehub-backups/db/truoc-103-s16-$(date -u +%Y%m%dT%H%M%SZ).dump
ls -la ~/onehub-backups/db/truoc-103-s16-*.dump   # phải khác 0 byte; bộ dựng ở 1e cũng tự kiểm điều này
```

## 4. Cách lùi

**Đã dựng (1e chạy rồi).** Bước dựng ghi vào năm bảng — `buildings`, `stacks`, `units`, `registry_aliases` (nguồn `S16`),
`review_queue` — với khoá mới, chung giao dịch với bước S08, S09. Chưa có ca thử cho việc gỡ chọn lọc từng dòng, nên lối lùi tin
được là khôi phục bản sao lưu:

```bash
pg_restore -U oneinvest -h localhost -p 5433 -d oneinvest --clean --if-exists ~/onehub-backups/db/truoc-103-s16-<thời điểm>.dump
```

**Giá:** mất mọi dòng ghi vào DB máy thu sau lúc sao lưu (kể cả lượt thu đêm nếu chạy xen). Vì thế bước 3 làm ngay sau một lượt thu,
và bước 0 → 1e chạy liền một mạch.

**Chỉ lùi 110 (giữ 103).** Áp lại tệp 103: nó `CREATE OR REPLACE` view `v_s16_can` về đúng định nghĩa của 103, các câu khác
của 103 là `IF NOT EXISTS` / `DROP … IF EXISTS` rồi `ADD` nên chạy lại không đổi gì khác. Kết quả của view không đổi (hai bản
tương đương — phần 2), chỉ chậm lại. Ca DA33-AC-1 của itest chứng việc áp lại 103 đổi đúng view.

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/103_stg_s16.sql
```

**Chỉ lùi bước nạp 1d (chưa dựng).** Bốn bảng `stg_s16_*` khai `REFERENCES airbnb_snapshots ON DELETE CASCADE`, nên xoá dòng bản
thu S16 là gỡ trọn lượt nạp, không chạm bảng nào khác:

```sql
DELETE FROM airbnb_snapshots WHERE source = 'S16';
```

Lọc theo `source`, không theo mẫu `snapshot_id`: bộ nạp lấy `snapshot_id` từ manifest, chỉ rơi về tên thư mục khi manifest thiếu. Máy thu
có 0 dòng `airbnb_snapshots` nguồn `S16` trước áp (đo 17/11), nên mọi dòng `S16` sau áp đều do bước 1d ghi.

**Chỉ lùi 088 (bước 0) — CHỈ trước 1e.** Trả hai ràng buộc hai mã của 082, bỏ khoá ngoại và bảng tra. Sau 1e câu này **không chạy
được**: Ocean Park 2 và Ocean Park 3 nằm ở Hưng Yên (mã tỉnh 33), nên 088 cho 21 toà S16 mới của hai khu ấy mã `VN-66` (14 + 7), và
ràng buộc hai mã của 082 không nhận chúng — `ADD CONSTRAINT` báo lỗi, giao dịch lùi trọn, 088 giữ nguyên (chiều an toàn). Đã thử
trên bản chép cả hai ca (phần 2). Đã qua 1e thì lùi bằng khôi phục bản sao lưu ở trên.

```sql
BEGIN;
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_iso_region_fkey;
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_upi_khuon;
ALTER TABLE buildings ADD CONSTRAINT buildings_iso_region_check CHECK (iso_region = ANY (ARRAY['VN-HN'::text, 'VN-SG'::text]));
ALTER TABLE buildings ADD CONSTRAINT buildings_upi_check CHECK (upi ~ '^urn:onehub:upi:1:VN:VN-(HN|SG):bld_[0-9A-HJKMNP-TV-Z]{26}$'::text);
DROP TABLE IF EXISTS iso_regions;
COMMIT;
```

**Chưa dựng (chỉ 1b, 1b-bis, 1c).** Lùi riêng lược đồ, không mất dữ liệu nào khác:

```sql
DROP VIEW IF EXISTS v_s16_can;
DROP VIEW IF EXISTS v_s16_toa;
DROP FUNCTION IF EXISTS s16_chuan_toa(text);
DROP TABLE IF EXISTS stg_s16_can, stg_s16_toa, stg_s16_khu, stg_s16_item;
ALTER TABLE registry_aliases DROP CONSTRAINT IF EXISTS registry_aliases_source_check;
ALTER TABLE registry_aliases ADD CONSTRAINT registry_aliases_source_check CHECK (source ~ '^S0[1-9]$');
DELETE FROM source_registry WHERE code = 'S16';
```

Ràng buộc nguồn chỉ thu hẹp lại được khi chưa có dòng `registry_aliases` nào mang `S10`–`S19`; có rồi thì `ADD CONSTRAINT` báo lỗi
và giữ nguyên bản rộng — chiều an toàn.

## 5. Lệnh kiểm sau áp

```sql
SELECT to_regclass('iso_regions') IS NOT NULL AS co_088;                                 -- t (f nếu đi phương án B)
SELECT to_regclass('stg_s16_can') IS NOT NULL AS co_103;                                 -- t
SELECT pg_get_viewdef('v_s16_can'::regclass) LIKE '%LEFT JOIN t ON%' AS co_110;            -- t (view bản nhanh của 110)
SELECT pg_get_constraintdef(oid) FROM pg_constraint
 WHERE conname = 'registry_aliases_source_check';                                         -- CHECK … '^S(0[1-9]|1[0-9])$'
SELECT code, label_vi, status FROM source_registry WHERE code = 'S16';                    -- một dòng; KHÔNG chọn real_name
SELECT count(*) FROM stg_s16_can;                                                         -- = số cặp ở do-may-thu.md
SELECT count(*) FROM registry_aliases WHERE source = 'S16' AND retired_at IS NULL;        -- = số bí danh S16 ở do-may-thu.md
SELECT count(*) FROM units;                                                               -- = số căn sau dựng ở phần 2
SELECT count(*) FROM units u JOIN stacks s ON s.stack_key = u.stack_key
 WHERE s.building_key <> u.building_key;                                                  -- 0
SELECT count(*) FROM review_queue WHERE evidence->>'loai' = 'toa-trung-ten';              -- 20 (một thẻ mỗi toa_id trùng tên)
```

Câu thứ ba cố ý không chọn `real_name`: kết quả lệnh kiểm có thể được dán vào báo cáo áp gửi qua kênh.
