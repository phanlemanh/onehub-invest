# Enrichment qua đề xuất — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giá trị enrichment do LLM suy ra không còn `UPDATE` thẳng `sale_offers`/`properties`; mọi giá trị đi qua bảng `enrichment_proposals`, luật xác định, và `/ops/review`.

**Architecture:** Migration 033 thêm bảng đề xuất + hai hàm SQL (`apply_enrichment`, `decide_enrichment_review`) — nguồn ghi duy nhất, dùng chung cho `agent/` và route của `app/`. Luật định tuyến là hàm thuần TS trong `agent/src/enrich/`. `enrich-run.ts` thành CLI mỏng gọi `runEnrich()`. Thẻ `/ops/review` rẽ nhánh theo `item_type`.

**Tech Stack:** Postgres 17 + PL/pgSQL · TypeScript (agent: tsx + node:test; app: Next.js 16, React 19, jsdom) · pg.

**Spec:** `docs/superpowers/specs/2026-10-22-enrich-qua-de-xuat-design.md` · Hợp đồng `_acceptance/enrich-qua-de-xuat/contract.md` (AC-1..AC-10) · Evals `_acceptance/enrich-qua-de-xuat/evals.yaml` (E1..E13).

## Global Constraints

- Field enrich đúng năm: `property_type`, `bedrooms`, `bathrooms`, `street_raw`, `block_raw`.
- `property_type` ∈ `apartment|house|land|room|commercial` (CHECK migration 025; `unknown` coi như trống).
- `bedrooms`/`bathrooms`: số nguyên 0–20.
- Fill-gap: giá trị cũ luôn thắng — không bao giờ ghi đè ô đã có giá trị (ô `property_type='unknown'` tính là trống).
- «Căn cứ độc lập» chỉ hai loại: E1 cùng giá trị (sau chuẩn hoá) · `block_raw` khớp tên/alias node `node_type='building'` của `asset_nodes` (so `lower()`).
- Confidence LLM KHÔNG BAO GIỜ là căn cứ — chỉ lưu.
- LLM trái E1 → E1 áp, LLM `superseded`, không thẻ; tổng kết lượt in số ca xung đột.
- Một thẻ `review_queue` mỗi offer: `item_type='agent_output'`, `item_id='enrich:<offer_id>'`.
- `enrichment_proposals` và `review_queue` KHÔNG vào `FILL` của `pipeline/sync-cloud.mjs`.
- Kiểm thử DB chạy trong `BEGIN … ROLLBACK` trên `DATABASE_URL` (mặc định `postgres://oneinvest:oneinvest@localhost:5433/oneinvest`) — không để lại dữ liệu.
- Mỗi phép đo mới có cặp ca hai chiều cùng fixture + thông điệp ghim (MEASURE-BIRTH-CLAUSE); verify per-task gồm lượt phá-thử.
- `app/` không import `agent/`.

## Review Focus

1. Duyệt thẻ khi offer đã bị transform đêm ghi giá trị vào ô đó → phải `skipped`, không ghi đè (Task 1, ca `apply skipped khi ô đã có`).
2. LLM trả `bedrooms: "2 phòng"` / `property_type: "Căn hộ"` → không chuẩn hoá được → bỏ, không thành đề xuất rác (Task 2, ca `normalize từ chối`).
3. Hai lượt enrich chạy chồng nhau (cron + tay) → khoá duy nhất giữ 1 đề xuất, không 2 thẻ chờ (Task 3, ca `AC-8 chạy lại`).
4. Bấm duyệt hai lần (double click) → lần hai 409 như hiện tại, không áp hai lần (Task 4: route giữ `FOR UPDATE` + kiểm `pending` trước khi gọi hàm).
5. `evidence` thẻ cũ thiếu `fields` (dữ liệu tay) → thẻ hiện dòng báo thiếu, trang không sập (Task 4, ca `AC-9 thiếu fields`).

---

### Task 1: Migration 033 — bảng đề xuất + hàm áp/quyết

