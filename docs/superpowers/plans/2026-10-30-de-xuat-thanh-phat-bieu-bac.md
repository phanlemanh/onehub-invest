# PL16 Bậc dữ liệu B0–B5 + kiểm đề xuất có phát biểu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (phương thức đã chọn ở NH1: tuần tự trong phiên). Steps dùng checkbox.

**Goal:** Mỗi căn và tin lẻ có bậc B0–B5 từ một hàm SQL; ảnh chụp phân bố theo thị trường × loại hình mỗi lượt cloud-sync, in được bằng CLI; dòng kiểm giữ bất biến «đề xuất đã áp có phát biểu».

**Architecture:** Migration 056 chứa hàm bậc (thuần cho tin, tập hợp cho căn), bảng `data_level_snapshot`, seed trục. `pipeline/sql/610_data_level.sql` dựng ảnh chụp ngày (DELETE ngày rồi INSERT). `pipeline/bac-du-lieu.mjs` chạy 610 + ghi hai dòng `dq_check_results` (`--write`) hoặc in bảng. Bước cuối `scripts/cloud-sync.sh`. Nhãn ở `app/src/lib/dq-labels.ts`.

**Tech Stack:** PostgreSQL 16 (PostGIS :5433), Node 24 `.mjs` + `pg`, app Next.js 16 TS (tsx test), bash `job_run`.

**Spec:** `docs/superpowers/specs/2026-10-30-de-xuat-thanh-phat-bieu-bac-design.md` · hợp đồng `_acceptance/de-xuat-thanh-phat-bieu-bac/contract.md` · evals `…/evals.yaml`.

## Global Constraints

- Migration số **056** (liên làn cấp); idempotent; KHÔNG áp lên `oneinvest` dùng chung trước merge — test trên DB thử `oneinvest_p2_bac` (`bash db/db-thu.sh oneinvest_p2_bac`).
- Năm trường lõi = đúng `levelOf` (`app/src/lib/data-level.ts`): `kind` khác rỗng · `property_type` khác rỗng và ≠ `unknown` · `price_vnd > 0` · `area_m2 > 0` · `area_id` khác rỗng.
- Khoá nguồn gốc trường lõi trong `field_provenance`: `kind`, `property_type`, `price_vnd`, `area_m2`, `area_id`.
- `ke_thieu` ∈ {`truong-loi`, `gan-can`, `so-do`, `xac-minh`, `hieu-luc`}; `data_level` ∈ B0…B5; `unit` ∈ {`can`, `tin_le`}; không phường → `market_id = 'chua-ro'`.
- Dòng kiểm: `enrich:proposal-assertion` entity `enrichment_proposals` detail `applied=<n> missing=<m>` (status `fail` khi m > 0); `data-level:distribution` entity `all` detail `units=<n> B0=<a> B1=<b> B2=<c> B3=<d> B4=<e> B5=<f>` status `pass`.
- Dòng kiểm `fail` không đổi mã thoát; chỉ lỗi chạy → thoát 1.
- Không tên nguồn thật (SPL); chỉ `S03`/`S05`/`S06`. Không chạm `pipeline/transform-zalo.mjs`.
- Không sync cloud: `data_level_snapshot` không vào danh sách bảng `sync-cloud.mjs`.

## Review Focus

1. Tin có `property_type = 'unknown'` hay giá 0 → SQL và app cùng trả B0 (E1 ô biên).
2. Căn gắn cả tin đủ và tin thiếu trường lõi → B2 (một tin đủ là đủ) — ca trong itest T1.
3. Đề xuất `applied` chỉ có phát biểu `legacy` cùng giá trị → tính là thiếu (T3).
4. Ảnh chụp chạy hai lần cùng ngày không nhân dòng; ngày hôm qua giữ nguyên (T3 roundtrip).
5. Phường không có cha `market` (dữ liệu areas thiếu) → `chua-ro`, không rơi mất đơn vị khỏi tổng (T3).

---

### Task 1: Migration 056 — hàm bậc, bảng ảnh chụp, trục

**Files:** Create `db/migrations/056_data_level.sql`, `pipeline/scripts/bac-du-lieu.itest.mjs`; Modify `pipeline/mappings.yaml` (trục `data_level.columns: [data_level_snapshot.data_level]`), tệp sinh từ vựng (`node pipeline/vocab.mjs --write`).
**Verify:** `cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_bac node --test scripts/bac-du-lieu.itest.mjs` · `bash db/check-idempotent-tam.sh db/migrations/056_data_level.sql data_level_snapshot ref_lookup ref_field_lookup` · `node pipeline/vocab.mjs --check`
**Phục vụ:** E2, E3, E4, E12, E13 · **independent:** false

