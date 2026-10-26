---
schema_version: 1
feature: Người vận hành mở /ops/data-flow ở máy thu và thấy dòng chảy bài → tin → căn, chất lượng từng chặng và bậc nghiêm của từng tin; cột «bài thô» S03 không lẫn bài S05 và bài thử
slug: ops-dong-chay-df0
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: implemented
design_doc: docs/superpowers/specs/2026-10-26-ops-dong-chay-du-lieu-ia-design.md
approved_by: Mạnh
approved_at: 2026-10-26T11:18:05Z
---

# Acceptance Contract: ops-dong-chay-df0

## Context

Hồ sơ cho hai commit đã dựng ở nhánh `feat/ops-data-flow`: `c9794e3d` (proto trang Ops «Dòng chảy dữ liệu»
`/ops/data-flow` — đường ống chuyển thể `@reui/chart-49`, chất lượng từng chặng, chặng theo ngày, loại giao dịch, tin mới
nhất + sheet hồ sơ tin chuyển thể `@reui/solution-analytics-3`) và `8a54fcdc` (DF0 — bậc nghiêm theo năm trường lõi ở
`app/src/lib/data-level.ts`; `S03_POSTS_SQL` của `pipeline/lib/ops-flow.mjs` + bản chép ở
`app/src/lib/collections-queries.ts` loại bài tác tử S05, tác tử thử, nhóm TEST). Mạnh giao trực tiếp ở phiên
local_c87bc280 và duyệt 5 khuyến nghị §5 của design doc ngày 26/10; giám sát xếp hàng vào dãy U2. Ở Cổng Phạm vi
lần một Mạnh sửa: thêm ảnh tin vào vòng này (AC-10), dùng lại bộ ghép ảnh và dải ảnh của Hàng duyệt, chỉ admin, chỉ máy thu.

Căn cứ: `opportunity.md` (Cổng Đáng = build) · design doc §0–§5 + Phụ lục (Đặc tả UX) · `docs/product/FRAMING.md` §3.4
(FR-§3.4 thang bậc) · `docs/architecture/classification-enrich-review.md` §0.2 B (RV-T1…T8) · ADR-0014 (số Ops trên
cloud do máy thu đẩy) · `.acceptance-runs/dieu-phoi-dot0-cam-mau/LUAT.md` mục «Dòng chảy dữ liệu /ops/data-flow».

Source input: docs/superpowers/specs/2026-10-26-ops-dong-chay-du-lieu-ia-design.md#3.4 (DF0) + proto

## Criteria

