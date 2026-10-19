# C1 — Vận hành hoá Collector: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collector tự vận hành từ monorepo — raw zone gộp về, SPL mã hoá nguồn ở serving, conduct CCP trong scheduler, API coverage + DQ checks + backup + launchd cron.

**Architecture:** Data move trước (T1), schema migrations một file (T2), SPL đổi giá trị serving + label map app (T3), role admin + 2 trang /ops (T4), API v1 coverage dùng chung lib queries (T5), DQ checks SQL (T6), conduct trong collector core có unit test (T7), backup + cron (T8). Spec: `docs/adr/0007-collector-operating-principles.md` + `docs/ROADMAP.md` track C1.

**Tech Stack:** TypeScript (collector, node:test), Next.js 16 app router (app/), PostgreSQL qua `docker exec one-invest-db psql` (kartoza postgis), bash + launchd.

## Global Constraints

- UI tiếng Việt; tên nguồn thật KHÔNG xuất hiện ở serving/API — mã `S01`–`S04` (ADR-0007 SPL).
- Raw zone bất biến: không sửa nội dung snapshot có sẵn; `snapshots/`, `state/`, `.airdna-profile/` gitignored.
- DB đổi qua migration trong `db/migrations/` (quy tắc AGENTS.md); pipeline SQL sống trong `pipeline/sql/`.
- psql luôn: `docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -h localhost -U oneinvest -d oneinvest`.
- Mã SPL: `S01`=airbnb (Tự thu), `S02`=airdna (Hiệu chuẩn), `S03`=zalo (Cộng đồng), `S04`=osm (Địa giới mở).
- Collector chạy headful system Chrome; không đổi kỹ thuật browse sẵn có.

## Review Focus

1. Literal `'airdna'`/`'mock'` sót ở consumer sau migration SPL (queries.ts, transform pipeline) → T3 bước grep toàn repo phải sạch.
2. `/api/v1/ops/coverage` gọi không token → phải 401, không rò dữ liệu → T5 test curl.
3. City không có snapshot (danang) trong coverage query → trường rỗng/null, không crash → T5.
4. DQ volume check khi city chỉ có 1 snapshot (hcmc) → SKIP không phải FAIL → T6.
5. `backup.sh` khi `BACKUP_DIR` unset → exit 0 + ghi note (không fail cron), conduct window chặn chạy tay ban ngày → có env override → T7/T8.

---

### Task 1: Gộp raw zone về monorepo + PROFILE_DIR tương đối

**Files:**
- Modify: `collector/src/collectors/airdna-research.ts:11`
- Data: copy `~/dev/one-invest-collector/{snapshots,state,.airdna-profile}` → `collector/`

**Interfaces:**
- Produces: `collector/snapshots/<city>/…`, `collector/state/*.json`, `collector/.airdna-profile/` — mọi task sau và weekly-collect.sh đọc vị trí này.

- [ ] **B1:** `rsync -a` 3 thư mục từ repo cũ sang `collector/` (copy, KHÔNG xóa bên cũ — old repo để user archive). Verify: `ls collector/snapshots/hanoi | tail` thấy snapshot cũ nhất+mới nhất; `du -sh collector/snapshots` > 100MB.
- [ ] **B2:** Sửa `PROFILE_DIR` thành path tương đối gốc monorepo: dùng `new URL("../../../.airdna-profile/", import.meta.url)` (từ `src/collectors/` xuống gốc) — same pattern `ROOT` trong `cli.ts`.
- [ ] **B3:** Verify: `cd collector && npm run build && npm run collect -- list-sources` in đủ 6 nguồn; `bash -n ../pipeline/finalize-hanoi.sh` + `ls collector/snapshots/hanoi/hanoi__airbnb-*` khớp glob dòng 12 của script.
- [ ] **B4:** Commit: `feat(c1): gộp raw zone về monorepo — airdna profile dùng path tương đối`.

### Task 2: Migration 012 — source_registry + users.role + dq_check_results

**Files:**
- Create: `db/migrations/012_source_registry_roles_dq.sql`

**Interfaces:**
- Produces: bảng `source_registry(code text PK, real_name, label_key, role_label, status, since, retired_at)`; cột `users.role text NOT NULL DEFAULT 'user'` (user hiện có UPDATE thành `admin`); bảng `dq_check_results(id serial, checked_at, check, entity, status, detail)`. Mã seed: S01–S04 như Global Constraints; `role_label` là nhãn tiếng Việt tầng C.