**Files:**
- Create: `db/migrations/033_enrichment_proposals.sql`
- Create: `agent/tests/helpers/db.ts`
- Create: `agent/tests/enrich-apply.test.ts`

**independent:** false (nền cho Task 3, 4) · **Phục vụ:** E5, E11 (một phần AC-5, AC-6) · **Verify:** `cd agent && npm test`

**Interfaces — Produces:**
- Bảng `enrichment_proposals(id bigserial pk, run_id text not null, offer_id text not null references sale_offers(offer_id), field text not null check (field in ('property_type','bedrooms','bathrooms','street_raw','block_raw')), value text not null, value_key text not null, source text not null check (source in ('e1_rule','e2_llm')), route text not null check (route in ('direct','corroborated','review','superseded')), corroborated_by text, confidence numeric, model text, trace_path text, evidence jsonb not null default '{}', status text not null default 'queued' check (status in ('queued','applied','rejected','superseded','skipped')), review_id bigint references review_queue(id), decided_by text, applied_at timestamptz, created_at timestamptz not null default now())` + `UNIQUE (offer_id, field, value_key, source)` + index `(review_id) WHERE status='queued'`. Header: `-- KHÔNG sync cloud (PII tầng A).` `value_key` = `lower(value)`.
- `apply_enrichment(p_ids bigint[], p_actor text) RETURNS integer` — số đề xuất `applied`.
- `decide_enrichment_review(p_review_id bigint, p_status text, p_actor text) RETURNS integer` — `approved` → `apply_enrichment(queued của thẻ)`; `rejected` → queued→`rejected`; `deferred` → 0, không đổi gì. Trả số đề xuất bị đổi. Không đụng `review_queue.status` (route làm).
- `agent/tests/helpers/db.ts`: `withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T>` (BEGIN → chạy nội dung tệp 033 → fn → ROLLBACK, luôn ROLLBACK kể cả khi lỗi); `insertOffer(c, o: { offer_id: string; source?: string; property_type?: string|null; bedrooms?: number|null; bathrooms?: number|null; street_raw?: string|null; block_raw?: string|null; post_ids?: string[] }): Promise<void>` (kind `'sale'`, confidence `'high'`, first/last_seen `now()`); `insertProperty(c, offerId: string): Promise<string>` (tạo `properties` + `property_offers`, trả property id).

- [ ] **Step 1: Viết test đỏ `agent/tests/enrich-apply.test.ts`** — các ca (tên ca chứa mã AC để eval đọc):
  - `AC-5 apply điền ô trống + cascade`: offer có property, bedrooms null; đề xuất `bedrooms='2'` status queued → `apply_enrichment([id],'t')` = 1; `sale_offers.bedrooms=2`; `properties.bedrooms=2`; `enrichment_log` phần tử cuối `src='enrich-proposals'`, `proposal_ids` chứa id, `actor='t'`.
  - `AC-5 apply skipped khi ô đã có` (chiều đỏ của ca trên, cùng fixture): bedrooms=3 trước khi áp → trả 0, status `skipped`, bedrooms vẫn 3.
  - `AC-2 offer không property`: mảng ids gồm offer có property + offer không property → cả hai `applied`, không ném lỗi.
  - `AC-6 decide rejected/deferred`: `rejected` → queued thành `rejected`, `sale_offers` không đổi; `deferred` → trả 0, status vẫn `queued`.
  - `AC-6 khoá duy nhất`: INSERT trùng `(offer_id, field, value_key, source)` với `value` khác hoa thường → lỗi unique_violation (thông điệp ghim `'AC-6 đẩy lại giá trị đã bác'` trong assert).