**Interfaces — Produces:**
- `offer_data_level(p_kind text, p_property_type text, p_price_vnd numeric, p_area_m2 numeric, p_area_id text, p_linked boolean) RETURNS TABLE (data_level text, ke_thieu text)` IMMUTABLE — B0 `truong-loi` / B1 `gan-can` / B2 `so-do`.
- `property_data_level(p_ids bigint[]) RETURNS TABLE (property_id bigint, data_level text, ke_thieu text)` STABLE, NULL = mọi căn; một câu tập hợp: mỗi căn lấy max trên các tin gắn (`property_offers` ⋈ `sale_offers`) của: đủ trường lõi → B2; thêm mọi khoá lõi `field_provenance->k->>'measured' = 'true'` → B3; thêm mọi khoá lõi `->>'tier' = 'fact'` và `properties.verification = 'verified'` → B4. Không tin đủ → B0 `truong-loi`. B4 → `hieu-luc`; B3 → `xac-minh`; B2 → `so-do`.
- Bảng `data_level_snapshot (snap_date date, market_id text, property_type text, unit text, data_level text, n integer NOT NULL, PRIMARY KEY (snap_date, market_id, property_type, unit, data_level))` + CHECK `data_level IN ('B0'…'B5')`, CHECK `unit IN ('can','tin_le')`.
- Seed `ref_field_lookup ('data_level_snapshot','data_level','data_level') ON CONFLICT DO UPDATE`.

- [ ] Viết itest (giao dịch BEGIN/ROLLBACK, advisory lock 56056 trước khi áp 056 — bài học deadlock NH1): fixture tạo phường + thị trường + căn + tin (`sale_offer_records`, `property_offers`, `field_provenance` dựng tay theo khuôn của `resolve_offer_fields`).
  Ca: `căn B2 · căn B0 truong-loi · tin lẻ B1 gan-can`; `không căn nào nhận B1`; `căn gắn tin đủ + tin thiếu → B2`; `B3 khi cả năm trường lõi measured` + chiều đỏ `thiếu một trường đo phải ở B2`; `B4 khi B3 + verified + lớp fact` + `pending → B3 xac-minh` + `một trường observed → B3` + chiều đỏ `pending không được lên B4`; `không đơn vị nào B5`.
- [ ] Chạy itest → đỏ (hàm chưa có).
- [ ] Viết 056 (header tên tệp, mục đích PL16, nguồn design, «KHÔNG sync cloud», idempotent).
- [ ] Chạy itest → xanh; check-idempotent-tam → xanh; mappings + vocab `--write` rồi `--check` xanh.
- [ ] Commit `feat(db): 056 bậc dữ liệu B0–B5 + ảnh chụp phân bố (PL16)`.

### Task 2: Đối chiếu SQL ↔ levelOf (AC-1)

**Files:** Create `app/tests/data-level-sql.itest.tsx`.
**Verify:** `cd app && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_bac node --import tsx --test tests/data-level-sql.itest.tsx`
**Phục vụ:** E1 · **independent:** false (cần 056 trên DB thử)
**Interfaces — Consumes:** `offer_data_level` (T1), `levelOf` (`app/src/lib/data-level.ts`).

- [ ] Ma trận viết trước: 2⁵ × {gắn, chưa} = 64 ô + 5 ô biên (giá 0, diện tích 0, loại hình `unknown`, loại hình `''`, loại tin `''`) × 2 = 74; mỗi ô gọi `SELECT data_level FROM offer_data_level($1…$6)` và `levelOf`; assert bằng nhau; in `# AC-1: <k>/74 ô khớp`; assert đếm = 74.
- [ ] Chiều đỏ: bản sao vị từ SQL (chuỗi `CREATE FUNCTION pg_temp.lech(...)` dùng `price_vnd IS NOT NULL`) chạy trên cùng ma trận phải có ô lệch, thông điệp ghim `ô lệch: giá 0`.
- [ ] Chạy → xanh. Commit `test(app): đối chiếu bậc SQL với levelOf trên 74 ô (PL16 AC-1)`.

### Task 3: Ảnh chụp 610 + `bac-du-lieu.mjs` + kiểm đề xuất

**Files:** Create `pipeline/sql/610_data_level.sql`, `pipeline/bac-du-lieu.mjs`; Modify `pipeline/scripts/bac-du-lieu.itest.mjs` (thêm ca).
**Verify:** cùng lệnh itest Task 1.
**Phục vụ:** E5 (phần SQL), E7, E18 · **independent:** false
**Interfaces — Produces:**
- `export async function ghiAnhChup(client): Promise<{ units: number, byLevel: Record<string, number> }>` — chạy 610 trong giao dịch của client.
- `export async function kiemDeXuat(client): Promise<{ applied: number, missing: number }>` — đề xuất `applied` thiếu phát biểu sống: không có phát biểu `evidence->>'proposal_id' = id::text`, và không có phát biểu cùng `subject_key` (nguồn tin ‖ `:` ‖ osk) · `field` · `value_key = assertion_value_key(value)` · `method = (hitl nếu decided_by LIKE 'hitl:%' ngược lại source)`; `legacy` không bao giờ khớp.
- `export async function chay(client, { write: boolean }): Promise<number>` — `--write`: `ghiAnhChup` + `kiemDeXuat` + INSERT hai dòng `dq_check_results`; không cờ: in bảng ngày mới nhất. Trả mã thoát (0, hoặc 1 khi lỗi chạy).
- 610: `DELETE FROM data_level_snapshot WHERE snap_date = current_date;` rồi INSERT gom từ (a) căn: `property_data_level(NULL)` ⋈ `properties` (loại hình của căn) ⋈ `areas` phường → cha `region_type='market'`; (b) tin lẻ: `sale_offers` S03/S05/S06 không có trong `property_offers`, `offer_data_level(...)`. `coalesce(market.id,'chua-ro')`, `coalesce(property_type,'unknown')`.

