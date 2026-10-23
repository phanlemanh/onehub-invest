# canonical-khong-tin-gia — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform S03/S05 gạt post thử ở đầu đọc stg; tin giả đang có được rút qua `reconcile_stale_offers`; bait gap + `sellers` tính lại; có thước dư lượng; sync cloud qua được chặn tụt khi có audit giải thích.

**Architecture:** Một mô-đun `pipeline/lib/test-posts.mjs` (định nghĩa post thử + đọc stg + ghi audit từ chối). Transform và `refresh-bait-gap` tách thân thành hàm nhận `client`, không tự mở giao dịch, để test và thước chạy chúng trong BEGIN…ROLLBACK. `sync-cloud` tách quyết định chặn tụt thành hàm thuần.

**Tech Stack:** Node 24 ESM `.mjs`, `pg`, `node:test`, Postgres local :5433.

**Spec:** `docs/superpowers/specs/2026-10-23-canonical-khong-tin-gia-design.md` · `_acceptance/canonical-khong-tin-gia/contract.md` · `evals.yaml`

## Global Constraints

- Không migration mới, không sửa migration đã commit; dùng `reconcile_stale_offers` (039) có sẵn.
- Không câu `DELETE FROM sale_offers` mới ngoài hàm đối soát; không xoá/sửa `stg_*`.
- Mọi test DB chạy trong BEGIN…ROLLBACK trên `DATABASE_URL` mặc định `postgres://oneinvest:oneinvest@localhost:5433/oneinvest` — không để lại dòng nào.
- Hành động `ops_audit`: `transform:reject-test` `{source, rejected, by_marker}` · `bait-gap:sellers-orphan` `{deleted, remaining}`; `env='local'`. Không cột người bán trong `detail`.
- Ba dấu: `snapshot-source` · `agent` · `group` (tên đúng chuỗi này — thước và audit dùng làm khoá).
- Băm SĐT = `sha256(phone).hex.slice(0,32)` như transform hiện có.
- Comment domain tiếng Việt; tên code tiếng Anh; nguồn gọi S03/S05.
- Làn: không sửa `pipeline/import-*`, `collector/**`, `scripts/zalo-*.sh`. `sync-cloud.mjs` chờ trả lời giám sát `P4-3` trước Task 6.

## Review Focus

1. Lượt đêm toàn post thử của một kênh (stg chỉ còn post thử) → transform phải ném lỗi, không xoá nguồn — Task 2 ca AC-5(b).
2. Post thật và post thử cùng băm offer → offer giữ, `post_ids`/`first_seen`/SĐT chỉ từ post thật — Task 2 ca AC-2.
3. Nhóm thật có chữ «test» trong tên («Hội mua bán test nhà», «TESTING ROOM») → không bị gạt — Task 1 ma trận.
4. Thước chạy sau lượt dọn thật (không còn tin giả) → `--simulate` vẫn xanh, không đòi dòng audit đối soát khi không có gì để rút — Task 5.
5. `sellers` co mà KHÔNG có dòng audit (local dựng dở) → sync vẫn dừng — Task 6 ô (4).

---

### Task 1: Định nghĩa post thử — `pipeline/lib/test-posts.mjs`

independent: false (nền của Task 2, 3, 5) · phục vụ E1 (AC-1)

**Files:**
- Create: `pipeline/lib/test-posts.mjs`
- Test: `pipeline/scripts/test-posts.test.mjs`

**Interfaces:**
- Produces:
  - `TEST_MARKERS: readonly ["snapshot-source","agent","group"]`
  - `testMarker(row: {snapshot_id?: string|null, agent_id?: string|null, group_name?: string|null}): "snapshot-source"|"agent"|"group"|null` — xét theo thứ tự trên. `snapshot-source`: phần giữa của `snapshot_id` tách bằng `__` là `example` hoặc khớp `/(mock|test|e2e)/i`. `agent`: `/^(e2e|test|mock)/i`. `group`: `/^test(?![\p{L}])/iu` sau trim.
  - `loadStgPosts(client, channel: "zalo"|"facebook"): Promise<{posts: Row[], rejected: {total: number, by_marker: Record<string, number>}}>` — câu SELECT `DISTINCT ON (post_id) post_id, snapshot_id, agent_id, text, posted_at, group_name, author_hash, sender_name FROM stg_zalo_posts WHERE <kênh> ORDER BY post_id, captured_at DESC` (kênh zalo: `agent_id IS NULL OR agent_id <> 'apify-facebook'`; facebook: `agent_id = 'apify-facebook'`), lọc bằng `testMarker` trong JS.
  - `auditRejected(client, source: string, rejected): Promise<boolean>` — INSERT `ops_audit (actor 'transform:<source>', action 'transform:reject-test', env 'local', detail {source, rejected: total, by_marker})` chỉ khi `total > 0`; trả có ghi hay không.

