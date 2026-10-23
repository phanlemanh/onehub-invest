# Enrichment qua đề xuất — LLM không ghi thẳng DB

Ngày: 2026-10-22 · Slug: `enrich-qua-de-xuat` · Hạng: T3 · Hợp đồng: `_acceptance/enrich-qua-de-xuat/contract.md`

## 1. Vấn đề

`agent/scripts/enrich-run.ts` (M-3, commit fe51088) lấy giá trị từ hai nguồn — E1 luật
(`context-resolver.ts`, từ điển `asset_nodes`) và E2 LLM (`enrich-text.ts`, Qwen 27B) — rồi
`UPDATE sale_offers` (fill-gap) và cascade `UPDATE properties`. Ba chỗ hỏng:

1. **Trái hiến pháp.** ROADMAP §1 luật 2: «LLM/agent chỉ gate/judge/extract có audit +
   evidence; KHÔNG bao giờ sửa dữ liệu trực tiếp.» Giá trị LLM vào thẳng bảng canonical.
2. **Lệch chính thiết kế.** `docs/research/enrichment-agent-design.md` §3 định «confidence <
   threshold → INSERT review_queue»; code bỏ qua confidence, không đẩy hàng duyệt nào.
3. **Không truy được.** `sale_offers` không có cột nguồn/lịch sử: sau một lượt chạy, không
   biết field nào do LLM điền. Có 34 trace `enrich-text` ngày 22/10 trong `agent/traces/`;
   `properties.enrichment_log` có 0 dòng `enrich-m3` → nếu lượt nào không `--dry`, các giá trị
   đã ghi vào `sale_offers` hiện không phân biệt được (xem Hỏi ở Cổng Phạm vi).

## 2. Quyết định người đã chốt (22/10, trong hội thoại)

- Đường ghi: **đề xuất + luật xác định.** LLM ghi vào bảng đề xuất; một luật xác định chỉ
  nhận khi có căn cứ độc lập; phần còn lại vào `/ops/review`. E1 vẫn ghi thẳng, kèm nguồn.
- Quy trình: feature-loop đầy đủ.

## 3. Thiết kế

### 3.1 Bảng `enrichment_proposals` (migration 033, KHÔNG sync cloud)

Mỗi dòng = một giá trị đề xuất cho một field của một offer:
`run_id · offer_id · field (property_type|bedrooms|bathrooms|street_raw|block_raw) · value ·
source (e1_rule|e2_llm) · route (direct|corroborated|review) · corroborated_by · confidence ·
model · trace_path · evidence jsonb (đoạn tin ≤300 ký tự, group_name, matchedBy/projectSlug của
E1) · status (applied|queued|rejected|superseded|skipped) · review_id · decided_by · applied_at`.
Duy nhất theo `(offer_id, field, value, source)`: chạy lại không nhân dòng, giá trị đã bị bác
không bị đẩy lại.

**Chuẩn hoá giá trị** (`normalizeValue(field, raw)` trong `agent/src/enrich/route.ts`, dùng cho
cả E1 lẫn LLM, TRƯỚC khi so «cùng giá trị» và trước khi ghi): `property_type` → chữ thường,
phải thuộc tập CHECK của migration 025; `bedrooms`/`bathrooms` → số nguyên 0–20 viết dạng chuỗi
thập phân (`"2"`, `2`, `"2 "` → `"2"`); `street_raw`/`block_raw` → NFC, trim, gộp khoảng trắng,
giữ hoa thường gốc để hiển thị nhưng so sánh và khoá duy nhất dùng bản `lower()`. Giá trị
không chuẩn hoá được → bỏ, không thành đề xuất.

### 3.2 Luật định tuyến (thuần, `agent/src/enrich/route.ts`)

Cho từng field còn trống của offer:

| Nguồn | Điều kiện | route → status |
|---|---|---|
| E1 luật | có giá trị hợp lệ | `direct` → áp |
| E2 LLM | E1 cùng field ra **cùng** giá trị | `corroborated` (by `e1`) → áp |
| E2 LLM | field `block_raw`: giá trị khớp tên/alias một node `building` trong `asset_nodes` | `corroborated` (by `asset_nodes:<slug>`), áp **tên chuẩn** của node |
| E1 + E2 | E1 và LLM ra giá trị **khác** nhau cho cùng field | **KHÔNG áp bên nào**: cả hai thành `review` → `queued` trên thẻ `/ops/review` của offer, đánh dấu xung đột, mỗi bên kèm căn cứ; người chọn một bên (hoặc bỏ cả hai). Số ca xung đột in trong tổng kết lượt chạy. (Nâng phạm vi 2026-10-23 — thay quyết định «E1 thắng» d-…-9; xem §3.6) |
| E2 LLM | không căn cứ nào | `review` → `queued` + thẻ `/ops/review` |

