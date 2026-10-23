# cloud-sync-atomic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `pipeline/sync-cloud.mjs` đẩy local → Supabase mà prod không bao giờ đọc thấy bảng rỗng/thiếu: nạp vào `sync_stage.rows` (jsonb) rồi tráo trong MỘT giao dịch.

**Architecture:** Lõi thuần (kế hoạch FK, chọn cột, chia mẻ, dựng SQL tráo) + `syncOnce({ local, exec })` nhận `exec(sql)` — thật: Management API; thử: DB Postgres mô phỏng cloud trên :5433. Thước `pipeline/scripts/check-cloud-sync.mjs <ca>` dựng hai DB tạm (local mô phỏng + cloud mô phỏng) và chạy từng ca của evals.yaml.

**Tech Stack:** Node 24 ESM, `pg` 8, Postgres 16 + PostGIS (container `one-invest-db`), Supabase Management API.

**Spec:** `docs/superpowers/specs/2026-10-23-cloud-sync-atomic-design.md` · hợp đồng `_acceptance/cloud-sync-atomic/contract.md` (đã duyệt) · `_acceptance/cloud-sync-atomic/evals.yaml`.

## Global Constraints

- `export const FILL = [`, `export const PII_EXCLUDE = {`, dòng `properties: ["seller_name"],` và `RENAME` giữ nguyên hình dạng (test tĩnh `sync-pii*.test.mjs`, `scripts/check-ruler-views.sh static` grep chúng).
- Import `sync-cloud.mjs` không gọi mạng; `main()` chỉ chạy khi gọi trực tiếp (giữ khối `realpathSync`).
- Script KHÔNG gửi DDL nào lên cloud (không CREATE/ALTER/DROP/TRUNCATE); chỉ SELECT/INSERT/UPDATE/DELETE + `pg_advisory_xact_lock` + `pg_sleep` (móc thử).
- Thân SQL mỗi lời gọi Management API ≤ `CHUNK_BYTES = 1_800_000`; 413 đo được ở ~2,5–4MB.
- `SHRINK_MIN = 0.5`; `STALE_STAGE_HOURS = 2`; khoá advisory hằng `ADVISORY_KEY = 74210231`.
- `seller_ref` cloud = `source || ':' || substring(seller_ref from '([0-9]+)$')`, NULL khi không có số; gate: `^S0[1-9]:[0-9]+$`.
- Danh sách tên/định danh nguồn để soát (từ `source_registry.real_name`, `source_ids` local) không bao giờ nằm trong câu SQL gửi cloud hay log.
- Bộ phân tích kiểu cho client local: OID 1082 (date), 1114 (timestamp), 1182 (date[]), 1115 (timestamp[]) trả chuỗi nguyên văn.
- Thước chỉ chạm DB tạm trên :5433 (tiền tố `acc_cloudsync_`), tự xoá khi xong; không gọi cloud.
- Chữ log/WARN tiếng Việt; tên code tiếng Anh.

## Review Focus

- Dòng `areas` geometry đơn lẻ lớn (1,19MB JSON) — một dòng vượt `CHUNK_BYTES` phải báo lỗi có tên, không gửi mẻ rỗng (test ở Task 2 `chunkRows`).
- Dữ liệu chứa đúng thẻ dollar-quote của lượt → dừng có tên (Task 2 `dollarTag`).
- Bảng FILL rỗng ở cả local lẫn cloud (vd `asset_nodes` 0 dòng) — chặn tụt không chia cho 0, tráo vẫn chạy (Task 3 ca `fidelity` có một bảng rỗng).
- Cột `jsonb`/mảng `text[]`/`numeric` round-trip qua `jsonb_populate_record` không đổi md5 (Task 3 ca `fidelity`).
- Cloud trả 429/5xx giữa pha nạp → thử lại có lùi, quá 4 lần thì gãy pha `stage` và dọn staging (Task 3 test `mgmtExec` với fetch giả).

---

### Task 1: Migration `sync_stage` + khung thước + ca `stage`

**Files:**
- Create: `db/migrations/NNN_sync_stage.sql` (số xin ở sổ chung — chưa cấp thì dùng tên tạm `XXX_sync_stage.sql`, đổi tên trước commit cuối)
- Create: `pipeline/scripts/check-cloud-sync.mjs` (khung + ca `stage`)

