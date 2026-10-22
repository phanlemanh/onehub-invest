---
schema_version: 1
feature: Enrichment qua đề xuất — giá trị LLM không ghi thẳng sale_offers/properties
slug: enrich-qua-de-xuat
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, api, ui]
status: approved
design_doc: docs/superpowers/specs/2026-10-22-enrich-qua-de-xuat-design.md
approved_by: Mạnh
approved_at: 2026-10-22
---

# Acceptance Contract: enrich-qua-de-xuat

## Context

`agent/scripts/enrich-run.ts` đang ghi thẳng giá trị do LLM suy ra vào `sale_offers` rồi lan sang
`properties`, không lưu nguồn, không qua người — trái hiến pháp ROADMAP §1 luật 2 và lệch cả
`docs/research/enrichment-agent-design.md` §3. Vòng này đưa mọi giá trị enrichment qua bảng đề
xuất: luật (E1) áp thẳng kèm nguồn, giá trị LLM chỉ được áp khi có căn cứ độc lập hoặc khi người
duyệt ở `/ops/review`.

Source input: prompt — quyết định của chủ kho trong hội thoại 22/10 («Đề xuất + luật xác định»,
«feature-loop đầy đủ»).

## Criteria

- AC-1: Given mã nguồn `agent/` sau thay đổi, When quét mọi tệp `.ts` trong `agent/src` và `agent/scripts`, Then không còn câu `UPDATE sale_offers` hay `UPDATE properties` nào — mọi lần ghi vào hai bảng đó đi qua hàm SQL `apply_enrichment`.
- AC-2: Given một offer S03/S05 có field trống mà E1 (luật) ra giá trị hợp lệ, When chạy enrich-run (không `--dry`), Then field được điền, và có một dòng `enrichment_proposals` `source=e1_rule`, `route=direct`, `status=applied` mang `run_id` và evidence (đoạn tin, matchedBy); offer không gắn property nào vẫn được điền bình thường, không làm hỏng việc áp các offer khác trong cùng lượt.
- AC-3: Given LLM ra giá trị cho một field và E1 ra CÙNG giá trị cho field đó, hoặc field `block_raw` khớp tên/alias một node `building` của `asset_nodes`, When chạy enrich-run, Then đề xuất LLM có `route=corroborated`, `corroborated_by` ghi đúng căn cứ (`e1` hoặc `asset_nodes:<slug>`), được áp — riêng `block_raw` áp tên chuẩn của node.
- AC-4: Given LLM ra giá trị cho một field mà không có căn cứ độc lập nào, When chạy enrich-run, Then `sale_offers` KHÔNG đổi field đó, đề xuất có `status=queued`, và có đúng một thẻ `review_queue` `item_type=agent_output`, `item_id=enrich:<offer_id>` đang chờ, `evidence` liệt kê field · giá trị · confidence · run_id · model · trace.
- AC-5: Given một thẻ `agent_output` đang chờ, When route `POST /api/v1/ops/review/[id]/decide` nhận `approved`, Then các đề xuất `queued` của thẻ được áp fill-gap vào `sale_offers` (field đã có giá trị lúc áp thì `skipped`, không ghi đè), `properties` liên kết nhận bedrooms/bathrooms/street còn trống, `properties.enrichment_log` có phần tử `src=enrich-proposals` kèm `proposal_ids` và người duyệt, và `ops_audit` có dòng `review:decide`.
- AC-6: Given một thẻ `agent_output` đang chờ, When người bấm «Bỏ» (`rejected`) hoặc «Để sau» (`deferred`), Then `sale_offers` không đổi; với «Bỏ» các đề xuất thành `rejected` và lượt enrich-run sau KHÔNG đẩy lại cùng giá trị; với «Để sau» đề xuất giữ `queued` và lượt enrich-run sau mở một thẻ chờ mới cho chúng.
- AC-7: Given LLM và E1 ra hai giá trị KHÁC nhau cho cùng field (sau chuẩn hoá), When chạy enrich-run, Then giá trị E1 được áp, đề xuất LLM có `status=superseded`, không sinh thẻ duyệt, và tổng kết lượt chạy in số ca xung đột.
- AC-8: Given enrich-run chạy hai lần liên tiếp trên cùng dữ liệu, When lần hai kết thúc, Then số dòng `enrichment_proposals` và số thẻ `agent_output` đang chờ không tăng; và Given cờ `--dry`, When chạy, Then không bảng nào trong `enrichment_proposals`, `review_queue`, `sale_offers`, `properties` có thay đổi.
- AC-9: Given `/ops/review` có thẻ `agent_output` và thẻ `entity_match`, When trang render, Then thẻ `agent_output` hiện đoạn tin, bảng field · giá trị · độ tin cậy và ba nút «Áp dụng» «Bỏ» «Để sau» gọi route decide với đúng status; thẻ `entity_match` hiển thị như trước; thẻ loại chưa hỗ trợ hiện một dòng báo thay vì làm sập trang. (cross-layer)
- AC-10: Given luồng đồng bộ cloud `pipeline/sync-cloud.mjs`, When đọc danh sách bảng đẩy lên (`FILL`), Then `enrichment_proposals` và `review_queue` không nằm trong danh sách — evidence chứa đoạn tin gốc (PII tầng A).

