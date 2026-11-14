---
schema_version: 1
feature: Mỗi mã dự án S06 có từ 10 tin căn hộ đang rao thành bí danh của đúng một nút dự án — nút có sẵn hoặc nút ứng viên máy đúc hàng loạt từ mã — qua một thẻ luật theo nguồn mà Mạnh xem mẫu trước khi áp, nên tin S06 đọc được dự án của mình qua bí danh
slug: ma-du-an-s06-thanh-nut
owner: phanlemanh@gmail.com
risk_tier: T3      # hàng khai T3; chạm db/migrations và tạo nút danh bạ
surfaces: [cli]      # lệnh pipeline + migration; từ vựng kit không có db
status: implemented
approved_by: Mạnh
approved_at: 2026-11-14
design_doc: docs/superpowers/specs/2026-11-14-ma-du-an-s06-thanh-nut-design.md
---

# Acceptance Contract: ma-du-an-s06-thanh-nut

## Context

Hàng DA32 (T3, mốc MN1, đường găng nhịp 1), lát mỏng của DA3 theo QĐ5 14/11 (ROADMAP §3 mục 48) và Hỏi-1 mục 44 (nút ứng viên
đúc hàng loạt chỉ dùng được sau thẻ luật theo nguồn mà Mạnh xem mẫu). Một lệnh `pipeline/noi-du-an-s06.mjs` dựng thẻ luật, áp thẻ
theo băm, đảo thẻ; migration 100 mở `registry_aliases` cho nút dự án (`node:<id>`), thêm `asset_nodes.catalog_tier`, bảng
`project_links` + `project_link_rules` và view `s06_offer_project`.

Phạm vi theo chữ của `bat_khi`: mã có từ 10 tin căn hộ đang rao — đo 14/11 **344 mã, 11.941 tin**. Lời hàng ghi 268 mã / 11.045 tin
là định nghĩa nhóm giá (mã có nhóm bán hoặc thuê từ 10 tin có giá/m²); theo chữ `bat_khi` có thêm 76 mã ít tin có giá, và nút
đúc ra không xoá được (rào chỉ-thêm — đảo luật chỉ gỡ bí danh). Trong 344 mã có 5 mã tên rỗng (623 tin, gồm mã giả `1` rải 5
tỉnh) không đúc được, nên số mã nối được hôm nay là 339 (17 vào nút có sẵn, 322 nút ứng viên), 11.318 tin.

## Acceptance Criteria

- **AC-1** Given DB thử chép DB máy thu, When áp `db/migrations/100_ma_du_an_s06_nut.sql` hai lần, Then lần hai không lỗi và lược
  đồ không đổi; `asset_nodes.catalog_tier` NOT NULL và 20 nút có sẵn mang `xac_minh`; `registry_aliases` nhận `object_key
  'node:<id>'` và vẫn từ chối `'node:abc'`; `project_links` từ chối dòng `noi` không nút và dòng `chua_noi` không lý do; bảng
  `registry_aliases` vẫn từ chối DELETE (rào chỉ-thêm giữ nguyên).
- **AC-2** Given ma trận lớp mã viết trước (tên rỗng · tên «Đang cập nhật» · hai tỉnh · chạm đúng một nút cùng tỉnh · chạm hai nút
  cùng tỉnh · tên chứa bí danh của nút KHÁC tỉnh như «Sunrise Riverside» với «riverside» Hà Nội · bí danh dưới 8 ký tự · tên chứa
  bí danh của nút ứng viên `mot_loi_khai` do lần áp trước đúc · còn lại · còn lại điểm tản), When hàm thuần `phanLop` xếp, Then mỗi ô ra đúng một kết cục viết trước (`chua_noi`+lý do, `noi` nút có sẵn,
  `duc`), số assert bằng số ô; và ca «chạm một nút» chạy lại trên dòng thật mà câu SQL đọc mã của lệnh trả về từ DB thử (không viết tay khuôn).