- [ ] **B1:** Viết migration (CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS + UPDATE users SET role='admin'; + INSERT seed 4 mã ON CONFLICT DO NOTHING).
- [ ] **B2:** Apply + verify: psql `\d source_registry`, `SELECT code, real_name FROM source_registry ORDER BY code` trả 4 dòng, `SELECT role, count(*) FROM users GROUP BY 1` → admin.
- [ ] **B3:** Commit: `feat(db): 012 — source_registry (SPL) + users.role + dq_check_results`.

### Task 3: SPL — mã B ở serving + label map app

**Files:**
- Modify: `db/migrations/012…sql` (thêm UPDATE đổi giá trị cũ — viết trước khi apply ở T2 nên gộp luôn: area_sources `airdna`→`S02`, sale_offers `mock`→`S03`; `ALTER TABLE market_metrics ADD COLUMN source text NOT NULL DEFAULT 'S01'`)
- Modify: `app/src/lib/queries.ts` (2 chỗ `source = 'airdna'` → `'S02'`)
- Modify: pipeline ghi sale_offers (tìm `grep -rn "'mock'" pipeline/ app/src` — transform-zalo/500_asset_stats) → `'S03'`
- Create: `app/src/lib/source-labels.ts`

**Interfaces:**
- Produces: `sourceLabel(code: string): { vi: string; hint?: string }` — S01→"Tự thu", S02→"Hiệu chuẩn", S03→"Cộng đồng", S04→"Địa giới mở"; unknown → `code`.

- [ ] **B1:** Sửa migration + các consumer; UI hiện badge "DỮ LIỆU MÔ PHỎNG" ở /yield nếu đọc source thì đổi điều kiện sang `S03` (grep `'mock'` trong app/src).
- [ ] **B2:** Apply migration; verify DB: `SELECT DISTINCT source FROM area_sources` → `S02`; `SELECT DISTINCT source FROM sale_offers` → `S03`; `SELECT DISTINCT source FROM market_metrics` → `S01`.
- [ ] **B3:** Viết `source-labels.ts` + thay chỗ hiển thị. Verify: `grep -rn "'airdna'\|'mock'" app/src pipeline/sql` chỉ còn ở bảng airdna_* hợp lệ (tên bảng, không phải giá trị source serving) — ghi kết quả grep vào commit message.
- [ ] **B4:** Verify app: `npm run build` sạch; dev server `/vn`, `/vn/hanoi`, `/yield` → 200.
- [ ] **B5:** Commit: `feat(spl): serving dùng mã nguồn S01–S04 + label map tiếng Việt`.

### Task 4: role admin + /ops/sources (giải mã) + /ops (tổng quan)

**Files:**
- Modify: `app/src/lib/auth.ts` (User thêm `role`; SELECT thêm cột)
- Modify: `app/src/lib/ops-access.ts` (thêm `isAdmin(user)`)
- Create: `app/src/lib/ops-queries.ts`
- Create: `app/src/app/ops/page.tsx`, `app/src/app/ops/sources/page.tsx`

**Interfaces:**
- Produces: `getCoverageOverview(): Promise<CoverageRow[]>` với `CoverageRow = { code: string; city: string; lastSnapshotAt: string | null; ageDays: number | null; sloDays: number; status: "fresh" | "stale" | "none" }` — đọc `airbnb_snapshots` (source thật tầng A) JOIN `source_registry` map ra mã; SLO: S01 discovery/listings 8, S03 3, S02 35.
- `isAdmin(user: User): boolean` — `user.role === "admin"`. `/ops/sources` gọi `notFound()` khi `!isAdmin`.

- [ ] **B1:** auth.ts + ops-access.ts sửa (User type, SELECT u.role, isAdmin).
- [ ] **B2:** ops-queries.ts viết getCoverageOverview (SQL: `SELECT source, city, max(collected_at) FROM airbnb_snapshots GROUP BY 1,2` + map source thật→mã bằng object const cục bộ — map không lưu DB serving).
- [ ] **B3:** 2 trang: `/ops` bảng CoverageRow + thanh trạng thái; `/ops/sources` bảng giải mã full (mã, tên thật, nhãn, status, since) gated admin.
- [ ] **B4:** Verify không login: curl `/ops/sources` → 307; có session admin → 200 chứa "S01" (tạo session test: INSERT INTO sessions token + curl cookie + DELETE).
- [ ] **B5:** Commit: `feat(ops): /ops tổng quan freshness + /ops/sources giải mã gated admin`.

