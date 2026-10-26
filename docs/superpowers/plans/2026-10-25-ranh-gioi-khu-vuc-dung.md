# Ranh giới khu vực đúng (AU9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `vn-hanoi` chỉ còn phường/xã của Hà Nội; khu vực cấp tỉnh đã lỡ nạp được dọn an toàn; số liệu tính lại;
lỗi không tái phát.

**Architecture:** Sửa `pipeline/reassign-areas.mjs` (lọc cấp 6, chốt vị trí, dọn khu vực lạc, chốt an toàn), tách
thân thành `runReassign(client, cities)` để test bọc `BEGIN … ROLLBACK`. Thêm check DQ ở `450_dq_checks.sql`. Đo dữ
liệu thật bằng `scripts/kiem-ranh-gioi-khu-vuc.mjs --thu` (một transaction, ROLLBACK) và test app gọi
`getFinderAreas(..., { db })` trên cùng transaction. Không áp thật trước chữ ký Cổng Bằng chứng (Hỏi-4).

**Tech Stack:** Node ESM + `pg`, PostGIS (DB local :5433), `node:test`; app TypeScript + tsx.

**Spec:** `docs/superpowers/specs/2026-10-25-ranh-gioi-khu-vuc-dung-design.md`,
`_acceptance/ranh-gioi-khu-vuc-dung/contract.md` (AC-1…AC-9, Gate 1 duyệt 25/10).

## Global Constraints

- Phường = `payload.tags.admin_level = '6'`; dung sai vị trí = 0.01° (`ST_Buffer(market.geom, 0.01)`).
- Chốt an toàn: tập phường hợp lệ rỗng hoặc `< 0.5 ×` số con `osm-phuong` hiện có của market → ném lỗi, không xoá.
- Khu vực lạc còn `saved_markets` → giữ, in id + số dòng (Hỏi-3).
- Tin bán trỏ khu vực lạc → `area_id = NULL`; listing ngoài mọi phường hợp lệ → bỏ khỏi canonical (Hỏi-2, luật 3).
- KHÔNG chạy `reassign-areas.mjs` thật, KHÔNG COMMIT lên DB local trong S3/S4 (Hỏi-4). Mọi phép đo trên DB local bọc
  `BEGIN … ROLLBACK`.
- Không in tên nguồn thật; báo cáo JSON (nếu có) chỉ ở `.acceptance-runs/`.
- TypeScript strict ở app; comment domain tiếng Việt.

## Review Focus

1. Snapshot thật mất tag `admin_level` → chốt AC-9 dừng trước khi xoá (test chiều đỏ, Task 1).
2. Hai phường cùng polygon (mồi chép từ dòng thật) → PIP chọn theo `ST_Area, id`; test chỉ đòi listing rơi vào MỘT
   phường hợp lệ có `ST_Covers` điểm, không đòi id cụ thể (Task 1).
3. `300_metrics.sql`/`400_breakdowns.sql` có `TRUNCATE` — chạy trong transaction được, nhưng khoá bảng tới ROLLBACK;
   script `--thu` phải ngắn và luôn ROLLBACK cả khi lỗi (Task 3).
4. CI (AU11) dựng DB trống: test cần dòng thật của `stg_osm_boundaries` → khi `CI=true` và không có dòng thật thì
   `t.skip` có lý do; khi main có `scripts/ci-bo-qua.json` thì thêm ca vào đó (Task 5).
5. Market chưa có polygon (DB trống, thị trường mới) → chốt vị trí không áp, in cảnh báo, không ném (Task 1).

---

### Task 1: `runReassign` — lọc cấp 6, chốt vị trí, dọn khu vực lạc, chốt an toàn

**Files:**
- Modify: `pipeline/reassign-areas.mjs`
- Test: `pipeline/scripts/reassign-areas.test.mjs`

**Interfaces:**
- Produces: `export async function runReassign(client, cities = Object.keys(MARKETS), { log = console } = {})` →
  `{ moves, dropped, removed, kept, skippedLevel, skippedOutside, stale }`; người gọi giữ transaction. `main()` bọc
  `BEGIN/COMMIT/ROLLBACK` như cũ; entrypoint theo nếp `realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)`.

