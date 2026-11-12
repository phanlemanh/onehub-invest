# DA2 truong-du-an-tren-tin — trường dự án, phân khu, phường trên tin

Hàng DA2 (đợt `danh-ba-du-an-0811`, mã kế hoạch DF1). Căn cứ: câu giao và ghi chú DA2 ở `docs/plan/lo-trinh.json`,
ROADMAP §3 mục 39 (Hỏi-2: dự án con có cha, kế thừa từ nút vùng), ADR-0013 §2, §6, ADR-0016 §5, §7, ADR-0011 Qđ 3.
Migration 096 (giám sát cấp 12/11, sổ SO-MIGRATION). Gộp sau #422 (DV4, migration 095).

## Vấn đề

GCQ2 cần nơi chứa dự án, phân khu của một tin; DA9 cần đếm mức gắn; kế thừa phường từ dự án cần ghi `area_id` trên tin.
Hôm nay `field_assertions` (082) chỉ cho `area_id` và `builder_name` ở resource Building, và không có trường dự án, phân khu.

## Thiết kế

Migration `db/migrations/096_truong_du_an_tren_tin.sql` (chạy sau 095, idempotent, chỉ DB local; áp máy thu là lời riêng
của Mạnh):

1. `field_assertions_field_chk` = danh sách của 095 (gồm `floor_raw`, `floor_band`) + `project_node_id`, `subzone_node_id`.
2. Thay thân hàm `field_assertions_vat_the_082()` (CREATE OR REPLACE, giữ tên trigger): luật resource ↔ trường thành
   - `builder_name` chỉ ở Building (như cũ);
   - `area_id` ở Building **hoặc Property**;
   - `project_node_id`, `subzone_node_id` chỉ ở Property;
   - giữ nguyên luật khoá ↔ resource, `registry_inherit` ↔ `inferred`, `area_id` phải là `submarket`.
   Thêm miền giá trị:
   - `project_node_id`: chữ số `^[1-9][0-9]*$`, là `asset_nodes.id` có `node_type = 'project'`;
   - `subzone_node_id`: chữ số, là `asset_nodes.id` có `node_type IN ('subzone', 'building')` — ba nút `building` của
     Grand Park là phân khu (ADR-0016 §3) tới khi DA1 đổi loại.
   Thông điệp lỗi gọi tên trường và giá trị.
3. Sổ từ vựng: hai mã mới trong trục `assertion_field` (`emit-seed`), nhãn `area_id` đổi «Phường của toà» → «Phường»
   (nay dùng cho cả tin).

`pipeline/mappings.yaml`:

- trục `assertion_field`: `project_node_id` (`dd_lookup: SubdivisionName`), `subzone_node_id` (local), `area_id` nhãn
  «Phường»; rationale ghi migration 096.
- `canonical.fields`: `project_node_id` (`dd: SubdivisionName`, Property, DD 2.1 tra 12/11), `subzone_node_id`
  (`dd: null`, extension `ComplexName` trên Property — DD 2.1 chỉ có `ComplexName` ở resource Building; đủ 6 điều kiện
  ADR-0011 Qđ 3), `area_id` trên tin (local, City là tên không phải mã — DD không có cấp phường).

Bộ phân xử `resolve_offer_fields` không đổi: ba trường chỉ là phát biểu, chưa dựng cột (GCQ2, DA9 đọc phát biểu).

## Thứ tự

S3 mở đầu bằng gộp nhánh DV4 (`feat/tang-tren-tin-s03`, hoặc main nếu #422 đã gộp) vào nhánh DA2, để 096 nằm trên 095 và
trục `assertion_field` của sổ có đủ hai mã tầng; sau đó `vocab --write` sinh lại tệp sinh.

## Phép đo

`pipeline/scripts/truong-du-an-tren-tin.test.mjs` (mã ca `TDT-AC-n`), DB thử `oneinvest_dbv_tdt_<pid>` qua
`scripts/db-thu-dbv.mjs` (dựng lược đồ từ `db/migrations` như CI), xoá khi xong; chạy trong `cd pipeline && npm test`.
Đối chứng đỏ: `DBV_MIG_THAY` thay 096 bằng bản đột biến (bỏ một trường khỏi CHECK; nới miền) — ca gọi đúng tên.

## Ngoài phạm vi

- Dựng cột trên `sale_offers`/bộ phân xử cho ba trường; bộ ghi phát biểu (GCQ2, DF7, DA9).
- Kế thừa phường từ dự án (hàng kế thừa riêng của kế hoạch), đổi loại ba nút Grand Park (DA1).
- Áp 096 lên DB máy thu hay cloud — lời riêng của Mạnh.
- DQ độ phủ ba trường — DA9 (chỉ số mức gắn mỗi đêm).