### Task 5: DCA — /api/v1/ops/coverage + OpenAPI skeleton + check-freshness webhook

**Files:**
- Create: `app/src/app/api/v1/ops/coverage/route.ts`
- Create: `docs/api/openapi.yaml`
- Create: `scripts/check-freshness.mjs`

**Interfaces:**
- Consumes: `getCoverageOverview()` (T4).
- Produces: `GET /api/v1/ops/coverage` — auth: session cookie HOẶC `Authorization: Bearer $OPS_API_TOKEN` (env; thiếu cả hai → 401 JSON `{error}`). Response `{generatedAt, rows: CoverageRow[]}`. `scripts/check-freshness.mjs` — exit 1 khi có row `stale|none`, POST `$WEBHOOK_URL` JSON `{text: …}` nếu đặt.

- [ ] **B1:** route.ts (export GET; kiểm auth trước; force-dynamic).
- [ ] **B2:** openapi.yaml v1 skeleton (info, securityScheme bearer, path này).
- [ ] **B3:** check-freshness.mjs (pg query thẳng, không phụ thuộc app).
- [ ] **B4:** Verify: curl không token → 401; curl token đúng (OPS_API_TOKEN=test chạy `npm run start`) → JSON có `rows` ≥ 4; `node scripts/check-freshness.mjs && echo OK` exit 0; `node --input-type=module -e "JSON.parse(require('fs')…)"`-style parse openapi.yaml bằng `npx yaml` hoặc bỏ qua nếu không có tool.
- [ ] **B5:** Commit: `feat(dca): /api/v1/ops/coverage + OpenAPI v1 skeleton + check-freshness`.

### Task 6: DQO — 450_dq_checks.sql + footer freshness

**Files:**
- Create: `pipeline/sql/450_dq_checks.sql`
- Modify: `pipeline/scripts/weekly-collect.sh` (chạy 450 sau 410)
- Modify: insight market page (tìm trong `app/src/components/` template Insight — thêm dòng "Cập nhật {date} · {n} listing")

