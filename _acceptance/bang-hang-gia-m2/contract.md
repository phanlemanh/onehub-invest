---
schema_version: 1
feature: Mỗi tin đang rao có giá trị hợp lệ mang hạng trong nhóm sâu nhất đủ căn (hôm nay phường × loại × bán/thuê, thêm số phòng ngủ khi nhóm vẫn đủ; tin thuê thiếu m² so giá tháng cùng số phòng ngủ), cùng số căn, trung vị, p20, phần trăm dưới trung vị, nhãn và lý do lùi cấp, do pipeline tính sẵn vào bảng offer_price_rank; /ops/deals và /v1/deals đọc bảng này
slug: bang-hang-gia-m2
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [db, pipeline, ui, api]
status: draft
design_doc: docs/superpowers/specs/2026-11-14-bang-hang-gia-m2-design.md
---

# Acceptance Contract: bang-hang-gia-m2

## Context

Hàng CG9 (`docs/plan/lo-trinh.json`, bản phạm vi `docs/plan/pham-vi-can-gia-tot-vi-tri-0911.md`, Q1–Q5 09/11, ROADMAP §3 mục 42) và
mỏ neo đợt 14/11 (QĐ3 không rào, QĐ4 thuê theo số phòng ngủ). Hôm nay chỉ tin bán có số giảm, chỉ cấp phường × loại, trung vị chỉ từ
căn S06, không hạng, p20 hay lý do. Hàng này dựng bảng tính sẵn `offer_price_rank` (migration 104) cho mọi tin đang rao, bán lẫn
thuê, P1 lẫn P2, mỗi căn một phiếu; `/ops/deals` và hai API đọc bảng. T3 vì chạm `db/migrations/**`.

## Criteria

- AC-1: Given DB thử dựng từ chuỗi migration của nhánh (gồm 104) và ma trận tin viết trước cùng một phường × loại × bán (nhóm 12 phiếu,
  nhóm 7 phiếu, nhóm 4 phiếu), When chạy bước chấm, Then với nhóm 12: `n`, `trung_vi`, `p20`, `hang_pct`, `duoi_trung_vi_pct` của mỗi
  tin bằng phép tính độc lập của test (lệch ≤ 0,1), tin có `gia_tri ≤ p20` và dưới trung vị từ 5% mang `nhan = re-trong-phuong`, tin
  ≤ p20 mà dưới trung vị chưa tới 5% không nhãn; nhóm 7 có số, không nhãn, `ly_do = nhom-5-9`; nhóm 4 không số, `ly_do = nhom-duoi-5`.
  Bản đột biến bỏ điều kiện 5% hay bỏ ngưỡng 10 thì đỏ, thông điệp nêu mã tin.
- AC-2: Given ba tin S06 cùng một căn (`property_offers`) giá khác nhau, một tin S06 gắn hai căn, và tin S03 cùng phường × loại, When
  chấm, Then căn ba tin góp đúng một phiếu bằng giá của tin thấy sau cùng, tin gắn hai căn góp một phiếu (căn nhỏ nhất), tin S03 góp
  phiếu riêng và chung nhóm với S06; `n` bằng số phiếu đếm độc lập; mọi tin của một căn mang cùng hạng. Đột biến đếm mỗi tin một phiếu
  thì đỏ.
- AC-3: Given ma trận viết trước: tin có PN mà nhóm cùng PN từ 10 phiếu, tin có PN mà nhóm cùng PN dưới 10, tin không PN, tin
  `unknown`, tin loại NULL, tin không phường, tin không giá, tin giá/m² ngoài khoảng, tin phi lý theo ON11 (diện tích, phòng quá nhỏ),
  tin dưới trung vị quá 35%, When chấm, Then lần lượt: `pn_nhom` = PN; `pn_nhom` NULL với `ly_do = pn-duoi-10`; `pn_nhom` NULL không
  lý do lùi; không chấm với `chua-ro-loai` (hai ô), `thieu-phuong`, `thieu-gia`, `ngoai-khoang`, `phi-ly:<lý do>`; tin dưới trung vị
  quá 35% vẫn mang nhãn và `can_xac_minh = true` — một assert mỗi ô.
