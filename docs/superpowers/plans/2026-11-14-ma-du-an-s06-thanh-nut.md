# DA32 Mã dự án S06 thành nút — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi mã dự án S06 có từ 10 tin căn hộ đang rao thành bí danh của đúng một nút dự án, qua một thẻ luật có băm mà người xem mẫu trước khi áp.

**Architecture:** Migration 100 mở `registry_aliases`/`registry_events` cho `node:<id>`, thêm `asset_nodes.catalog_tier`, bảng `project_links`, `project_link_rules`, view `s06_offer_project`. Hàm thuần `pipeline/lib/noi-du-an-s06-lop.mjs` phân lớp và dựng thẻ; lệnh `pipeline/noi-du-an-s06.mjs` đọc DB, dựng thẻ (`--the`), áp theo băm (`--ap`), đảo (`--dao`). Hai bộ khớp tên khác nguồn bỏ qua nút `mot_loi_khai`.

**Tech Stack:** Node 22 ESM (`.mjs`), `pg`, `node:test`; agent TS + `tsx`; PostgreSQL/PostGIS :5433; DB thử `db/db-thu.sh oneinvest_suite_<bộ> --chay`.

**Spec:** `docs/superpowers/specs/2026-11-14-ma-du-an-s06-thanh-nut-design.md` · hợp đồng `_acceptance/ma-du-an-s06-thanh-nut/contract.md` · evals `_acceptance/ma-du-an-s06-thanh-nut/evals.yaml` (11 eval, mã ca `MS6-AC-n`).

## Global Constraints

- Ngưỡng: mã có **≥ 10** tin `sale_offer_records` `source='S06'`, `property_type='apartment'`, `retired_at IS NULL AND superseded_by IS NULL`; mã = `stg_chotot_ads.payload->>'projectid'` nối `c.list_id::text = r.originating_system_key`.
- Tên rỗng giả (sau trim, so không dấu không hoa): `''`, `'Đang cập nhật'`, `'--'`, `'-'`, `'0'`, `'N/A'` → `chua_noi` lý do `khong-ten`.
- Lý do `chua_noi` dùng đúng chuỗi: `khong-ten`, `lech-tinh`, `nhieu-ung-vien`, `dao-luat`.
- Chạm nút: tên chuẩn hoá của mã CHỨA tên hoặc bí danh chuẩn hoá (độ dài ≥ 8) của nút `project` **cùng tỉnh** có `catalog_tier <> 'mot_loi_khai'`. Đúng 1 nút → `noi`; ≥ 2 → `chua_noi nhieu-ung-vien`.
- Tỉnh của mã = thị trường (`areas.region_type='market'`) cha của xã có nhiều tin nhất; mã có tin ở > 1 thị trường → `lech-tinh`. Tỉnh của nút = thị trường của `area_ids[1]` (chính nó nếu đã là market).
- Nút ứng viên: `node_type='project'`, `name` = tên S06, `slug` = slugify(tên) (trùng → `-2`, `-3`…), `aliases` = [tên viết thường], `area_ids` = [xã nhiều tin nhất], `catalog_tier='mot_loi_khai'`, `meta = {nguon:'S06', rule_id}`. KHÔNG mã nguồn trong slug/meta.
- Bí danh: `object_key 'node:<id>'`, `source 'S06'`, `kind 'ma_nguon'`, `value 'du_an/<mã>'`. Bí danh thuộc luật nào đọc qua `project_links.rule_id`.
- Kết cục chuẩn hoá cho băm: `noi:<node_id>` (nút có sẵn) · `duc` · `chua_noi:<ly_do>`; băm = sha256 hex của `JSON.stringify` mảng `[mã, kết cục]` sắp theo mã (so chuỗi). Mã đã có dòng `project_links` trỏ nút ứng viên của chính nó vẫn chuẩn hoá `duc`.
- Thẻ (`--the`) chỉ in tên dự án, tỉnh, xã, số tin — không mã nguồn; dòng cuối `băm: <64 hex>`.
- Câu lọc nút ở bên đọc phải chạy được cả trên DB CHƯA áp 100: `(to_jsonb(n)->>'catalog_tier') IS DISTINCT FROM 'mot_loi_khai'` (không gọi thẳng cột).
- Không chạy migration hay ghi trên DB chung `oneinvest`: test dùng `db/db-thu.sh oneinvest_suite_ms6 --chay` (đổi đuôi theo bộ); itest tự đọc và áp `db/migrations/100_ma_du_an_s06_nut.sql` trước ca đầu.
- Tệp test mới trong `pipeline/tests/` (ngoài glob `npm test` của pipeline — không xếp vào `pipeline/test-nua.json`); `agent/tests/*.test.ts` nằm trong suite agent.
- Comment domain logic tiếng Việt; commit Conventional Commits; chạy `/verify` trước commit code.

