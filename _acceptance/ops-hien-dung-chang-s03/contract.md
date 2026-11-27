---
schema_version: 1
feature: Ops hiện đúng chặng S03 — «Khớp toà» đọc bảng gắn toà; «Luồng 7 ngày» tab S03 tách tin rao mới và tin có bài hôm đó
slug: ops-hien-dung-chang-s03
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-27T18:16:29Z
design_doc: docs/superpowers/specs/2026-11-28-ops-hien-dung-chang-s03-design.md
---

# Acceptance Contract: ops-hien-dung-chang-s03

## Context

Hàng ON25, giám sát cắt từ điều tra chỉ đọc «tin vào kho S03 thấp» ngày 28/11 (`research-local/audit-s03-vao-kho-2811/BAO-CAO.md`
mục 1, 5, việc 5–6). Hai chỗ trên màn Ops làm số S03 trông thấp hơn thật: số mốc «Khớp toà» viết cứng 0 trong khi bảng gắn toà có
3.167 tin; chuỗi «tin rao vào kho» của «Luồng 7 ngày» chỉ đếm tin mới (187–366/ngày) trong khi mỗi ngày 713–1.013 tin có bài.

## Acceptance Criteria

- **AC-1** Given lược đồ tạm có bảng `offer_building` với tin S03 sống ở bốn ô (`gan/toa`, `gan/vung`, `xung_dot`, không dòng), một
  tin S03 đã nghỉ mang `gan/toa` và một tin S06 mang `gan/toa`, When lượt làm tươi thật chạy `600_data_flow.sql`, Then số mốc hôm
  nay `building_linked` đếm đúng các tin S03 sống `gan/toa` (một ô một assert), và đột biến đặt `toa_link` rỗng trở lại thì ca đỏ,
  thông điệp nêu `building_linked`.
- **AC-2** Given cùng ma trận, có tin ghi toà (`block_raw`) đã khớp toà và tin ghi toà chưa khớp, When làm tươi, Then
  `sources[S03].locatedPending` chỉ đếm tin ghi toà/trục chưa có dòng `gan/toa`; đột biến bỏ `NOT toa_khop` thì đỏ, thông điệp nêu
  `locatedPending`.
- **AC-3** Given máy thu sau khi gộp (bản chép dữ liệu thật hoặc lượt làm tươi kế tiếp), When đọc `data_flow_snapshot`, Then
  `building_linked` của ngày hôm nay bằng `count(*)` của `offer_building` `gan/toa` join `sale_offers` S03 (28/11: 3.167) và
  `locatedPending` «all» của S03 nhỏ hơn số trước sửa (28/11: 5.308 → 2.308), lệnh đo in hai số cạnh nhau; và `luong7()` trên cùng bản
  chép in bảy ngày «ngày · tin rao mới · tin có bài hôm đó» với mọi ngày tin rao mới ≤ tin có bài (28/11: 187–366 cạnh 713–1.013).
  Lệnh đo chạy trên DB của riêng lượt, không trên DB chung của máy thu.
- **AC-4** Given lược đồ tạm có tin S03 mới trong ngày, tin cũ đăng lại trong ngày, một tin nhiều bài cùng ngày, tin S05, tin đã
  nghỉ, bài S03 không thuộc tin nào và một ngày không bài, When `luong7()` chạy, Then mỗi ngày mang `s03ActiveOffers` = số tin S03 sống có ít nhất một bài đăng ngày đó
  (đếm phân biệt), ngày không bài mang khoá với giá trị 0, ma trận viết trước mỗi ô một assert, và mỗi ngày `s03Offers ≤ s03ActiveOffers`; đột biến đếm bài thay vì tin đỏ,
  thông điệp nêu `s03ActiveOffers`.
- **AC-5** Given cùng lược đồ, When `getFlowDays` (máy thu) và `luong7()` (bên ghi) cùng chạy, Then `s03ActiveOffers` của trang
  bằng `s03ActiveOffers` của khối từng ngày, và văn bản `S03_ACTIVE_OFFERS_SQL` của app trùng bản của `ops-flow.mjs` (cùng phép ghép
  cặp ON5-AC-4); bản app lệch một ký tự thì đỏ, thông điệp nêu tên câu.
