# Áp CG15 lên DB máy thu — năm thứ cho lời áp (như 106 của CG10)

Chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp những gì dưới đây lên **DB máy thu** (`oneinvest` :5433). Cloud không đổi
(«cloud đi sau» — Hỏi-2). Thứ tự: sau khi PR CG15 gộp. 105 và 106 đã áp máy thu 15/11 (CG10).

## 1. Lệnh áp

Điều kiện trước — phải in `t`, không thì DỪNG:

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc \
  "SELECT to_regclass('offer_project') IS NOT NULL AND to_regclass('offer_price_rank') IS NOT NULL AND to_regclass('project_area_band') IS NOT NULL"
```

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/107_project_source_baseline.sql
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q \
  < ~/dev/onehub-invest/db/migrations/107_project_source_baseline.sql   # áp lần hai: phải sạch
cd ~/dev/onehub-invest/pipeline && node xep-hang-gia.mjs   # chấm lại ngay, không chờ lượt đêm
```

107 chỉ tạo bảng mới `project_source_baseline` (`CREATE TABLE IF NOT EXISTS`) — không đổi bảng có dữ liệu, áp lại được.

## 2. Số chạy thử (bản chép DB máy thu, `bash pipeline/scripts/do-lech-s03-s06-db.sh do`)

Lượt chấm S4 lượt 3 (16/11 05:20Z, bản chép sau lượt ghi dự án S03 của 03:59Z), `.acceptance-runs/do-lech-s03-s06-canh-hang/do-may-thu.md`:

| Thước | Bản chép 16/11 | Đích |
|---|---|---|
| Tin S03 cấp dự án có mặt bằng đủ hai bên (`tin_s03_co_mat_bang`) | **3.660** | ≥ 1.500 |
| Nhóm đủ hai bên | 19 (bán 6 · thuê giá/m² 7 · thuê giá tháng 6) | — |
| Độ lệch S03 so S06, trung vị trên 19 nhóm | +7,1% | — |
| Đếm độc lập / lần hai | lech = 0 · lần hai = lần một | 0 |
| Bước chấm (422 + 423) | 6,1 giây/lượt | — |

Mẫu số (tin đang rao): S03 thuê 4.006 · S03 bán 2.475 · S06 thuê 57.661 · S06 bán 49.817. Số nền nhích mỗi ngày (lượt ghi dự án S03
sau mỗi lần nạp) — đối chiếu sau áp bằng lệnh mục 5, đọc là sàn chứ không phải số đúng từng tin.

## 3. Sao lưu trước áp

```bash
pg_dump -U oneinvest -h localhost -p 5433 -Fc oneinvest > ~/onehub-backups/db/truoc-107-$(date -u +%Y%m%dT%H%M%SZ).dump
```

## 4. Cách lùi

```sql
DROP TABLE IF EXISTS project_source_baseline;
```

Bước chấm tự bỏ mặt bằng khi bảng vắng (in «chưa áp 107 — bỏ mặt bằng hai nguồn»); app không hiện dòng S06, không lỗi.

## 5. Lệnh kiểm sau áp

```sql
SELECT to_regclass('project_source_baseline') IS NOT NULL AS co_107;
SELECT kind, thuoc, trang_thai, count(*) FROM project_source_baseline GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
SELECT count(*) FROM offer_price_rank h JOIN sale_offers o USING (offer_id) JOIN project_source_baseline b
    ON b.nut = h.nut AND b.kind = h.kind AND b.property_type = h.property_type AND b.thuoc = h.thuoc
   AND coalesce(b.pn_nhom, -1) = coalesce(h.pn_nhom, -1)
 WHERE h.cap = 'du_an' AND o.source = 'S03' AND b.trang_thai = 'du';   -- ≥ 1.500
```

Và mở `/ops/deals?project=1` trên Ops máy thu (:3456): dòng S03 có dòng phụ «S06 … căn · S03 ±x%».
