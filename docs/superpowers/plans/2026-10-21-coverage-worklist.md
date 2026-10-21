# Coverage Worklist (AirDNA universe → PDP Airbnb) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đạt độ phủ Airbnb cao (60% 3 market lớn sau ~3,5 tuần) bằng cách dùng universe AirDNA (đã có sẵn Airbnb ID từng listing) làm worklist PDP, thay cho discovery search bị trần ~270 unique/query.

**Architecture:** Pipeline xuất worklist id từ DB (`airdna_listings` LEFT JOIN `listings`) ra file JSON cho collector (collector giữ nguyên không biết DB). Collector `airbnb-listing` thêm chế độ worklist (env, checkpoint theo namespace city `vn`, phát hiện listing đã rút). Cron nightly thay cron tuần: mỗi đêm N batch PDP trong cửa sổ CCP 19-23h, sau đó finalize multi-city. DQ truthful-coverage nâng lên listing-level và idempotent.

**Tech Stack:** Node 24 + TypeScript (collector, node --test), Node ESM + pg (pipeline, node --test), bash + launchd (cron), Postgres 5433 qua docker compose.

**Spec:** `docs/research/coverage-expansion-plan.md` (mục 2b + Giai đoạn 0/1/2) — bằng chứng JOIN 268/506, worklist HCMC 14.506 · HN 14.139 · ĐN 13.131.

## Global Constraints

- ADR-0009: AirDNA ≤500 request/ngày, rate ≤0,3 req/s — KHÔNG tăng; việc này chỉ đổi N rotation (số market/đêm), tổng vẫn ~150-250 req/đêm.
- ADR-0007 CCP: cửa sổ activity 19-23h, jitter trước chạy, rate 0,35 req/s của `airbnb-listing` giữ nguyên.
- Airbnb phải chạy Chrome headful (`headless: false`) — headless bị anti-bot.
- Mọi thay đổi ONLY trong repo private `one-invest`. onehub-data-api / onehub-invest-app KHÔNG đụng (public app tự hưởng qua sync cloud).
- Không commit `research-local/`, `*.har`, hay file state/ checkpoint.
- DB local: `postgres://oneinvest:oneinvest@localhost:5433/oneinvest` (env DATABASE_URL override); psql đi qua `docker compose exec` trong db/.
- Log/UI tiếng Việt theo hiện trạng.

## Review Focus

1. **Id AirDNA thiểu số không phải Airbnb ID thật ("id mờ")** → PDP trả trang không tồn tại: test `isGone` (Task 3) + đo tỉ lệ delisted tuần đầu, dừng nếu >40% (Task 7).
2. **Worklist chảy vào market nhỏ trước khi 3 market lớn xong** → test thứ tự ưu tiên `prioritize` (Task 2).
3. **Listing đã rút bị retry vô hạn** (fetch fail không vào doneIds như hiện tại) → `isGone` phải ghi doneIds + goneIds, test (Task 3).
4. **Listing Đà Nẵng bị drop khỏi canonical** vì `reassign-areas.mjs` chưa có market danang + chưa có OSM phường ĐN → Task 4 phải xong và verify TRƯỚC khi nightly lấy id ĐN (Task 5 chọn id theo priority đã đảm bảo ĐN cuối).
5. **Batch tăng làm Airbnb chặn / nights bùng nổ làm finalize-sync chậm** → nút giảm `AIRBNB_NIGHTLY_BATCHES` (Task 5), smoke 20:00 hằng ngày sẵn có; đo thời gian finalize + sync (Task 7).

---

### Task 1: Rotation AirDNA 12 market/đêm

**Files:**
- Modify: `pipeline/airdna-rotate.mjs:18` (default N)

**Interfaces:**
- Produces: mặc định mới 12; env `AIRDNA_DAILY_MARKETS` vẫn override được (không đổi tên).

- [ ] **Step 1: Đổi default 6 → 12 kèm comment**

Dòng 18 hiện `const N = flag("n", Number(process.env.AIRDNA_DAILY_MARKETS ?? 6));` — đổi `6` thành `12`, comment 1 dòng: `// 12/đêm: xong 43 market trong ~3 đêm (~240 req/đêm, <50% cap ADR-0009); sau 43/43 hạ về 7 (Task 7)`.

- [ ] **Step 2: Dry-run verify**