- [ ] **Step 1: Viết test `AC-1 ma trận dấu`** — mảng 11 hàng đúng như E1 (`[row, kỳ vọng]`), `assert.equal(testMarker(row), kỳ vọng, \`AC-1 …: ${tên}\`)`, cuối `assert.equal(số assert, 11)`. Hàng null thông điệp `AC-1 bắt nhầm nhóm thật: <group_name>`. Thêm ca đỏ: hàm sao `groupLoose = (g) => /^test/i.test(g)` trên hàng «TESTING ROOM» → trả true (chứng ma trận bắt được luật lỏng — assert đúng thông điệp ghim).
- [ ] **Step 2:** `cd pipeline && node --test scripts/test-posts.test.mjs` → FAIL (module chưa có).
- [ ] **Step 3:** Viết `test-posts.mjs` theo Interfaces.
- [ ] **Step 4:** chạy lại → PASS.
- [ ] **Step 5:** commit `feat(pipeline): định nghĩa post thử dùng chung (PL2 AC-1)`.

### Task 2: transform-zalo đọc qua `loadStgPosts`, tách `runTransformZalo`

independent: false · phục vụ E2, E4, E5, E10 (AC-2, AC-4, AC-5, AC-9)

**Files:**
- Modify: `pipeline/transform-zalo.mjs` (thân `main` → `runTransformZalo`)
- Test: `pipeline/scripts/test-posts.test.mjs`

**Interfaces:**
- Consumes: `loadStgPosts`, `auditRejected` (Task 1); `writeOffers` (có sẵn).
- Produces: `export async function runTransformZalo(client): Promise<{offers: number, rejected, reconcile}>` — không BEGIN/COMMIT; `main` mở client, `BEGIN`, gọi, `COMMIT`/`ROLLBACK`, in log như cũ. `parsePost`, `matchPhuong`, `extractPhones` giữ nguyên export.

Helper test (đầu file test, dùng cho mọi task sau): `withTx(fn)` mở client, `BEGIN`, gọi, `ROLLBACK`; `insertPost(c, {post_id, snapshot_id, agent_id, group_name, text, posted_at})`; `offersWith(c, postId)`. Post fixture dùng `post_id` tiền tố `t_pl2_`, văn bản tin bán có phường Hà Nội thật (lấy tên phường đầu tiên từ `areas` lúc chạy), giá/diện tích số lạ (vd 3,17 tỷ · 61,3 m²) để băm không trùng offer thật.

- [ ] **Step 1: Viết test** `AC-2 transform S03 từ chối post thử` (đúng E2: p_real/p_test cùng văn bản, p_only zalo-mock; vế so mọi cột giữa lượt A không p_test và lượt B có p_test khác SĐT + posted_at sớm hơn, dùng SAVEPOINT để chạy hai lượt; đối chứng p_only bỏ dấu → có offer), `AC-4 rút offer giả qua đối soát` (đúng E4, phần quét mã để Task 3), `AC-5 lượt sạch và lượt toàn thử` (đúng E5), `AC-9 stg không đổi` (vân tay stg trước/sau `runTransformZalo`; đối chứng UPDATE một dòng → khác; phần S05 thêm ở Task 3).
- [ ] **Step 2:** chạy → FAIL (`runTransformZalo` chưa export).
- [ ] **Step 3:** Refactor `transform-zalo.mjs`: `loadStgPosts(client,"zalo")` thay câu SELECT; `auditRejected(client,"S03",rejected)` trước `writeOffers`; trả `{offers: rows.length, rejected, reconcile}`.
- [ ] **Step 4:** chạy test → PASS; `node --test scripts/write-offers.test.mjs` vẫn xanh.
- [ ] **Step 5:** commit `feat(pipeline): transform S03 gạt post thử, dọn qua đối soát (PL2 AC-2/4/5/9)`.

