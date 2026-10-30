---
schema_version: 1
feature: Mỗi căn và mỗi tin chưa gắn căn có bậc dữ liệu B0–B5 tính bằng một hàm, phân bố bậc theo thị trường × loại hình được chụp mỗi ngày và in ra được, và một kiểm chất lượng giữ bất biến «mọi đề xuất enrich đã áp có phát biểu tương ứng»
slug: de-xuat-thanh-phat-bieu-bac
owner: phanlemanh@gmail.com
risk_tier: T3      # db/migrations/** (t3_paths) — migration 056
surfaces: [cli, ui]
status: verified
design_doc: docs/superpowers/specs/2026-10-30-de-xuat-thanh-phat-bieu-bac-design.md
approved_by: Mạnh
approved_at: 2026-10-30
---

# Acceptance Contract: de-xuat-thanh-phat-bieu-bac

## Context

Hàng PL16 (mã review C2.3, thang bậc FRAMING §3.4), đứng trên PL15 (bảng phát biểu + phân xử, migration 045). Đo ngày
30/10 trên DB máy thu: `enrichment_proposals` rỗng từ 26/10, 0 quyết định người về trường, 25.863 căn đều ở B2, 918 tin
chưa gắn căn (913 thiếu trường lõi). Từ 045 mọi lần áp đề xuất đã tự ghi phát biểu, nên phần «đề xuất cũ» còn lại là giữ
bất biến bằng một phép kiểm; phần chính là bậc theo căn và phân bố theo phân khúc — north star của FRAMING §5.

Căn cứ: RV-C2.3 · FR-§3.4 · FR-§5 · design PL15 §2 (dòng 66–72).

## Criteria

- AC-1: Given ma trận đủ 2⁵ tổ hợp có/thiếu của năm trường lõi (loại tin, loại hình khác `unknown`, giá > 0, diện tích > 0,
  phường) × gắn/chưa gắn căn, cộng các ô biên viết trước (giá 0, diện tích 0, loại hình `unknown`, loại hình rỗng, loại tin
  rỗng) × gắn/chưa gắn, When gọi hàm SQL `offer_data_level` và hàm `levelOf` của app trên cùng từng ô, Then hai bên trả cùng
  bậc ở mọi ô (B0 khi thiếu một trường, B1 khi đủ và chưa gắn, B2 khi đủ và đã gắn).
- AC-2: Given một căn có ít nhất một tin gắn đủ năm trường lõi, một căn chỉ có tin gắn thiếu trường lõi, và một tin chưa
  gắn căn đủ trường lõi, When gọi `property_data_level` và `offer_data_level`, Then căn thứ nhất là B2, căn thứ hai là B0
  với chỗ kẹt `truong-loi`, tin lẻ là B1 với chỗ kẹt `gan-can`; không căn nào nhận B1.
- AC-3: Given căn B2 có tin đại diện mà nguồn gốc của cả năm trường lõi ghi `measured = true`, và căn B2 có đúng một trường
  lõi thiếu `measured = true`, When gọi `property_data_level`, Then căn thứ nhất là B3, căn thứ hai là B2 với chỗ kẹt `so-do`.
- AC-4: Given căn B3 có `verification = 'verified'` và mọi trường lõi của tin đại diện ở lớp `fact`, căn B3 có `verification
  = 'pending'`, và căn B3 đã xác minh nhưng có một trường lõi lớp `observed`, When gọi `property_data_level`, Then căn thứ
  nhất là B4 với chỗ kẹt `hieu-luc` (B5 cần trạng thái lời chào của PL19), hai căn sau là B3 với chỗ kẹt `xac-minh`; không
  đơn vị nào nhận B5.
- AC-5: Given bản chép DB máy thu, When chạy `node pipeline/bac-du-lieu.mjs --write` hai lần trong cùng một ngày, Then
  `data_level_snapshot` của ngày ấy có tổng `n` bằng số căn cộng số tin S03/S05/S06 còn sống chưa gắn căn; số theo từng
  phân khúc khớp một câu đếm độc lập (thị trường = cha `region_type = market` của phường; loại hình của căn lấy từ
  `properties.property_type`, của tin lẻ từ tin); đơn vị không có phường nằm ở `market_id = 'chua-ro'` (giá trị chữ trong
  khoá chính, không NULL); lần hai cho cùng tập dòng và cùng số; dòng của ngày khác không đổi.
- AC-6: Given ảnh chụp phân bố đã ghi, When chạy `node pipeline/bac-du-lieu.mjs` không cờ, Then lệnh thoát 0 và in một bảng
  mỗi dòng một phân khúc (tên thị trường, nhãn loại hình tiếng Việt), sáu cột B0–B5 mang nhãn bậc lấy từ trục `data_level`,
  và một dòng tổng bằng tổng `n` của ngày.
