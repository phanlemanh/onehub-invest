---
schema_version: 1
feature: Số giảm của Căn giá tốt ở /ops/deals và ở API /v1/deals chỉ so tin với thước cùng phường × loại hình × bán/thuê; tin chưa rõ loại hình không có số giảm và ghi lý do
slug: can-gia-tot-cung-loai
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api, cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-12
design_doc: docs/superpowers/specs/2026-11-12-can-gia-tot-cung-loai-design.md
---

# Acceptance Contract: can-gia-tot-cung-loai

## Context

Ba đường hiện «số giảm» của Căn giá tốt (`/ops/deals` qua `bait_gap_pct`, `/api/v1/deals` của app, `/v1/deals` của data-api) so tin
với thước cả phường gộp mọi loại hình. Đo 12/11: trung vị số giảm của 9.618 tin căn hộ bán là 35,2% so với thước cả phường, 0,0% so với
thước cùng loại; nhà −12,9% ↔ −0,4%. Hàng CG8 dùng view có sẵn `v_ruler_p2` (phường × loại hình, bán, n ≥ 5) cho cả ba đường, không
migration. Bản phạm vi `docs/plan/pham-vi-can-gia-tot-vi-tri-0911.md` (Mạnh «Chốt theo đề xuất» Q1–Q5, 09/11).

## Criteria

- AC-1: Given DB thử có tin P1 bán của bốn loại (căn hộ, nhà, đất, thương mại) cùng một phường, mỗi loại một thước `v_ruler_p2`
  khác nhau, When chạy `refreshBaitGap`, Then `bait_gap_pct` của mỗi tin bằng `ROUND((1 − price_perm2 / m) × 100, 1)` với `m` là
  trung vị của đúng phường × loại của nó (một assert mỗi loại); bản đột biến dùng `v_ruler_p2_area` thì đỏ ở mọi ô, thông điệp
  nêu mã tin.
- AC-2: Given phường có thước cả phường và ma trận viết trước gồm tin P1 bán loại `unknown`, loại NULL, bốn tin P1 bán có loại (căn
  hộ, nhà, đất, thương mại) mà phường × loại không có dòng thước, và tin P1 thuê, When chạy `refreshBaitGap`, Then cả bảy có
  `bait_gap_pct` NULL (một assert mỗi ô, theo Hỏi-2: thiếu thước cùng loại thì không lùi về thước khác); log của bước in số tin
  không chấm theo hai lý do `chua-ro-loai` và `thieu-thuoc-cung-loai`, bằng số ô.
- AC-3 (cross-layer): Given DB thử sau AC-1, When đọc danh sách `/ops/deals` (`dealsSql`) và trang một căn (`dealSql`), Then trung
  vị giá/m² và số căn của thước in ra là của đúng dòng `v_ruler_p2` đã tính `bait_gap_pct`; không tin `unknown` nào trong danh
  sách.
- AC-4: Given trang một căn của tin chưa rõ loại và của tin thiếu thước cùng loại, When dựng lý do rời danh sách (`lyDoRoi`), Then
  lần lượt ra «Chưa rõ loại hình — không so được với thước cùng loại» và «Phường chưa đủ tin <loại> để dựng thước»; câu chứng minh
  của tin có số giảm nói «thước <loại> cùng phường» với nhãn loại tiếng Việt từ `LABELS_VI.property_type`.
- AC-5 (cross-layer): Given DB thử, When gọi `/api/v1/deals` của app bằng token ops, Then mỗi dòng có số giảm khớp tính lại từ
  `v_ruler_p2` cùng phường × loại (lệch ≤ 0,1 điểm), không dòng nào loại `unknown` hay tin thuê (fixture có tin thuê cùng phường có
  thước bán), và `meta.ruler` nêu «phường × loại hình».
- AC-6 (cross-layer): Given DB thử, When gọi `/v1/deals` của data-api, Then mỗi dòng có `propertyType` khác `unknown`, số giảm khớp
  tính lại từ `v_ruler_p2` cùng phường × loại (lệch ≤ 0,1 điểm), không dòng nào là tin thuê (fixture có tin thuê cùng phường có
  thước bán), và các trường cũ của phản hồi giữ nguyên tên và kiểu; `area`, `market`, `limit`, `min_discount` lọc như trước.