- **AC-3** Given DB thử fixture, When `noi-du-an-s06.mjs --the <tệp>`, Then tệp có tổng theo lớp bằng phép đếm SQL độc lập, bảng mẫu
  đủ năm tầng (10 lớn nhất · 10 giữa · 5 sát ngưỡng · mọi mã nối nút có sẵn · mọi mã từ chối) chỉ mang tên dự án, tỉnh, xã, số tin
  (không mã nguồn), dòng `băm:` là sha256 của danh sách kết cục chuẩn hoá (mã → kết cục, sắp theo mã) — đổi kết cục một mã thì băm
  đổi; và số dòng của `asset_nodes`, `registry_aliases`, `project_links`, `project_link_rules` không đổi.
- **AC-4** Given thẻ đã dựng, When `--ap --bam <băm đúng>`, Then trong MỘT giao dịch: đúng một dòng `project_link_rules` mang băm, mỗi
  mã lớp `duc` có đúng một nút ứng viên `catalog_tier='mot_loi_khai'` với `area_ids` ≥ 1 phần tử là xã có nhiều tin nhất của mã, mỗi
  mã nối có đúng một bí danh `node:<id>`/`S06`/`ma_nguon`/`du_an/<mã>`, mọi mã ≥10 tin có một dòng `project_links` và dòng của mã
  nối mang `rule_id` của luật; slug và `meta` của nút ứng viên không chứa mã nguồn. Mã có đúng 9 tin không có bí danh, không có
  nút, không có dòng `project_links` (dưới ngưỡng không xảy ra gì).
  Và `--ap --bam <băm sai>` (hoặc dữ liệu đổi sau khi dựng thẻ) → thoát khác 0, thông điệp `bam-lech`, 0 dòng đổi ở bốn bảng.
- **AC-5** Given sau khi áp trên DB thử fixture, When ba câu SQL kiểm bất biến chạy, Then 0 mã có hai bí danh còn hiệu lực trỏ hai nút;
  0 cặp mã–nút mà tỉnh của xã nhiều tin nhất khác tỉnh của nút; 0 mã ≥10 tin thiếu dòng `project_links` và mã dưới 10 tin không có dòng nào (dưới ngưỡng không xảy ra gì); và mỗi câu đỏ đúng tên
  khi fixture bị phá (chèn bí danh thứ hai, đổi tỉnh nút, xoá một dòng trạng thái).
- **AC-6** Given đã áp một lần, When chạy `--ap` lần hai với băm của thẻ dựng lại, Then 0 bí danh thêm hay đổi, 0 nút mới, 0 dòng
  luật mới (thông điệp «đã áp, không đổi»).
- **AC-7** Given luật đã áp, When `--dao <rule_id>`, Then trong một giao dịch mọi bí danh của luật (đọc qua `project_links.rule_id`) có `retired_at`, mọi dòng
  `project_links` của luật về `chua_noi` lý do `dao-luat`, dòng luật có `dao_at`/`dao_by`, nút ứng viên còn nguyên; và áp lại sau
  đảo tạo bí danh mới trỏ ĐÚNG nút cũ (không đúc nút thứ hai cho cùng mã).
- **AC-8** (cross-layer) Given sau khi áp, When đếm tin S06 căn hộ đang rao đọc được dự án qua view `s06_offer_project`, Then số
  bằng phép đếm SQL độc lập viết thẳng từ `sale_offer_records` ⨝ `stg_chotot_ads` ⨝ `registry_aliases` (không qua view), và mỗi tin
  ra đúng một nút.
- **AC-10** (cross-layer) Given sau khi áp trên DB thử fixture có một tin S03 và một tên nhóm mang đúng tên một nút ứng viên, When
  bộ dự án trên tin S03 (`pipeline/lib/du-an-tren-tin-s03.mjs`) và bộ phân giải ngữ cảnh của agent
  (`agent/src/agents/context-resolver.ts`) khớp tên, Then cả hai không trả nút `mot_loi_khai`; và đối chứng dương cùng fixture: tên
  của một nút `xac_minh` vẫn khớp đúng nút ấy.