- AC-7: Given bốn đề xuất `applied` — (a) có phát biểu sống mang `proposal_id` của nó, (b) không mang `proposal_id` nhưng có
  phát biểu sống cùng chủ thể · trường · giá trị · phương pháp (không phải `legacy`), (c) chỉ có phát biểu `legacy` cùng giá
  trị, (d) không có phát biểu nào — When chạy `bac-du-lieu.mjs --write`, Then dòng kiểm `enrich:proposal-assertion` trạng
  thái `fail` với chi tiết `applied=4 missing=2` (c và d thiếu); bỏ c và d thì `pass` với `missing=0`; bảng rỗng (như máy
  thu) thì `pass` với `applied=0 missing=0`; trong mọi ca lệnh thoát 0 — chỉ lỗi chạy (DB không tới được, SQL hỏng) mới làm
  lệnh thoát khác 0.
- AC-8: Given hai dòng kiểm mới `enrich:proposal-assertion` và `data-level:distribution` ở `dq_check_results`, When bảng
  «Kiểm chất lượng» trên `/ops/quality` đọc chúng qua `dq-labels.ts` (ca ON12-AC-5 trên DB local), Then tên kiểm, đối tượng
  và chi tiết đều có nhãn tiếng Việt, không dòng nào hiện «chưa diễn giải».
- AC-9: Given cây sau vòng, When chạy `scripts/cloud-sync.sh` trong hộp thử job-exit và áp migration 056, Then bước
  `job_run cloud-sync bac-du-lieu` là bước cuối, sau `push-ops-facts`, và hỏng thì mã thoát của job khác 0 với dòng
  `JOB FAIL [cloud-sync] bước bac-du-lieu`, còn dòng kiểm `fail` không làm job thoát khác 0 (Hỏi-3); migration 056 chạy hai
  lần không lỗi và không nhân dòng ở `data_level_snapshot`, `ref_lookup`, `ref_field_lookup`; trục
  `data_level` khai cột `data_level_snapshot.data_level` trong `pipeline/mappings.yaml`; `CONTEXT.md` có thuật ngữ «Phân bố
  bậc»; bộ test pipeline, test app, typecheck và lint đều thoát 0.

## Coverage

Quét không gian (preset test-matrix) trên ba trục, thước CE ghi cạnh mỗi trục:
- Đơn vị × bậc: {tin lẻ, căn} × {B0 … B5} — AC-1 (tin B0–B2), AC-2 (căn B0/B2, tin lẻ B1, căn không B1), AC-3 (B3),
  AC-4 (B4, B5 không đạt). [thước CE: bảng FRAMING §3.4 sáu bậc, cột «Căn ở bậc này khi»]
- Đường ra của số: hàm → ảnh chụp ngày → bảng in → kiểm chất lượng → nhịp chạy — AC-5, AC-6, AC-7, AC-8, AC-9.
  [thước CE: thành phần 1–5 của design §3]
- Bất biến đề xuất → phát biểu: {áp có phát biểu, áp thiếu phát biểu, bảng rỗng} — AC-7. [thước CE: trạng thái
  `applied` của 033 và luật khớp phát biểu của `revert_enrichment` 045]

Ô bị cắt có lý do ở Out of scope. Bất biến chỉ xét `applied`: `reverted` đã rút phát biểu khi hoàn tác (045), còn
`rejected`, `superseded`, `skipped`, `queued` không có phát biểu dương; phát biểu `legacy` không bao giờ được tính là phát
biểu của một đề xuất.

## Out of scope

- Bộ chuyển đề xuất cũ sang phát biểu: bảng đề xuất rỗng từ 26/10 (Hỏi-1).
- Đưa phân bố bậc lên cloud hoặc một trang `/ops` (cần migration Supabase và leak gate).
- Bậc đích từng phân khúc và số north star «đạt bậc đích của phân khúc».
- Bậc năng lực N0–N4 của phân khúc.
- Nguồn gốc cho bốn trường lõi chưa có phát biểu (loại tin, giá, diện tích, phường): PL17; cổng số đo mở B3: PL21.
- Nhánh «khớp danh mục» của B4: DB1 (danh mục S08).
- Vị từ B5 (lời chào còn hiệu lực, lịch sử giá): PL19.
- Phát biểu phủ định cho quyết định «bác» của người và ca thẻ chờ chuyển sang tin kế (Ngoài-4 của enrich-hau-ky): PL23.
- Đổi định nghĩa «căn» theo ADR-0016 Đợt 1–2: hàm bậc đọc `properties` của hôm nay (Hỏi-2).

## Đường đo

- «Mọi đề xuất cũ có phát biểu tương ứng»: dòng kiểm `enrich:proposal-assertion` mỗi lượt cloud-sync, chi tiết đếm thiếu
  (AC-7, AC-9); máy thu hôm nay 0 đề xuất nên số phải là thiếu 0.
- «Phân bố bậc in ra được theo phân khúc»: `node pipeline/bac-du-lieu.mjs` in bảng ngày mới nhất (AC-5, AC-6); lịch sử theo
  ngày ở `data_level_snapshot`.

## Notes