- AC-7 (cross-layer): Given DB thử chép từ DB máy thu, When chạy `refreshBaitGap` trong giao dịch rồi đếm bằng SQL viết riêng,
  Then: 0 tin P1 có `bait_gap_pct` lệch quá 0,1 điểm so với thước cùng phường × loại; 0 tin `unknown` hay thuê có số giảm; gọi hai API
  (app `/api/v1/deals`, data-api `/v1/deals`) với `limit` tối đa trên từng thị trường của bản chép: 0 dòng lệch quá 0,1 điểm, 0 dòng
  thuê hay `unknown` (in mẫu số mỗi API); trung vị số giảm của tin căn hộ có thước nằm trong ±10% (in kèm số cũ theo thước cả phường
  và mẫu số).
- AC-8: Given trang `/ops/deals/[offerId]` trên bản chạy trỏ DB thử `oneinvest_u1_cg8` đã chạy `refreshBaitGap` mới, When mở một căn hộ trong danh sách, một tin chưa rõ loại và một tin thiếu
  thước cùng loại, Then câu chứng minh và lý do hiện đúng chữ của AC-4, số giảm trên thẻ bằng `ROUND((1 − giá/m² ÷ trung vị in trên thẻ) × 100, 1)`,
  đọc được ở sáng và tối.
- AC-9: Given diff của hàng so với main, When quét, Then không tệp nào dưới `db/migrations/`, `pipeline/sync-cloud.mjs` không đổi,
  phản hồi data-api không thêm trường liên lạc người bán (`contact` giữ nguyên khối cũ), và không dòng thêm nào chứa tên nguồn thật.
- AC-10: Given DB cloud (đọc qua Management API, chỉ SELECT) và DB máy thu, When so định nghĩa `v_ruler_p2`, Then băm
  `pg_get_viewdef('v_ruler_p2')` hai phía bằng nhau và cloud có dòng thước cho cả bốn loại; lệch hay vắng thì thoát khác 0 nêu phía
  lệch.

## Coverage

- Trục loại hình × trạng thái thước: căn hộ, nhà, đất, thương mại × (có thước cùng loại · thiếu) · `unknown` · NULL — 10 ô (AC-1, AC-2).
  Thước: ma trận viết trước, mỗi ô một assert, có ca đột biến đỏ.
- Trục bán/thuê: bán chấm, thuê không chấm ở cả ba đường (AC-2, AC-5, AC-6, AC-7).
- Trục đường đọc: pipeline · Ops danh sách · Ops một căn · API app · API công khai (AC-1, AC-3, AC-5, AC-6). Thước: tính lại độc lập
  từ `v_ruler_p2`, không dùng mã của hàng.
- Trục dữ liệu thật: toàn bộ tin bán trên bản chép DB máy thu (AC-7). Thước: phép đếm SQL viết riêng, in mẫu số.
- Trục lời cho người: lý do và câu chứng minh (AC-4 hàm thuần, AC-8 trên màn).
- Trục ranh giới: không migration, không đổi sync cloud, không lộ thêm liên lạc (AC-9).
- Trục triển khai: thước trên cloud là đúng view của máy thu (AC-10).

## Đường đo

- «0 tin có số giảm tính từ thước khác loại hình hoặc khác bán/thuê ở cả hai đường»: `can-gia-cung-loai-db.sh do` · AC-7 (pipeline),
  AC-5 và AC-6 (hai API).
- «trung vị số giảm của tin căn hộ không còn lệch theo trung vị cả phường (09/11: −45,5%)»: `can-gia-cung-loai-db.sh do` in hai trung vị
  · AC-7.
- «tin chưa rõ loại có lý do "chưa rõ loại hình", không vào danh sách»: AC-2, AC-3, AC-4, AC-8.

## Out of scope

- `sellers.flags.median_gap_pct` (view 060) vẫn đọc thước cả phường — đổi cần migration; CG9 gánh.
- Nhóm sâu hơn phường (dự án, phân khu, toà, trục), nhóm theo số phòng ngủ, thước thuê — CG9, CG10, CG11.
- Mở lại `/api/v1/deals` của app cho người ngoài (hồ sơ `deals-api-tam-dong`).
- Đổi ngưỡng vào, ngưỡng cần xác minh, ngưỡng loại của danh sách.
- Đẩy bản data-api mới ra repo công khai và triển khai (`sync-public` do Mạnh gọi).

## Notes

- Lượt chạy thật của `refresh-bait-gap` trên DB máy thu là job đêm sẵn có; hàng không chạy tay trên DB dùng chung.
