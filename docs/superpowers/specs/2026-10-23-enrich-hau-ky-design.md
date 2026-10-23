# Hậu kỳ enrich-qua-de-xuat — đề xuất sống qua nạp lại · hoàn tác có audit · E1 không suy «đất» từ tên nhóm

Ngày: 2026-10-23 · Hạng T3 (db/migrations + ghi dữ liệu) · Hồ sơ `_acceptance/enrich-hau-ky/`
Nguồn: ba mục còn treo của vòng `enrich-qua-de-xuat` (PR #14, main 148c073) —
hợp đồng mục Ngoài hợp đồng (Ngoài-6, hai giá trị land sai, siết luật E1).

## 1. Vấn đề đo được

| # | Hiện trạng | Đo ở đâu |
|---|---|---|
| 1 | `transform-zalo.mjs` / `transform-fb.mjs` chạy `DELETE FROM sale_offers WHERE source = 'S03'/'S05'` rồi INSERT lại toàn bộ. `enrichment_proposals.offer_id` khoá ngoại `ON DELETE CASCADE` (033) → mỗi lần nạp lại xoá sạch đề xuất, kể cả đề xuất người đã duyệt/bác và thẻ đang chờ. Hàng `sale_offers` mới cũng mất mọi giá trị đã enrich (`property_type` về `unknown`/NULL, `street_raw`, `block_raw`, `bathrooms` về NULL). `property_offers`, `property_candidates` cùng bị cascade. | `pipeline/transform-zalo.mjs:200`, `pipeline/transform-fb.mjs:113`, `db/migrations/033_enrichment_proposals.sql:15` |
| 2 | Hai giá trị `property_type=land` sai đã áp ở DB local (đề xuất 639 `offer_feb6cd92901f426c` «Nhà Gò Vấp 4 tầng», 644 `offer_c5ac0386105f18ae` «CHDV 9PN 4 tầng», cả hai S05). Đề xuất LLM `house` (640, 645) nằm ở `superseded`. Migration 033 không có đường ghi ngược. | DB local 2026-10-23 |
| 3 | Luật E1 (`context-resolver.ts`) ghép `text + tên nhóm` rồi quét luật theo thứ tự; `/đất|nền|…/ → land` khớp chữ «ĐẤT» của tên nhóm «HỘI MUA BÁN NHÀ ĐẤT…». Ngược lại, tin «BÁN LÔ ĐẤT» trong nhóm «MUA BÁN CHUNG CƯ…» ra `apartment` vì luật chung cư đứng trước và khớp tên nhóm. | `agent/src/agents/context-resolver.ts:105-125`; tin thật `offer_76060ec556721a1b` |

Điểm mấu chốt cho mục 1: `offer_id` ĐÃ là định danh ổn định — băm nội dung
`kind|phường|giá|diện tích|phòng ngủ` (S03, `transform-zalo.mjs` bước 4; S05 cùng khuôn có tiền tố).
Nạp lại cùng dữ liệu cho cùng `offer_id`. Thứ phá định danh chỉ là câu DELETE toàn nguồn.

## 2. Thiết kế

### 2.1 Nạp lại không xoá (mục 1)

**Bước ghi canonical dùng chung** `pipeline/lib/write-offers.mjs` — `writeOffers(client, source, offers)`,
cả hai transform gọi nó; mọi thứ trong MỘT transaction:

1. UPSERT từng offer. `ON CONFLICT (offer_id) DO UPDATE` làm mới các cột NGUỒN (area_id, kind, giá,
   diện tích, phuong_raw, confidence, first_seen, last_seen, n_reposts, post_ids, price_tier, seller_*),
   `bedrooms = COALESCE(EXCLUDED.bedrooms, sale_offers.bedrooms)`; KHÔNG đụng các cột enrich
   (`property_type`, `street_raw`, `block_raw`, `bathrooms`). Hàng mới vẫn INSERT như cũ.
2. Gọi `reconcile_stale_offers(source, live_ids, actor)` (migration 037) cho các offer cùng nguồn
   không còn trong lượt này (offer «cũ»).

**`reconcile_stale_offers`** — với mỗi offer cũ X:

- **Offer kế** Y = offer sống cùng nguồn có chung `post_id` với X (chung nhiều post nhất; hoà → `offer_id`
  nhỏ nhất). Ca thật: tin sửa giá → băm đổi → `offer_id` mới chứa cùng post.
- Có Y → (theo khuyến nghị Hỏi-3) chuyển đề xuất của X sang Y giữ nguyên `status`, `decided_by`, `review_id`, `route`.
  Các post của X tách sang nhiều offer sống → chỉ offer chung nhiều post nhất nhận; offer còn lại duyệt lại như tin mới.
  Trùng khoá `(offer_id, field, value_key, source)` ở Y → giữ dòng «đã quyết» hơn
  (applied/rejected/reverted thắng queued/superseded/skipped; ngang hạng → giữ dòng của Y).
  Đề xuất `applied` đã chuyển → áp lại fill-gap lên Y qua cùng logic `apply_enrichment` (Y đã có giá
  trị → `skipped`, đúng như luật fill-gap). Thẻ chờ `enrich:X` → đổi `item_id` thành `enrich:Y` khi Y
  chưa có thẻ chờ; Y đã có → thẻ X thành `deferred`, đề xuất queued thành «lỏng» và lượt enrich-run sau
  gắn vào thẻ của Y (cơ chế «Để sau» sẵn có của 033/run.ts).
- Không có Y → xem §2.4 Hỏi-1. Theo khuyến nghị: ảnh chụp `ops_audit` `enrich:retire` gồm các dòng đề
  xuất (bỏ `evidence.text`) + các cột đã enrich của X (property_type, bedrooms, bathrooms, street_raw,
  block_raw — không cột người bán). Khôi phục: khi một lượt nạp sau sinh lại X (băm cũ quay về),
  `INSERT INTO enrichment_proposals SELECT * FROM jsonb_populate_recordset(NULL::enrichment_proposals,
  <detail->'proposals'>)` — khoá ngoại thoả vì X đã tồn tại lại; giá trị applied áp lại bằng `apply_enrichment`.
- Sau cùng xoá X. Một dòng `ops_audit` `enrich:reconcile` cho cả lượt: số offer cũ, cặp X→Y, đề xuất
  đã chuyển/gộp/áp lại/xoá.

**Khoá ngoại** `enrichment_proposals.offer_id` đổi từ `ON DELETE CASCADE` sang `ON DELETE RESTRICT`:
mọi đường xoá offer chưa đối soát đề xuất (một transform cũ quay về DELETE toàn nguồn, câu DELETE tay)
GÃY có tiếng thay vì lặng lẽ xoá công duyệt.

`writeOffers` kiểm hàm `reconcile_stale_offers` tồn tại TRƯỚC khi ghi; thiếu → dừng với thông điệp
«chưa áp migration 037» (code mới chạy trên DB chưa áp migration không được nửa chừng).

### 2.2 Hoàn tác có audit (mục 2) — migration 036

`revert_enrichment(p_ids bigint[], p_actor text, p_reason text) RETURNS integer`:

- `p_actor` phải dạng `hitl:<người>` và `p_reason` không rỗng — ngược lại RAISE, không bảng nào đổi
  (AGENTS.md luật 7: quyết định ghi dữ liệu đi qua người hoặc luật xác định).
- Mỗi id `status='applied'` mà `sale_offers` hiện còn đúng giá trị đó (so không phân biệt hoa thường) →
  trả field về «trống»: `property_type='unknown'` (chuẩn trống mà bộ chọn backlog của run.ts đọc),
  field khác NULL; đề xuất → `status='reverted'`, ghi `reverted_by`, `reverted_at`, `revert_reason`.
  Giá trị đã đổi sau khi áp → bỏ qua, lý do `value-changed`; không ở `applied` → bỏ qua `not-applied`.
- `properties` liên kết: bedrooms/bathrooms/street bằng đúng giá trị bị hoàn tác VÀ không offer nào khác
  của căn còn mang giá trị đó → NULL; mọi căn liên kết nhận phần tử `enrichment_log`
  `src='enrich-revert'` (proposal_ids, actor, reason).
  Ma trận hiệu ứng ghi — rút từ các câu ghi thật của `apply_enrichment` (033), mỗi ô có một hiệu ứng ngược:

  | Field | Ghi ở `sale_offers` | Ghi ở `properties` (033) | Hoàn tác |
  |---|---|---|---|
  | property_type | property_type | — (`properties.property_type` do resolve-properties tính lại từ offer) | sale_offers → 'unknown' |
  | bedrooms | bedrooms | bedrooms (COALESCE) | sale_offers → NULL; căn → NULL khi bằng và không offer khác mang |
  | bathrooms | bathrooms | bathrooms (COALESCE) | như trên |
  | street_raw | street_raw | street (COALESCE) | như trên |
  | block_raw | block_raw | — | sale_offers → NULL |
- Đề xuất `superseded` cùng offer + field (bị lấn bởi giá trị vừa hoàn tác — ca 640/645 `house`) →
  `queued`, `route='review'`: lượt enrich-run sau đưa lên thẻ cho người quyết, không áp thẳng.
- Một dòng `ops_audit` `enrich:revert` mỗi lần gọi: reason, reverted[], skipped[{id, why}], reopened[].
- Gọi lại cùng ids → 0 hoàn tác (đã `reverted`), vẫn có dòng audit.
- `status` thêm giá trị `reverted` vào CHECK. Unique index cũ giữ nguyên → giá trị đã hoàn tác không bị
  luật đẩy lại (như `rejected`).

CLI `agent/scripts/enrich-revert.ts --ids 639,644 --actor hitl:<tên> --reason "<…>" [--dry]`: `--dry` in kế
hoạch (field · giá trị hiện tại · sẽ thành gì · lý do bỏ qua), không ghi. Lần chạy thật cho 639/644 là
bước SAU merge, SAU khi điều phối liên làn áp 036, và chỉ khi Mạnh đồng ý (Hỏi-2).

### 2.3 E1 không suy `land` từ tên nhóm (mục 3)

`resolveContext` loại BĐS (theo khuyến nghị Hỏi-4):

1. **Tên nhóm không bao giờ cho `land`** (căn cứ: vòng trước định siết đúng chỗ này).
2. Luật `land` chỉ xét **nội dung tin**, và chặt: chỉ cụm chỉ đất rõ — `đất nền|nền đất|lô đất|bán đất|
   đất thổ cư|thửa đất|đất ở|đất vườn|đất trống|đất dự án` — quét trên tin đã bỏ cụm «nhà đất», «bất động
   sản». Bỏ khớp trần «đất», «nền», «diện tích đất» (tin nhà phố ghi «diện tích đất»).
3. **Phủ quyết land**: tin có dấu nhà nhiều tầng/phòng — `\d+ tầng|\d+ lầu|trệt|\d+ (pn|phòng ngủ)` → không ra land.
4. Các loại khác giữ nguyên cách cũ: quét chuỗi ghép tin + tên nhóm theo thứ tự apartment · house · room ·
   commercial (giữ ca «…Chung Cư Vin 1,2,3» → apartment). Riêng khi tin có cụm đất rõ (bước 2–3 ra land) mà
   loại kia chỉ khớp ở tên nhóm → land thắng. Căn cứ ghi rõ «trong tin» / «tên nhóm».

Số đo trên 735 tin bán S03/S05 ở DB local (2026-10-23, so luật cũ ↔ khuyến nghị): 57 kết quả đổi, tất cả
dính land — 52 land-từ-tên-nhóm → trống (mẫu: «3 TẦNG HẺM XE HƠI…», «3 tầng kiên cố, 3 PN» — đều là nhà),
3 land-từ-«đất»-trần → trống (2 nhà «3Tầng… khuôn đất», 1 «bán đất tặng nhà 1 trệt» — bỏ sót có chủ đích),
1 land → commercial, 1 apartment-từ-tên-nhóm → land («BÁN LÔ ĐẤT» trong nhóm «CHUNG CƯ»).
Lối khác (quét mọi luật trên tin trước tên nhóm) đổi thêm 50 tin apartment(tên nhóm) → house(tin): đa số
đúng là nhà phố «6 tầng», nhưng tin căn hộ «căn góc 2PN… mặt phố Phúc Diễn» bị gán house.

Hai ca thật (nhóm «HỘI MUA BÁN NHÀ ĐẤT…») → E1 không ra loại; LLM `house` → thẻ duyệt (AC-4 cũ), không
áp. Ca đất nền thật (`offer_76060ec556721a1b` «BÁN LÔ ĐẤT» trong nhóm «MUA BÁN CHUNG CƯ…»,
`offer_c0f04c88f9255699` «38m2 đất thổ cư») → `land`, căn cứ «trong tin».

Các ca AC-7/AC-11 cũ của `enrich-db.test.ts` dựng xung đột bằng luật E1 thật cũ (land từ tên nhóm). Sau
mục 3 chúng chuyển sang E1 tiêm (stub ra đúng `land` + căn cứ cũ) — cơ chế xung đột vẫn được đo, chỉ
nguồn sinh xung đột đổi.

### 2.4 Câu chỉ người quyết

- **Hỏi-1** (xoá dữ liệu → khó-đảo): offer cũ KHÔNG có offer kế (mọi post của nó không còn ra offer nào).
  Khuyến nghị: xoá offer + đề xuất của nó một cách TƯỜNG MINH, chụp nguyên các dòng đề xuất (bỏ
  `evidence.text`) vào `ops_audit` `enrich:retire` để khôi phục được; thẻ chờ → `rejected` kèm ghi chú.
  Lối khác: bỏ khoá ngoại, giữ đề xuất mồ côi để tự gắn lại khi băm cũ quay lại — giữ trọn công duyệt nhưng
  mất toàn vẹn tham chiếu và thẻ chờ trỏ offer không tồn tại.
- **Hỏi-2**: chạy `enrich-revert` cho 639/644 trên DB local sau khi 036 được áp — đồng ý không, actor tên gì.
- **Hỏi-3**: đề xuất `applied` của offer cũ có offer kế — tự áp lại lên offer kế (khuyến nghị: field enrich là
  thuộc tính vật lý của căn mà cùng post mô tả, không đổi khi người đăng sửa giá) hay đưa lên thẻ cho người
  xác nhận lại (giá: thêm một thẻ cho mọi tin sửa giá).
- **Hỏi-4**: cách siết luật E1 — chỉ siết land (khuyến nghị, 57 tin đổi, đều là land) hay quét mọi luật trên
  tin trước tên nhóm (thêm 50 tin apartment→house). Số đo ở §2.3.

### 2.5 Thứ tự triển khai (sau merge — việc của điều phối liên làn)

Áp 036 → 037 lên DB local TRƯỚC lượt `zalo-import-daily` / `apify-facebook-daily` kế tiếp (code
transform mới dừng có tên nếu chưa có 037). Không lên cloud: `enrichment_proposals`, `ops_audit`,
`review_queue` không thuộc `FILL`. Rồi (Hỏi-2) chạy hoàn tác 639/644.

## 3. Ngoài phạm vi

- `property_offers` / `property_candidates` (quyết định entity_match của người) vẫn `ON DELETE CASCADE`
  cho offer cũ — hợp đồng riêng nếu cần; vòng này chỉ giảm số lần xoá (upsert).
- Định danh offer theo post thay cho băm nội dung (đổi khoá chính sale_offers) — nặng, đụng mọi bảng.
- Lượt dọn hồi tố các giá trị E1 `land` khác ngoài 639/644 (đo: chỉ 2 dòng `e1_rule` land đã áp ở DB local).
- Học thêm luật E1 cho house («N tầng», «trệt») — luật mới cần số liệu riêng.
- UI: không màn nào đổi; hoàn tác chạy bằng CLI, chưa có nút trên `/ops/review`.