- [ ] **Step 2:** `cd agent && npm test` → FAIL (`relation "enrichment_proposals" does not exist`).
- [ ] **Step 3:** Viết migration 033 theo Interfaces; `apply_enrichment` dùng một `UPDATE … SET <field> = CASE` theo `field` (cast int cho bedrooms/bathrooms), điều kiện ô trống (`IS NULL`, hoặc `property_type='unknown'`); đánh `applied`/`skipped`; cascade `properties` qua `property_offers` (bedrooms/bathrooms/street fill-gap) + append `enrichment_log`. Áp vào DB local: `docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 < db/migrations/033_enrichment_proposals.sql` hai lần (idempotent).
- [ ] **Step 4:** `cd agent && npm test` → PASS. Phá-thử: đổi điều kiện ô trống thành luôn đúng trong bản sao → ca `skipped` đỏ với thông điệp ghim; hoàn lại.
- [ ] **Step 5: Commit** `feat(db): 033 enrichment_proposals + apply_enrichment/decide_enrichment_review`.

### Task 2: Luật định tuyến thuần + fixture từ trace thật

**Files:**
- Create: `agent/src/enrich/route.ts`
- Create: `agent/tests/fixtures/llm-outputs.json` (chép `output` của ≥3 tệp `agent/traces/*enrich-text.jsonl` ngày 22/10, giữ nguyên văn)
- Create: `agent/tests/enrich-route.test.ts`

**independent:** true · **Phục vụ:** E3, E8 · **Verify:** `cd agent && npm test`

**Interfaces — Produces:**
- `type EnrichField = 'property_type'|'bedrooms'|'bathrooms'|'street_raw'|'block_raw'`
- `normalizeValue(field: EnrichField, raw: unknown): string | null` — luật ở Global Constraints; street/block: NFC, trim, gộp khoảng trắng, độ dài 2–200 (block ≤30).
- `type Current = Partial<Record<EnrichField, string|number|null>>`
- `type BuildingNode = { slug: string; name: string; aliases: string[] }`
- `type Routed = { field: EnrichField; value: string; source: 'e1_rule'|'e2_llm'; route: 'direct'|'corroborated'|'review'|'superseded'; corroboratedBy: string|null }`
- `routeFields(input: { current: Current; e1: Partial<Record<EnrichField, unknown>>; llm: Partial<Record<EnrichField, unknown>> | null; buildings: BuildingNode[] }): Routed[]` — chỉ field đang trống; bảng §3.2 của spec; block khớp node → `value` = `node.name`, `corroboratedBy='asset_nodes:'+slug`.
- `summarizeRun(routed: Routed[][]): { direct: number; corroborated: number; review: number; xungDot: number }`
- `llmFieldsFromEnrich(e: EnrichResult): Partial<Record<EnrichField, unknown>>` (map `street→street_raw`, `building→block_raw`).

- [ ] **Step 1: Test đỏ** (`enrich-route.test.ts`, đọc fixture qua `parseEnrichOutput` thật):
  - `normalize "2"↔2`, `normalize 'Apartment'→'apartment'`, `normalize từ chối` (`"2 phòng"`, `"Căn hộ"`, `99` → null).
  - `AC-3 corroborated e1`: LLM bedrooms `"2"` + E1 `2` → `[{route:'corroborated', corroboratedBy:'e1'}]`.
  - `AC-3 corroborated asset_nodes`: LLM block `'lbv'` + node `{slug:'gpk-lumiere-boulevard', name:'Lumiere Boulevard', aliases:['lbv']}` → value `'Lumiere Boulevard'`. Chiều đỏ cùng fixture: aliases `[]` → `route:'review'` (ghim `'AC-3'`).
  - `AC-7 E1 thắng`: E1 `'house'`, LLM `'apartment'` → E1 `direct`, LLM `superseded`; `summarizeRun` → `xungDot:1`. Chiều đỏ: E1 vắng → LLM `review` (ghim `'AC-7'`).
  - `fill-gap`: `current.bedrooms=3` → không có phần tử nào cho bedrooms.
  - `fixture thật`: mọi output trong `llm-outputs.json` qua `parseEnrichOutput` + `llmFieldsFromEnrich` + `routeFields` không ném lỗi.