- AC-1: Given số chặng của một hay nhiều nguồn (bài nhận · đọc được · tin rao mới · gắn căn), When dựng đường ống (`buildFlow`), Then mỗi nút giữa bằng tổng các nhánh ra của nó — bài nhận = đọc được + «Không đọc được», đọc được = tin rao mới + «Gộp vào tin đã có», tin rao mới = «Gắn căn» + «Chưa gắn căn» — mỗi nguồn chảy vào «Bài nhận» đúng số bài của nó; nút số 0 bị bỏ cùng mọi cạnh tới nó; chú thích cột «Gắn căn» là tỉ lệ gắn căn trên tin rao mới, tô đỏ khi dưới 80%, và đứng trên «Chưa gắn căn» khi không tin nào gắn căn.
- AC-2: Given lược đồ tạm có bài S03 thật, bài thử (snapshot thử, tác tử thử, nhóm TEST), bài S05, tin S03/S05 nối bài qua `post_ids`, quảng cáo và tin S06, tin gắn căn và listing S01, When tính dòng chảy (`getDataFlow`) cho «Toàn kho» và «7 ngày», Then mỗi nguồn ra đúng số bài nhận (đã gạt bài thử), số bài thử đã gạt, đọc được (bài nằm trong `post_ids` của tin cùng nguồn), tin rao mới, đủ trường lõi, có phường, gắn căn — bằng đáp án viết trước; «đọc được» của S06 bằng min(tin, bài nhận) và mang dấu ước lượng; bài/tin ngoài khoảng 7 ngày không vào tổng 7 ngày.
- AC-3: Given một tin với năm trường lõi (loại tin, loại hình, giá, diện tích, phường) và cờ gắn căn, When tính bậc (`levelOf`), Then B1 chỉ khi đủ năm trường, B2 khi B1 và đã gắn căn, còn lại B0 (kể cả tin đã gắn căn mà thiếu trường); và trên cùng một tập tin của lược đồ tạm, số «đủ trường lõi» do câu SQL của dòng chảy đếm bằng số tin mà `levelOf` xếp B1 hoặc B2.
- AC-4: Given bài trong bảng nạp đi chung ống snapshot `zalo-agent` gồm bài S03 thật, bài tác tử S05, bài nhóm TEST và bài tác tử thử, When đếm cột «bài thô» S03 theo ngày đăng ở bên ghi bản tin (`luong7` của `pipeline/lib/ops-flow.mjs`) và ở trang Thu thập máy thu (`getFlowDays`), Then cả hai chỉ đếm bài S03 thật, ra cùng số mỗi ngày, và một bản đếm lọc như cũ (chỉ theo snapshot) bị phép đo bắt với ngày và hai số lệch. (cross-layer)
- AC-5: Given một hàng nguồn hay nhóm thu với số bài nhận, đọc được, tin rao, đủ trường lõi, có phường, gắn căn và mốc bài mới nhất, When chấm nút thắt, Then nhãn theo luật đã khai: «Kẹt · <chặng>» khi đọc được < 30% hoặc đủ trường lõi / có phường / gắn căn < 50% (chặng đầu tiên chạm ngưỡng theo thứ tự đọc → trường lõi → phường → gắn căn); không kẹt mà im quá 48 giờ → «Im N ngày»; dưới 60% / 80% → «Theo dõi · <chặng>»; còn lại «Khoẻ»; ô không áp dụng (nhóm thu, listing S01) không tham gia luật.
- AC-6: Given danh sách tin mới nhất (tối đa 150 tin mỗi nguồn), When người vận hành lọc bảng theo Nguồn · Loại tin · Loại hình · Thị trường · Bậc và bấm một tin (nút tiêu đề hay ô khác của hàng), Then bảng chỉ còn đúng các tin khớp mọi điều kiện (là / không phải), mỗi hàng hiện badge bậc và «x/5 trường lõi»; sheet hồ sơ tin mở và ở lại tới khi người đóng, hiện badge bậc, «Trường lõi x/5» với từng trường có/thiếu, đúng câu điều kiện lên bậc kế (B0 → liệt trường thiếu, B1 → gắn căn, B2 → số đo trên nhãn), bài gốc của tin S03/S05 và câu «S06 chưa lưu khoá nối ngược tin → bài (TV10)» cho tin S06.
- AC-7: Given máy thu có DB local thật và dev server của worktree dãy U2, When người vận hành (tài khoản thử admin) mở `/ops/data-flow` ở 1280 px sáng, tối và 390 px, chọn nguồn S03 trên đường ống và mở hồ sơ một tin S03, Then thấy năm vùng theo thứ tự Đường ống → Chất lượng từng chặng → Chặng theo ngày + Loại giao dịch → Tin mới nhất, đường ống S03 cho «Gắn căn 0,0%» tô đỏ, lưới hiện S03 «Kẹt · đọc» và cột «Đủ trường lõi» 0%, hồ sơ tin S03 ở B0 với trường thiếu; ở 390 px trang không cuộn ngang.
- AC-8: Given vùng dữ liệu của trang, When khoảng không có bài / bộ lọc ra 0 tin / đang tải / truy vấn lỗi / chạy trên máy chủ không có bảng nạp thô, Then lần lượt: đường ống hiện Empty «Chưa có bài trong khoảng này» với đúng một hành động «Xem tất cả nguồn»; bảng tin hiện «Không có tin nào khớp bộ lọc»; Skeleton theo bố cục trang; RegionError «Không tải được dòng chảy dữ liệu» kèm «Thử lại»; LocalOnlyAlert «Chỉ xem ở máy thu» thay cho trang, không truy vấn bảng nạp thô.
- AC-9: Given các tệp của vòng, When chạy kiểm máy, Then `tsc` sạch, lint 0 lỗi; route `/ops/data-flow` có slug `data-flow` trong `CONTEXT.md`, dòng trong `routes.md`, mục «Dòng chảy dữ liệu» nhóm Giám sát trong nav; quét chữ hiển thị Ops (ON12) phủ mọi tệp data-flow và 0 chữ tiếng Anh / từ `_Avoid_`; lint từ vựng 0 enum viết tay; kiểm cổng tĩnh (luật 5/6/9) xanh.
- AC-10: Given tin S03/S05 mà bài gốc có ảnh (đã tải về máy thu, hoặc chỉ còn đường dẫn ở máy chủ ảnh của nguồn) và tin S06, When người vận hành mở hồ sơ tin, Then với tài khoản admin hồ sơ có dải ảnh của đúng tin đó — ảnh ghép từ các bài trong `post_ids` qua cùng bộ ghép ảnh của Hàng duyệt (`buildOfferImages`: ảnh đã tải trước, rồi đường dẫn gốc, không trùng, tối đa 12), ảnh không tải được hiện «Ảnh hỏng», bấm ảnh mở hộp phóng to — tin có bài mà không ảnh nào ghi «không có ảnh»; tin S06 ghi rõ chưa gắn được ảnh vì S06 chưa lưu khoá nối ngược tin → quảng cáo (TV10); tài khoản không phải admin không thấy dải ảnh và dữ liệu ảnh không được gửi xuống trình duyệt; bảng «Tin mới nhất» không tải ảnh; trên máy chủ không có đường ảnh nào. (cross-layer)