Field đang có đề xuất `queued` trên thẻ xung đột (chờ hoặc đã hoãn) → lượt sau KHÔNG áp gì cho field đó (kể cả LLM vắng/lỗi/đồng ý E1): `routeFields` nhận tập field đang giữ và đẩy mọi đề xuất mới của field vào thẻ.

Confidence của LLM KHÔNG bao giờ là căn cứ (lưu để người đọc). Field đã có giá trị trong
`sale_offers` → không sinh đề xuất (fill-gap: giá trị cũ thắng).

### 3.3 Một nguồn cho việc áp: hàm SQL

`app/` không được import `agent/` (app/CLAUDE.md), nên logic áp nằm trong DB — một định nghĩa
dùng chung cho script lẫn route:

- `apply_enrichment(ids bigint[], actor text)` — fill-gap `UPDATE sale_offers` theo field; field
  đã có giá trị lúc áp → `skipped`; còn lại `applied` + `applied_at`; cascade `properties`
  (bedrooms/bathrooms/street, fill-gap) + một phần tử `enrichment_log`
  `{t, src:'enrich-proposals', proposal_ids, actor}`.
- `decide_enrichment_review(review_id, status, actor)` — `approved` → `apply_enrichment` cho
  các đề xuất `queued` của thẻ; `rejected` → đề xuất `rejected`; `deferred` → giữ `queued`.

Sau thay đổi, `agent/` không còn câu `UPDATE sale_offers` / `UPDATE properties` nào.

### 3.4 Hàng duyệt

Một thẻ `review_queue` `item_type='agent_output'`, `item_id='enrich:<offer_id>'` cho mỗi offer
có đề xuất `queued`; `evidence` = đoạn tin + danh sách `{proposal_id, field, value, confidence}`
+ run_id/model/trace. Lượt sau có thêm đề xuất cho cùng offer khi thẻ còn chờ → gắn vào thẻ đó
và dựng lại `evidence`. Thẻ bị hoãn (`deferred`) → lượt kế mở thẻ chờ mới cho các đề xuất còn
`queued`.

Route `POST /api/v1/ops/review/[id]/decide`: nhánh `agent_output` + `enrich:` gọi
`decide_enrichment_review` trong cùng transaction, ghi `ops_audit` như hiện tại.

Thẻ có field xung đột: `evidence.fields` mang thêm `source` (`e1_rule`|`e2_llm`), `basis` (căn
cứ — E1: từ khoá/luật khớp và khớp ở tin hay tên nhóm; LLM: model · độ tự tin · tên trace) và
`conflict: true` cho mọi đề xuất của field có ≥2 giá trị chờ. Route decide nhận thêm
`choices: { <field>: <proposal_id> | null }` — bắt buộc cho mỗi field xung đột khi `approved`
(thiếu → 400, không bảng nào đổi). Áp = `apply_enrichment(<đề xuất được chọn + đề xuất không
xung đột>)` rồi `decide_enrichment_review(id, 'rejected')` cho phần còn lại — hai hàm sẵn có của
033, cùng transaction; không migration mới, không câu UPDATE viết tay. Logic chọn id nằm trong
hàm thuần `planEnrichApproval` (`app/src/lib/enrich-choices.ts`) để test được.

### 3.5 `--dry`

In bảng định tuyến (field · nguồn · route) cho từng offer; KHÔNG ghi bảng nào.

### 3.6 Vì sao đổi «E1 thắng» (2026-10-23)

Chạy thật `LIMIT=6` trên DB local: E1 áp `property_type=land` cho hai tin S05 rõ là nhà 4 tầng
(«Nhà Gò Vấp 4 tầng», «CHDV 9PN 4 tầng») vì luật từ khoá nhận chữ «đất» trong tên nhóm «HỘI MUA
BÁN NHÀ ĐẤT…»; LLM ra `house` nhưng bị `superseded`, thẻ duyệt không hiện gì — đúng rủi ro sổ d-9
đã ghi («E1 sai thì giá trị LLM đúng bị bỏ mà không ai nhìn»). E1 vẫn áp thẳng khi LLM không có ý
kiến hoặc đồng ý; chỉ khi hai nguồn TRÁI nhau thì người quyết. Siết chính luật E1 là vòng riêng.

## 4. Quét không gian AC (morphological-scan, preset entity-feature)

Ngữ cảnh — chân sản phẩm: [SUY-TỪ-REPO: AGENTS.md, docs/ROADMAP.md] công cụ nội bộ 1–2 người vận
hành dữ liệu BĐS VN; actor: máy (enrich-run), người vận hành ở `/ops/review`. Chân ngành:
[NGÀNH: Amazon Augmented AI (A2I)] — dự đoán ML độ tin cậy thấp đi luồng duyệt người;
[NGÀNH: Informatica MDM — data steward task inbox, trust/survivorship] — giá trị từ nhiều nguồn
qua luật ưu tiên + hàng việc người quản trị dữ liệu.