- [ ] Ca itest: `enrich:proposal-assertion bốn dạng` (a proposal_id · b e1_rule cùng ô · c chỉ legacy · d không gì → `applied=4 missing=2`, fail, `chay` trả 0; bỏ c,d → `applied=2 missing=0`; rỗng → `applied=0 missing=0`; chiều đỏ ghim `legacy không được tính là phát biểu của đề xuất`). `phân khúc của đơn vị` (tin lẻ không phường → `chua-ro`; căn ở phường con của M → M, loại hình của properties; chiều đỏ ghim `tin không phường phải ở chua-ro`).
- [ ] Đỏ → viết 610 + `bac-du-lieu.mjs` → xanh. Bảng in: cột «Thị trường | Loại hình | <6 nhãn bậc từ `vocab.generated`> | Tổng», dòng cuối «Tổng».
- [ ] Commit `feat(pipeline): ảnh chụp phân bố bậc + kiểm đề xuất có phát biểu (PL16)`.

### Task 4: Nhãn tiếng Việt + round-trip trên bản chép máy thu

**Files:** Modify `app/src/lib/dq-labels.ts`; Create `app/tests/dq-data-level-label.test.tsx`, `app/scripts/bac-roundtrip.ts`.
**Verify:** `cd app && node --import tsx --test tests/dq-data-level-label.test.tsx` · `cd app && DATABASE_URL=…/oneinvest_p2_bac node --import tsx scripts/bac-roundtrip.ts`
**Phục vụ:** E5, E6, E8, E9, E10 · **independent:** false
**Interfaces — Consumes:** `chay` qua tiến trình con `node ../pipeline/bac-du-lieu.mjs [--write]`; `dqCheckName`, `dqEntityLabel`, `dqDetail`.

- [ ] Nhãn: `enrich:proposal-assertion` → «Đề xuất có phát biểu»; `data-level:distribution` → «Phân bố bậc»; entity `enrichment_proposals` → «Bảng đề xuất», `all` → «Toàn bộ»; detail `applied=(\d+) missing=(\d+)` → «n đề xuất đã áp · m thiếu phát biểu»; `units=… B0=… … B5=…` → «n đơn vị · B0 a · … · B5 f». Test hai ca: dương (cả ba known) và chiều đỏ (thiếu `missing` → known false, thông điệp ghim).
- [ ] `bac-roundtrip.ts`: chèn một dòng mốc ngày hôm qua vào `data_level_snapshot`; chạy `--write` hai lần; in và assert các dòng `AC-5 tổng n=…`, `AC-5 phân khúc: s/s …`, `AC-5 lần hai: …`, `AC-5 ngày khác: …`; chạy không cờ, bắt stdout, assert sáu nhãn bậc + `AC-6 dòng tổng = N khớp ảnh chụp`; đọc dòng kiểm vừa ghi → `AC-7 enrich:proposal-assertion pass applied=0 missing=0`; qua ba hàm nhãn → `AC-8 k dòng kiểm do bac-du-lieu ghi: 0 chưa diễn giải`; lệch → thoát 1 với dòng ghim.
- [ ] Dựng DB thử, áp 056, chạy roundtrip → xanh. Commit `feat(app): nhãn hai kiểm PL16 + round-trip bản chép máy thu`.

### Task 5: Bước cuối cloud-sync

**Files:** Modify `scripts/cloud-sync.sh`, `scripts/job-exit.test.mjs`.
**Verify:** `node --test scripts/job-exit.test.mjs`
**Phục vụ:** E11 · **independent:** false

- [ ] `JOBS["cloud-sync"].seq` thêm `"bac-du-lieu"` cuối; ca mới `AU13 cloud-sync: bac-du-lieu hỏng → ≠0, dòng ghim` dùng `problemsContinueOnFail`.
- [ ] Đỏ → thêm `job_run cloud-sync bac-du-lieu node "$ROOT/pipeline/bac-du-lieu.mjs" --write` sau `push-ops-facts` + comment một dòng → xanh.
- [ ] Commit `feat(scripts): cloud-sync chụp phân bố bậc ở bước cuối (PL16)`.

### Task 6: Không lùi

**Verify:** `cd pipeline && npm test` · `cd app && npm test` · `cd app && npx tsc --noEmit && npm run lint`
**Phục vụ:** E14, E15, E16, E17 · **independent:** false

- [ ] Chạy ba bộ; xoá `app/AGENTS.md` nếu dev server sinh ra; đỏ thì sửa; set contract `status: implemented`.