- AC-4: Given tin thuê cùng phường × căn hộ: nhóm có m² từ 10 phiếu, tin thuê thiếu m² có 2PN trong nhóm 2PN từ 10 tin có giá tháng (có
  và không m²), tin thiếu m² có 1PN trong nhóm 1PN dưới 5, tin thiếu cả m² lẫn PN, và tin bán cùng phường, When chấm, Then tin thuê có
  m² có `thuoc = gia-m2` so với nhóm thuê (không lẫn tin bán); tin 2PN thiếu m² có `thuoc = gia-thang-pn`, `pn_nhom = 2`, trung vị là
  giá tháng của nhóm 2PN; tin 1PN `nhom-duoi-5`; tin thiếu cả hai `thieu-dt-va-pn`; giá trị nằm ngoài khoảng thuê thì `ngoai-khoang`.
- AC-5: Given DB đã chấm, When chạy bước chấm lần hai không đổi dữ liệu, Then bảng giống hệt (so từng dòng trừ `computed_at`,
  `run_id`); khi bước chấm lỗi giữa chừng (đột biến ném lỗi sau khi xoá), bảng giữ nguyên các dòng cũ; áp 104 hai lần không lỗi; cột
  `cap` nhận `phuong`, `du_an`, `phan_khu`, `toa` và từ chối giá trị khác; bảng có đúng một dòng cho mỗi tin đang rao.
- AC-6 (cross-layer): Given DB thử sau AC-1…AC-4, When đọc `/ops/deals` (`dealsSql`) và trang một căn (`dealSql`, `lyDoRoi`,
  `cauChungMinh`), Then danh sách gồm đúng các tin bán có `nhan` (P1 và P2), xếp tin cần xác minh sau rồi theo phần trăm dưới trung vị
  giảm dần, trần 50% và hạn 45 ngày như cũ; số trên thẻ (trung vị, số căn, phần trăm) bằng dòng của bảng; mỗi mã `ly_do` (ma trận
  viết trước đủ mọi mã, cộng một mã lạ) ra đúng chữ tiếng Việt đã ghim; câu chứng minh nêu «so với N căn cùng phường, cùng loại» với N
  bằng `n` của bảng (thêm «cùng <k>PN» khi chia PN) và nhãn «Rẻ trong phường»; tin có `can_xac_minh` mang chữ «Cần xác minh», tin không
  cờ thì không. Khi DB chưa có bảng `offer_price_rank` hoặc bảng chưa có dòng, hai hàm đọc theo lối Hỏi-5 và không lỗi.
- AC-7 (cross-layer): Given DB thử, When gọi `/v1/deals` của data-api và `/api/v1/deals` của app (token ops) với `kind` vắng,
  `kind=sale`, `kind=rent_lt`, Then mọi dòng là tin có `nhan` của đúng loại tin; `discountPct` và `rank.*` bằng dòng của bảng; mọi
  trường cũ còn đủ tên và kiểu (bảng khoá viết trước); tin thuê chỉ xuất hiện khi `kind=rent_lt`; `area`, `market`, `limit`,
  `min_discount` lọc như trước; `kind` sai giá trị → 400. DB chưa có bảng hoặc bảng rỗng: hai API trả theo lối Hỏi-5, không 500.
- AC-8: Given `sync-cloud` với cloud giả có và không có bảng `offer_price_rank`, When chạy, Then có bảng thì chép đúng các dòng của tin
  sống (bảng con của tin sống), không cột nào mang tên nguồn thật; không có bảng thì in một dòng bỏ qua và các bảng khác vẫn chép như
  cũ. Diff của hàng không đổi cách tính `bait_gap_pct` (ca CG8 vẫn xanh không sửa ca) và không dòng thêm nào chứa tên nguồn thật.
- AC-9 (cross-layer): Given DB thử chép từ DB máy thu (`db/db-thu.sh`, không chạm DB dùng chung), When áp 104, chạy bước chấm hai lần
  và đếm bằng SQL viết riêng, Then số tin được chấm theo bán/thuê × (có nhãn · chỉ số · không chấm theo từng lý do) khớp phép đếm độc
  lập; lần hai bằng lần một; 0 tin có nhãn ở nhóm dưới 10 phiếu; 0 tin được chấm so với nhóm khác loại hình hay khác bán/thuê; in mẫu số.