### Task 3: transform-fb cùng bộ lọc + hai phép quét mã

independent: false · phục vụ E3, E4 (phần quét), E10 (phần S05)

**Files:**
- Modify: `pipeline/transform-fb.mjs`
- Test: `pipeline/scripts/test-posts.test.mjs`

**Interfaces:**
- Produces: `export async function runTransformFb(client): Promise<{offers, rejected, reconcile}>` (như Task 2, nguồn S05, kênh `facebook`).
- Produces (test helper, trong `test-posts.mjs` để tái dùng): `scanStgWriters(files: {path,text}[]): string[]` — đường tệp vừa có `stg_zalo_posts` vừa có `writeOffers(` hoặc `/INSERT\s+INTO\s+sale_offers/i`.

- [ ] **Step 1: Viết test** `AC-3 transform S05 dùng cùng bộ lọc` (đúng E3 kể cả cặp nhóm 'TEST FB' / 'Mua bán nhà Hà Nội'); `AC-3 quét quan hệ` — duyệt mọi `.mjs/.ts` không phải test trong `pipeline/` (bỏ `node_modules`) và `agent/src` → `scanStgWriters` = `[]`; chiều đỏ bộ tệp mẫu; `AC-4 không DELETE mới` — `scanDeleteAll` trên mọi `.mjs/.ts/.tsx/.sh` không phải test trong `pipeline/`, `agent/src`, `app/src`, `data-api/src`, `scripts/` → tập tệp = `["pipeline/lib/write-offers.mjs"]`; mở rộng `AC-9` cho `runTransformFb`. Gốc kho tính từ `import.meta.dirname`.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** Refactor `transform-fb.mjs` như Task 2 (`loadStgPosts(client,"facebook")`, `auditRejected(client,"S05",…)`).
- [ ] **Step 4:** chạy → PASS.
- [ ] **Step 5:** commit `feat(pipeline): transform S05 dùng chung bộ lọc post thử (PL2 AC-3)`.

### Task 4: `refreshBaitGap` + xoá người bán mồ côi

independent: true (chỉ `refresh-bait-gap.mjs` + tệp test riêng) · phục vụ E6, E7 (AC-6, AC-7)

**Files:**
- Modify: `pipeline/refresh-bait-gap.mjs`
- Test: `pipeline/scripts/bait-gap-sellers.test.mjs`

**Interfaces:**
- Produces: `export async function refreshBaitGap(client): Promise<{gap: number, sellersUpdated: number, sellersDeleted: number, sellersRemaining: number}>` — thân `main` cũ + bước mới sau bước 3: `DELETE FROM sellers x WHERE NOT EXISTS (SELECT 1 FROM sale_offers o WHERE o.seller_phone_hash = x.phone_hash)`; nếu xoá ≥1 → `ops_audit` `bait-gap:sellers-orphan` `{deleted, remaining}` với `remaining = count(*) FROM sellers`. `main` giữ autocommit như cũ (gọi hàm với client thường).

- [ ] **Step 1: Viết test** `AC-7 sellers mồ côi` (đúng E7 kể cả biến thể có offer mang hash → còn) và `AC-6 bait gap tính lại` (đúng E6; cần `runTransformZalo` từ Task 2 — nếu chạy song song trước Task 2 thì AC-6 viết sau khi Task 2 xong, đánh dấu ở bước 4).
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** Refactor theo Interfaces.
- [ ] **Step 4:** chạy → PASS.
- [ ] **Step 5:** commit `feat(pipeline): bait gap tính lại + xoá người bán mồ côi có audit (PL2 AC-6/7)`.

### Task 5: Thước dư lượng — `pipeline/scripts/test-data-residue.mjs`

independent: false (cần Task 2, 4) · phục vụ E8, E9 (AC-8)

**Files:**
- Create: `pipeline/scripts/test-data-residue.mjs`
- Test: `pipeline/scripts/test-posts.test.mjs`