- [ ] **Step 1: Viết test đỏ** (mỗi ca `BEGIN` … `ROLLBACK`, mồi: snapshot `hanoi__au9-moi`):
  - `AU9-AC-1 chỉ ranh giới cấp 6 thành phường`: chép payload một dòng thật cấp 6 (đổi `tags.name` → «Phường Mồi
    AU9», `osm_id` → `au9-moi-6`) + một dòng cấp 4 polygon bao Hà Nội (`au9-moi-4`); sau `runReassign(client,
    ["hanoi"], { log })`: `vn-hanoi-moi-au9` có trong `areas`; không area nào có `meta->>'osm_id' = 'au9-moi-4'`; số
    trong dòng log «bỏ N dòng khác cấp» = `count(*)` dòng `hanoi__%` có `admin_level <> '6'` (đếm theo `DISTINCT ON
    (osm_id)` như hàm).
  - `AU9-AC-2 …ngoài polygon market bị bỏ, in tên` (mồi cấp 6 tịnh tiến +3° kinh độ) và `AU9-AC-2 market chưa có
    polygon → không chốt, in cảnh báo` (tạm `UPDATE areas SET geom = NULL WHERE id='vn-hanoi'` trong transaction).
  - `AU9-AC-3 dọn khu vực lạc`: tạo khu vực lạc `vn-hanoi-tinh-moi-au9` (`osm-phuong`, `osm_id` không có trong
    snapshot), listing A ở trong một phường thật, listing B ở Hưng Yên (106.05, 20.65), tin bán, dòng
    `market_metrics` + `area_breakdowns` trỏ vào; sau chạy: A ở một phường hợp lệ có `ST_Covers`, B không còn trong
    `listings`, tin bán `area_id IS NULL`, không còn metrics/breakdowns/area của khu vực lạc.
  - `AU9-AC-3 khu vực lạc có saved_markets thì giữ`: thêm `saved_markets(user_id='au9-moi', area_id=…)`; khu vực còn,
    dòng saved còn, log có id + «1 saved_markets».
  - `AU9-AC-4 chạy lần hai không đổi gì`: lần hai `moves` không có dòng đổi, `dropped` rỗng, `removed` rỗng.
  - `AU9-AC-9 snapshot mất tag admin_level → dừng, không xoá gì`: trong transaction xoá tag `admin_level` khỏi mọi
    dòng `hanoi__%`; `runReassign` ném lỗi chứa `vn-hanoi` và hai con số; đếm `areas`, `listings`,
    `market_metrics` trước = sau (dùng SAVEPOINT quanh lời gọi).
  - Không có dòng thật cấp 6 → `CI=true`: `t.skip("cần stg_osm_boundaries thật")`; không CI: fail.
- [ ] **Step 2:** `cd pipeline && node --test scripts/reassign-areas.test.mjs` → FAIL (`runReassign` chưa xuất).
- [ ] **Step 3: Cài đặt** trong `pipeline/reassign-areas.mjs`:
  - `upsertPhuong`: thêm `payload->'tags'->>'admin_level'` vào SELECT; bỏ dòng khác `'6'` (đếm); với market có
    `geom`, bỏ dòng mà `ST_PointOnSurface(g)` không nằm trong `ST_Buffer(market.geom, 0.01)` (in tên); market không
    geom → một dòng cảnh báo. Trả `{ upserted, ids, skippedLevel, skippedOutside }`.
  - Chốt an toàn ngay sau upsert: `ids.length === 0 || ids.length < 0.5 × count(con osm-phuong hiện có)` → `throw
    new Error(\`\${market.id}: chỉ \${ids.length} phường hợp lệ / \${hien} con hiện có — dừng, không xoá\`)`.
  - `stale` = con `osm-phuong` của market không thuộc `ids`. PIP (bước 2) và luật 3 (bước 3) chỉ xét `osm-phuong`
    KHÔNG thuộc `stale`.
  - Dọn (sau bước 3): `stale` có `saved_markets` → `kept` (in id + số); còn lại: `UPDATE sale_offers SET area_id =
    NULL`, xoá `market_metrics`, `area_breakdowns`, rồi `DELETE FROM areas` → `removed`.
- [ ] **Step 4:** chạy lại test → PASS; `cd pipeline && npm test` xanh.
- [ ] **Step 5:** commit `fix(pipeline): reassign-areas chỉ nhận phường cấp 6 trong polygon, dọn khu vực lạc (AU9)`.