## Review Focus

- Mã có tin ở hai xã cùng số tin (hoà mode) → `area_ids` phải tất định: chọn xã có id nhỏ nhất theo chuỗi. Test ở Task 3 (ca `MS6-AC-4`, mã fixture 5+5 tin hai xã).
- Tên S06 có khoảng trắng thừa, chữ hoa, dấu khác dạng (NFC/NFD) → chuẩn hoá giống nhau, không đúc nút trùng tên. Test ở Task 2 (ô thêm: `'  VINHOMES GRAND PARK '` → `noi` Grand Park).
- Hai mã khác nhau cùng tên → hai nút, slug `x` và `x-2`, không gộp. Test ở Task 3 (fixture có cặp cùng tên).
- Mã đổi tên ở nguồn sau khi áp → lần dựng sau giữ nút cũ (theo `project_links`), băm của mã vẫn `duc`. Test ở Task 3 (ca `MS6-AC-6b`: UPDATE tên trong fixture rồi dựng lại, băm không đổi).
- Chạy `--ap` khi đang có luật áp dở bị đảo một phần — không có trạng thái «một phần» vì `--dao` một giao dịch; kiểm ở Task 3 ca `MS6-AC-7` (lỗi giữa chừng → 0 bí danh đổi).

---

### Task 1: Migration 100 [independent: true]

**Files:**
- Create: `db/migrations/100_ma_du_an_s06_nut.sql`
- Create: `pipeline/tests/noi-du-an-s06.itest.mjs` (khung chung + ca `MS6-AC-1`)

**Interfaces:**
- Produces (SQL): cột `asset_nodes.catalog_tier text NOT NULL DEFAULT 'xac_minh'` CHECK `('xac_minh','suy_ra_manh','mot_loi_khai')`; CHECK `object_key` của `registry_aliases` và `registry_events` = `'^((pty|prc|bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}|node:[0-9]+)$'`; bảng `project_link_rules(id bigserial PK, source text CHECK ~ '^S[0-9]{2}$', can_cu text NOT NULL, mau_bam text NOT NULL CHECK ~ '^[0-9a-f]{64}$', so_ma int NOT NULL, decided_by text NOT NULL, decided_at timestamptz NOT NULL DEFAULT now(), dao_by text, dao_at timestamptz)`; bảng `project_links(source text, source_project_id text, asset_node_id bigint REFERENCES asset_nodes(id), status text CHECK IN ('noi','chua_noi'), can_cu text, ly_do text, rule_id bigint REFERENCES project_link_rules(id), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (source, source_project_id), CHECK (status <> 'noi' OR asset_node_id IS NOT NULL), CHECK (status <> 'chua_noi' OR btrim(coalesce(ly_do,'')) <> ''))`; view `s06_offer_project(offer_id, source_project_id, node_id)`.
- Produces (test helper, export từ itest để các ca sau dùng): `apMigration(client)`, `dungFixture(client, maTran)` — tạo schema `ms6_fx` với `sale_offer_records`, `stg_chotot_ads` (chỉ cột lệnh đọc) và đặt `search_path = ms6_fx, public` cho client.

