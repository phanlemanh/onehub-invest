# Áp CG10 lên DB máy thu — năm thứ cho lời áp (ROADMAP §3 mục 50)

Chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp những gì dưới đây lên **DB máy thu** (`oneinvest` :5433). Cloud không đổi
(«cloud đi sau» — giới hạn có tên). Thứ tự: sau khi PR CG10 gộp **và** DV7 (`du-an-cua-tin-len-dinh-vi`, migration 105) đã gộp và áp —
không có view 105 thì bước chấm đêm tự lùi về cấp phường (AC-4), nên áp 106 trước 105 cũng không hỏng gì.

## 1. Lệnh áp

Điều kiện trước: **105 (DV7) đã áp** lên máy thu. Lệnh kiểm trước — phải in `t`, không thì DỪNG, áp 105 theo hồ sơ DV7 trước:

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc \
  "SELECT to_regclass('offer_project') IS NOT NULL AND to_regclass('offer_price_rank') IS NOT NULL"
```

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/106_project_area_band.sql
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/106_project_area_band.sql   # áp lần hai: phải sạch
cd ~/dev/onehub-invest/pipeline && node xep-hang-gia.mjs   # chấm lại ngay, không chờ lượt đêm
```

106 chỉ tạo bảng mới `project_area_band` (`CREATE TABLE IF NOT EXISTS`) — không đổi bảng có dữ liệu, áp lại được.

## 2. Số chạy thử (bản chép DB máy thu, `bash pipeline/scripts/gia-tot-du-an-db.sh do`)

Ghi ở `do-may-thu.md` của hồ sơ (lượt S4 ghi lại): bảng đếm cấp × bán/thuê × thước × ô, `can_ho_cap_du_an` (ngưỡng ≥ 10.000),
`op1_danh_sach_can` (ngưỡng ≥ 100), số nhóm dải m², thời gian một lượt chấm.

## 3. Sao lưu trước áp

```bash
pg_dump -U oneinvest -h localhost -p 5433 -Fc oneinvest > ~/onehub-backups/db/truoc-106-$(date -u +%Y%m%dT%H%M%SZ).dump
```

## 4. Cách lùi

```sql
DROP TABLE IF EXISTS project_area_band;
```

Rồi chấm lại hạng bằng bản chỉ phường: trỏ `xep-hang-gia.mjs` về 420 bằng cách gỡ view 105 không phải việc của hàng này — thay vào đó
gộp revert PR CG10 (422 không còn, bước chấm chạy 420) và chạy `node pipeline/xep-hang-gia.mjs`. Bảng `offer_price_rank` xoá trọn rồi
chèn mỗi lượt nên không còn dòng cấp dự án sau lượt chấm kế.

## 5. Lệnh kiểm sau áp

```sql
SELECT to_regclass('project_area_band') IS NOT NULL AS co_106;
SELECT count(*) FROM project_area_band;                                                   -- số nhóm dải m² (≈ 359, đo 15/11)
SELECT count(*) FROM offer_price_rank WHERE cap = 'du_an' AND property_type = 'apartment'
   AND hang_pct IS NOT NULL;                                                              -- thước MN1, ≥ 10.000
SELECT count(*) FROM offer_price_rank WHERE cap = 'du_an' AND nut = '1' AND kind = 'sale' AND nhan IS NOT NULL;   -- OP1
```

Và mở `/ops/deals?project=1` trên Ops máy thu (:3456): danh sách tin bán «Giá tốt» của Vinhomes Ocean Park 1, mỗi căn một dòng.