### Task 2: Check DQ `area_con_ngoai_cha`

**Files:** Modify `pipeline/sql/450_dq_checks.sql`; Test: thêm vào `pipeline/scripts/reassign-areas.test.mjs`.

- [ ] **Step 1: Test đỏ**: `AU9-AC-5 DQ area_con_ngoai_cha fail khi có con ngoài cha` (chèn con có polygon ở
  Hưng Yên dưới `vn-hanoi`, chạy đúng khối SQL của check rút từ tệp 450 theo marker `-- AU9 area_con_ngoai_cha`,
  đọc dòng `dq_check_results` mới nhất: `status='fail'`, `detail` có số ≥ 1) và `…pass trên dữ liệu sạch` (chạy
  `runReassign` trước trong cùng transaction, rồi check → `pass`).
- [ ] **Step 2:** FAIL. **Step 3:** thêm khối `INSERT INTO dq_check_results (check_name, entity, status, detail)`
  đếm con có `geom` mà `NOT ST_Covers(ST_Buffer(p.geom, 0.01), ST_PointOnSurface(c.geom))`, entity = id cha, giữa
  hai marker `-- AU9 area_con_ngoai_cha` / `-- /AU9`. **Step 4:** PASS. **Step 5:** commit.

### Task 3: `scripts/kiem-ranh-gioi-khu-vuc.mjs`

**Files:** Create `scripts/kiem-ranh-gioi-khu-vuc.mjs` (mượn `pg` từ `app/node_modules`, bẫy #6).

**Interfaces:** Consumes `runReassign` (Task 1). Hai chế độ: `--thu` (BEGIN → chụp trước → `runReassign` → đọc và
chạy `pipeline/sql/300_metrics.sql`, `400_breakdowns.sql` → chụp sau → ROLLBACK, luôn ROLLBACK trong `finally`) và
mặc định (chỉ đọc trạng thái hiện tại, dùng sau khi áp thật).

- [ ] **Step 1:** Viết hàm `chup(client)` → `{ extentCon, bboxCha, tenTinh: string[], ngoaiCha: {hanoi, hcmc},
  hcmcPhuong, tro: {listings, sale_offers, market_metrics, area_breakdowns, market_asset_stats}, rollupLech }`.
- [ ] **Step 2:** In khối «trước» (phải đỏ ở extent và «Tỉnh…», `khu vực lạc (trước): <n> id` với n > 0), khối «sau»
  (các dòng `ok   …` đúng chữ trong evals E6/E7), dòng cuối `ROLLBACK — DB local không đổi`; exit 1 nếu bất kỳ
  điều kiện nào sai (kể cả «trước» không đỏ).
- [ ] **Step 3:** Chạy `node scripts/kiem-ranh-gioi-khu-vuc.mjs --thu` → exit 0; kiểm DB local không đổi (đếm areas
  trước/sau lệnh). **Step 4:** commit.

### Task 4: `getFinderAreas` nhận `db` + test app

**Files:** Modify `app/src/lib/queries.ts:293`; Create `app/tests/finder-ranh-gioi.test.tsx`.

- [ ] **Step 1:** Test đỏ: một `pg.Client`, `BEGIN`; `getFinderAreas({ marketId: "vn-hanoi" }, { db: client })` →
  có khu vực vượt bbox `vn-hanoi` (đối chứng); import `runReassign` từ `../../pipeline/reassign-areas.mjs`, chạy +
  300; gọi lại → ≥ 1 khu vực, mọi hình trong bbox (dung sai 0.01°); `ROLLBACK`.
- [ ] **Step 2:** FAIL (tham số `db` chưa có). **Step 3:** thêm `db = pool` vào options (`{ geometry = true, db = pool
  }: { geometry?: boolean; db?: Queryable } = {}`), thay `pool.query` bằng `db.query`. **Step 4:** PASS; `cd app &&
  npx next typegen && npx tsc --noEmit && npm run lint && npm test`. **Step 5:** commit.

### Task 5: Hoàn thiện

- [ ] Sau khi main có `scripts/ci-bo-qua.json` (AU11): gộp main, thêm các ca AU9 cần DB thật vào danh sách (tệp ·
  tên ca · lý do). Chưa có thì ghi ở `## Notes` của hợp đồng.
- [ ] `/verify` cho pipeline + app; contract `status: implemented`.