**Interfaces:**
- Produces:
  - `measureResidue(client): Promise<{offers_from_test, bait_gap_from_test, sellers_from_test, sellers_orphan, offers_from_test_sql, markers: {snapshot-source, agent, group}, ok: boolean}>` — đúng định nghĩa design §2.4; `offers_from_test_sql` đếm bằng SQL độc lập (regex trên `split_part(snapshot_id,'__',2)`, `agent_id`, `group_name`), không gọi `testMarker`.
  - `exitCodeFor(result: {ok: boolean}): 0|1`.
  - `simulate(client)`: đếm 7 bảng (`sale_offers, sellers, ops_audit, review_queue, enrichment_proposals, property_offers, property_candidates`) → `BEGIN` → `before = measureResidue` → `runTransformZalo` → `refreshBaitGap` → `after` → đếm dòng audit mới (`id > max trước`) theo action → `keep_ratio` (sau/trước cho `sale_offers`, `sellers`) → `ROLLBACK` → đếm lại 7 bảng. `ok = after.ok && rows_before == rows_after && before.offers_from_test == before.offers_from_test_sql && (before.offers_from_test == 0 || audit.reconcile ≥ 1) && (tổng markers == 0 || audit.reject_test ≥ 1)`.
  - CLI: `--simulate` in JSON `simulate`, không cờ in JSON `measureResidue`; thoát `exitCodeFor`.

- [ ] **Step 1: Viết test** `AC-8 thước dư lượng bắt được tin giả` đúng E9 (round-trip qua `runTransformZalo`) + `exitCodeFor`.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** Viết script.
- [ ] **Step 4:** chạy test → PASS; `cd pipeline && node scripts/test-data-residue.mjs --simulate` → exit 0, `after.*` = 0, `before.offers_from_test` ≈ 1.023, số dòng 7 bảng không đổi. Đếm lại `sale_offers` S03 = 1.102 sau lệnh (không để lại gì).
- [ ] **Step 5:** commit `feat(pipeline): thước dư lượng tin thử, chế độ mô phỏng ROLLBACK (PL2 AC-8)`.

### Task 6: Chặn tụt có căn cứ audit — `sync-cloud.mjs`

independent: true (chỉ `sync-cloud.mjs` + `sync-cloud.test.mjs`) · phục vụ E11 (AC-10) · **chỉ bắt đầu khi giám sát trả lời `P4-3`** (dãy P2 cùng sửa tệp)

**Files:**
- Modify: `pipeline/sync-cloud.mjs:481-500` (vòng chặn tụt) + một câu đọc `ops_audit` local
- Test: `pipeline/sync-cloud.test.mjs`

**Interfaces:**
- Produces: `export const SHRINK_AUDIT = { sellers: "bait-gap:sellers-orphan" }`; `export function shrinkVerdict({table, local, cloud, audits, now}): {ok: boolean, reason: string}` — `audits` là mảng `{at: Date, detail: {remaining}}` của action trong `SHRINK_AUDIT[table]`; ok khi `cloud == 0 || local >= SHRINK_MIN*cloud`, hoặc khi `table in SHRINK_AUDIT` và có audit `now - at ≤ 24h` với `detail.remaining === local`. Vòng chặn tụt gọi hàm này; câu lỗi `shrink` giữ nguyên chữ cũ khi `!ok`.

- [ ] **Step 1: Viết test** `AC-10 chặn tụt có audit` — ma trận 6 ô đúng E11, đếm assert = 6; chiều đỏ bản sao bỏ so `remaining` → ô (2) cho qua, assert thông điệp ghim.
- [ ] **Step 2:** `cd pipeline && node --test sync-cloud.test.mjs` → FAIL.
- [ ] **Step 3:** Cài theo Interfaces; trước bước 3 của `main`, đọc `SELECT at, detail FROM ops_audit WHERE action = ANY($1) AND at > now() - interval '24 hours'` từ DB local.
- [ ] **Step 4:** chạy → PASS; `node --test sync-pii.test.mjs` và `node scripts/check-cloud-sync.mjs atomic` vẫn xanh.
- [ ] **Step 5:** commit `feat(sync): miễn trừ chặn tụt sellers khi có audit dọn khớp số (PL2 AC-10)`.

### Task 7: Trạng thái tài liệu

independent: false (cuối) · không eval

**Files:** `docs/ROADMAP.md` (§2 as-built: bộ lọc post thử, thước dư lượng; §4 trạng thái PL2), `pipeline/CLAUDE.md` (dòng `test-data-residue.mjs`, `lib/test-posts.mjs`).

- [ ] **Step 1:** sửa hai tệp; **Step 2:** `cd pipeline && npm test` toàn bộ xanh; **Step 3:** commit `docs: PL2 as-built`.