- [ ] **Step 1: Viết ca `MS6-AC-1`** đúng expected của E1 trong `evals.yaml` (áp hai lần, so dấu lược đồ, `catalog_tier` 20 nút cũ = `xac_minh`, `node:<id>` nhận / `node:abc` từ chối, hai CHECK của `project_links`, DELETE bí danh ném lỗi chứa `chỉ thêm`, đối chứng đỏ bản sao bỏ CHECK object_key → ca nêu `node-key`). Khung: `DATABASE_URL` phải trỏ `oneinvest_suite_*`, không thì ném lỗi như `resolve-properties-khoa-gop.itest.mjs:18-21`.
- [ ] **Step 2: Chạy, thấy đỏ** — `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6 --chay node --test --test-concurrency=1 tests/noi-du-an-s06.itest.mjs` → FAIL (thiếu tệp 100).
- [ ] **Step 3: Viết `100_ma_du_an_s06_nut.sql`** theo Interfaces: header như 082, idempotent (`ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS` rồi `ADD`, `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE VIEW`). View: `sale_offer_records` S06 căn hộ đang rao ⨝ `stg_chotot_ads` ⨝ `registry_aliases` `source='S06' AND kind='ma_nguon' AND retired_at IS NULL AND value = 'du_an/'||payload->>'projectid'` → `node_id = substring(object_key from 6)::bigint`.
- [ ] **Step 4: Chạy lại** cùng lệnh → `MS6-AC-1` PASS (ca này đã áp hai lần và so dấu lược đồ — chứng idempotent).
- [ ] **Step 5: Commit** `feat(db): 100 mở bí danh cho nút dự án, bảng nối mã nguồn (DA32)`.

### Task 2: Hàm thuần phân lớp và thẻ [independent: true]

**Files:**
- Create: `pipeline/lib/noi-du-an-s06-lop.mjs`
- Test: `pipeline/tests/noi-du-an-s06-lop.test.mjs`

**Interfaces:**
- Produces:
  - `chuanTen(s: string): string` — bỏ dấu (NFD), `đ→d`, viết thường, gộp khoảng trắng, trim.
  - `laTenRong(s: string|null): boolean` — theo danh sách rỗng giả.
  - `phanLop(ma: {ma, ten, tinh: string[], xaNhieu: string, soTin: number, dlatM: number}, nut: {id, name, aliases, tinh, catalog_tier}[], daNoi?: {asset_node_id, laUngVien: boolean}|null) → {status: 'noi'|'duc'|'chua_noi', node_id?, ly_do?, co_diem_tan: boolean}`.
  - `ketCucChuan(kq) → string` (`noi:<id>` · `duc` · `chua_noi:<ly_do>`), `bamKetCuc(ds: [ma, ketCuc][]) → string` (sha256 hex).
  - `dungThe(ds: {ma, ten, tinh, xa, soTin, kq}[]) → {markdown: string, bam: string, tong: Record<lop, {ma, tin}>}` — bảng mẫu năm tầng + tầng điểm tản theo Global Constraints, KHÔNG in `ma`.
- [ ] **Step 1: Viết ca `MS6-AC-2`** — ma trận 10 ô của E2 (`assert.equal(MA_TRAN.length, 10)`, so `deepEqual`; ma trận giữ đúng 10 ô như hợp đồng) + ca riêng `MS6-AC-2d` (Review Focus): `'  VINHOMES GRAND PARK '` và dạng NFD của «Vinhomes Grand Park» → cùng `noi` Grand Park; ca `MS6-AC-2c` cho `dungThe`: markdown không chứa chuỗi mã nào của đầu vào, `bam` = `bamKetCuc` tính độc lập; đối chứng đỏ: bản sao `phanLop` bỏ điều kiện cùng tỉnh → ô Sunrise Riverside ra `noi`, ca nêu `cung-tinh`.
- [ ] **Step 2: Chạy, thấy đỏ** — `node --test pipeline/tests/noi-du-an-s06-lop.test.mjs` → FAIL (thiếu module).
- [ ] **Step 3: Viết module** theo chữ ký trên; `daNoi.laUngVien` → trả `{status:'duc', node_id: daNoi.asset_node_id}` (giữ nút cũ, không phân lớp lại).
- [ ] **Step 4: Chạy lại** → PASS.
- [ ] **Step 5: Commit** `feat(pipeline): luật phân lớp mã dự án S06 và thẻ luật (DA32)`.

### Task 3: Lệnh dựng, áp, đảo thẻ luật [independent: false — cần Task 1, 2]

**Files:**
- Create: `pipeline/noi-du-an-s06.mjs`
- Test: `pipeline/tests/noi-du-an-s06.itest.mjs` (thêm ca `MS6-AC-2b`, `-3` … `-8`)