## Coverage

Bỏ quét `morphological-scan` — phạm vi đã chốt bởi design doc §5 Mạnh duyệt và hai commit đã dựng (xem dòng `descope`
«bỏ coverage-scan» trong `decisions.jsonl`). Trục đọc từ design doc + mã, để người duyệt soi:

- Trục A — Nguồn: S03 · S05 · S06 · S01 (listing ngắn hạn) [thước CE: DB local 26/10 — S03 269 tin, S05 28, S06 18.472, S01 611]
- Trục B — Chặng: bài nhận · đọc được · tin rao mới · gắn căn · nhánh rơi (không đọc được · gộp · chưa gắn) [thước CE: `buildFlow`]
- Trục C — Bậc: B0 · B1 · B2 (B3+ chưa có số đo) [thước CE: FRAMING §3.4]
- Trục D — Bề mặt × môi trường: máy thu 1280 sáng/tối · máy thu 390 · máy chủ [thước CE: `localOnlyTable`]
- Trục E — Khoảng: 7 ngày · 30 ngày · Toàn kho [thước CE: `parseFlowWindow`]
- Trục F — Ảnh tin × quyền: ảnh đã tải · chỉ đường dẫn gốc · không ảnh · S06 chưa nối × admin · không admin [thước CE: DB local 26/10 — 4.290/9.310 bài S03 có ảnh, 7 bài đã tải; `isAdmin`]

Core → AC-1…AC-10 (A×B qua AC-1/2; C qua AC-3/6; «bài thô» qua AC-4; nút thắt qua AC-5; D qua AC-7/8; E qua AC-2; ảnh tin theo nguồn × quyền qua AC-10).
Later: DF1–DF5 (một định nghĩa số ở pipeline/sql + bản tin cloud, thẻ điểm tin + ảnh, bảng chặn bậc, lăng kính T1–T8,
dọn IA Thu thập ↔ Dòng chảy) — cắt vào lộ trình ở PR riêng.
Never: ghi hay sửa dữ liệu từ trang (quan sát ≠ quản trị) · kéo thả đổi bậc · hiện độ tự tin.

## Đường đo

Ô Cổng Đáng không khai ngưỡng UAT → không có thước nghiệm thu; bỏ bằng dòng `descope` «bỏ đường-đo — …».

## Out of scope

- DF1–DF5 của design doc §3.4 (cắt lộ trình ở PR riêng, theo xếp của giám sát).
- Lỗi gộp trùng quá tay của `transform-zalo.mjs` (khoá `offer_id` thiếu phường/diện tích) — thẻ đề xuất riêng, chưa làm.
- Số dòng chảy trên máy chủ (cloud chỉ hiện LocalOnlyAlert tới khi DF1 đẩy khối bản tin) và nội dung/ảnh tin trên máy chủ (TV9).
- Thẻ điểm tin đầy đủ (độ chắc H0–H5, lượng bằng chứng, cờ phi lý) — DF2; ảnh tin S06 (cần khoá nối của TV10) và ảnh trên máy chủ (TV9).

## Notes

- **Ảnh hưởng prod sau merge** (giám sát yêu cầu ghi trên thẻ): khối `luong7` của `push-ops-facts` đổi định nghĩa «bài
  thô» S03 → cột «S03 — bài thô» trên Ops prod ngày 21/10 từ 182 xuống 82 (bỏ 100 bài S05); ngày 20/10 và 22/10 bớt mỗi
  ngày 1 bài nhóm TEST. Số chỉ đổi khi máy thu chạy code mới sau merge. Đây là sửa đúng, không phải mất dữ liệu.
- Số trang tính lúc tải (không precompute ở `pipeline/sql` — luật 10): chấp nhận cho proto, DF1 chuyển.
- Chặng «Đọc được» của S06 là ước lượng (S06 chưa có khoá nối ngược bài → tin, TV10).
- Ngưỡng nút thắt là ngưỡng tạm Mạnh duyệt dùng tới khi PL9 có số đo (design doc §5 câu 4).