- [ ] **Step 2:** `npm test` → FAIL (module không có).
- [ ] **Step 3:** Viết `route.ts`.
- [ ] **Step 4:** `npm test` → PASS; phá-thử: bỏ chuẩn hoá trong bản sao → ca `"2"↔2` đỏ; hoàn lại.
- [ ] **Step 5: Commit** `feat(agent): luật định tuyến enrichment thuần + fixture trace thật`.

### Task 3: runEnrich — đề xuất, áp qua SQL, hàng duyệt, dry; gỡ UPDATE thẳng

**Files:**
- Create: `agent/src/enrich/run.ts`
- Modify: `agent/scripts/enrich-run.ts` (thành CLI mỏng: parse `--dry`, `LIMIT`; gọi `runEnrich`; in tổng kết gồm `xung đột E1/LLM: <n>`)
- Modify: `agent/src/agents/enrich-text.ts:1-4` (comment đầu: bỏ «Output → UPDATE sale_offers + properties», thay bằng «Output → enrichment_proposals (agent/src/enrich/run.ts)»)
- Create: `agent/tests/enrich-db.test.ts`, `agent/tests/enrich-guard.test.ts`

**independent:** false (cần Task 1, 2) · **Phục vụ:** E1, E2, E4, E5, E7, E9, E11 · **Verify:** `cd agent && npm test && npx tsc --noEmit -p . 2>&1 | grep -E "src/enrich|scripts/enrich-run|tests/enrich" ; test $? -eq 1`

**Interfaces:**
- Consumes: Task 1 hàm SQL; Task 2 `routeFields`, `summarizeRun`, `llmFieldsFromEnrich`.
- Produces: `runEnrich(opts: { client: pg.Client; runId: string; dry: boolean; limit: number; offerIds?: string[]; llm: (text: string, ctx: ContextResult) => Promise<{ result: EnrichResult | null; model: string; tracePath: string | null }>; resolve: (groupName: string|null, text: string) => Promise<ContextResult>; buildings?: BuildingNode[] }): Promise<{ routed: Routed[][]; summary: ReturnType<typeof summarizeRun>; reviewIds: number[] }>`. `offerIds` giới hạn tập offer (test dùng). `llm`/`resolve` tiêm vào để test không gọi model.
- `scanDirectWrites(files: { path: string; text: string }[]): string[]` (trong `enrich-guard.test.ts` hoặc `agent/src/enrich/guard.ts`) — trả `'<tệp>:<dòng>'` cho mỗi dòng khớp `/UPDATE\s+(sale_offers|properties)\b/i`.

Luồng `runEnrich` mỗi offer: `resolve` → `llm` (khi `needsLLM`) → `routeFields` → INSERT đề xuất `ON CONFLICT (offer_id, field, value_key, source) DO NOTHING` (status: direct/corroborated → `queued` rồi áp ngay; superseded → `superseded`; review → `queued`) → `apply_enrichment` cho id direct/corroborated (actor `'enrich-run:'+runId`) → đề xuất review còn `queued` và chưa gắn thẻ `pending` → tìm thẻ `pending` `enrich:<offer_id>` hoặc tạo mới; gắn `review_id`; dựng lại `evidence` từ mọi đề xuất `queued` của thẻ (`{offer_id, text≤300, group_name, run_id, model, trace_path, fields:[{proposal_id,field,value,confidence}]}`), `ai_suggestion='apply'`, `ai_confidence`=max confidence. Đề xuất `queued` mà thẻ cũ `deferred` → gắn sang thẻ `pending` mới. `dry=true` → không INSERT/UPDATE/gọi hàm nào; chỉ trả `routed`.