**Interfaces:**
- Consumes: Task 1 (`project_links`, `project_link_rules`, view, helper `dungFixture`), Task 2 (`phanLop`, `dungThe`, `bamKetCuc`).
- Produces (export để itest và Task 5 gọi):
  - `docMa(client) → Promise<MaS06[]>` (một câu SQL; xuất chuỗi câu `SQL_DOC_MA`), `docNut(client)`.
  - `dungTheLuat(client) → Promise<{markdown, bam, tong, ds}>`.
  - `apTheLuat(client, {bam, nguoi, giaoDich: 'rieng'|'ngoai'}) → Promise<{rule_id: number|null, khongDoi: boolean}>` — lệch băm ném `Error('bam-lech …')`; `'ngoai'` dùng `SAVEPOINT ms6_ap`.
  - `daoTheLuat(client, {ruleId, nguoi, giaoDich}) → Promise<{soBiDanh: number}>`.
  - `kiemHaiNut(client)`, `kiemLechTinh(client)`, `kiemThieuTrangThai(client)` → `Promise<{ma: string}[]>` (rỗng là đạt).
  - CLI: `--the <tệp>` · `--ap --bam <hex> --nguoi <tên>` · `--dao <rule_id> --nguoi <tên>`; in `đã áp, không đổi` khi `khongDoi`.
- [ ] **Step 1: Viết các ca** đúng expected của E3–E8 (`MS6-AC-2b`, `-3`, `-4`, `-4b`, `-4c`, `-5`, `-6`, `-7`, `-8`) trên fixture ≈ 40 mã đủ mọi lớp, mỗi ca trong `BEGIN … ROLLBACK` gọi lệnh với `giaoDich:'ngoai'`; thêm ca Review Focus: hoà mode xã (`area_ids[1]` = id nhỏ nhất), hai mã cùng tên → slug `x`, `x-2`, `MS6-AC-6b` đổi tên rồi dựng lại băm không đổi. Ca đối chứng đỏ dùng bản sao hàm trong test (chép hàm rồi phá một dòng), như expected ghi.
- [ ] **Step 2: Chạy, thấy đỏ** (lệnh itest của Task 1) → FAIL các ca mới.
- [ ] **Step 3: Viết lệnh.** `apTheLuat`: dựng lại thẻ trong giao dịch, so băm; nếu mọi mã đã có `project_links` đúng kết cục → `khongDoi`; ngược lại chèn dòng luật, với mỗi mã `duc` chưa có nút: chèn nút (slug duy nhất), với mỗi mã nối: chèn bí danh nếu chưa có bí danh còn hiệu lực cùng value, `INSERT … ON CONFLICT (source, source_project_id) DO UPDATE` vào `project_links`. `daoTheLuat`: `UPDATE registry_aliases SET retired_at = now()` cho value của các mã mang `rule_id`, `project_links` → `chua_noi`/`dao-luat` (giữ `asset_node_id`), dòng luật `dao_by/dao_at`.
- [ ] **Step 4: Chạy lại** → mọi ca PASS.
- [ ] **Step 5: Commit** `feat(pipeline): lệnh dựng, áp, đảo thẻ luật mã dự án S06 (DA32)`.

### Task 4: Hai bộ khớp tên bỏ qua nút ứng viên [independent: true]

**Files:**
- Modify: `pipeline/lib/du-an-tren-tin-s03.mjs:181` (câu `SELECT id, name, aliases FROM asset_nodes …`)
- Modify: `agent/src/agents/context-resolver.ts:47-49` (câu trong `loadNodes`)
- Test: `pipeline/tests/noi-du-an-s06.itest.mjs` (ca `MS6-AC-10a`), Create `agent/tests/context-resolver-ung-vien.test.ts` (ca `MS6-AC-10b`)

