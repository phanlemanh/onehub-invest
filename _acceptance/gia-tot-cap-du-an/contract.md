---
schema_version: 1
feature: Tin có dự án được xếp hạng giá trong nhóm dự án × loại (× số phòng ngủ) và mang nhãn «Giá tốt» khi nằm trong 20% thấp nhất và dưới trung vị từ 5%; tin chỉ biết phường giữ «Rẻ trong phường»; /ops/deals lọc được theo dự án, mỗi căn một dòng, tab «Cần xác minh» đếm trên toàn tập; dải diện tích dự án × PN là phát biểu suy ra riêng
slug: gia-tot-cap-du-an
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [db, pipeline, ui, api]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-15
design_doc: docs/superpowers/specs/2026-11-15-gia-tot-cap-du-an-design.md
---

# Acceptance Contract: gia-tot-cap-du-an

## Context

Hàng CG10 (`docs/plan/lo-trinh.json`), mốc MN1 của mỏ neo 14/11 (ROADMAP §3 mục 48, QĐ3, QĐ4, QĐ9) và đường găng mục 50. CG9 (#456,
104 đã áp máy thu) chấm mọi tin vào `offer_price_rank` ở cấp phường. Hàng này thêm cấp dự án vào đầu chuỗi chọn nhóm của
`420_price_rank.sql` (nguồn dự án: view `offer_project` của migration 105, hàng DV7), migration 106 dựng bảng dải diện tích dự án × PN,
và đổi đường đọc của `/ops/deals`, trang một căn, hai API. T3 vì chạm `db/migrations/**`. Cổng Đáng: Mạnh «build, ngưỡng như đề xuất»
15/11. Thiết kế: `design_doc`.

## Criteria

- AC-1: Given DB của riêng lượt (chuỗi migration của nhánh, view `offer_project` tạm dựng từ thân 105) và ma trận tin viết trước của
  một dự án trải hai phường (nhóm căn hộ bán 12 phiếu gồm 2PN đủ 10 và 1PN dưới 10), When chạy bước chấm, Then mỗi tin trong nhóm có
  `cap = du_an`, `nut` = id dự án, `n`/`trung_vi`/`p20`/`hang_pct`/`duoi_trung_vi_pct` bằng phép tính độc lập của test (lệch ≤ 0,1)
  trên phiếu gom qua hai phường; tin ≤ p20 và dưới trung vị từ 5% mang `nhan = gia-tot`, tin ≤ p20 mà dưới 5% không nhãn; tin 2PN có
  `pn_nhom = 2`, tin 1PN `pn_nhom` NULL với `ly_do = pn-duoi-10`; tin căn hộ thuê có m² cùng dự án so trong nhóm thuê (không lẫn bán).
  Ba đột biến (bỏ điều kiện 5%, nhóm theo phường thay dự án, ghi nhãn `re-trong-phuong` ở cấp dự án) đỏ, thông điệp nêu mã tin.
- AC-2: Given ma trận viết trước một ô mỗi ca: dự án nhóm dưới 5 phiếu; dự án 5–9 phiếu mà nhóm phường của tin từ 10; dự án 5–9 mà
  nhóm phường dưới 10; tin `xung_dot`; tin không dự án; tin dự án con (nút `project` có cha `project`); tin có dự án thiếu loại hình;
  tin bán có dự án thiếu m², When chấm, Then lần lượt: chuỗi phường của CG9 (`cap = phuong`); `cap = phuong` có nhãn
  `re-trong-phuong` theo nhóm phường; `cap = du_an` có số, không nhãn, `ly_do = nhom-5-9`; `cap = phuong`; `cap = phuong` y như CG9;
  nhóm theo nút dự án con; không chấm `chua-ro-loai`; không chấm `thieu-gia` (dải diện tích không được dùng để chia giá) — một assert
  mỗi ô; ca CG9 (`hang-gia.test.mjs`) xanh không sửa ca.