- [ ] **Step 1: Test đỏ `enrich-guard.test.ts`:** `AC-1 không ghi thẳng` — quét thật `agent/src/**/*.ts`, `agent/scripts/**/*.ts` → `[]`; chiều đỏ cùng bộ quét: tệp tạm chứa `UPDATE sale_offers SET` → `['<tệp>:1']`, ghim `'ghi thẳng: '`.
- [ ] **Step 2: Test đỏ `enrich-db.test.ts`** (dùng `withTx`, `insertOffer`, `insertProperty`; `llm` stub trả output lấy từ `fixtures/llm-outputs.json`; `resolve` stub; `offerIds` = offer của ca):
  - `AC-2 E1 áp thẳng kèm nguồn` (+ offer không property cùng lượt).
  - `AC-4 LLM không căn cứ vào hàng duyệt`: `sale_offers` không đổi; 1 thẻ pending; `evidence.fields` đủ khoá. Chiều đỏ: thêm field E1 → field E1 áp, thẻ chỉ liệt field LLM.
  - `AC-5 duyệt áp fill-gap + cascade (nối liền)`: id thẻ lấy từ `reviewIds` của lượt → `decide_enrichment_review(id,'approved','test')` → applied = queued trước > 0. Chiều đỏ: `UPDATE enrichment_proposals SET review_id=NULL` trước khi duyệt → trả 0, assert ghim `'AC-5 thẻ không trỏ đề xuất'`.
  - `AC-6 bỏ/để sau`: rejected → chạy lại cùng LLM (`'Apartment'` sau khi bác `'apartment'`) → 0 đề xuất mới, 0 thẻ mới; deferred → chạy lại → đúng 1 thẻ pending mới gắn các đề xuất cũ.
  - `AC-8 chạy lại + dry`: hai lượt → đếm đề xuất + thẻ pending bằng nhau; `dry` → md5 theo dòng (`md5(row(...)::text)`) của các cột liệt trong E9 trước = sau. Chiều đỏ: một `dry` giả trong test chạy `UPDATE sale_offers SET bedrooms=1` → so băm khác, ghim `'AC-8 dry đã ghi'`.
- [ ] **Step 3:** `npm test` → FAIL.
- [ ] **Step 4:** Viết `run.ts`; viết lại `scripts/enrich-run.ts` (giữ cách lấy offer backlog hiện tại, `runId = 'enrich-' + ISO`, `llm` thật bọc `runAgent(enrichTextAgent, …)` + `parseEnrichOutput`, `tracePath` từ kết quả runAgent); sửa comment `enrich-text.ts`.
- [ ] **Step 5:** `npm test` → PASS; phá-thử từng chiều đỏ đã ghi ở Step 1–2; `npx tsc` không thêm lỗi ở tệp của task.
- [ ] **Step 6:** Chạy thật `cd agent && npx tsx scripts/enrich-run.ts --dry` (LIMIT mặc định) → in bảng định tuyến, kiểm DB không đổi (đếm `enrichment_proposals` = 0).
- [ ] **Step 7: Commit** `feat(agent): enrich-run đi qua enrichment_proposals — gỡ UPDATE thẳng`.

### Task 4: Route decide + thẻ agent_output + test render app

**Files:**
- Modify: `app/src/app/api/v1/ops/review/[id]/decide/route.ts` (thêm nhánh sau nhánh `entity_match`)
- Modify: `app/src/components/ops/review-card.tsx`
- Modify: `app/package.json` (devDependency `tsx`; script `"test": "node --import tsx --test tests/*.test.tsx"`)
- Create: `app/tests/review-card.test.tsx`

**independent:** false (dùng tên hàm SQL của Task 1) · **Phục vụ:** E6, E10 · **Verify:** `cd app && npm test && npx tsc --noEmit && npm run lint`

**Interfaces:**
- Consumes: `decide_enrichment_review(bigint, text, text)` (Task 1).
- Route: trong transaction hiện có, khi `item.item_type === 'agent_output' && item.item_id.startsWith('enrich:')` → `SELECT decide_enrichment_review($1,$2,$3)` với `(id, status, 'hitl:' + (user?.id ?? 'api'))`; audit giữ nguyên.
- `ReviewCard({ item })`: `item.item_type === 'entity_match'` → thẻ hiện tại (không đổi); `'agent_output'` → `AgentOutputCard`; loại khác → khung tiêu đề + dòng `«<item_type>» chưa có giao diện duyệt`. `ReviewItem.evidence` đổi thành `Record<string, unknown>`, mỗi nhánh tự thu hẹp kiểu.
- `AgentOutputCard`: đoạn tin, bảng `Trường · Giá trị đề xuất · AI tự tin`, nút `Áp dụng`(approved) `Bỏ`(rejected) `Để sau`(deferred) → cùng `decide()` hiện có; `evidence.fields` thiếu/rỗng → dòng `Thẻ thiếu dữ liệu đề xuất` và không nút. Nhãn badge sau quyết: `Đã áp` / `Đã bỏ` / `Hoãn`.

