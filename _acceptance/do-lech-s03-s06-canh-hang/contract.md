---
schema_version: 1
feature: Cạnh hạng cấp dự án của mỗi tin S03, người vận hành thấy mặt bằng giá S06 cùng dự án × loại × số phòng ngủ — trung vị hai nguồn, số căn mỗi bên, độ lệch phần trăm — tính sẵn ở bước chấm hạng; nhóm thiếu một bên ghi «chưa đủ để so»
slug: do-lech-s03-s06-canh-hang
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [db, pipeline, ui]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-16
design_doc: docs/superpowers/specs/2026-11-16-do-lech-s03-s06-canh-hang-design.md
---

# Acceptance Contract: do-lech-s03-s06-canh-hang

## Context

Hàng CG15 (`docs/plan/lo-trinh.json`, lát l03, mốc MS2), đứng trên CG10 (#466, đã áp máy thu 15/11). ROADMAP §3 mục 51: S03 là nguồn
lõi, S06 là mặt bằng so sánh; độ lệch giá hai nguồn cùng dự án chưa từng đo. Hàng thêm bảng `project_source_baseline` (migration 107,
chỉ máy thu), câu `423_project_source_baseline.sql` chạy trong cùng giao dịch chấm hạng sau 422, và dòng đọc trên `/ops/deals` cùng
trang một căn. T3 vì chạm `db/migrations/**` (lộ trình ghi T2 khi chưa biết cần bảng). Cổng Đáng: Mạnh «build, ngưỡng như đề xuất»
16/11. Thiết kế: `design_doc`.

## Criteria

- AC-1: Given DB của riêng lượt (chuỗi migration của nhánh, có 105, 106, 107) và ma trận tin viết trước của một dự án: nhóm căn hộ bán
  2PN có 7 phiếu S03 và 9 phiếu S06 (một căn S06 mang hai tin, hai tin S03 trùng giá), When chạy bước chấm, Then đúng một dòng
  `project_source_baseline` cho nhóm đó với `n_s03 = 7`, `n_s06 = 9` (đếm phiếu, không đếm tin), `trung_vi_s03`, `trung_vi_s06` bằng
  phép tính độc lập của test (lệch ≤ 0,1), `lech_pct = round((trung_vi_s03 / trung_vi_s06 − 1) × 100, 1)`, `trang_thai = du`. Ba đột
  biến (đếm theo tin thay phiếu, bỏ lọc nguồn để S05 lẫn vào, đảo dấu độ lệch) đỏ, thông điệp nêu khoá nhóm.
- AC-2: Given ma trận viết trước một ô mỗi ca: nhóm S03 4 phiếu + S06 ≥ 5; S03 ≥ 5 + S06 4; cả hai dưới 5; nhóm chỉ có S06; tin S05 và
  S02 cùng nhóm; tin S03 cấp phường (không dự án); tin S03 phi lý hay ngoài khoảng, When chấm, Then lần lượt `thieu-s03`, `thieu-s06`,
  `thieu-hai` với `lech_pct` NULL và trung vị của bên có ≥ 1 phiếu vẫn ghi; dòng `thieu-s03` với `n_s03 = 0`; S05, S02 không vào `n`
  của bên nào; tin cấp phường không sinh dòng; tin loại ra không vào mẫu — một assert mỗi ô.
- AC-3: Given thuê căn hộ cùng dự án: nhóm thuê có m² (thước `gia-m2`) và nhóm thuê thiếu m² theo PN (thước `gia-thang-pn`), When chấm,
  Then mỗi thước một dòng riêng theo đúng khoá nhóm của `offer_price_rank` (`nut`, `kind`, `property_type`, `thuoc`, `pn_nhom`), trung
  vị giá tháng tính độc lập; khoá dòng mặt bằng khớp khoá nhóm của mọi tin S03 trong nhóm (đối chứng: nhóm bán và nhóm thuê cùng dự án
  không trộn).
- AC-4: Given DB đã chấm một lần, When chạy lại cùng dữ liệu, Then số dòng và mọi cột trừ `computed_at`, `run_id` không đổi; đột biến
  ném lỗi sau bước xoá → cả `offer_price_rank` lẫn `project_source_baseline` giữ dòng cũ (một giao dịch). Given DB chưa áp 107, When chấm,
  Then thoát 0, đúng dòng «xep-hang-gia: chưa áp 107 — bỏ mặt bằng hai nguồn», hạng giống hệt lượt có 107; DB không view 105 → bảng rỗng.
  Áp 107 hai lần không lỗi.
- AC-5: Given DB của AC-1 sau chấm, When app đọc qua `dealsSql` và trang một căn, Then tin S03 cấp dự án mang `matBang` bằng đúng dòng bảng
  của nhóm nó (so từng trường với SELECT trên bảng); tin S06, tin cấp phường, tin không dự án có `matBang` null; lược đồ không có bảng
  (kiểu cloud) → không lỗi, `matBang` null mọi dòng.
- AC-6: Given các `DealRow` viết trước (đủ hai bên âm, đủ hai bên dương, `thieu-s06`, `thieu-s03`, `thieu-hai`, thuê giá tháng, và một
  nhóm 9 căn S06 mang 10 tin), When dựng ô «Giảm so thước» của danh sách và hàng mặt bằng của trang một căn, Then chữ đúng bốn khuôn
  ghim theo trạng thái (thiết kế §2.3): «S06 <trung vị> · <n_s06> căn · S03 −x,x%» / «+x,x%»; «S06 chưa đủ để so (<n> căn)»; «S03 chưa
  đủ để so (<n> căn) · S06 …»; «Chưa đủ căn hai nguồn để so (S03 <n> · S06 <n>)»; nhóm 9 căn 10 tin ghi «9 căn»; thuê ghi «tr/tháng»;
  tin không có `matBang` không có chữ «S06». Ba đột biến đỏ: đảo dấu, dùng câu `thieu-s06` cho dòng `thieu-s03`, lấy `n_s03` làm số căn S06.
- AC-7: Given bản chép DB máy thu (db/db-thu.sh), áp 107, When chấm hai lần và đếm độc lập, Then bảng đếm bán/thuê × thước × trạng thái
  khớp đếm SQL riêng (lech = 0); lần hai = lần một; `tin_s03_co_mat_bang` (tin S03 cấp dự án nằm ở nhóm `du`) ≥ 1.500; in mẫu số; ghi
  `.acceptance-runs/do-lech-s03-s06-canh-hang/do-may-thu.md` (không ghi vào hồ sơ); hai đối chứng (đếm theo tin, bỏ lọc nguồn) đỏ đúng.
- AC-8: Given app chạy trên DB thử của AC-7 (`do-lech-s03-s06-db.sh ghi-thu`), When mở `/ops/deals?project=1` và trang một căn S03 của
  Vinhomes Ocean Park 1, Then thấy dòng phụ S06 trên dòng S03 của danh sách (tin chọn bằng SQL, số khớp dòng bảng của nhóm nó) và hàng
  «Mặt bằng S06 cùng dự án» trên trang một căn, số khớp dòng bảng; một dòng S03 nhóm thiếu bên trên danh sách và một trang một căn
  thiếu bên hiện đúng câu của trạng thái; đọc được ở sáng và tối.

## Coverage

Trục lấy từ số phủ đo chỉ đọc 15/11 (ô cơ hội) và chuỗi nhóm của CG10.

- Trục đủ bên: S03 ≥ 5 ∧ S06 ≥ 5 · thiếu S03 · thiếu S06 · thiếu cả hai · chỉ một nguồn — AC-1, AC-2.
- Trục mẫu số: phiếu (căn S06 nhiều tin) · tin trùng giá · nguồn khác (S05, S02) · tin loại ra · tin cấp phường — AC-1, AC-2.
- Trục bán/thuê × thước: bán giá/m² · thuê giá/m² · thuê giá tháng × PN — AC-1, AC-3.
- Trục môi trường: chạy lại · lỗi giữa chừng · chưa áp 107 · không view 105 · 107 hai lần — AC-4.
- Trục đường đọc: danh sách · trang một căn · lược đồ cloud không bảng · tin không phải S03 cấp dự án — AC-5, AC-6, AC-8.
- Trục dữ liệu thật: toàn tin trên bản chép DB máy thu — AC-7.
- Ô loại có lý do: tin S03 thuê trên danh sách (danh sách chỉ tin bán từ CG10 Hỏi-2 — thuê thấy ở trang một căn); cấp phường, toà.

## Đường đo

- «Mỗi nhóm đủ căn ở cả hai nguồn có một dòng độ lệch tính sẵn ở pipeline; nhóm thiếu một bên ghi «chưa đủ để so»» ← AC-1, AC-2, AC-3.
- «Số trên màn khớp truy vấn trên DB máy thu» ← AC-5, AC-8 (so với dòng bảng) và AC-7 (đếm độc lập trên bản chép).
- «Chạy lại cùng ngày không nhân dòng» ← AC-4, AC-7.

## Out of scope

- UI10 (bảng `/ops/deals` theo block data-grid, đủ trạng thái) — cùng màn nhưng 9 tiêu chí riêng; gom vượt cỡ hợp đồng. Vòng này chỉ
  thêm dòng phụ vào ô có sẵn.
- Đưa `project_source_baseline` lên cloud và API `/v1/deals` (Hỏi-2) — không chạm `sync-cloud.mjs`, data-api.
- Đổi hạng hay nhãn «Giá tốt»: hạng CG10 giữ nguyên, mặt bằng S06 chỉ là dữ kiện đọc kèm.
- Mặt bằng cấp phường, cấp toà; nguồn S05 làm mặt bằng.
- Áp 107 và chấm thật trên DB máy thu — đi theo lời áp ở Cổng Bằng chứng (`ap-may-thu.md`, như CG10).

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-11-16:
  - Ngoài-1: Trang một căn ghi «… tin S06» ở dòng số tin dựng thước dù thước cấp dự án gom mọi nguồn; đứng cạnh hàng mặt bằng có thể nói ngược nhau.
  - Ngoài-2: Nhãn «Mặt bằng S06 cùng dự án» trùng chữ «Mặt bằng» của loại hình và chưa có trong CONTEXT.md.
  - Ngoài-3: Nhóm giá tháng bỏ sót tin thuê có m² được xếp hạng cấp phường; vài nhóm thuê ghi «chưa đủ để so» dù thật đủ.
- Số migration 107 do giám sát đợt dành cho hàng này (sổ số 16/11: 103 S16 · 104 CG9 · 105 DV7 · 106 CG10 · 107 CG15).
- Hồ sơ áp đủ năm thứ như 106 (`ap-may-thu.md`: lệnh áp, số chạy thử, sao lưu, lùi, kiểm sau) để chữ ký Cổng Bằng chứng phủ cả lời áp
  107 lên DB máy thu.
