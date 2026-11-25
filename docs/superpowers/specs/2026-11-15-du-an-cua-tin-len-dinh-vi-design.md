# DV7 du-an-cua-tin-len-dinh-vi — thiết kế

Ngày 15/11/2026 · dãy U1 · hạng T3 (chạm `db/migrations/`) · GS giao, chọn đường A.
Bảng phủ ca: `_acceptance/du-an-cua-tin-len-dinh-vi/discovery/bang-phu-ca.md` (số đếm DB máy thu).

## 1. Vấn đề

Màn Ops «Chất lượng từng chặng» báo Định vị = 0 cho mọi nguồn. Hai chỗ cắm rỗng:

- `pipeline/sql/600_data_flow.sql:88-90` — `dinh_vi_link AS (SELECT NULL::text AS offer_id WHERE false)` (#377).
- `offer_located()` của `db/migrations/087_thang_bac_moi.sql` — `SELECT false`, nên bậc B2 của thang dữ liệu cũng 0.

Dữ liệu đã có từ 14/11: 42.604 phát biểu `project_node_id` sống trên bài S03 (DV6), nối qua `sale_offers.post_ids` ra
4.934/6.102 tin S03.

## 2. Thiết kế

### 2.1 View `offer_project` (migration `105_offer_project.sql`, chỉ máy thu)

Mỗi tin có chứng cứ dự án một dòng; tin không có chứng cứ thì không có dòng.

| Cột | Kiểu | Nghĩa |
|---|---|---|
| `offer_id` | text | khoá |
| `source` | text | S03, S05, S06 |
| `project_node_id` | bigint | nút dự án GỐC; NULL khi xung đột |
| `status` | text | `mot_du_an` · `xung_dot` |
| `evidence` | text | `bai` (phát biểu theo bài) · `ma_nguon` (`s06_offer_project`) |
| `catalog_tier` | text | hạng tin cậy của nút (`xac_minh`, `suy_ra_manh`, `mot_loi_khai`); NULL khi xung đột |
| `n_posts` | int | số bài của tin (S06: 0) |
| `n_posts_with_project` | int | số bài mang phát biểu dự án sống |

Luật:

1. **Theo bài (S03, S05):** phát biểu `field = 'project_node_id'`, `retracted_at IS NULL`, `subject_key =
   source || ':' || post_id` với mọi `post_id` trong `post_ids` của tin. Mỗi nút quy về dự án gốc (đi `parent_id` tới
   `node_type = 'project'`).
2. **Một dự án gốc → `mot_du_an`**; hai dự án gốc trở lên → `xung_dot`, `project_node_id` NULL. Không chọn theo đa số:
   tin rao một căn chỉ ở một dự án, hai dự án là gom tin sai hay phát biểu sai, để người xem.
3. **Hai luật cùng nút trên một bài** đếm một dự án (34 bài hôm nay).
4. **S06:** đọc `s06_offer_project` (100), quy nút về dự án gốc, cùng luật một/hai dự án. Hôm nay 0 dòng; tự lên số khi
   thẻ luật S06 được áp, không cần PR.
5. **Không lọc trạng thái tin** (`offer_status`, hết hạn). Đọc `sale_offers` (view đã bỏ tin `retired_at`), như 600.
6. **Không ghi gì**: view thuần đọc, không bảng mới, không sync cloud (cùng chế độ với 087, 100).

### 2.2 `offer_located()` và `data_level_units()` đọc view

- `offer_located(p_offer_id)` (giữ chữ ký 087): `EXISTS (SELECT 1 FROM offer_project WHERE offer_id = p_offer_id AND status
  = 'mot_du_an')` — cho người gọi từng tin.
- `data_level_units()` (giữ chữ ký 087) KHÔNG gọi hàm từng tin: nối `LEFT JOIN offer_project` một lần và truyền
  `op.status = 'mot_du_an'` vào `offer_data_level`. Lý do (phản biện 15/11): nền `SELECT false` được inline thành hằng (66 ms
  cho 110.778 đơn vị); dạng gọi từng tin qua view UNION ALL + GROUP BY chạy quá 130 giây và chạy mỗi lượt cloud-sync 15 phút
  (`bac-du-lieu`, `do-hang-ngay`).

Bậc B2 là «định vị VÀ đủ năm trường lõi» (`offer_data_level` của 087), nên số tin B2 ≤ số ô Định vị; hai số khớp theo luật
này.

### 2.3 `600_data_flow.sql`

- `dinh_vi_link AS (SELECT offer_id FROM offer_project WHERE status = 'mot_du_an')`.
- `gan_can_link` giữ rỗng (nhịp 3).
- «Chờ khớp» (`locatedPending`) giữ nghĩa cấp toà: tin ghi toà/trục mà chưa khớp nút toà. Thêm CTE rỗng
  `toa_link` (nhịp 2, PL20) và tính `ghi_toa AND NOT <khớp toà>` thay cho `ghi_toa AND NOT located`. Không có bước này
  thì «chờ khớp» S03 tụt từ 3.224 xuống 755 chỉ vì đổi định nghĩa.
- `deep_located`, `deep_clustered` giữ công thức (bậc sâu nhất).

### 2.4 Chạy thử trên DB máy thu

Tệp 600 tự có `BEGIN;` (dòng 21) và `COMMIT;` (dòng 265). Bộ chạy thử và bộ đo hiệu năng giữ một giao dịch ngoài và chạy
THÂN 600 đã bỏ đúng một `BEGIN;` và một `COMMIT;`; còn `COMMIT` thì thoát trước khi gửi câu nào. Không vậy thì `COMMIT` của
600 chốt luôn 105 lên DB máy thu khi chưa có lời áp.

### 2.5 Màn

Nhãn cột và gợi ý của màn chặng nói rõ «Định vị (cấp dự án)»: `quality-grid.tsx` (nhãn cột, chú thích), `flow-sankey-data.ts`
(gợi ý «Chưa định vị»: số chờ khớp toà gồm cả tin đã định vị cấp dự án — 2.469/3.224 tin S03 ghi toà đã có dự án),
JSDoc `records-filter.tsx`. Thêm thuật ngữ vào `CONTEXT.md`.

### 2.6 Bên đọc khác của app

- `app/src/lib/data-flow-queries.ts` (câu bản ghi, dòng 224): ở máy thu (`withPost`) nối `offer_project` để mức `located`
  và lọc B2 đúng; ở cloud không có view nên giữ câu cũ.
- `app/scripts/bac-roundtrip.ts` (`SQL_DEM`, tham số cuối `false`): đọc `offer_project` cùng luật, không thì bộ kiểm
  `bac_roundtrip` đỏ trên DB thử chép sau khi áp.
- `app/tests/thang-bac-db.itest.tsx` TB-AC-8: «lọc B2 phải rỗng» thành lọc B2 ra tin định vị.

## 3. Người đọc phía sau

| Người đọc | Ảnh hưởng | Xử lý trong hàng |
|---|---|---|
| Màn chặng (600 → `data_flow_snapshot`) | ô Định vị S03 0 → 4.934 (all), 754 (7d) | tiêu chí đo trên DB máy thu |
| Bậc B2 (`data_level_snapshot`, `do-hang-ngay`) | tin S03 đủ lõi và có dự án lên B2; `chuyenBac` ghi «len», không phải «tut» | tiêu chí B2 khớp; lượt đầu sinh một loạt dòng «len» một lần |
| CG10, `/ops/deals` (N1) | đọc `offer_project` | tên và cột đã gửi GS chuyển N1 |
| Cloud (`push-ops-facts`) | chỉ số đếm qua `data_flow_snapshot` | không đổi `sync-cloud`, leak gate |

## 4. Áp lên DB máy thu (xin ở Cổng Phạm vi)

- Sao lưu: `pg_dump` lược đồ trước khi áp (lệnh trong hồ sơ).
- Áp: `docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v
  ON_ERROR_STOP=1 < db/migrations/105_offer_project.sql`, rồi `node pipeline/refresh-data-flow.mjs
  pipeline/sql/600_data_flow.sql` và `node pipeline/bac-du-lieu.mjs --write`.
- Kiểm sau: lệnh đo ô Định vị và B2 (hồ sơ).
- Lùi: `_acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/105-lui.sql` (kho chưa có thư mục lùi chung): thay
  `offer_located` và `data_level_units` về thân 087 TRƯỚC, rồi `DROP VIEW offer_project` không CASCADE — có view của
  người khác dựa trên nó thì lùi thất bại cả khối, người lùi view kia trước.
- Lượt `bac-du-lieu` đầu sau áp ghi một loạt dòng chuyển bậc «len» (B1 → B2, tới số tin định vị đủ lõi) vào
  `data_level_change` — một lần, ghi trong README áp. — `DROP VIEW offer_project`, trả `offer_located()` về `SELECT false`.

## 5. Ngoài phạm vi

- S06 qua phát biểu theo tin; S06 khác căn hộ (2.625 tin có mã) — `s06_offer_project` của DA32 chỉ lấy căn hộ.
- Định vị cấp toà, trục; `gan_can_link` — PL20, nhịp 2–3.
- Cột dự án trên tin và căn, sync-cloud — DS2.
- Gom tin S03 vào căn — GT5.
- Phát biểu `subzone_node_id` (0 dòng hôm nay).