**Interfaces:**
- Produces: migration tạo `sync_stage.rows(run_id text not null, tbl text not null, payload jsonb not null, staged_at timestamptz not null default now())` + index `(run_id, tbl)`, `sync_stage.swaps(run_id text primary key, read_at timestamptz not null, swapped_at timestamptz not null default now())`; `REVOKE ALL ON SCHEMA sync_stage FROM PUBLIC`, và trong khối `DO` chỉ khi role tồn tại: `REVOKE ALL ON SCHEMA/ALL TABLES IN SCHEMA sync_stage FROM anon, authenticated`. Idempotent.
- Produces (khung thước): `makeDb(name) → pg.Client`, `dropDb(name)`, `buildLocalSim() → name` (pg_dump bảng FILL + `source_registry` từ `oneinvest` sang DB tạm), `buildCloudSim({ withRoles, defaultAcl }) → name` (schema FILL đổi tên `airdna_*`→`ref_calib_*`, bỏ cột `properties.seller_name`, thêm `users`/`saved_markets` FK `ON DELETE CASCADE`, role `anon`/`authenticated` + `ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES/SCHEMAS TO anon, authenticated` khi `defaultAcl`, áp migration), `pass(msg)`, `fail(msg)`, thoát 0 khi không `fail`.

- [ ] **Step 1:** Viết ca `stage` trong `check-cloud-sync.mjs`: áp migration 2 lần trên DB có role + default ACL và trên DB không role; kiểm `has_schema_privilege('anon','sync_stage','USAGE') = false`, `has_table_privilege('anon','sync_stage.rows','SELECT') = false` (và `authenticated`); đối chứng dương `INSERT` bằng role chủ thành công; chụp catalog (`pg_class.relacl`, `pg_namespace.nspacl`, danh sách quan hệ) ngoài `sync_stage` trước/sau → bằng nhau; chiều đỏ: bản sao migration bỏ mọi dòng `REVOKE` → `anon` SELECT được → in `ĐỎ-ĐÚNG acl`.
- [ ] **Step 2:** Chạy `cd pipeline && node scripts/check-cloud-sync.mjs stage` → FAIL (chưa có migration).
- [ ] **Step 3:** Viết migration theo Interfaces.
- [ ] **Step 4:** Chạy lại → mọi dòng PASS, exit 0; DB tạm đã xoá (`\l` không còn `acc_cloudsync_`).
- [ ] **Step 5:** Commit `feat(db): NNN sync_stage — bảng tạm cho sync-cloud nguyên tử`.

**Verify:** `cd pipeline && node scripts/check-cloud-sync.mjs stage` · phục vụ E6 · `independent: true` (với Task 2)

### Task 2: Lõi thuần của `sync-cloud.mjs` + test đơn vị

**Files:**
- Modify: `pipeline/sync-cloud.mjs` (thêm export; chưa đổi `main`)
- Create: `pipeline/sync-cloud.test.mjs`
- Modify: `pipeline/package.json` (thêm `sync-cloud.test.mjs` vào script `test`)

**Interfaces:**
- Produces:
  - `CLOUD_ALLOW: { sale_offers: string[], sellers: string[], properties: string[] }` = cột local hiện có trừ `PII_EXCLUDE` (sale_offers 25 cột, sellers 6, properties 27).
  - `localTypes` — đối tượng `types` cho `new pg.Client({ types })`.
  - `selectList(table: string, localCols: string[]) → { sql: string, cols: string[], unapproved: string[] }` — `sql` là danh sách biểu thức SELECT (có biểu thức chuẩn hoá `seller_ref`), `unapproved` = cột local không thuộc `CLOUD_ALLOW` (chỉ ba bảng).
  - `planTables({ fill: string[], fks: {src,dst}[], pks: Record<string,string[]> }) → { insertOrder: string[], deleteOrder: string[], keep: Record<string,string[]> }` — tên cloud; `keep` = bảng FILL bị bảng ngoài FILL tham chiếu → khoá chính; FK tự tham chiếu bỏ qua khi sắp topo; vòng FK giữa hai bảng FILL → ném lỗi có tên.
  - `chunkRows(rows: object[], maxBytes: number) → string[]` — mỗi phần tử là mảng JSON; một dòng > `maxBytes` → ném `dòng quá lớn: <bytes>`.
  - `dollarTag(runId) → string` và `assertNoTag(text, tag)`.
  - `buildSwapSql({ runId, readAt, plan, counts, columns, pause }) → string` — đúng một chuỗi `BEGIN; … COMMIT;` theo design bước 5; `columns[table]` = cột chung local∩cloud (không generated); `pause` > 0 chèn `SELECT pg_sleep(<pause>);` ngay sau khối DELETE.
  - `scanSourceNames(jsonText: string, tokens: string[]) → string|null` — trả token trúng đầu tiên (không phân biệt hoa thường).
  - `CHUNK_BYTES`, `SHRINK_MIN`, `STALE_STAGE_HOURS`, `ADVISORY_KEY`.