- AC-3: Given tin thuê căn hộ cùng một dự án thiếu m²: nhóm 2PN từ 10 tin có giá tháng (có và không m²), nhóm 1PN 5–9, tin thiếu cả m²
  lẫn PN, When chấm, Then tin 2PN có `cap = du_an`, `thuoc = gia-thang-pn`, `pn_nhom = 2`, `trung_vi` = trung vị giá tháng nhóm 2PN của
  dự án tính độc lập; tin 1PN theo luật AC-2 (lùi phường khi phường đủ 10, không thì `du_an` + `nhom-5-9`); tin thiếu cả hai
  `thieu-dt-va-pn`. Đột biến bỏ khoá PN khỏi nhóm giá tháng đỏ.
- AC-4: Given bốn môi trường: DB không có `offer_project`; DB có view dưới lược đồ không phải `public` trong `search_path`; DB có view
  nhưng chưa áp 106; DB có view và 106, When chạy `xep-hang-gia.mjs` hai lần, Then không view → thoát 0, đúng một dòng «chưa có
  offer_project — chỉ chấm cấp phường», bảng chỉ có `cap = phuong` và giống hệt kết quả câu CG9; view ngoài `public` → được dò thấy và có
  dòng `du_an`; có view mà chưa có `project_area_band` → thoát 0, có dòng `du_an`, đúng một dòng «chưa áp 106 — bỏ dải diện tích»
  (đột biến chèn dải không dò bảng đỏ); chạy lần hai bảng giống hệt
  (trừ `computed_at`, `run_id`); tin đổi khỏi dự án giữa hai lượt (sửa view tạm) thì lượt sau về `cap = phuong`. Đột biến dò
  `public.offer_project` đỏ ở ca lược đồ khác.
- AC-5: Given migration 106 và ma trận tin căn hộ có dự án (dự án × 2PN có 12 mẫu m² hợp lệ, dự án × 1PN có 7 mẫu, tin m² ngoài khoảng),
  When áp 106 hai lần rồi chấm, Then áp lần hai không lỗi; `project_area_band` có đúng một dòng cho dự án × 2PN với `p10`, `p50`, `p90`,
  `n` bằng phép tính độc lập (lệch ≤ 0,1), không dòng cho 1PN (dưới 10), tin ngoài khoảng không vào mẫu; `sale_offers.area_m2` và mọi
  cột của `offer_price_rank` không đổi so với lượt chấm không có 106 (đột biến dùng p50 làm m² cho tin thiếu m² đỏ); lỗi giữa chừng
  (đột biến ném sau xoá) thì cả hai bảng giữ dòng cũ.
- AC-6 (cross-layer): Given DB thử sau AC-1…AC-5, When đọc trang một căn (`dealSql`, `cauChungMinh`, `lyDoRoi`) cho: tin bán cấp dự án
  có nhãn, tin 2PN thiếu m² thuê cấp dự án, tin cấp phường, tin `nhom-5-9` cấp dự án, tin căn hộ thiếu m² có dải, Then câu lần lượt
  chứa «So với N căn cùng dự án <tên dự án>, cùng loại (căn hộ), cùng 2PN» và «Giá tốt» với N = `n` của bảng; «cùng 2PN, theo giá thuê
  tháng»; chữ CG9 «cùng phường … Rẻ trong phường» không đổi; lý do «Nhóm so sánh chỉ có 5–9 căn — có số, chưa gắn nhãn»; «≈ a–b m² ·
  suy ra» với a, b = p10, p90 làm tròn — mỗi câu một assert, cặp dương/âm (tin cấp phường không có «cùng dự án», tin có m² không có
  «suy ra»). Lược đồ không có `project_area_band` → trang không lỗi, không dòng dải.