- [ ] **Step 1: Test đỏ `app/tests/review-card.test.tsx`** (jsdom + `react-dom/client` + `act`, `globalThis.fetch` giả ghi body, `next/navigation` giả bằng module mock hoặc bọc `useRouter` — chọn cách tối thiểu chạy được dưới `node --import tsx`):
  - `AC-9 thẻ agent_output`: hiện đoạn tin, đủ hàng field, 3 nút; bấm từng nút → POST `/api/v1/ops/review/7/decide` body `{"status":"approved"|"rejected"|"deferred"}`.
  - `AC-9 entity_match không đổi`: hiện `Tin A`, `Tin B`, nút `Cùng căn`.
  - `AC-9 loại lạ`: `item_type:'data_quality'` → chứa `chưa có giao diện duyệt`, không ném.
  - `AC-9 thiếu fields` (chiều đỏ): evidence không `fields` → `Thẻ thiếu dữ liệu đề xuất`, không nút, ghim `'AC-9'`.
- [ ] **Step 2:** `cd app && npm i -D tsx && npm test` → FAIL.
- [ ] **Step 3:** Sửa `review-card.tsx` và `route.ts`.
- [ ] **Step 4:** `npm test` PASS; `npx tsc --noEmit` + `npm run lint` 0 lỗi; phá-thử: bỏ nhánh loại lạ → ca `loại lạ` đỏ; hoàn lại.
- [ ] **Step 5: Commit** `feat(ops): thẻ duyệt agent_output + route decide áp đề xuất enrichment`.

### Task 5: Chặn PII lên cloud + cập nhật tài liệu

**Files:**
- Create: `pipeline/scripts/sync-cloud-pii.test.mjs`
- Modify: `docs/research/enrichment-agent-design.md` (§3 «Output →», §3 pipeline tích hợp, §5 E3: thay đường UPDATE/ngưỡng bằng đường đề xuất → luật xác định → /ops/review; trỏ spec vòng này)
- Modify: `docs/ROADMAP.md` (§2.2 thêm tầng `enrichment_proposals` trước canonical; §4 Track 1 thêm dòng «enrich qua đề xuất ✅» sau khi vòng ký)

**independent:** true · **Phục vụ:** E12, E13 · **Verify:** `cd pipeline && npm test`

**Interfaces — Produces:** `readFillList(source: string): string[]` (trong tệp test) — rút mảng `const FILL = [ … ]` bằng regex từ nội dung `sync-cloud.mjs`; ném lỗi ghim `'không tìm thấy FILL'` khi không khớp.

- [ ] **Step 1: Test** `AC-10 PII không lên cloud`: `readFillList(thật)` không chứa `enrichment_proposals`, `review_queue`, và có `sale_offers` (đối chứng dương: bộ đọc đọc ra danh sách thật). Chiều đỏ cùng bộ đọc: chuỗi thật + chèn `"enrichment_proposals",` vào FILL → assert phát hiện, ghim `'PII: enrichment_proposals trong FILL'`.
- [ ] **Step 2:** `cd pipeline && npm test` → PASS (không cần sửa `sync-cloud.mjs`); phá-thử chiều đỏ đã nằm trong test.
- [ ] **Step 3:** Sửa hai tài liệu.
- [ ] **Step 4: Commit** `test(pipeline): chặn bảng đề xuất lên cloud + docs: đường enrichment mới`.

## Thứ tự

Task 1 → (Task 2 ∥ Task 5) → Task 3 → Task 4 → `status: implemented` → S4.