- AC-10: Given `/ops/deals` và trang một căn trên bản chạy trỏ DB thử của AC-9, When mở danh sách, một căn có nhãn, một căn cần xác
  minh và một tin nhóm 5–9, Then nhãn «Rẻ trong phường», chữ «Cần xác minh» (chỉ ở căn có cờ), dòng «so với N căn» và lý do hiện đúng
  chữ của AC-6, con số khớp bảng, đọc được ở sáng và tối.
- AC-11: Given ba job đêm (`scripts/chotot-daily.sh`, `scripts/zalo-import-daily.sh`, `scripts/apify-facebook-daily.sh`) và DB của
  lượt không có 104, When đọc thứ tự bước và chạy `xep-hang-gia.mjs`, Then mỗi job có đúng một bước `xep-hang-gia` đứng sau bước định
  vị cuối của job (`resolve-properties` ở job S06, `refresh-bait-gap` ở hai job kia); lệnh trên DB không có 104 thoát 0 với đúng dòng
  «chưa áp 104», không ghi gì; trên DB có 104 bảng mang `run_id` mới. Đột biến bỏ bước khỏi một job hay đặt trước `resolve-properties`
  thì đỏ, nêu tên job.

## Coverage

- Trục cỡ nhóm × điều kiện nhãn: ≥10 / 5–9 / <5 × (≤ p20 ∧ ≥5%) / (≤ p20 ∧ <5%) / (> p20) — AC-1. Thước: ma trận viết trước, tính
  độc lập trong test, đột biến đỏ.
- Trục phiếu: một tin một căn · nhiều tin một căn · một tin nhiều căn · tin không căn (P1) — AC-2.
- Trục lùi cấp và lý do: PN đủ · PN thiếu · không PN · bảy lý do không chấm · cần xác minh — AC-3.
- Trục bán/thuê × thước: bán giá/m² · thuê giá/m² · thuê giá tháng theo PN · thuê thiếu cả hai — AC-4.
- Trục thời gian và ghi: lượt đầu · chạy lại · lỗi giữa chừng · migration hai lần · cấp tương lai — AC-5; chỗ gọi trong job đêm và
  DB chưa áp 104 — AC-11; bảng chưa có trên cloud — AC-6, AC-7 (lối Hỏi-5).
- Trục đường đọc: pipeline · Ops danh sách · Ops một căn · API app · API công khai · cloud — AC-6, AC-7, AC-8, AC-10. Thước: so với
  dòng của bảng, không tính lại bằng mã của hàng.
- Trục dữ liệu thật: toàn bộ tin trên bản chép DB máy thu — AC-9.
- Ô loại có lý do: cấp dự án, toà (CG10, CG11 — `cap` đã nhận giá trị, chưa sinh dòng); tin thuê trên màn Ops (CG3).

## Đường đo

- «số tin được chấm khớp phép đếm SQL độc lập» ← AC-9 (`hang-gia-db.sh do`), ghi số vào `_acceptance/bang-hang-gia-m2/do-may-thu.md`.
- «chạy lại lần hai không đổi số» ← AC-5, AC-9.
- «nhóm 5–9 căn chỉ có số, không nhãn; nhóm dưới 5 không chấm» ← AC-1, AC-9.
- «tin S03 và S06 chung nhóm, mỗi căn một phiếu» ← AC-2.
- «tin thuê có hạng theo giá thuê/m²» (và theo giá tháng cùng PN khi thiếu m², QĐ4) ← AC-4.

## Out of scope

- Áp 104 lên DB máy thu hay cloud, chạy bước chấm thật trên DB dùng chung — lời riêng của Mạnh sau gộp.
- Nhãn «giá tốt» cấp dự án (CG10), cấp toà và lọc tầng (CG11), tin thuê trên màn Ops và màn chọn vị trí (CG3).
- `sellers.flags.median_gap_pct` (view 060, thước cả phường) — hàng riêng.
- Rào trước khi lên Invest (mẫu gọi thử, giấu căn rẻ quá 35%) — QĐ3: chưa dựng.
- Đẩy data-api ra repo công khai (`sync-public` do Mạnh gọi).

## Notes

- Bước chấm đêm là bước `xep-hang-gia` riêng trong ba job đêm, sau bước định vị (AC-11); DB chưa áp 104 thì in một dòng «chưa áp 104», không lỗi.
