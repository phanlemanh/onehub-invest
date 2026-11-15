---
schema_version: 1
feature: Mọi tin S03, S05, S06 có chứng cứ dự án được định vị cấp dự án qua một nguồn chung trong DB (view offer_project, migration 105, chỉ máy thu), và ô Định vị của màn chặng cùng bậc B2 của thang dữ liệu đọc đúng nguồn ấy — ô Định vị S03 trên DB máy thu từ 0 lên khoảng 4.934
slug: du-an-cua-tin-len-dinh-vi
owner: phanlemanh@gmail.com
risk_tier: T3      # chạm db/migrations (t3_paths); GS chọn đường A 15/11
surfaces: [cli, data, ui]
status: approved
approved_by: Mạnh
approved_at: 2026-11-15
design_doc: docs/superpowers/specs/2026-11-15-du-an-cua-tin-len-dinh-vi-design.md
---

# Acceptance Contract: du-an-cua-tin-len-dinh-vi

## Context

Hàng DV7 (T3, đường găng nhịp 1, bước 4 của điều tra 15/11). Màn Ops «Chất lượng từng chặng» báo Định vị = 0 cho mọi
nguồn vì `pipeline/sql/600_data_flow.sql` nối ô vào CTE rỗng `dinh_vi_link` (#377), và bậc B2 của thang dữ liệu trả 0
vì `offer_located()` của 087 là `SELECT false`. Dữ liệu đã có: 42.604 phát biểu `project_node_id` sống trên bài S03
(DV6, 14/11), nối qua `sale_offers.post_ids` ra 4.934/6.102 tin S03. GS chọn đường A: một nguồn chung trong DB cho 600,
B2, CG10 và `/ops/deals` (N1 đọc nguồn này). Bảng phủ ca đếm trên DB máy thu ở `discovery/bang-phu-ca.md`.

Luật AGENTS.md «Ai quyết gì» (main d8406b30): chữ ký Cổng Bằng chứng kèm lời áp 105 lên DB máy thu khi hồ sơ ghi đủ năm
thứ — lệnh áp, số chạy thử, sao lưu trước (ngoài cây kho, `~/onehub-backups/db/`), cách lùi, lệnh kiểm sau (AC-10).

## Acceptance Criteria

- **AC-1** Given DB thử của lượt đã áp mọi migration tới 104, When áp `db/migrations/105_offer_project.sql` hai lần,
  Then lần hai không lỗi và lược đồ không đổi (cột và kiểu của view `offer_project`, định nghĩa `offer_located`); view có
  đúng tám cột `offer_id, source, project_node_id, status, evidence, catalog_tier, n_posts, n_posts_with_project`;
  `offer_located(text)` giữ chữ ký và kiểu trả của 087; không bảng mới, và `pipeline/sync-cloud.mjs` không đổi trong diff.
- **AC-2** Given ma trận lớp tin theo bài viết trước từ bảng phủ ca (1 bài 0 dự án · 1 bài 1 dự án · nhiều bài 0 dự án ·
  nhiều bài một phần bài có dự án · nhiều bài mọi bài cùng dự án · nhiều bài hai dự án gốc khác nhau · một bài hai dự án
  · một bài hai luật cùng nút · phát biểu đã rút · tin 0 bài · tin S05; ô nút con không có đường qua phát biểu vì trigger 082/096 buộc
  `project_node_id` trỏ nút loại dự án — đo ở AC-3), When đọc `offer_project`, Then mỗi ô ra đúng một kết cục viết trước (không dòng · `mot_du_an` với nút gốc và
  hai số đếm bài · `xung_dot` với nút NULL), số assert bằng số ô, và mỗi `offer_id` một dòng.
- **AC-3** Given `s06_offer_project` có dòng (bí danh S06 trỏ nút có sẵn, nút ứng viên `mot_loi_khai`, phân khu con, phân
  khu cháu, toà con) và khi
  rỗng, When đọc `offer_project`, Then tin S06 có dòng `evidence = 'ma_nguon'` với nút gốc và `catalog_tier` của nút
  gốc; bí danh đã thôi thì không dòng; rỗng thì 0 dòng S06. (Một tin S06 không thể mang hai bí danh: khoá `list_id` và
  `registry_aliases_ma_nguon_uq` buộc mỗi tin tối đa một nút — không dựng ô ấy.)
- **AC-4** Given cùng fixture, When gọi `offer_located()` và `data_level_units()`, Then `offer_located` trả true đúng với
  tin `mot_du_an`, false với tin `xung_dot` và tin không dòng; `data_level_units()` tính định vị theo tập (nối view một
  lần, không gọi hàm từng tin) và cho cùng kết quả với `offer_located` từng tin; tin `mot_du_an` đủ năm trường lõi ra B2,
  tin `mot_du_an` thiếu trường lõi vẫn B0, tin không dự án đủ lõi vẫn B1, tin `xung_dot` đủ lõi vẫn B1.
- **AC-5** Given fixture cùng ma trận, When chạy `600_data_flow.sql` (cờ nhánh tắt), Then `located` mỗi nguồn và cửa sổ
  bằng số tin `mot_du_an` trong cửa sổ đếm độc lập; `locatedPending` bằng số tin ghi toà/trục đếm độc lập, KHÔNG trừ tin
  đã định vị cấp dự án (nghĩa cấp toà giữ nguyên, khớp toà còn rỗng); `unitLinked` = 0; `deepest.located` = `located`.
- **AC-6** Given DB máy thu, When chạy câu đọc của view trong giao dịch READ ONLY (không CREATE) và một phép đếm độc lập
  viết trong eval (nối `field_assertions` sống qua `post_ids`, quy nút về dự án gốc qua mọi tầng cha), Then số tin
  `mot_du_an` của S03 bằng phép đếm độc lập; số tin `xung_dot` in ra kèm danh sách `offer_id`; mỗi tin một dòng; mọi
  `offer_id` có trong `sale_offers`.
- **AC-7** Given DB máy thu và tải máy dưới 14, When đo nền và bản sau (áp 105 trong giao dịch lùi) cho
  `600_data_flow.sql` và `SELECT count(*) FROM data_level_units()`, Then 600 sau không quá 2 lần nền và không quá 15 giây;
  `data_level_units()` sau không quá 2 giây (nền đo 15/11: 66 ms); sau lượt đo DB máy thu không đổi.
- **AC-8** Given app dev trên worktree đọc DB thử đã làm tươi 600 với tin `mot_du_an`, When mở `/ops/data-flow` phần chất
  lượng và sơ đồ dòng chảy, Then tiêu đề cột Định vị có chữ «cấp dự án» và ô có số khác 0; gợi ý của nút «Chưa định vị»
  nói rõ số tin ghi toà/trục chờ khớp toà gồm cả tin đã định vị cấp dự án (chữ khẳng định, có số); nhãn mới có trong
  `CONTEXT.md`.
- **AC-9** Given DB máy thu, When chạy thử trong MỘT giao dịch do bộ chạy giữ (đọc số nền, áp 105, chạy thân 600 đã bỏ
  `BEGIN;`/`COMMIT;` của tệp, đọc số, ROLLBACK), Then ô Định vị S03 cửa sổ all và 7d bằng phép đếm độc lập lúc đo (mốc
  15/11: 4.934 và 754); S05, S06 bằng 0 khi `s06_offer_project` rỗng; `locatedPending` S03 bằng số nền đo trong cùng giao
  dịch trước khi áp; bộ chạy từ chối chạy nếu thân 600 còn `COMMIT`; sau ROLLBACK DB máy thu không có view
  `offer_project`, `offer_located` vẫn thân 087, `data_flow_snapshot.computed_at` như trước. Số ghi vào
  `ap-may-thu/so-chay-thu.md`.
- **AC-10** Given thư mục `ap-may-thu/` của hồ sơ, When soát, Then có đủ năm thứ: lệnh áp, số chạy thử (AC-9), lệnh sao
  lưu `pg_dump` ra `~/onehub-backups/db/` trước khi áp, tệp lùi, lệnh kiểm sau (gồm số dòng chuyển bậc «len» dự kiến của
  lượt đầu); tệp lùi thay `offer_located` và `data_level_units` về thân 087 TRƯỚC khi `DROP VIEW` (không CASCADE); chạy
  thật trên DB thử đã áp 105 thì view biến mất, mọi tin không còn B2 từ định vị, áp lại 105 sau lùi vẫn được; có view phụ
  thuộc `offer_project` thì lùi thất bại cả khối, không đổi gì.
- **AC-11** Given DB thử chép DB máy thu đã áp 105, When chạy các bên đọc có sẵn của bậc và bản ghi, Then danh sách bản
  ghi của trang dòng chảy ở máy thu (`app/src/lib/data-flow-queries.ts`) đánh mức `located` cho tin `mot_du_an` và lọc B2
  ra đúng các tin ấy; ở cloud (không có view) câu bản ghi vẫn chạy và không tin nào `located`; câu đếm độc lập của
  `app/scripts/bac-roundtrip.ts` đọc cùng luật nên khớp ảnh chụp bậc; bộ kiểm `tb_app_db` và `bac_roundtrip` xanh.

## Coverage

Bảng phủ ca (skill morphological-scan) ở `discovery/bang-phu-ca.md`, mọi số đếm từ DB máy thu 15/11.
- Trục A — nguồn × đường chứng cứ: S03 theo bài (AC-2, AC-6, AC-9) · S05 theo bài (AC-2) · S06 mã nguồn (AC-3) · S06 theo
  tin (Later). [CE: ba nguồn của `src` trong 600 — đủ]
- Trục B — tin × bài × dự án: 9 lớp của bảng phủ ca, gồm ô 0 tin hôm nay (hai dự án, 0 bài) (AC-2). [CE: đếm DB máy thu —
  đủ]
- Trục C — chứng cứ: sống · đã rút · nút gốc · nút con · nút ứng viên (AC-2, AC-3). [CE: ràng buộc `field_assertions`,
  `asset_nodes` 100 — đủ]
- Trục D — trạng thái tin: đang rao · hết hạn · thôi · bị thay · khác căn hộ — nguồn không lọc trạng thái, đọc
  `sale_offers` như 600 (thiết kế §2.1 luật 5). [CE: đếm DB — mọi tin hôm nay `active`; [GIẢ ĐỊNH] người đọc tự lọc]
- Lớp E — người đọc phía sau: màn chặng (AC-5, AC-8, AC-9) · bậc B2 và `data_level_change` (AC-4, AC-10 kiểm sau) · bản
  ghi trang dòng chảy, `bac-roundtrip`, test thang bậc (AC-11) · CG10, `/ops/deals` (tên cột gửi N1, ngoài hồ sơ) · cloud
  (AC-1 không đổi sync-cloud, AC-11 câu bản ghi chạy khi không có view) · hiệu năng chuỗi đêm 15 phút (AC-7).
- Tầng nút: dự án gốc · phân khu → dự án · phân khu → phân khu → dự án (12 nút) · toà → dự án (AC-2). [CE: đếm
  `asset_nodes` 15/11 — đủ]

## Đường đo

- Điểm xong của hàng (GS 15/11): ô Định vị S03 (cửa sổ all) trên DB máy thu từ 0 lên khoảng 4.934 sau một lượt 600 —
  AC-9 chứng trước khi ký bằng chạy thử trong giao dịch lùi; sau lời áp kèm chữ ký, lệnh kiểm sau của AC-10 đo lại trên
  bản thật.
- B2 khớp màn: AC-4 (luật), AC-9 không đo B2 trên DB máy thu vì `bac-du-lieu.mjs --write` ghi ngày; lệnh kiểm sau đo nó.

## Out of scope

- Định vị cấp toà, trục; `gan_can_link`, khớp toà cho «chờ khớp» — PL20, nhịp 2–3.
- S06 qua phát biểu theo tin; S06 khác căn hộ có mã dự án (2.625 tin) — `s06_offer_project` của DA32 chỉ lấy căn hộ.
- Cột dự án trên tin và căn, sync-cloud — DS2.
- Gom tin S03 vào căn (`property_offers`) — GT5.
- Phát biểu `subzone_node_id` (0 dòng hôm nay) — định vị cấp phân khu, khi có bộ ghi.
- CG10 xếp hạng cấp dự án và bộ lọc dự án trên `/ops/deals` — N1, đọc view này.

## Notes

- Ra khỏi kho: áp 105 lên DB máy thu đi cùng chữ ký Cổng Bằng chứng theo luật «Ai quyết gì»; người chạy theo
  `ap-may-thu/`.