- **AC-6** Given bản tin cloud có khối `luong7` mang khoá mới, và bản tin cũ thiếu khoá, When `getCloudFlowDays` dựng ngày, Then
  bản mới cho `s03ActiveOffers` đúng số, bản cũ cho `null` (không 0); đột biến `?? 0` đỏ.
- **AC-7** Given trang Thu thập render tab S03, When đọc chú giải và cột, Then có đúng ba nhãn «S03 — bài nhận», «S03 — tin rao
  mới», «S03 — tin có bài hôm đó» (vai nguồn theo `sourceLabel`), không còn «tin rao vào kho» hay «bài thô» làm nhãn cột, tab S03
  không chồng cột (không `stackId` chung), dòng mô tả không cộng bài với tin; tab Listing không đổi; ba nhãn có trong `CONTEXT.md`; bản tin cloud cũ (khoá mới vắng) thì tooltip in «—» cho «tin có bài hôm
  đó», không «0».
- **AC-8** Given dev server với dữ liệu lược đồ tạm (hoặc DB local) và tài khoản ops thử, When mở `/ops/collections` tab S03 và
  `/ops/data-flow`, Then ảnh chụp cho thấy ba cột cạnh nhau với ba nhãn, và đường «Khớp toà» có điểm khác 0 ngày hôm nay (`ui-check`).

## Out of scope

- «Gom cụm», «Gắn căn» của S03 (`gan_can_link`, `property_offers`): PL36 #571 chưa gộp, máy thu chưa có `offer_unit` (28/11); S03
  chưa có bộ dựng căn. Nối ở hàng riêng sau khi migration 131 + 138 áp trên máy thu.
- «Có hạng cấp toà» (`building_ranked`): đọc `offer_price_rank.cap = 'toa'`, máy thu 0 dòng cấp toà — bộ xếp hạng chưa xếp ở cấp
  toà; không đổi trong hàng này.
- Số của các ngày đã ghi trong `dq_check_results` (`s03-moc-ngay`): không ghi lại quá khứ; đường «Khớp toà» bắt đầu có số từ ngày gộp.
- Ghi cloud: không. Bằng chứng hình khối `luong7` mới trên cloud là lượt đẩy đầu tiên của máy thu sau khi gộp (vận hành thường).
- Nới luật đọc tin (việc 1–3 của báo cáo, +500–800 tin) và bài chỉ ảnh chưa ghép: hàng khác của làn transform.

## Coverage

- Trục trạng thái gắn toà của tin: `gan/toa` · `gan/vung` · `xung_dot` · không dòng [thước CE: ô của `offer_building.status × muc`
  đếm trên máy thu 28/11 — 3.167 · 1.522 · 37 · còn lại] — AC-1, AC-2.
- Trục tin: S03 sống · S03 đã nghỉ · S05 · S06 [CE: nguồn trong `sale_offers`] — AC-1, AC-4.
- Trục ghi toà của chữ tin: có `block_raw` · có `xx` trong mã căn · không ghi — AC-2.
- Trục tin theo ngày: tin mới trong ngày · tin cũ đăng lại · nhiều bài cùng ngày · tin đã nghỉ · bài không thuộc tin · ngày không
  bài · bài S05 [CE: bảng «Theo ngày» của báo
  cáo mục 2] — AC-4, AC-5.
- Trục khối cloud: có khoá mới · khuôn cũ thiếu khoá · khối vắng — AC-6.
- Trục mặt hiển thị: tab S03 · tab Listing · cloud (khối đủ · khối cũ) · máy thu — AC-7, AC-8.

## Đường đo

- «Khớp toà» 0 → số `offer_building gan/toa` S03 (28/11: 3.167) — lệnh đo của AC-3 trên máy thu.
- «Chờ khớp» S03 all 5.308 → 2.308 — cùng lệnh AC-3.
- «tin có bài hôm đó» 713–1.013/ngày cạnh «tin rao mới» 187–366/ngày — AC-3 (lệnh đo trên bản chép thật), AC-4 (định nghĩa),
  AC-8 (trên màn).