- AC-7 (cross-layer): Given DB thử có hai dự án, một căn có 3 tin bán cùng `property_offers`, 35 tin thường và 3 tin cần xác minh,
  When đọc danh sách `/ops/deals` (`getDeals` với và không `project`), Then `project=<id>` chỉ trả tin `cap = du_an` có `nut = id`, giới
  hạn 300 dòng-căn (không cắt 30) — fixture 35 dòng thường của một dự án ra đủ 35; căn 3 tin ra một dòng mang `soTin = 3` (tin thấy sau
  cùng làm đại diện); không lọc dự án: đếm tab «Cần xác minh» = 3 và liệt kê đủ 3 dù danh sách thường đã đủ 30 dòng; có lọc dự án: đếm
  tab chỉ gồm tin cần xác minh của dự án đó (dự án thứ hai có tin cờ làm đối chứng); danh sách chỉ có tin bán; id dự án có thật mà 0
  dòng `du_an` → kết quả rỗng mang tên dự án (trạng thái «chưa đủ căn»), id lạ → rỗng không tên dự án (trạng thái «không tìm thấy»),
  không ném. Đột biến đếm tab trên 30 dòng đã cắt đỏ.
- AC-8 (cross-layer): Given DB thử và lược đồ kiểu cloud (không `offer_project`, không `project_area_band`), When gọi `/v1/deals`
  (data-api) và `/api/v1/deals` (app, token ops) với `project` vắng, `project=<id>`, `project=abc`, Then dòng cấp dự án có
  `rank.level = du_an`, `rank.node` = id, `rank.label = gia-tot`; `project=<id>` chỉ trả tin của dự án; `project=abc` → 400; mọi trường
  cũ đủ tên và kiểu (bảng khoá viết trước); lược đồ kiểu cloud trả 200. `sync-cloud` (không sửa) trên DB thử với cloud giả chép các
  dòng `cap = du_an` của tin sống đúng số đếm độc lập (theo Hỏi-5 — lối «đi cùng»; nếu Mạnh chọn «đi sau» thì ca này đổi thành đếm 0
  với bộ lọc mới và hợp đồng sửa ở Cổng Phạm vi). Diff của hàng không chạm `pipeline/refresh-bait-gap.mjs`, và 0 dòng thêm chứa tên
  nguồn thật (công cụ rà có đối chứng đỏ).
- AC-9 (cross-layer): Given DB thử chép từ DB máy thu (`db/db-thu.sh`, không chạm DB dùng chung) có 104, When áp 105 (thân của DV7
  nếu DB chưa có view) và 106, chấm hai lần và đếm bằng SQL viết riêng, Then bảng đếm cấp × bán/thuê × thước × (có nhãn · chỉ số ·
  không chấm theo lý do) khớp phép đếm độc lập; lần hai bằng lần một; 0 nhãn ở nhóm dưới 10 phiếu; 0 tin so với nhóm khác dự án, khác
  loại, khác bán/thuê; số tin căn hộ có hạng cấp dự án ≥ 10.000 (mô phỏng 15/11: 13.269); danh sách OP1 đếm qua CHÍNH câu SQL của
  `getDeals({ project: 1 })` (gom căn, giới hạn của lọc dự án) có ≥ 100 dòng-căn (mô phỏng: 141 tin, 140 căn), in cả số dòng và số tin;
  in mẫu số và ghi `do-may-thu.md`. Hai đối chứng đỏ đúng (nhóm theo phường thay dự án → sai khoá; mỗi tin
  một phiếu → lệch đếm).
- AC-10: Given bản chạy `/ops/deals` trỏ DB thử của AC-9, When mở `?project=1` (Ocean Park 1), tab «Cần xác minh», một tin bán OP1
  nhãn «Giá tốt», một tin thuê OP1 thiếu m² và một căn có nhiều tin, Then tiêu đề mang tên dự án, mỗi căn một dòng có «N tin», tab đếm
  trên toàn tập, câu «So với N căn cùng dự án Vinhomes Ocean Park 1 …» và «Giá tốt», câu thuê «theo giá thuê tháng», con số khớp bảng,
  đọc được ở sáng và tối, trạng thái trống «Bỏ lọc dự án» khi id lạ và khi dự án có thật mà chưa đủ căn.

## Coverage