- [ ] **Step 1:** Viết test (node:test) cho: `CLOUD_ALLOW ∩ PII_EXCLUDE = ∅` cho cả ba bảng; `selectList('sale_offers', [...,'seller_ref','new_col'])` → `unapproved` = `['new_col']`, `sql` chứa `substring("seller_ref" from '([0-9]+)$')` và không chứa `"seller_phone"`; `planTables` với FK của cloud đo 23/10 (`listings→areas`, `nights→listings`, `listing_stats→listings`, `property_offers→properties`, `properties→asset_nodes`, `ref_calib_scores→ref_calib_markets`, `saved_markets→areas`…) → `areas` trước `listings` trước `nights` trong `insertOrder`, `deleteOrder` là đảo, `keep` = `{ areas: ['id'] }`; vòng A↔B → ném `vòng FK`; `chunkRows` 3 dòng × 400 byte với `maxBytes=1000` → 2 mẻ, dòng 2000 byte → ném `dòng quá lớn`; `assertNoTag` ném khi text chứa thẻ; `buildSwapSql` → bắt đầu `BEGIN;`, kết thúc `COMMIT;`, có `pg_advisory_xact_lock(74210231)`, `DELETE FROM "nights"` đứng trước `INSERT INTO "nights"`, `ON CONFLICT ("id") DO UPDATE` cho `areas`, có `pg_sleep(2)` khi `pause: 2` và không có khi `pause: 0`, không chứa `TRUNCATE`/`CREATE`/`DROP`/`ALTER`; `scanSourceNames('{"a":"X-Foo:1"}', ['x-foo'])` → `'x-foo'`, với `[]` → `null`; `localTypes` trả `'2026-10-01'` nguyên văn cho OID 1082.
- [ ] **Step 2:** `cd pipeline && node --test sync-cloud.test.mjs` → FAIL (export chưa có).
- [ ] **Step 3:** Cài các export trong `sync-cloud.mjs`.
- [ ] **Step 4:** `cd pipeline && npm test` → PASS toàn bộ (gồm `sync-pii*.test.mjs`).
- [ ] **Step 5:** Commit `feat(pipeline): lõi thuần sync-cloud nguyên tử — kế hoạch FK, cột cho phép, SQL tráo`.

**Verify:** `cd pipeline && npm test` · phục vụ E8a (và nền cho E1–E7, E11) · `independent: true` (với Task 1)

### Task 3: `syncOnce` + `main` mới + bảy ca thước

**Files:**
- Modify: `pipeline/sync-cloud.mjs` (thay `main`, thêm `syncOnce`, `mgmtExec`, bỏ `restInsert`/TRUNCATE)
- Modify: `pipeline/scripts/check-cloud-sync.mjs` (ca `atomic`, `fail`, `fidelity`, `keep`, `pii`, `overlap`, `allow`)
- Modify: `pipeline/sync-cloud.test.mjs` (test `mgmtExec` thử lại với fetch giả)

**Interfaces:**
- Consumes: mọi export của Task 2; migration + khung thước của Task 1.
- Produces:
  - `mgmtExec(token, { fetchImpl = fetch, retries = 4 }) → (sql: string) => Promise<object[]>` — 429/5xx thử lại lùi 1s·2ⁿ; lỗi khác ném nguyên văn 300 ký tự đầu.
  - `syncOnce({ local: pg.Client, exec, log = console.log, runId?, swapPause = 0, sourceTokens? }) → Promise<{ runId, total, timings: Record<'catalog'|'read'|'stage'|'swap'|'gate', number> }>` — các pha theo design bước 1–8; lỗi ném `Error` có `phase ∈ {catalog, read, scan, stage, shrink, swap, gate}`; đường lỗi pha `stage`/`swap` xoá `sync_stage.rows WHERE run_id = …` trước khi ném lại.
  - `main()` = đọc creds, `syncOnce({ exec: mgmtExec(token) })`, in timings + tổng; lỗi in `SYNC FAIL [<phase>]: …` và exit 1; leak gate fail exit 1.