Run: `cd pipeline && node airdna-rotate.mjs --dry`
Expected: stderr `picked 12 (n=12, max-age=1d)`; 43 markets, không đụng state file.

- [ ] **Step 3: Commit**

```bash
git add pipeline/airdna-rotate.mjs
git commit -m "feat(e2): rotation AirDNA 12 market/đêm — đủ 43/43 trong 3 đêm"
```

### Task 2: Xuất worklist từ DB (`export-airdna-worklist.mjs`)

**Files:**
- Create: `pipeline/export-airdna-worklist.mjs`
- Test: `pipeline/scripts/export-airdna-worklist.test.mjs` (nằm trong glob `scripts/*.test.mjs` của `npm test`)

**Interfaces:**
- Produces (Task 3, 5 tiêu thụ): file `collector/state/airbnb-worklist.json` dạng
  `{ generatedAt: string, total: number, ids: string[] }` — ids đã dedupe, lọc `abnb_`, xếp ưu tiên.
- Produces: hàm pure `prioritize(rows: {id: string; market: string; revenue_ltm: number | null}[]): string[]` — export từ file chính để test.

- [ ] **Step 1: Write the failing test**

Test 3 hành vi: (a) market 47 đứng trước 48, 48 trước 89491, market khác sau cùng; (b) cùng market thì `revenue_ltm` DESC, NULL cuối; (c) id trùng giữ 1 lần, id không `abnb_` bị loại.

```js
import test from "node:test"; import assert from "node:assert/strict";
import { prioritize } from "../export-airdna-worklist.mjs";
test("prioritize: ưu tiên market rồi revenue DESC, dedupe, chỉ abnb_", () => {
  const rows = [
    { id: "abnb_9", market: "89491", revenue_ltm: 100 },
    { id: "abnb_2", market: "47", revenue_ltm: null },
    { id: "abnb_1", market: "47", revenue_ltm: 50 },
    { id: "abnb_1", market: "47", revenue_ltm: 50 },
    { id: "abnb_5", market: "48", revenue_ltm: 900 },
    { id: "vrbo_x", market: "47", revenue_ltm: 999 },
  ];
  assert.deepEqual(prioritize(rows), ["abnb_1", "abnb_2", "abnb_5", "abnb_9"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pipeline && node --test scripts/export-airdna-worklist.test.mjs`
Expected: FAIL — module không tồn tại.

- [ ] **Step 3: Implement**