Trục lấy từ bảng phủ ca đo chỉ đọc 15/11 (thiết kế §6; ghi chú giám sát mục 2–7, 21 ô).

- Trục cấp × cỡ nhóm: dự án ≥10 / 5–9 (phường ≥10 | <10) / <5 × điều kiện nhãn — AC-1, AC-2. Thước: ma trận viết trước, tính độc lập,
  đột biến đỏ.
- Trục nguồn dự án: một dự án · xung đột · không dự án · dự án con · dự án trải nhiều phường · S03 một phần bài có dự án (view 105 quyết)
  — AC-1, AC-2, AC-9.
- Trục bán/thuê × thước: bán giá/m² · thuê giá/m² · thuê giá tháng × PN · thiếu cả hai · bán thiếu m² — AC-1, AC-2, AC-3.
- Trục môi trường: không view · view ngoài `public` · view mà chưa 106 · chạy lại · tin rời dự án · 106 hai lần · lỗi giữa chừng —
  AC-4, AC-5.
- Trục phát biểu suy ra: dải ≥10 mẫu · dưới 10 · ngoài khoảng · không chảy vào giá — AC-5, AC-2.
- Trục đường đọc: trang một căn · danh sách (lọc dự án, dự án chưa đủ căn, một căn nhiều tin, tab cần xác minh toàn tập và theo dự án)
  · API app · API công khai · lược đồ cloud · sync cloud — AC-6, AC-7, AC-8, AC-10. Thước: so với dòng của bảng, không tính lại bằng mã của hàng.
- Trục dữ liệu thật: toàn tin trên bản chép DB máy thu, thước MN1, OP1 — AC-9.
- Ô loại có lý do: tin 46–90 ngày (danh sách lọc 45 ngày như CG9); PN lạ (rơi nhóm không PN, luật CG9); có dự án thiếu loại (không suy
  «căn hộ» từ dự án — AC-2 khẳng định không chấm).

## Đường đo

- «/ops/deals lọc OP1 ra tin bán nhãn cấp dự án, mỗi dòng ghi so với N căn cùng dự án» ← AC-7, AC-10; số trên dữ liệu thật ← AC-9
  (OP1 ≥ 100, `do-may-thu.md`).
- «trang một căn thuê OP1 thiếu m² hiện hạng giá tháng × số phòng ngủ» ← AC-3, AC-6, AC-10.
- «thước MN1 ≥ 10.000 tin căn hộ có hạng cấp dự án» ← AC-9 trên bản chép; số trên DB máy thu sau áp đọc bằng cùng câu đếm (lệnh kiểm
  sau áp ở `ap-may-thu.md`).
- «Mạnh mở 10 tin nhãn OP1, ≤ 3 sai rõ» — phiên nghiệm thu sau ship (Cổng Giá trị), không phải eval máy.

## Out of scope

- Cấp phân khu, toà, tầng (CG11 — nhịp 2).
- Đẩy `project_area_band` lên cloud (cloud đi sau) — không chạm `sync-cloud.mjs`. Hạng cấp dự án đi theo bảng `offer_price_rank` đã sync
  sẵn từ CG9 (Hỏi-5); hiện «Giá tốt» trên cổng Invest là nhịp 3.
- Tin thuê trên danh sách `/ops/deals` (CG3) — nếu Mạnh chọn khác ở Hỏi-2 thì sửa hợp đồng.
- Sửa view `offer_project` hay áp 105 lên máy thu (hàng DV7).
- Áp 106 và chấm thật trên DB máy thu — đi theo lời áp ở Cổng Bằng chứng với đủ năm thứ (`ap-may-thu.md`, mục 50).

## Notes

- PR gộp SAU DV7 (`du-an-cua-tin-len-dinh-vi`, migration 105): test dựng view tạm từ thân 105 nên vòng chạy không chờ. Gộp trước khi áp
  106 vẫn an toàn: bước chấm đêm bỏ dải khi thiếu bảng (AC-4).
- Migration 106 do N1 giữ số; sổ số migration của điều phối liên làn ghi 106 cho hàng này.