- [ ] **B1:** 450_dq_checks.sql — mỗi check `INSERT INTO dq_check_results SELECT …` với status pass/fail/skip: (a) occupancy domain `BETWEEN 0 AND 1` trên market_metrics+listing_stats; (b) volume: listings/city so 2 snapshot gần nhất giảm >20% → fail, chỉ 1 snapshot → skip; (c) median ADR/city đổi >30% giữa 2 snapshot → fail; (d) not-null: market_metrics.metric/metric_value, listings.id; (e) freshness: per city max(collected_at) vs SLO. Kết thúc: `SELECT check, status, detail FROM dq_check_results ORDER BY checked_at DESC LIMIT 20` cho log.
- [ ] **B2:** Chạy trực tiếp: mọi check pass/skip trên data hiện tại (hà nội 2 nguồn snapshot, hcmc 1 — volume skip đúng Review Focus #4).
- [ ] **B3:** weekly-collect.sh thêm dòng chạy 450 sau 410 (cùng kiểu psql qua docker ở `finalize-hanoi.sh` — neo theo DB_DIR của script đó).
- [ ] **B4:** Footer Insight: query max(collected_at)+count listings cho market, hiển thị "Cập hoạch YYYY-MM-DD · N listing" nhỏ cuối trang. Verify `/vn/hanoi` 200 + build sạch.
- [ ] **B5:** Commit: `feat(dqo): 450_dq_checks (4 trụ) + footer freshness trang Insight`.

### Task 7: CCP — conduct.ts + scheduler jitter/cap/window + smoke hằng ngày

**Files:**
- Create: `collector/src/core/conduct.ts`, `collector/src/test/conduct.test.ts`
- Modify: `collector/src/core/scheduler.ts`, `collector/src/cli.ts`, `collector/src/collectors/airbnb-discovery.ts:6` (MAX_PAGES từ env), `collector/package.json` (script test)
- Create: `scripts/smoke-daily.sh`

**Interfaces:**
- Produces: `jitterMs(minMs=2000, maxMs=15000): number` (pure, dùng Math.random); `inActivityWindow(now=new Date(), window="19-23"): boolean`; `dailyBudget(checkpointDate: string|undefined, now: Date): {date: string; used: number}` — pure helpers. Scheduler: sau mỗi `rateLimit.take()` thêm `sleep(jitterMs())` khi `CONDUCT_JITTER!=0`; trước collect kiểm window (env `CONDUCT_WINDOW=19-23`, `off` để tắt) và cap ngày (env `CONDUCT_DAILY_MAX=600` items, đếm trong checkpoint key `conduct:<yyyymmdd>`).

- [ ] **B1:** Viết test trước (node:test): jitterMs trong miền + min≤max; inActivityWindow 18:59 false/19:00 true/22:59 true/23:01 false; dailyBudget lăn ngày mới reset.
- [ ] **B2:** `npm run test` (thêm script `"test": "tsc -p tsconfig.json && node --test dist/test/"`) → fail (chưa có module).
- [ ] **B3:** Implement conduct.ts → test pass.
- [ ] **B4:** scheduler.ts + cli.ts wiring (window check exit code 0 với message rõ; cap ghi checkpoint). airbnb-discovery `MAX_PAGES = Number(process.env.AIRBNB_DISCOVERY_MAX_PAGES ?? 15)`.
- [ ] **B5:** smoke-daily.sh: chạy discovery MAX_PAGES=1, grep log `page 1:` có `cards` > 0; fail → POST WEBHOOK_URL; KHÔNG fail khi Airbnb đổi → chỉ warn selector. Verify: `npm run test` pass; `bash -n smoke-daily.sh`.
- [ ] **B6:** Commit: `feat(ccp): conduct (jitter+window+cap) trong scheduler + smoke test hằng ngày + test node:test`.

### Task 8: DR — backup.sh + launchd plists + install script

**Files:**
- Create: `pipeline/scripts/backup.sh`, `pipeline/scripts/weekly-with-jitter.sh`
- Create: `pipeline/cron/com.oneinvest.collector.plist`, `com.oneinvest.smoke.plist`, `com.oneinvest.backup.plist`
- Create: `scripts/install-cron.sh`

**Interfaces:**
- Produces: backup.sh — `BACKUP_DIR` unset → log note + exit 0; set → `db-YYYYMMDD.sql.gz` (pg_dump qua docker exec) + `raw-YYYYMMDD.tar.gz.enc` (tar snapshots+state+ `.airdna-profile`, openssl aes-256 pass `$BACKUP_PASS`), prune >56 ngày. weekly-with-jitter.sh: `sleep $((RANDOM % 1800))` rồi exec weekly-collect.sh. Plists: collector Chủ nhật 19:30, smoke 20:00 hằng ngày, backup Chủ nhật 21:00. install-cron.sh: cp plist → `~/Library/LaunchAgents/` + `launchctl bootstrap gui/$(id -u)`.

- [ ] **B1:** Viết 5 file. Env (BACKUP_DIR/BACKUP_PASS/WEBHOOK_URL/OPS_API_TOKEN/OPS_EMAILS) ghi chú đầu file — KHÔNG hardcode giá trị thật.
- [ ] **B2:** Verify: `bash -n` cả 3 script; `plutil -lint` 3 plist; chạy `BACKUP_DIR=/tmp/c1-backup-test BACKUP_PASS=test bash pipeline/scripts/backup.sh` → 2 file tồn tại + gunzip file db đọc được header PostgreSQL; unset BACKUP_DIR → exit 0.
- [ ] **B3:** KHÔNG tự bootstrap launchd trong plan này — install-cron.sh để user chạy (đụng LaunchAgents của user). Ghi note.
- [ ] **B4:** Commit: `feat(dr): backup tuần (pg_dump + raw mã hoá) + launchd plists + install script`.

### Task 9: Verify toàn cục + push

- [ ] **B1:** `app: npm run build` sạch; start prod server: `/`, `/vn`, `/vn/hanoi`, `/yield`, `/ops` (307), `/api/v1/ops/coverage` (401/200) đúng kỳ vọng.
- [ ] **B2:** `collector: npm run test && npm run check` pass.
- [ ] **B3:** psql: 4 bảng/mới cột của T2 tồn tại; dq_check_results có dòng pass.
- [ ] **B4:** Push. Note trong commit body: HCMC ≥100 listings do cron tích lũy nhiều tuần — tiêu chí C1 đó không đo được ngay.
