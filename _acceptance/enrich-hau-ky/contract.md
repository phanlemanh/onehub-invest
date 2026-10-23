---
schema_version: 1
feature: Hậu kỳ enrich-qua-de-xuat — đề xuất sống qua nạp lại, hoàn tác có audit, E1 không suy đất từ tên nhóm
slug: enrich-hau-ky
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: approved
design_doc: docs/superpowers/specs/2026-10-23-enrich-hau-ky-design.md
approved_by: Mạnh
approved_at: 2026-10-23
---

# Acceptance Contract: enrich-hau-ky

## Context

Vòng `enrich-qua-de-xuat` (PR #14) để lại ba việc: (1) transform S03/S05 DELETE toàn nguồn + khoá ngoại
CASCADE của `enrichment_proposals` xoá sạch đề xuất và công duyệt mỗi lần nạp lại; (2) hai giá trị
`property_type=land` sai đã áp ở DB local mà không có đường ghi ngược; (3) luật E1 suy `land` từ chữ
«đất» trong tên nhóm «…NHÀ ĐẤT…». Vòng này sửa cả ba theo luật LLM-off-data-path: mọi lần ghi dữ liệu đi
qua người hoặc luật xác định, kèm audit.

Source input: prompt — việc hậu kỳ giao từ phiên điều phối làn merge 2026-10-23; Ngoài-6 «Mạnh chọn mở hợp
đồng mới» (`_acceptance/enrich-qua-de-xuat/contract.md` Notes).

## Criteria

- AC-1: Given offer S0x đã có đề xuất `applied`, `rejected`, `queued` (gắn thẻ chờ) và field đã enrich (`property_type`, `street_raw`, `bathrooms`), When bước ghi canonical của transform chạy lại với cùng tập offer, Then số dòng, `status`, `decided_by`, `review_id` của các đề xuất không đổi, thẻ chờ còn nguyên, các field đã enrich không đổi, còn cột nguồn (`n_reposts`, `last_seen`, `post_ids`) được làm mới.
- AC-2: Given offer X không còn trong lượt nạp và offer sống Y cùng nguồn chung ít nhất một `post_id` với X (tin sửa giá → băm mới; post của X tách sang nhiều offer sống → Y là offer chung nhiều post nhất, hoà thì `offer_id` nhỏ nhất), When bước ghi canonical chạy, Then X bị xoá, mọi đề xuất của X nằm ở Y với `status`/`decided_by` giữ nguyên, giá trị từng `applied` ở X được áp lại fill-gap lên Y (Y đã có giá trị → `skipped`), thẻ chờ của X trỏ `enrich:Y` (hoặc, khi Y đã có thẻ chờ, thẻ X thành `deferred` và lượt enrich-run sau gắn các đề xuất đó vào thẻ của Y), và có một dòng `ops_audit` `enrich:reconcile` liệt cặp X→Y cùng số đề xuất đã chuyển.
- AC-3: Given Y đã có đề xuất trùng khoá `(field, value_key, source)` với một đề xuất của X, When đối soát, Then còn đúng một dòng cho khoá đó ở Y và nó mang trạng thái «đã quyết» hơn (`applied`/`rejected`/`reverted` thắng `queued`/`superseded`/`skipped`; ngang hạng giữ dòng của Y).
- AC-4: Given offer X không còn trong lượt nạp và không có offer kế, When bước ghi canonical chạy, Then X và đề xuất của X bị xoá TƯỜNG MINH, `ops_audit` `enrich:retire` chứa các dòng đề xuất bị xoá (trừ `evidence.text`) và các cột đã enrich của X (không cột người bán), thẻ chờ của X thành `rejected` kèm ghi chú; và When một lượt nạp sau sinh lại X, Then chèn lại đề xuất từ ảnh chụp audit thành công và bằng các dòng cũ (trừ `evidence.text`). (cách xử lý theo khuyến nghị Hỏi-1 — người chốt ở Cổng Phạm vi)
- AC-5: Given offer có ít nhất một đề xuất, When chạy thẳng `DELETE FROM sale_offers` cho offer đó, Then lệnh lỗi khoá ngoại và không dòng nào bị xoá; và Given mã `pipeline/transform-zalo.mjs`, `pipeline/transform-fb.mjs`, When quét, Then không còn câu `DELETE FROM sale_offers` nào — cả hai ghi qua `writeOffers`, và `writeOffers` dừng với thông điệp «chưa áp migration 037» khi DB thiếu hàm đối soát.
- AC-6: Given đề xuất `applied` mà `sale_offers` còn đúng giá trị đó, When `revert_enrichment(ids, 'hitl:<người>', lý do)`, Then mỗi hiệu ứng ghi của `apply_enrichment` cho field đó có hiệu ứng ngược theo ma trận design §2.2 (5 field × `sale_offers`/`properties`): field ở tin về trống (`property_type='unknown'`, field khác NULL), đề xuất thành `reverted` kèm `reverted_by`/`reverted_at`/`revert_reason`, đề xuất `superseded` cùng offer + field thành `queued` `route=review`, căn liên kết mất field bằng đúng giá trị đó khi không offer nào khác của căn còn mang nó và nhận `enrichment_log` `src=enrich-revert`, có một dòng `ops_audit` `enrich:revert`; giá trị đã đổi sau khi áp → bỏ qua lý do `value-changed`; đề xuất không `applied` → bỏ qua `not-applied`; actor không dạng `hitl:` hoặc lý do rỗng → lỗi và không bảng nào đổi; gọi lại → 0 hoàn tác.
- AC-7: Given CLI `agent/scripts/enrich-revert.ts`, When chạy `--dry` với id hợp lệ, Then in kế hoạch từng id (field · giá trị hiện tại · sẽ thành gì · lý do bỏ qua) và không bảng nào đổi; thiếu `--actor`/`--reason` → mã thoát khác 0. Given hai tin S05 thật đã hoàn tác (`land` → `unknown`), When enrich-run chạy lại với luật E1 mới và đầu ra LLM thật, Then E1 không đẩy lại `land`, đề xuất LLM `house` nằm trên đúng một thẻ chờ, `sale_offers.property_type` vẫn `unknown`.
- AC-8: Given hai tin S05 thật «Nhà Gò Vấp 4 tầng» và «CHDV 9PN 4 tầng» trong nhóm «HỘI MUA BÁN NHÀ ĐẤT…», hoặc một tin không có từ khoá loại nào trong nhóm đó, When `resolveContext` chạy, Then `propertyType` không phải `land`; và When enrich-run chạy với LLM ra `house`, Then E1 không sinh đề xuất `property_type`, đề xuất LLM vào hàng duyệt, `sale_offers` không đổi.
- AC-9: Given tin đất nền thật («BÁN LÔ ĐẤT…» trong nhóm «MUA BÁN CHUNG CƯ…», «38m2 đất thổ cư…»), When `resolveContext` chạy, Then `propertyType='land'` với căn cứ «trong tin»; Given tin có cụm đất kèm dấu nhà nhiều tầng («Nhà 4 tầng trên lô đất…»), Then không ra `land`; Given tin không từ khoá trong nhóm «…Chung Cư…», Then vẫn ra `apartment` với căn cứ «tên nhóm»; và Given 735 tin bán S03/S05 của DB local, When so luật cũ với luật mới, Then mọi kết quả đổi đều có `land` ở một trong hai phía (luật các loại khác không đổi — theo khuyến nghị Hỏi-4).
- AC-10: Given migration 036 và 037, When áp hai lần liên tiếp trong một transaction trên DB local (ROLLBACK cuối), Then cả hai lần không lỗi, cấu trúc bảng/hàm/ràng buộc sau lần 1 bằng sau lần 2, và không dòng dữ liệu nào bị xoá hay nhân đôi.

## Coverage

- Trục A — Lượt nạp × số phận offer: offer giữ nguyên | offer có kế (băm đổi) | offer kế đã có đề xuất trùng | offer không kế | đường xoá khác [thước CE: `transform-zalo.mjs` bước 4–5 (băm + ghi), khoá ngoại 027/033]
- Trục B — Trạng thái đề xuất qua đối soát: queued (có thẻ / lỏng) | applied | rejected | superseded | skipped | reverted [thước CE: CHECK `status` của 033 + `reverted` mới]
- Trục C — Hoàn tác: áp còn nguyên | giá trị đã đổi | không applied | actor không phải người | gọi lại | lan sang căn | mở lại superseded [thước CE: `apply_enrichment` 033 — mỗi hiệu ứng ghi có một hiệu ứng ngược]
- Trục D — Luật E1 loại BĐS × vị trí khớp: tin | tên nhóm × land | loại khác × có/không dấu nhà nhiều tầng [thước CE: TYPE_RULES `context-resolver.ts` + 2 ca sai thật + 2 ca đất thật]
- Core 10 ô → AC-1…AC-10. Later/Never: design doc §3.
- [GIẢ ĐỊNH] Tin sửa (cùng `post_id`, băm khác) là nguồn chính của offer cũ có kế; offer không kế chỉ xảy ra khi parser đổi hoặc tin rớt ngưỡng confidence.
- [GIẢ ĐỊNH] Transform đọc TOÀN BỘ tin của nguồn mỗi lượt (`DISTINCT ON (post_id)` không lọc thời gian) — tập «sống» là đầy đủ, offer vắng là offer cũ thật.

## Out of scope

- `property_offers` / `property_candidates` (kể cả quyết định entity_match) vẫn cascade khi offer cũ bị xoá — hợp đồng riêng nếu cần.
- Đổi định danh offer sang theo post (khoá chính `sale_offers`).
- Chạy hoàn tác 639/644 trên DB local trong vòng này — bước sau merge, sau khi 036 được áp, khi Mạnh đồng ý (Hỏi-2).
- Áp migration 036/037 lên DB local hay cloud — việc của phiên điều phối liên làn sau merge.
- Nút hoàn tác trên `/ops/review`; luật E1 mới cho house («N tầng», «trệt»).

## Notes

- Số migration 037 đã xin ở phiên điều phối liên làn 2026-10-23, chờ xác nhận.
- Kiểm thử DB chạy trong transaction rồi ROLLBACK trên Postgres local :5433 — không để lại dữ liệu, không áp migration thật.