## Coverage

- Trục A — Vòng đời đề xuất: sinh | định tuyến | người quyết | áp + cascade | chạy lại [thước CE: state machine design doc §3 + vòng đời task MDM steward [NGÀNH: Informatica MDM]]
- Trục B — Nguồn × căn cứ: E1 luật | LLM có E1 cùng giá trị | LLM khớp asset_nodes | LLM trái E1 | LLM không căn cứ [thước CE: ROADMAP §1 luật 2 + bảng §3.2; [NGÀNH: Amazon A2I] định tuyến dự đoán ML sang người]
- Trục C — Trạng thái đích: field trống | field đã có | offer có property | offer không property [thước CE: câu UPDATE fill-gap + cascade hiện tại trong agent/scripts/enrich-run.ts]
- Trục D — Bề mặt: script thật | `--dry` | thẻ `/ops/review` | route decide [thước CE: enrich-run.ts, app/src/app/ops/review/page.tsx, route decide]
- Core: 10 ô → AC-1…AC-10. Later/Never: design doc §4.
- [GIẢ ĐỊNH] «Căn cứ độc lập» gồm đúng hai loại: E1 cùng giá trị, và khớp node `building` của `asset_nodes`. Regex mới, khớp chuỗi trong tin gốc, hay hai lượt LLM đồng ý đều KHÔNG tính.
- [GIẢ ĐỊNH] Một thẻ duyệt cho mỗi offer (duyệt cả gói field), không phải mỗi field.

## Out of scope

- Truy vết và dọn các giá trị LLM có thể đã ghi vào `sale_offers` trước vòng này (34 trace ngày 22/10) — chờ người quyết ở Cổng Phạm vi.
- Ngưỡng confidence của LLM làm căn cứ áp — trái hiến pháp luật 2, người đã bác.
- E5: học alias mới vào `asset_nodes` từ các lần duyệt.
- Duyệt từng field riêng trong một thẻ; duyệt hàng loạt.
- Giao diện duyệt cho `source_decision` / `data_quality` (chỉ bảo đảm không sập trang).
- Chạy enrich-run trên toàn backlog (~735 offer) — vòng này chỉ đổi đường ghi.

## Notes

- Hàm SQL là một nguồn duy nhất cho việc áp, vì `app/` không được import `agent/` (app/CLAUDE.md).
- Kiểm thử DB chạy trong transaction rồi ROLLBACK trên Postgres local :5433 — không để lại dữ liệu.
- Repo chưa khai `feature_loop.ui_standards_skill` — artifact UI không có đối trọng chuẩn nội.