- **AC-9** Given DB thử chép DB máy thu, When dựng thẻ, áp, kiểm AC-5 và AC-8 trên dữ liệu thật, Then tổng của thẻ khớp phép đếm độc
  lập (mã ≥10 tin, tin của chúng, từng lớp), bất biến AC-5 đều 0, và tệp thẻ cùng băm nằm trong bằng chứng để Mạnh xem mẫu ở Cổng
  Bằng chứng.

## Coverage

Quét theo preset test-matrix (skill morphological-scan) — chi tiết ở design doc §4:
- Trục A — lớp mã: rỗng · lệch tỉnh · chạm 1 nút cùng tỉnh · chạm ≥2 nút · chạm nút khác tỉnh · bí danh ngắn · còn lại · điểm tản (AC-2).
  [CE: phép đo 14/11 trên toàn bộ 344 mã — đủ]
- Trục B — vòng đời luật: dựng · áp băm khớp · áp băm lệch · chạy lại · đảo · áp lại sau đảo (AC-3, AC-4, AC-6, AC-7). [CE: mục 44
  Hỏi-1 + thẻ luật thiết kế DA3 §2 — đủ]
- Trục C — bất biến: một mã một nút · không lệch tỉnh · trạng thái đủ · tier thấp nhất + có xã · chạy lại không đổi · đếm tin khớp
  (AC-4–AC-8). [CE: `bat_khi` của hàng DA32 — đủ]
- Trục D — tầng: migration (AC-1) · hàm thuần (AC-2) · lệnh trên DB thử fixture (AC-3–AC-8) · bên đọc khớp tên (AC-10) · dữ liệu
  thật chép (AC-9).
- Trục E — nút ứng viên đi tới đâu: hai bộ khớp tên khác nguồn (AC-10) · sync cloud và bốn bên đọc còn lại thấy như nút thường
  (Hỏi-3) · mã nguồn chỉ ở hai bảng không sync (AC-4). [CE: grep bên đọc `asset_nodes` 14/11 — đủ]

## Đường đo

Ngưỡng của `opportunity.md` (chép từ `bat_khi`):
- «mọi mã ≥10 tin có trạng thái; 0 mã nối hai nút; 0 cặp lệch tỉnh» — ba câu kiểm của AC-5, chạy trên dữ liệu thật ở AC-9.
- «nút ứng viên catalog_tier thấp nhất, có area_ids» — AC-4.
- «thẻ luật có nhật ký, mẫu ghi băm, đảo được cả loạt» — AC-3, AC-4, AC-7.
- «chạy lại lần hai không đổi bí danh» — AC-6.
- «số tin đọc được dự án qua bí danh khớp phép đếm độc lập» — AC-8, AC-9.

## Out of scope

- Mã dưới 10 tin (906 mã, 2.697 tin, đo 14/11) — cùng lệnh, hạ ngưỡng ở hàng sau.
- Phân khu thật cho mã dạng «<con> – <cha>» (K5) và thẻ từng cặp trên `/ops/review` — DA3 lát đầy đủ.
- Ghi dự án lên tin (`project_node_id` trên tin) — DS2, đọc view `s06_offer_project`.
- Nguồn S08, S07, S11 và khuôn chung bản ghi nguồn — DA3 lát đầy đủ.
- Áp thẻ luật lên DB máy thu — lời riêng của Mạnh sau gộp («Áp thẻ luật S06 <băm>»).
- Sync bảng mới lên cloud.

## Notes

- Số trong lời hàng (268 mã / 11.045 tin) là định nghĩa nhóm giá; hợp đồng theo chữ `bat_khi` (344 mã / 11.941 tin, 14/11).