- Thước — mỗi ca dựng localsim + cloudsim mới, seed một lượt lành rồi:
  - `atomic`: sửa localsim (xoá 1 dòng mỗi bảng có ≥2 dòng) → kiểm số dòng mới ≠ cũ cho mọi bảng + 2 view; luồng đọc (client riêng, `REPEATABLE READ` mỗi lần) đếm mọi bảng mỗi 50ms, gắn pha qua `pg_stat_activity` (có giao dịch đang giữ `pg_advisory_xact_lock` ⇒ «tráo-mở»); `syncOnce({ swapPause: 2 })`; bảng pha × trạng thái; chiều đỏ (i) bộ nạp kiểu cũ ngay trong thước: `TRUNCATE … CASCADE` rồi `INSERT` từng bảng có `pg_sleep(0.3)` giữa các bảng; (ii) chính `buildSwapSql` bỏ `BEGIN;`/`COMMIT;`, gửi từng câu riêng.
  - `fail`: (a) `exec` bọc ném ở mẻ thứ 3 pha nạp; (b) `ALTER TABLE listings ADD COLUMN must_have int NOT NULL` trên cloudsim; (c) cloudsim không áp migration, `exec` ghi nhật ký mọi câu; (d) chạy sync trong tiến trình con, `kill -9` khi `sync_stage.rows` có ≥1 dòng, `UPDATE sync_stage.rows SET staged_at = now() - interval '3 hours'` cho run đó, chèn 1 dòng run khác `staged_at = now() - interval '10 minutes'`, chạy lượt lành; đối chứng md5 đổi sau lượt lành.
  - `fidelity`: md5 `string_agg(row_to_json(x)::text ORDER BY …)` trên cột gửi cho 21 bảng; min/max mọi cột date; chiều đỏ đọc localsim bằng client không `localTypes`; lệch schema (i) `ALTER TABLE cloud.listings DROP COLUMN last_seen` → WARN nêu `listings.last_seen`; (ii) `ADD COLUMN gen int GENERATED ALWAYS AS (1) STORED`, `ADD COLUMN extra text DEFAULT 'cloud'` → lượt lành, `extra` vẫn `'cloud'`.
  - `keep`: chèn `users` + 3 `saved_markets` trỏ 3 area có ở localsim; sync → 3 dòng còn; `DELETE` 70% `areas` của localsim (sau khi gỡ phụ thuộc trong localsim) → thoát pha `shrink`, md5 không đổi; xoá 1 area khỏi localsim (cùng dòng phụ thuộc) → `saved_markets` trỏ nó bị xoá, 2 dòng còn; chiều đỏ bộ nạp kiểu cũ → `saved_markets` = 0 (`ĐỎ-ĐÚNG cascade`).
  - `pii`: `exec` bọc chụp mọi payload `sync_stage.rows` của `sale_offers`/`sellers`/`properties` → không khoá `seller_phone`, `seller_name`, (`sellers`) `name`; đối chứng có `offer_id`; chiều đỏ: chép `sync-cloud.mjs` sang thư mục tạm (symlink `node_modules`), xoá `"seller_phone", ` khỏi `PII_EXCLUDE` và khỏi kiểm giao, import bản sao → payload có `seller_phone` (`ĐỎ-ĐÚNG pii`).
  - `overlap`: hai `syncOnce` song song (A đọc trước, giữ pha nạp lâu hơn bằng `exec` chậm), localsim đổi giữa hai lần đọc; luồng đọc 0 lần «0»; A bị từ chối pha `swap` «cũ hơn lượt đã tráo»; cloud khớp lần đọc của B; 0 dòng staging.
  - `allow`: payload ba bảng chỉ cột `CLOUD_ALLOW`; `seller_ref` cloud NULL hoặc khớp gate, mã = `source`; `S06` `ct:<n>` → `S06:<n>`; chiều đỏ `ALTER TABLE localsim.sale_offers ADD COLUMN fake text` → không có trong payload + WARN `cột chưa duyệt`; `UPDATE` một `street_raw` localsim thành một định danh đọc từ `source_registry.source_ids` của localsim → thoát pha `scan`, 0 dòng staging (`ĐỎ-ĐÚNG ten-nguon`); `UPDATE` cloudsim một `seller_ref = 'ct:1'` rồi chạy riêng gate → đỏ (`ĐỎ-ĐÚNG seller_ref`).