Trục:
- A. Vòng đời đề xuất: sinh | định tuyến | người quyết | áp + cascade | chạy lại
  [thước CE: state machine §3 + vòng đời task của MDM steward]
- B. Nguồn × căn cứ: E1 luật | LLM có E1 cùng giá trị | LLM khớp asset_nodes | LLM trái E1 | LLM
  không căn cứ [thước CE: bảng §3.2; ROADMAP §1 luật 2]
- C. Trạng thái đích: field trống | field đã có | offer có property | offer không property
  [thước CE: câu UPDATE hiện tại của enrich-run.ts — fill-gap + cascade]
- D. Bề mặt: script thật | `--dry` | thẻ `/ops/review` | route decide [thước CE: enrich-run.ts,
  app/src/app/ops/review, route decide]

Core → AC-1…AC-10 của hợp đồng. Later: dọn ghi cũ chưa truy được (chờ Hỏi) · E5 học alias từ
duyệt · duyệt từng field thay vì cả offer · thẻ cho `source_decision`/`data_quality` · số liệu
tỷ lệ promote trên `/ops`. Never: dùng confidence LLM làm căn cứ promote — trái hiến pháp luật 2
(người đã bác phương án ngưỡng ngày 22/10).

Cross-cutting: audit (`ops_audit` + `enrichment_log`), PII tầng A (đoạn tin có thể chứa SĐT →
bảng mới không sync cloud), transaction ở route.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/review` → thẻ «Bổ sung dữ liệu tin» → đọc đoạn tin + bảng field đề xuất → bấm «Áp dụng» → thẻ chuyển «Đã duyệt», giá trị vào `sale_offers` (điểm ra: danh sách đã quyết)
- Biên: thẻ có field mà lúc duyệt đã có giá trị khác → field đó «bỏ qua (đã có giá trị)», không ghi đè
- Xung đột: field mà luật và LLM ra hai giá trị khác nhau → chọn «Theo luật», «Theo LLM» hoặc «Bỏ cả hai» rồi mới «Áp dụng»; field không xung đột của cùng thẻ áp như thường
- Lỗi & quay lại: route lỗi → dòng «❌ <lỗi>» cạnh nút, thẻ vẫn chờ; bấm lại được

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| /ops/review — thẻ agent_output | Quyết nhận hay bác các giá trị LLM đề xuất cho một tin | nav Ops (URL) / ở lại trang sau khi quyết |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-review-agent-pending | thẻ agent_output | đoạn tin, bảng field · giá trị · độ tin cậy LLM, 3 nút «Áp dụng» «Bỏ» «Để sau» | bấm một nút |
| ST-review-agent-done | thẻ agent_output | badge «Đã áp» / «Đã bỏ» / «Hoãn» thay cho nút | không gì |
| ST-review-agent-conflict | thẻ agent_output | field xung đột thành hai lựa chọn «Theo luật» / «Theo LLM» (Badge nguồn) + giá trị + căn cứ, thêm «Bỏ cả hai»; «Áp dụng» khoá | chọn một bên cho mỗi field xung đột |
| ST-review-agent-conflict-chosen | thẻ agent_output | lựa chọn được đánh dấu; «Áp dụng» bật | bấm «Áp dụng» / «Bỏ» / «Để sau» |
| ST-review-agent-error | thẻ agent_output | «❌ <thông điệp route>» cạnh nút | bấm lại |
| ST-review-unknown-type | thẻ loại chưa hỗ trợ | tiêu đề + «loại <item_type> chưa có giao diện duyệt» | không gì — trang không sập |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Nút khoá trong lúc gửi (useTransition, như thẻ entity_match).

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| ReviewCard | mở rộng | rẽ nhánh theo item_type, giữ nguyên thẻ entity_match |
| Badge (reui) | dùng | nhãn nguồn (luật / LLM), độ tin cậy, trạng thái |
| Button, ToggleGroup (components/ui) | dùng | ba nút quyết định và ô chọn một bên cho field xung đột — thay `<button>`/`<table>` tự dựng (lint onehub-ui) |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: trang `/ops/review` đã là danh sách thẻ, mỗi thẻ tự chứa chi tiết để quyết — luồng hiển nhiên, không tra mẫu.
<!-- UX-SPEC-TEMPLATE>>> -->

## 5. Tệp đụng tới

`db/migrations/033_enrichment_proposals.sql` · `agent/src/enrich/route.ts` (mới) ·
`agent/scripts/enrich-run.ts` · `agent/src/agents/enrich-text.ts` (comment đầu file) ·
`agent/tests/*.test.ts` · `app/src/app/api/v1/ops/review/[id]/decide/route.ts` ·
`app/src/components/ops/review-card.tsx` · `app/tests/review-card.test.tsx` + `app/package.json`
(script test) · `_acceptance/config.yaml` (khoá `app_ui`) · `docs/research/enrichment-agent-design.md` ·
`docs/ROADMAP.md`.
