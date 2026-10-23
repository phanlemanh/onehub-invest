# enrich-hau-ky Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đề xuất enrich sống qua nạp lại S03/S05, có hàm hoàn tác một lượt áp kèm audit, và luật E1 thôi suy `land` từ tên nhóm.

**Architecture:** Hai migration mới (036 hoàn tác, 039 khoá ngoại RESTRICT + hàm đối soát) là nguồn duy nhất của logic ghi; `pipeline/lib/write-offers.mjs` thay câu DELETE toàn nguồn của hai transform; `agent/scripts/enrich-revert.ts` là CLI người gọi; luật loại BĐS tách thành hàm thuần trong `context-resolver.ts`.

**Tech Stack:** PostgreSQL 16 + PostGIS (plpgsql), Node .mjs (pipeline, `node --test`), TypeScript strict (agent, `node --import tsx --test`), `pg`.

**Spec:** `docs/superpowers/specs/2026-10-23-enrich-hau-ky-design.md` · hợp đồng `_acceptance/enrich-hau-ky/contract.md` (AC-1…AC-10) · `evals.yaml` (E1…E10). Cổng Phạm vi: Hỏi-1…4 theo khuyến nghị.

## Global Constraints

- Migration mới là file mới, idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP … IF EXISTS` trước `ADD CONSTRAINT`); không sửa 033. Đầu file: tên, mục đích, nguồn, `KHÔNG sync cloud (PII tầng A)`.
- Số 039 do điều phối liên làn cấp (037 thuộc phiên RLS, 038 sync_stage); merge 036 trước 039.
- Không áp migration lên DB local/cloud thật; mọi test DB chạy trong `BEGIN … ROLLBACK`, nạp migration trong transaction sau `pg_advisory_xact_lock(33033)`.
- Không câu `UPDATE sale_offers|properties` trong `agent/src`, `agent/scripts` (AC-1 vòng trước, `enrich-guard.test.ts`) — CLI chỉ gọi hàm SQL.
- Actor hoàn tác: regex `^hitl:.+`; lý do: `length(trim(p_reason)) > 0`.
- `property_type` trống = `'unknown'`. `ops_audit.env = 'local'`. Ảnh chụp audit bỏ `evidence.text` và không mang cột người bán.
- Chữ comment domain tiếng Việt; tên code tiếng Anh.

## Review Focus

1. Lượt nạp rỗng (stg lỗi lọc, query trả 0 tin) — đối soát sẽ xoá mọi offer của nguồn. Kỳ vọng: `writeOffers` từ chối khi `offers.length === 0`, không ghi gì. Test ở Task 2.
2. Hai offer cũ X1 (rejected) và X2 (queued) cùng đổ về một Y với cùng khoá — kỳ vọng: còn một dòng, `rejected`. Test ở Task 2.
3. `--ids` chứa id không tồn tại — kỳ vọng: bỏ qua lý do `not-found`, id còn lại vẫn hoàn tác. Test ở Task 1 (SQL) + Task 3 (CLI dry in dòng `not-found`).
4. Transform mới chạy trên DB chưa áp 039 — kỳ vọng: dừng trước khi ghi, thông điệp «chưa áp migration 039». Test ở Task 2 (AC-5).
5. Hoàn tác giá trị `street_raw` mà căn có offer khác cùng mang giá trị đó — kỳ vọng: `properties.street` giữ. Test ở Task 1 (cặp hai chiều).

---

### Task 1: Migration 036 — `revert_enrichment`

**Phục vụ:** E6, E10 (một nửa) · `independent: false` (đầu chuỗi — các task sau nạp 036)

**Files:**
- Create: `db/migrations/036_revert_enrichment.sql`
- Modify: `agent/tests/helpers/db.ts` (nạp 033 → 036 → 039 nếu file tồn tại; export `MIGRATIONS: string[]` đường dẫn đã nạp)
- Test: `agent/tests/enrich-revert.test.ts`

**Interfaces:**
- Produces (SQL): cột `enrichment_proposals.reverted_by text`, `reverted_at timestamptz`, `revert_reason text`; CHECK `status` thêm `'reverted'` (tên ràng buộc `enrichment_proposals_status_check`); hàm `revert_enrichment(p_ids bigint[], p_actor text, p_reason text) RETURNS integer`; dòng `ops_audit(action='enrich:revert', detail={reason, reverted:[{id,offer_id,field,value}], skipped:[{id,why}], reopened:[id]})`.
- Lý do bỏ qua: `not-found` · `not-applied` · `value-changed`.

- [ ] **Step 1: Viết test đỏ** `agent/tests/enrich-revert.test.ts`:
  - `AC-6 ma trận hiệu ứng ngược` — mảng viết trước 5 dòng `{field, value, soCol, propCol|null}`: `property_type/'house'/property_type/null`, `bedrooms/'3'/bedrooms/bedrooms`, `bathrooms/'2'/bathrooms/bathrooms`, `street_raw/'Quang Trung'/street_raw/street`, `block_raw/'S1.03'/block_raw/null`. Mỗi dòng: offer có căn liên kết, `insertProposal` + `apply_enrichment` → `revert_enrichment([id],'hitl:test','thử')` = 1 → `sale_offers.<soCol>` là `'unknown'` (property_type) hoặc NULL; `propCol` khác null → căn NULL; `properties.property_type` không đổi. `assert.equal(rows.length, 5)`; thông điệp `AC-6 ma trận: <bảng>.<cột>`.
  - `AC-6 land thật` — `runEnrich` với E1 tiêm `land` và `llmWith(null)` → land applied; chèn thêm đề xuất `e2_llm house` trạng thái `superseded` cho cùng offer; revert → `reverted`, `reverted_by='hitl:test'`, `revert_reason`, house thành `queued`+`review`; `enrichment_log` có `src='enrich-revert'`; đúng 1 dòng `ops_audit action='enrich:revert'`.
  - `AC-6 căn giữ khi offer khác mang` — hai offer cùng căn cùng street; revert một → `properties.street` giữ; đối chứng: chỉ một offer → NULL.
  - `AC-6 bỏ qua` — `value-changed` (sửa tay giá trị sau khi áp), `not-applied` (đề xuất queued), `not-found` (id 0): trả 0, `detail.skipped[].why` đúng.
  - `AC-6 chỉ người` — actor `'enrich-run:x'` và lý do `'  '` → `assert.rejects`, hash `md5(string_agg(t::text))` của enrichment_proposals/sale_offers/ops_audit không đổi; thông điệp `AC-6 máy hoàn tác không cần người`.
  - `AC-6 gọi lại` → 0, thêm một dòng audit.
- [ ] **Step 2:** `cd agent && node --import tsx --test tests/enrich-revert.test.ts` → FAIL (hàm không tồn tại).
- [ ] **Step 3:** Viết `036_revert_enrichment.sql` theo design §2.2 (ALTER ADD COLUMN IF NOT EXISTS; DROP CONSTRAINT IF EXISTS + ADD CHECK; CREATE OR REPLACE FUNCTION). So giá trị: `lower(<col>::text) = r.value_key`. Căn: `UPDATE properties … SET <col> = NULL WHERE <col>::text = r.value AND NOT EXISTS (offer khác của căn mang giá trị đó)`.
- [ ] **Step 4:** chạy lại → PASS; `cd agent && npm test` xanh (các ca vòng trước không đổi).
- [ ] **Step 5:** commit `feat(db): 036 revert_enrichment — hoàn tác một lượt áp qua audit`.

### Task 2: Migration 039 + `writeOffers` — nạp lại không xoá đề xuất

**Phục vụ:** E1, E2, E3, E4, E5 · `independent: false` (cần Task 1)

**Files:**
- Create: `db/migrations/039_enrichment_proposals_retain.sql`
- Create: `pipeline/lib/write-offers.mjs`
- Modify: `pipeline/transform-zalo.mjs:199-230`, `pipeline/transform-fb.mjs:113-140` (thay DELETE + vòng INSERT bằng `BEGIN` → `writeOffers` → `COMMIT`, ROLLBACK khi lỗi)
- Test: `pipeline/scripts/write-offers.test.mjs`

**Interfaces:**
- Consumes: hàm `apply_enrichment` (033), trạng thái `reverted` (036).
- Produces (SQL): FK `enrichment_proposals_offer_id_fkey … ON DELETE RESTRICT`; `reconcile_stale_offers(p_source text, p_live text[], p_actor text) RETURNS jsonb` = `{stale, moved, merged, reapplied, retired, pairs:[{from,to}]}`; audit `enrich:reconcile` (mọi lượt có offer cũ) và `enrich:retire` (detail `{offers:[{offer_id, enriched:{property_type,bedrooms,bathrooms,street_raw,block_raw}}], proposals:[<dòng trừ evidence.text>]}`).
- Produces (JS): `export async function writeOffers(client, source, offers, { actor = \`transform:${source}\` } = {})` → `{ upserted: number, reconcile: object }`. `offers` là mảng object khoá = tên cột sale_offers (có `offer_id`). Cột làm mới khi trùng: mọi khoá có mặt trừ `offer_id`, `source` và `ENRICH_COLS = ['property_type','street_raw','block_raw','bathrooms']`; `bedrooms = COALESCE(EXCLUDED.bedrooms, sale_offers.bedrooms)`. Từ chối: `offers.length === 0` → `Error('writeOffers: lượt nạp rỗng — không đối soát')`; thiếu hàm → `Error('writeOffers: chưa áp migration 039 (thiếu hàm reconcile_stale_offers)')`, cả hai trước mọi lần ghi. Export thêm `scanDeleteAll(files: {path,text}[]) → string[]` ('<tệp>:<dòng>' cho mỗi `DELETE FROM sale_offers`).
- Thứ hạng «đã quyết» (AC-3): applied=rejected=reverted (2) > queued=superseded=skipped (1); ngang → giữ dòng của Y. Offer kế: chung nhiều post nhất, hoà → `offer_id` nhỏ nhất.

- [ ] **Step 1: Viết test đỏ** (nguồn `'TST'`, `withTx` riêng của pipeline nạp 033/036/039 trong transaction; helper `seed(c, {offer_id, post_ids, ...})`):
  - `AC-1 nạp lại giữ đề xuất` — ảnh chụp `(id,status,decided_by,review_id)` bằng nhau; field enrich giữ; `n_reposts`/`post_ids` mới. Chiều đỏ: hàm `legacyWrite` (DELETE toàn nguồn + INSERT) trên cùng fixture → `assert.rejects` mã `23503` hoặc mất đề xuất, ghim `AC-1 nạp lại làm mất đề xuất`.
  - `AC-2 offer kế` + ba biến thể (Y có thẻ chờ → `runEnrich` từ `../../agent/src/enrich/run.ts` không import được từ .mjs → thay bằng assert: thẻ X `deferred`, đề xuất `review_id` trỏ thẻ không pending; ca gắn vào thẻ Y đo ở agent Task 4), Y đã có giá trị → `skipped`, tách p1/p2/p3 và hoà. Chiều đỏ: Y không chung post → không chuyển, ghim `AC-2 chuyển nhầm sang offer không chung post`.
  - `AC-3 trùng khoá` — ma trận 4 ô viết trước + ca Review Focus 2 (X1 rejected, X2 queued → rejected); `assert.equal(cells.length, 4)`.
  - `AC-4 offer không kế` + round-trip `jsonb_populate_recordset`; assert ảnh chụp không có `text`, không có `seller_phone`.
  - `AC-5 khoá ngoại RESTRICT` (mã 23503 + đối chứng offer không đề xuất xoá được) · `AC-5 transform không DELETE` (`scanDeleteAll` trên hai file thật = [], đối chứng chuỗi mẫu) · `AC-5 thiếu 039` (DROP FUNCTION trong tx) · Review Focus 1 (mảng rỗng).
- [ ] **Step 2:** `cd pipeline && node --test scripts/write-offers.test.mjs` → FAIL.
- [ ] **Step 3:** Viết 039 (DROP CONSTRAINT IF EXISTS + ADD FK RESTRICT; hàm đối soát gọi `apply_enrichment` cho đề xuất applied đã chuyển sau khi đặt lại `queued`), `write-offers.mjs`, sửa hai transform.
- [ ] **Step 4:** test PASS; `cd pipeline && npm test` xanh.
- [ ] **Step 5:** commit `feat(pipeline): nạp lại S03/S05 không xoá đề xuất — 039 + writeOffers`.

### Task 3: CLI `enrich-revert`

**Phục vụ:** E7 (CLI) · `independent: false` (cần Task 1)

**Files:**
- Create: `agent/scripts/enrich-revert.ts`
- Test: `agent/tests/enrich-revert.test.ts` (thêm ca)

**Interfaces:**
- Produces: `export async function main(argv: string[], client?: pg.Client, out: (s: string) => void = console.log): Promise<number>`; cờ `--ids 1,2` (số nguyên dương, bỏ khoảng trắng), `--actor`, `--reason`, `--dry`. Không client → tự mở theo `DATABASE_URL` và tự `BEGIN/COMMIT`; có client → không quản transaction. Lỗi tham số → in `thiếu --actor` / `thiếu --reason` / `--ids không hợp lệ`, trả 2. `--dry`: mỗi id một dòng `<id> <field>: <hiện tại> → <sẽ thành> | bỏ qua: <lý do>`, chỉ SELECT. Chạy thật: `SELECT revert_enrichment($1::bigint[], $2, $3)`.

- [ ] **Step 1: Test đỏ** `AC-7 CLI hoàn tác`: đường thật với client trong tx (hai trong ba id → `reverted`, id thứ ba giữ; `ops_audit.actor='hitl:test'`); `--dry` hash không đổi + 3 dòng in; thiếu cờ → 2; tiến trình con `npx tsx scripts/enrich-revert.ts` không cờ → mã ≠ 0.
- [ ] **Step 2:** FAIL → **Step 3:** viết CLI (guard `import.meta.url === pathToFileURL(process.argv[1]).href`) → **Step 4:** PASS + `npm test` (gồm `enrich-guard` AC-1) → **Step 5:** commit `feat(agent): CLI enrich-revert`.

### Task 4: Luật E1 loại BĐS + hai ca thật + đất nền

**Phục vụ:** E7 (sau hoàn tác), E8, E9, E2 (biến thể thẻ Y) · `independent: false` (cần Task 1, 2)

**Files:**
- Modify: `agent/src/agents/context-resolver.ts:103-128` (tách `export function resolvePropertyType(text: string, groupName: string | null): { type: string; basis: string } | null`; `resolveContext` gọi nó)
- Create: `agent/tests/fixtures/e1-land-cases.json` (2 tin thật design §2.3, bỏ dòng liên hệ, tên nhóm che phần riêng)
- Create: `agent/tests/context-resolver.test.ts`
- Modify: `agent/tests/enrich-db.test.ts:304-310` (ca AC-7/AC-11 cũ dùng E1 tiêm `resolveWith({propertyType:'land', typeBasis:'luật từ khoá: «đất» trong tên nhóm «…» → land'})` thay cho `resolveContext`; bỏ assert «luật E1 thật vẫn ra land»; giữ tên ca)
- Modify: `agent/tests/enrich-revert.test.ts` (ca `AC-7 sau hoàn tác`)

**Interfaces:**
- Luật (Hỏi-4 khuyến nghị): land chỉ từ tin, regex `LAND_IN_TEXT = /đất nền|nền đất|lô đất|bán đất|đất thổ cư|thửa đất|đất ở|đất vườn|đất trống|đất dự án/` trên tin đã thay `/nhà đất|bất động sản/g` bằng khoảng trắng; phủ quyết `MULTI_STOREY = /\d+\s*(tầng|lầu)|trệt|\d+\s*(pn|phòng ngủ)/`; loại khác: vòng TYPE_RULES cũ (bỏ land) trên chuỗi ghép; kết quả khớp ở tên nhóm mà tin có land → land thắng. Căn cứ giữ khuôn `luật từ khoá: «<khớp>» trong tin|tên nhóm «…» → <type>`.

- [ ] **Step 1: Test đỏ** `context-resolver.test.ts`:
  - `AC-8 E1 không suy land từ tên nhóm` — 2 ca `e1-conflict-cases.json` + tin «Bán gấp, giá tốt, liên hệ xem nhà» cùng `group_name` → `!== 'land'`; `runEnrich` (withTx, resolveContext thật, LLM thật house) → 0 đề xuất `e1_rule property_type`, LLM `queued/review`, `property_type='unknown'`. Chiều đỏ: `legacyType` (chép đóng băng luật cũ trong test) cùng fixture → `'land'`, ghim `AC-8 suy land từ tên nhóm`.
  - `AC-9 E1 đất từ nội dung tin` — ma trận 5 dòng viết trước (design §2.3 + AC-9), `assert.equal(rows.length, 5)`.
  - `AC-9 chỉ land đổi` — đọc DB local (chỉ SELECT, cùng câu chọn của `measure`): mọi cặp `legacyType ≠ resolvePropertyType` có `land` ở một phía; số cặp khác > 0. Chiều đỏ: biến thể quét-tin-trước (hàm trong test) → có cặp không land, ghim `AC-9 đổi loại không phải land`. Chiều đỏ phủ quyết: bản bỏ `MULTI_STOREY` → dòng 3 đỏ, ghim `AC-9 phủ quyết nhiều tầng`.
  - `enrich-revert.test.ts` `AC-7 sau hoàn tác` (2 tin thật): land áp qua E1 tiêm → revert → `runEnrich` resolveContext thật + LLM thật → 0 land mới, 1 thẻ chờ có house, `unknown`. Chiều đỏ: `DROP INDEX enrichment_proposals_uq` trong tx rồi E1 tiêm land → có land mới, ghim `AC-7 luật đẩy lại giá trị đã hoàn tác`.
  - Ca `AC-2` Y có thẻ chờ: dựng X, Y bằng `insertOffer`, gọi thẳng `SELECT reconcile_stale_offers('S03', ARRAY[Y], 'test')` (không import .mjs từ TS) rồi `runEnrich` trên Y → đúng 1 thẻ chờ chứa đề xuất của X.
- [ ] **Step 2:** FAIL → **Step 3:** sửa `context-resolver.ts`, fixture, `enrich-db.test.ts` → **Step 4:** `cd agent && npm test` xanh → **Step 5:** commit `fix(agent): E1 không suy land từ tên nhóm — chỉ từ nội dung tin`.

### Task 5: Idempotent 036/039 + tài liệu

**Phục vụ:** E10 · `independent: false` (cần Task 1, 2)

**Files:**
- Test: `agent/tests/enrich-revert.test.ts` (ca `AC-10 migration idempotent`)
- Modify: `docs/ROADMAP.md` §2 as-built + §4 trạng thái; `docs/ops/runtime-map.md` (thứ tự áp 036→039 trước lượt nạp đêm)

- [ ] **Step 1:** Test: trong tx áp 036, 039 hai lần; md5 (cột public + `pg_get_functiondef` hai hàm + `pg_get_constraintdef` ràng buộc enrichment_proposals) và đếm bốn bảng bằng nhau; 0 dòng trùng. Chiều đỏ: chuỗi mẫu `ALTER TABLE enrichment_proposals ADD CONSTRAINT t_x CHECK (true)` áp hai lần → lần 2 lỗi, ghim `AC-10 không idempotent: <tệp>`.
- [ ] **Step 2:** PASS → cập nhật hai tài liệu → `/verify` → commit `docs: enrich-hau-ky as-built + thứ tự áp 036/039`.