File chính: query
```sql
SELECT a.id, a.airdna_market_id AS market, a.revenue_ltm
  FROM airdna_listings a LEFT JOIN listings l ON l.id = a.id
 WHERE a.id LIKE 'abnb\_%' ESCAPE '\' AND l.id IS NULL
```
→ `prioritize()` (priority map `{ "47": 0, "48": 1, "89491": 2 }`, mặc định 9) → ghi JSON (argv[2] hoặc default `../collector/state/airbnb-worklist.json` tính từ file), console log `total=… by market 47=x 48=y 89491=z khác=w`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd pipeline && node --test scripts/export-airdna-worklist.test.mjs && npm test`
Expected: PASS toàn bộ.

- [ ] **Step 5: Integration verify với DB thật**

Run: `cd pipeline && node export-airdna-worklist.mjs /tmp/worklist-test.json && node -e "const w=require('/tmp/worklist-test.json');console.log(w.total, w.ids[0], w.ids.at(-1))"`
Expected: total ≈ 47.500 (± vài trăm); id đầu tiên thuộc market 47.

- [ ] **Step 6: Wire vào airdna-daily.sh**

Trong `scripts/airdna-daily.sh`, sau dòng `dq-truthful-coverage.mjs` thêm `node "$ROOT/pipeline/export-airdna-worklist.mjs"` (universe mới nhất vào worklist mỗi đêm AirDNA chạy).

- [ ] **Step 7: Commit**

```bash
git add pipeline/export-airdna-worklist.mjs pipeline/scripts/export-airdna-worklist.test.mjs scripts/airdna-daily.sh
git commit -m "feat(e2): xuất worklist PDP từ universe AirDNA — 47.5k id ưu tiên theo doanh thu"
```

### Task 3: Collector `airbnb-listing` chế độ worklist + phát hiện listing đã rút

**Files:**
- Modify: `collector/src/collectors/airbnb-listing.ts`
- Test: `collector/src/test/airbnb-worklist.test.ts`

**Interfaces:**
- Consumes: `collector/state/airbnb-worklist.json` (Task 2) qua env `AIRBNB_LISTING_WORKLIST` (đường dẫn).
- Produces: checkpoint `collector/state/vn__airbnb-listing.json` với `doneIds: string[]` và `goneIds: string[]` (chạy với `--city vn` nên namespace tách khỏi discovery mode hanoi/hcmc).
- Produces: hàm pure export `parseWorklist(json: unknown): string[]` và `isGone(pageTitle: string, landedUrl: string, roomId: string): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test"; import assert from "node:assert/strict";
import { parseWorklist, isGone } from "../collectors/airbnb-listing.js";
test("parseWorklist: lấy ids hợp lệ", () => {
  assert.deepEqual(parseWorklist({ ids: ["abnb_1", "abnb_2"] }), ["abnb_1", "abnb_2"]);
  assert.deepEqual(parseWorklist(null), []);
  assert.deepEqual(parseWorklist({ ids: "not-array" }), []);
});
test("isGone: title báo không tồn tại hoặc redirect khỏi /rooms/<id>", () => {
  assert.equal(isGone("Rất tiếc, trang này không tồn tại", "https://www.airbnb.com.vn/rooms/123", "123"), true);
  assert.equal(isGone("Choose your room", "https://www.airbnb.com.vn/", "123"), true);
  assert.equal(isGone("Căn hộ đẹp – Hoàn Kiếm", "https://www.airbnb.com.vn/rooms/123?x=1", "123"), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd collector && npm test`
Expected: FAIL — export chưa tồn tại.

- [ ] **Step 3: Implement**

Trong `collect()`: nếu `process.env.AIRBNB_LISTING_WORKLIST` set → bỏ khúc đọc discovery snapshot (dòng 47-63); `ids = new Set(parseWorklist(JSON.parse(await readFile(env))))`. Sau `fetchOnce` đầu tiên của mỗi id: đọc `await page.title()` + `page.url()`; `isGone` → ghi `goneIds` (checkpoint, thêm vào `doneIds`, KHÔNG emit item, đếm biến `delisted++`, log `id: GONE`) rồi `continue`. Cuối run thêm note `delisted: ${delisted}/${batch.length}` vào coverage.notes. Batch limit giữ `AIRBNB_LISTING_BATCH` (25).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd collector && npm test && npm run check`
Expected: PASS, 0 lỗi type.

- [ ] **Step 5: Smoke thật 1 batch nhỏ (headful)**

Run: `cd collector && AIRBNB_LISTING_WORKLIST=state/airbnb-worklist.json AIRBNB_LISTING_BATCH=2 node dist/cli.js collect --city vn --source airbnb-listing`
Expected: log 2 id đầu (thuộc market 47), snapshot `snapshots/vn/vn__airbnb-listing__*` có items, checkpoint `state/vn__airbnb-listing.json` có 2 doneIds.

- [ ] **Step 6: Commit**

```bash
git add collector/src/collectors/airbnb-listing.ts collector/src/test/airbnb-worklist.test.ts
git commit -m "feat(e2): airbnb-listing worklist mode từ universe AirDNA + đánh dấu delisted"
```

### Task 4: Đà Nẵng vào reassign-areas + OSM phường ĐN

**Files:**
- Modify: `pipeline/reassign-areas.mjs:14-17` (MARKETS)

**Interfaces:**
- Produces: `MARKETS.danang = { id: "vn-thanh-pho-da-nang", name: "Đà Nẵng" }` để listing ĐN không bị drop khỏi canonical (bước 3 của script hiện bỏ listing ngoài mọi phường).

- [ ] **Step 1: Thu OSM boundaries Đà Nẵng (chưa có lần nào)**

Run: `cd collector && npm run collect -- collect --city danang --source osm-boundaries`
Expected: snapshot `snapshots/danang/danang__osm-boundaries__*`, log không lỗi.

- [ ] **Step 2: Thêm danang vào MARKETS + nạp staging + chạy**

Sửa MARKETS thêm danang. Nạp OSM ĐN vào staging (`import-airbnb.mjs` là cầu nạp `stg_osm_boundaries` — xem pipeline/import-airbnb.mjs:149):
`cd pipeline && node import-airbnb.mjs ../collector/snapshots/danang/danang__osm-boundaries__<ts>` rồi `node reassign-areas.mjs` (không arg = mọi city).
Expected: log upsert phường cho 3 market; SQL verify:
`SELECT parent_id, count(*) FROM areas WHERE parent_id IS NOT NULL GROUP BY 1;` → có `vn-thanh-pho-da-nang` > 0 dòng phường.

- [ ] **Step 3: Commit**

```bash
git add pipeline/reassign-areas.mjs
git commit -m "fix(e2): Đà Nẵng vào reassign-areas + OSM phường — listing ĐN không bị drop"
```

### Task 5: finalize multi-city + nightly runner + launchd

**Files:**
- Create: `pipeline/finalize-airbnb.sh`
- Create: `scripts/airbnb-nightly.sh`
- Create: `pipeline/cron/com.oneinvest.airbnb-nightly.plist`
- Modify: `scripts/install-airbnb-cron.sh` (cài nightly + smoke, bootout label `com.oneinvest.collector` cũ)

**Interfaces:**
- Consumes: worklist mode (Task 3), MARKETS danang (Task 4).
- Produces: launchd `com.oneinvest.airbnb-nightly` chạy 19:35 hằng ngày; env tuỳ chỉnh `AIRBNB_NIGHTLY_BATCHES` (default 32 → 800 listing/đêm).

- [ ] **Step 1: `pipeline/finalize-airbnb.sh` — tổng quát hoá finalize-hanoi.sh**

Copy finalize-hanoi.sh, đổi: (a) vòng import glob thêm `hcmc`, `danang`, `vn`: `"../collector"/snapshots/{hanoi,hcmc,danang,vn}/*__airbnb-listing__*`; (b) `reassign-areas.mjs` gọi không arg; (c) sanity query nhóm theo 3 market (vn-hanoi, vn-hcmc, vn-thanh-pho-da-nang) thay vì chỉ vn-hanoi. Giữ nguyên transform + 300/400/410/450.

- [ ] **Step 2: `scripts/airbnb-nightly.sh`**

Mẫu theo `airdna-daily.sh`: `set -euo pipefail`; `sleep $((RANDOM % 1200))` (jitter ≤20′); build collector nếu thiếu dist; `node pipeline/export-airdna-worklist.mjs`; vòng `AIRBNB_NIGHTLY_BATCHES` (default 32) lần chạy `AIRBNB_LISTING_WORKLIST=state/airbnb-worklist.json node dist/cli.js collect --city vn --source airbnb-listing`, break khi log `còn 0 id` hoặc `không còn việc`; cuối gọi `bash pipeline/finalize-airbnb.sh`. Log `pipeline/logs/airbnb-nightly.log`.

- [ ] **Step 3: Plist + installer**

Plist `com.oneinvest.airbnb-nightly.plist` theo mẫu `com.oneinvest.collector.plist` (StartCalendarInterval 19:35, StandardOut/ErrorPath trỏ log trên). Trong `install-airbnb-cron.sh`: vòng for `f` đổi thành `airbnb-nightly smoke`, và thêm `launchctl bootout …/com.oneinvest.collector.plist || true` trước khi bootstrap (job Chủ nhật hanoi bị thay thế).

- [ ] **Step 4: Verify chạy tay + cài**

Run: `bash scripts/install-airbnb-cron.sh && launchctl list | grep oneinvest`
Expected: danh sách có `com.oneinvest.airbnb-nightly` và `com.oneinvest.smoke`, KHÔNG còn `com.oneinvest.collector`.
Run (ép chạy ngay, batch nhỏ): `AIRBNB_NIGHTLY_BATCHES=1 bash scripts/airbnb-nightly.sh` — expected log đầy đủ regen worklist → 1 batch → finalize, listings count DB tăng đúng số item batch.

- [ ] **Step 5: Commit**

```bash
git add pipeline/finalize-airbnb.sh scripts/airbnb-nightly.sh pipeline/cron/com.oneinvest.airbnb-nightly.plist scripts/install-airbnb-cron.sh
git commit -m "feat(e2): nightly PDP theo worklist thay cron tuần — 800 listing/đêm multi-city"
```

### Task 6: DQ truthful-coverage listing-level + idempotent

**Files:**
- Modify: `pipeline/dq-truthful-coverage.mjs`

**Interfaces:**
- Produces: mỗi entity đúng 1 row mới nhất trong `dq_check_results` (check `truthful-coverage`); detail thêm `overlap=matched/universe` (listing-level, ví dụ `overlap=268/15000 (1.8%)`).

- [ ] **Step 1: Thay insert bằng upsert + thêm overlap**

Trước INSERT mỗi row: `DELETE FROM dq_check_results WHERE check_name='truthful-coverage' AND entity=$1`. Thêm 1 query `SELECT a.airdna_market_id, count(*) AS uni, count(l.id) AS matched FROM airdna_listings a LEFT JOIN listings l ON l.id = a.id WHERE a.id LIKE 'abnb\_%' ESCAPE '\' GROUP BY 1`, aggregate theo byArea (cùng map keys ↔ area như code hiện tại), nối vào chuỗi detail: `overlap=${matched}/${uni} (${pct}%)`.

- [ ] **Step 2: Verify**

Run: `cd pipeline && node dq-truthful-coverage.mjs && sleep 1 && node dq-truthful-coverage.mjs`
Run: query `SELECT entity, count(*) FROM dq_check_results WHERE check_name='truthful-coverage' GROUP BY 1 HAVING count(*) > 1;`
Expected: 0 dòng (chạy 2 lần không nhân bản); console có `overlap=…` cho vn-hanoi (≈141/14280 → ~1% hiện tại, sẽ tăng theo đêm).

- [ ] **Step 3: Commit**

```bash
git add pipeline/dq-truthful-coverage.mjs
git commit -m "feat(e2): DQ truthful-coverage listing-level overlap + idempotent"
```

### Task 7: Steady state + đo delisted-rate + health-check volume

**Files:**
- Modify: `pipeline/airdna-rotate.mjs:18` (12 → 7 khi đã đủ)
- Create: `pipeline/worklist-health.mjs` (đọc checkpoint + DB, in báo cáo 1 lần chạy)

**Interfaces:**
- Produces: lệnh `node pipeline/worklist-health.mjs` in: `done=X gone=Y rate=Z% pending_by_market{47,48,89491,…}` và thời gian chạy finalize/sync gần nhất (đọc mtime log).

- [ ] **Step 1: Điều kiện chuyển 43/43**

Run: query `SELECT count(*) FILTER (WHERE captured_at > now() - interval '8 days') FROM airdna_markets;`
Expected: = 43 (sau ~3 đêm chạy Task 1). Khi đúng → đổi default rotate 12 → 7 (comment chu kỳ tuần), commit `chore(e2): rotation steady 7/đêm — chu kỳ tuần 43 market`.

- [ ] **Step 2: `worklist-health.mjs`**

Đọc `collector/state/vn__airbnb-listing.json` (doneIds/goneIds), DB (pending per market = universe − our listings), in báo cáo. Nếu `gone/done > 40%` → in `DỪNG: tỉ lệ delisted bất thường — soát lại giả định id AirDNA` (Review Focus #1) và exit 1.

- [ ] **Step 3: Verify + ghi baseline volume**

Run: `node pipeline/worklist-health.mjs && tail -3 pipeline/logs/airbnb-nightly.log`
Ghi nhận (vào commit message hoặc docs/research/coverage-expansion-plan.md mục 6): thời gian finalize, tổng nights sau 1 tuần, tỉ lệ delisted. Nếu finalize > 60 phút hoặc sync-cloud.log lỗi → tạo việc riêng (index/batch) trước khi tiếp tục tăng batch.

- [ ] **Step 4: Commit**

```bash
git add pipeline/airdna-rotate.mjs pipeline/worklist-health.mjs
git commit -m "feat(e2): steady state — rotation tuần 7/đêm + worklist health (delisted gate 40%)"
```

---

## Phạm vi hoãn (plan riêng sau)

- **Giai đoạn 1b discovery sharding 65 query quận** (spec mục Giai đoạn 1b): chỉ cần sau khi worklist chính xong (~tuần 3-5) để bắt listing mới + segment cap 15k. Yêu cầu dọn bảng `areas` bẩn trước khi sinh query.
- **Join listing-level ra tầng serving** (LTM AirDNA × listings cho Deals/hiệu chuẩn): schema đã có đủ (`airdna_listings.metrics`), chỉ cần view/query khi UI cần — việc của plan UI sau.