**Interfaces:**
- Consumes: không (câu lọc chịu được DB chưa có cột, theo Global Constraints).
- Produces: `docDuLieu(client).nut` và `loadNodes()` không chứa nút `mot_loi_khai`; hành vi với DB chưa áp 100 không đổi.
- [ ] **Step 1: Viết `MS6-AC-10a`** (E10: sau áp 100, chèn một nút `mot_loi_khai` tên «Khu Thử Ứng Viên» và dùng nút Grand Park có sẵn; `docDuLieu` không chứa id nút ứng viên, có Grand Park; `tinhDuAn` với bài fixture tên nhóm «Khu Thử Ứng Viên» không gán, «Vinhomes Grand Park» gán Grand Park; đối chứng đỏ `loc-ung-vien-s03`) và **`MS6-AC-10b`** (E11: test agent tự áp 100 lên DB của lượt, chèn hai nút, `resetContextCache()`, `resolveContext` với tên nhóm từng nút; xoá hai nút ở `after`; đối chứng đỏ `loc-ung-vien-agent`). Thêm ca «DB chưa có cột»: chạy câu lọc trên bản sao bảng không có `catalog_tier` (schema tạm) → không lỗi, trả mọi nút.
- [ ] **Step 2: Chạy, thấy đỏ** — lệnh itest Task 1; `cd agent && bash ../db/db-thu.sh oneinvest_suite_ms6a --chay node --import tsx --test tests/context-resolver-ung-vien.test.ts` → FAIL.
- [ ] **Step 3: Sửa hai câu SQL** thêm `WHERE (to_jsonb(n)->>'catalog_tier') IS DISTINCT FROM 'mot_loi_khai'` (alias `n`), comment tiếng Việt trỏ DA32 Hỏi-3.
- [ ] **Step 4: Chạy lại** hai lệnh → PASS; `cd agent && npx tsc --noEmit` không thêm lỗi (2 lỗi tồn đọng của `loop.ts`, `models.ts` giữ nguyên).
- [ ] **Step 5: Commit** `feat: bộ khớp tên S03 và agent bỏ qua nút ứng viên mot_loi_khai (DA32)`.

### Task 5: Chạy trên dữ liệu thật chép và khai executor [independent: false — cần Task 3]

**Files:**
- Create: `pipeline/scripts/noi-du-an-s06-that.mjs`
- Modify: `_acceptance/config.yaml` (`executors.test.ms6_lop`, `ms6_db`, `ms6_agent`, `executors.script.ms6_that`)

**Interfaces:**
- Consumes: Task 3 (`dungTheLuat`, `apTheLuat`, ba hàm `kiem*`, `SQL_DOC_MA`).
- Produces: tệp `_acceptance/ma-du-an-s06-thanh-nut/evidence/the-luat-s06.md`; một dòng stdout `thẻ: <N> mã ≥10 tin, <T> tin, băm <hex>`; cờ `--doi-chung`.
- [ ] **Step 1: Viết script** theo expected E9: áp 100, dựng thẻ ghi evidence, đếm độc lập (SQL viết riêng, không dùng `SQL_DOC_MA`) N, T và tổng từng lớp → so; áp bằng băm; ba `kiem*` = 0; đếm view = đếm độc lập; soát tệp thẻ không chứa mã nguồn nào (`lo-ma-nguon`); in thêm số mã của định nghĩa nhóm giá (bán hoặc thuê ≥ 10 tin có `price_perm2`) để đối chiếu 268. `--doi-chung`: lệch bộ đếm độc lập 1 → thoát 1, in `tong-lech`.
- [ ] **Step 2: Khai bốn executor** trong `_acceptance/config.yaml` cạnh khối `tdn_*`:
  - `ms6_lop: "node --test pipeline/tests/noi-du-an-s06-lop.test.mjs"`
  - `ms6_db: "cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6 --chay node --test --test-concurrency=1 tests/noi-du-an-s06.itest.mjs"`
  - `ms6_agent: "cd agent && bash ../db/db-thu.sh oneinvest_suite_ms6a --chay node --import tsx --test tests/context-resolver-ung-vien.test.ts"`
  - `ms6_that: "cd pipeline && bash ../db/db-thu.sh oneinvest_suite_ms6t --chay node scripts/noi-du-an-s06-that.mjs"`
- [ ] **Step 3: Chạy** `ms6_that` → exit 0, dòng `thẻ: …` có N ≈ 344 (trôi theo dữ liệu ngày chạy); chạy kèm `--doi-chung` → exit 1, `tong-lech`.
- [ ] **Step 4: Chạy cả bộ** `ms6_lop`, `ms6_db`, `ms6_agent`, rồi `node --test scripts/*.test.mjs` ở gốc kho (CI chạy) → xanh.
- [ ] **Step 5: Commit** `feat(pipeline): chạy thẻ luật S06 trên dữ liệu thật chép, khai executor (DA32)`.

## Thứ tự

Task 1, 2, 4 độc lập (khác tệp; Task 4 chỉ cần migration 100 có mặt lúc chạy test — chạy sau Task 1 trên cùng nhánh). Task 3 sau 1 + 2. Task 5 sau 3. Làm tuần tự trong một phiên: 1 → 2 → 4 → 3 → 5.