- [ ] **Step 1:** Viết bảy ca + test `mgmtExec`.
- [ ] **Step 2:** Chạy từng ca → FAIL (chưa có `syncOnce`).
- [ ] **Step 3:** Cài `mgmtExec`, `syncOnce`, `main` mới.
- [ ] **Step 4:** Chạy `npm test` + bảy ca + `node scripts/sync-pii-mutation.mjs` + `bash ../scripts/check-ruler-views.sh static` → mọi lệnh exit 0.
- [ ] **Step 5:** Commit `feat(pipeline): sync-cloud nguyên tử — staging + một giao dịch tráo, không còn cửa sổ trống`.

**Verify:** bảy lệnh `config:executors.script.cloud_sync_*` + `config:executors.test.pipeline` + `config:executors.script.sync_pii_mutation` · phục vụ E1, E2, E3, E4, E5, E7, E11, E8a, E8b · `independent: false`

### Task 4: Đo lượt thật (chỉ đọc) + hướng dẫn vận hành + chú thích luật

**Files:**
- Create: `pipeline/scripts/cloud-sync-watch.mjs`
- Create: `docs/ops/cloud-sync-atomic.md`
- Modify: `pipeline/sync-cloud.mjs` (chú thích đầu tệp theo luật 23/10)
- Modify: `docs/ROADMAP.md` (§2 as-built, §4 trạng thái — AGENTS.md)

**Interfaces:**
- Consumes: `main()` của Task 3.
- Produces: `cloud-sync-watch.mjs --seconds <n> --every <s>` — lặp truy vấn `read_only: true` qua Management API đếm `sale_offers`, `properties`, `sellers`, `areas`, `nights`, `ref_calib_listings`, `v_ruler_p2`, `v_ruler_p2_area`, `saved_markets`; in min/max từng bảng + dòng `MIN0 <bảng>` nếu từng thấy 0; exit 1 khi có bảng từng 0 hoặc `saved_markets` đổi.

- [ ] **Step 1:** Viết `cloud-sync-watch.mjs`; chạy thử 20 giây trên cloud thật (chỉ đọc) → in số khớp số đo 08:37.
- [ ] **Step 2:** Viết `docs/ops/cloud-sync-atomic.md`: vì sao (ba lỗi đo 23/10) · thứ tự (Mạnh áp migration lên cloud → kiểm → merge → lượt launchd đầu) · lệnh áp (dán SQL migration vào SQL Editor hoặc Management API) · lệnh kiểm (`sync_stage` có; `has_schema_privilege('anon','sync_stage','USAGE')` false) · lượt thử có đo (chạy watch nền + `node pipeline/sync-cloud.mjs`, đọc kết quả) · cloud chưa có `sync_stage` thì code mới dừng pha `catalog`, không đụng dữ liệu · cách lùi (`git revert` commit Task 3; dữ liệu cloud không cần sửa) · không bước nào agent tự áp DDL.
- [ ] **Step 3:** Sửa chú thích đầu `sync-cloud.mjs` theo luật Mạnh 23/10 (định danh người bán tầng C; tên nguồn thật tầng A kể cả trong giá trị; `PII_EXCLUDE` giữ vì phạm vi).
- [ ] **Step 4:** Cập nhật ROADMAP §2/§4.
- [ ] **Step 5:** Commit `docs(ops): hướng dẫn triển khai sync-cloud nguyên tử + máy đo lượt thật`.

**Verify:** `node pipeline/scripts/cloud-sync-watch.mjs --seconds 20 --every 2` exit 0 (cloud hiện tại không ở giữa lượt cũ thì không 0) · phục vụ E9, E10 · `independent: false`

**Ngoài làn máy (cần lời Mạnh):** lượt sync thật đầu tiên với code mới chỉ chạy SAU khi Mạnh áp migration lên cloud; kết quả watch đưa vào gói Cổng Bằng chứng.
