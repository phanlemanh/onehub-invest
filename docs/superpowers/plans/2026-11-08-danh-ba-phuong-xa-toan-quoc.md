# PX1 Danh bạ phường/xã toàn quốc — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nạp đủ 3.321 xã theo mã Cục Thống kê vào `areas` (giữ id cũ), ghi 10.033 bí danh xã cũ, cho transform S03/S06 khớp tên trên danh bạ, giữ reassign khỏi xoá xã danh bạ, đo tin có xã trước/sau theo tỉnh.

**Architecture:** Dữ liệu chép kèm băm ở `pipeline/data/dvhc/`; hàm thuần ở `pipeline/lib/dvhc.mjs`; migration 084 thêm `areas.admin_code` + bảng `area_aliases`; bộ nạp `pipeline/nap-dvhc.mjs` một giao dịch; `lib/osm.mjs` tách điều kiện khớp tên khỏi điều kiện point-in-polygon và đọc có điều kiện khi DB chưa áp 084.

**Tech Stack:** Node ESM (.mjs), `pg`, `node:test`, PostgreSQL/PostGIS, `db/db-thu.sh` (DB của riêng lượt).

**Spec:** `docs/superpowers/specs/2026-11-08-danh-ba-phuong-xa-toan-quoc-design.md` · hợp đồng `_acceptance/danh-ba-phuong-xa-toan-quoc/contract.md` (AC-1…AC-10) · evals `…/evals.yaml` (E1…E10).

## Global Constraints

- Không sửa migration đã commit; 084 idempotent (`IF NOT EXISTS`), viết theo skill `/new-migration`; không áp lên `oneinvest` :5433 dùng chung (chỉ DB thử).
- Không xoá tin/listing; không `DELETE`/`TRUNCATE` trên `sale_offer_records`/`listing_records` (`lib/scan-delete.mjs`).
- Chép DỮ LIỆU từ `~/dev/onehub-quy-hang/packages/core/src/address/du-lieu/`, không chép code; `NGUON.json` ghi sha256 + commit nguồn (`git -C ~/dev/onehub-quy-hang rev-parse HEAD`).
- Bảng ánh xạ tỉnh cố định: `01→vn-hanoi`, `79→vn-hcmc`, còn lại `vn-<slugify(tên bỏ «Tỉnh »/«Thành phố »)>`; tên so với `areas.name` của market (bỏ cùng tiền tố).
- Tên chuẩn: NFC, thường hoá, bỏ đúng tiền tố cấp xã `Phường|Xã|Thị trấn|Đặc khu`, bỏ hậu tố ` (…)`; KHÔNG bỏ `Quận|Huyện|Thị xã`; giữ dấu.
- Id xã chèn: `<market>-<slugify(ten)>`; slug trùng với xã khác cùng tỉnh trong danh bạ hoặc id đã có → `-<mã 5 số>`.
- `meta` dòng chèn: `{"source":"dvhc","loai":<loai>}`; `name` = `ten` của `xa.json`.
- Thông điệp ghim (nguyên văn trong evals): «PX1 băm lệch: <tệp>», «PX1 thiếu thị trường <mã>», «PX1 tên thị trường lệch <mã>», «PX1 khớp hai khu vực: <mã>», «chưa áp 084».
- Mã nguồn gọi bằng S0x; không tên nguồn thật trong code/commit.
- Tiếng Việt cho comment domain; code/bảng/cột tiếng Anh.

## Review Focus

1. DB máy thu chưa áp 084 khi code đã gộp (đêm đầu tiên sau gộp) → transform và reassign chạy như cũ — Task 4, Task 5, Task 7.
2. Một xã cũ cùng tên ở hai huyện cũ của cùng tỉnh mới trỏ hai xã khác nhau → «cần chọn xã», không chọn — Task 1.
3. Khu `airbnb-discovery` tên «Quận X» trùng tên phường mới «X» → không nhận mã — Task 1 (ma trận chuanTen), Task 3.
4. Chạy bộ nạp khi `pipeline/data/dvhc` bị sửa tay → thoát 2, không ghi — Task 3.
5. Bài S03 nêu «đường <tên phường cũ>» → không gắn xã — Task 1 (matchXaCuCoTienTo).

---

### Task 1: Dữ liệu danh bạ + hàm thuần `lib/dvhc.mjs`

`independent: false` (Task 3, 4, 6 dùng hàm của task này) · phục vụ E3 (ma trận tên), E4 (bộ tra), E7 (ca thuần), E8, E9 (hàm so sánh)

**Files:**
- Create: `pipeline/data/dvhc/xa.json`, `xa-cu.json`, `tinh-cu.json` (chép nguyên byte), `tinh.json` (34 tỉnh từ `danh-muc.ts`: `{ma,ten,loai}`), `NGUON.json`
- Create: `pipeline/lib/dvhc.mjs`
- Test: `pipeline/lib/dvhc.test.mjs`

**Interfaces — Produces:**
- `DATA_DIR: string` (đường tuyệt đối tới `pipeline/data/dvhc`, suy từ `import.meta.dirname`)
- `docDanhBa(dir = DATA_DIR): { xa, xaCu, tinh, tinhCu, nguon }` — kiểm băm, lệch → `throw` lỗi có `code = "BAM_LECH"` và message «PX1 băm lệch: <tệp>»
- `MA_TINH_THI_TRUONG: Record<string,string>` (34 dòng) · `thiTruongCuaTinh(maTinh): string`
- `chuanTen(s: string): string` · `slugify` lấy lại từ `lib/osm.mjs`
- `idXa(xa, market, slugTrungTrongTinh: Set<string>, idDaCo: Set<string>): string`
- `khopXa(xa, conCua: {id,name,source}[]): { id } | { loi: "hai" } | null` — ưu tiên `source==='osm-phuong'`
- `dungBiDanhAnToan(xaCu, xaHienHanh: {market, name, id}[]): { map: Map<market, Map<tenChuan, areaId>>, loai: { tach, "trung-ten-hien-hanh", "nhieu-dich" } }`
- `traXaCu(xaCu, maTinh, ten): { xa: string } | { canChon: string[] } | null` (theo khoá (maTinh, chuanTen))
- `matchXaCuCoTienTo(text: string, biDanhCuaThiTruong: Map<tenChuan, areaId>): areaId | null`
- `soSanhTruocSau(dong: {tinh, truoc: areaId|null, sau: areaId|null, laXa: (id)=>boolean, khaiTruoc: Set<id>}[]): { bang, do: string[] }`

- [ ] **Step 1: Chép dữ liệu + viết `NGUON.json`** (sha256 bằng `shasum -a 256`, `commit` = HEAD của quy-hang, `vanBan`/`ngayThamChieu`/`sha256` hai tệp gốc chép từ `nguon` của `danh-muc.ts`).
- [ ] **Step 2: Viết test thất bại `pipeline/lib/dvhc.test.mjs`** — các ca:
  - «PX1-AC-3 chuanTen»: ma trận viết trước `["Phường Ba Đình","ba đình"]`, `["Cẩm Giàng (03626)","cẩm giàng"]`, `["Quận Thanh Xuân","quận thanh xuân"]`, `["Thị xã Sơn Tây","thị xã sơn tây"]`, NFD = NFC, `"Cẩm Giang" ≠ "Cẩm Giàng"`; `khopXa` ưu tiên osm-phuong, hai osm-phuong → `{loi:"hai"}`.
  - «PX1-AC-2 bảng tỉnh»: 34 khoá; mọi `maTinh` của `xa.json` có trong bảng; `thiTruongCuaTinh("46")==="vn-hue"`.
  - «PX1-AC-4 bộ tra»: ma trận theo khoá rút từ `xa-cu.json`; số assert = số khoá; khoá một đích → `{xa}`; nhiều đích → `{canChon}` đúng hợp mã. Chiều đỏ: hàm bản sao trả đích đầu → assert thông điệp «PX1-AC-4 đoán xã cho tên cũ nhiều đích».
  - «PX1-AC-7»: ba ca của E7 trên danh sách dạng `{id,name,parent_id}`.
  - «PX1-AC-8»: ma trận 4 lớp × 2 đường của E8; ca dữ liệu thật: an toàn + ba lý do = 10033; chiều đỏ bỏ tiền tố.
  - «PX1-AC-9 so sánh»: bảng giả một tỉnh giảm, một tin đổi xã → `do` gọi đúng tỉnh và mã tin.
- [ ] **Step 3: Chạy `node --test pipeline/lib/dvhc.test.mjs`** — Expected: FAIL (module chưa có).
- [ ] **Step 4: Viết `pipeline/lib/dvhc.mjs`** theo Interfaces.
- [ ] **Step 5: Chạy lại** — Expected: PASS mọi ca.
- [ ] **Step 6: Commit** `feat(pipeline): PX1 dữ liệu danh bạ DVHC kèm băm + hàm tra tên`

### Task 2: Migration 084

`independent: false` (Task 3, 5, 7 cần lược đồ) · phục vụ E2, E4, E5

**Files:** Create: `db/migrations/084_danh_ba_dvhc.sql` (qua skill `/new-migration`)

- [ ] **Step 1:** `ALTER TABLE areas ADD COLUMN IF NOT EXISTS admin_code text;` + `CREATE UNIQUE INDEX IF NOT EXISTS areas_admin_code_uq ON areas(admin_code) WHERE admin_code IS NOT NULL;`
- [ ] **Step 2:** `CREATE TABLE IF NOT EXISTS area_aliases (old_code text PRIMARY KEY, name text NOT NULL, kind text NOT NULL, old_district text NOT NULL, old_district_code text NOT NULL, old_province_code text NOT NULL, province_code text NOT NULL, targets text[] NOT NULL CHECK (cardinality(targets) >= 1), split boolean NOT NULL, source_sha text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());` + index `(province_code, name)`.
- [ ] **Step 3:** áp hai lần trên DB thử (`bash db/db-thu.sh oneinvest_px1mig --neu-chua-co`, rồi `psql -f` hai lần) — Expected: lần hai không lỗi, `\d areas` có cột.
- [ ] **Step 4: Commit** `feat(db): 084 mã đơn vị hành chính cho areas + bảng bí danh xã cũ`

### Task 3: Bộ nạp `pipeline/nap-dvhc.mjs` + test DB

`independent: false` · phục vụ E1–E5

**Files:** Create `pipeline/nap-dvhc.mjs`; Test `pipeline/scripts/nap-dvhc.test.mjs`

**Interfaces:**
- Consumes: Task 1 (`docDanhBa`, `thiTruongCuaTinh`, `chuanTen`, `khopXa`, `idXa`), Task 2 lược đồ.
- Produces: `export async function napDvhc(client, { dir = DATA_DIR, log = console } = {}): { doi: number, theoTinh: {market, xa, khopSan, chenMoi, coRanhGioi}[], khongKhop: {id,name}[], biDanh: number, tach: number, khoa: {motDich, tach, trungTen} }` (người gọi giữ giao dịch); CLI `node pipeline/nap-dvhc.mjs [--data <dir>] [--thu]` — mã thoát 0/1/2; in `doi=<n>`; khoá advisory 56084.

- [ ] **Step 1: Test thất bại** `pipeline/scripts/nap-dvhc.test.mjs`, mỗi ca BEGIN…ROLLBACK + `pg_advisory_xact_lock(33033)`, nạp 084 trong giao dịch khi DB chưa có cột; ca «PX1-AC-1»…«PX1-AC-5», «PX1-AC-7-db» đúng như expected E1–E5, E7 (chiều đỏ của AC-1 gọi CLI thật bằng `child_process.spawnSync` với `--data <tmp>`, DB_URL của lượt; đếm trước/sau bằng client riêng).
- [ ] **Step 2:** `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_px1 --chay node --test --test-concurrency=1 scripts/nap-dvhc.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Viết `napDvhc` + CLI** theo design §2.3; UPDATE chỉ khi giá trị khác (`IS DISTINCT FROM`), đếm `doi` = tổng rowCount ghi.
- [ ] **Step 4:** chạy lại — Expected: PASS (trừ ca AC-7-db chờ Task 4).
- [ ] **Step 5: Commit** `feat(pipeline): PX1 bộ nạp danh bạ xã vào areas + bí danh xã cũ`

### Task 4: Khớp tên trên danh bạ (`lib/osm.mjs`, transform S06, S03)

`independent: false` · phục vụ E7, E8, E10

**Files:** Modify `pipeline/lib/osm.mjs`, `pipeline/transform-chotot.mjs:31-80`, `pipeline/transform-zalo.mjs:744-792` (và chỗ gọi thứ hai `:906-910`)

**Interfaces — Produces:**
- `coDanhBa(client): Promise<boolean>` — `admin_code` + `area_aliases` có mặt (một lần mỗi lượt); `false` → in «chưa áp 084» một lần.
- `khuVucKhopTen(p = "", coMa = true): string` — `(${phuongHopLe(p)}) OR ${p}admin_code IS NOT NULL` khi `coMa`, ngược lại `phuongHopLe(p)`.
- `docPhuongHopLe(client, markets)` — giữ chữ ký, dùng `khuVucKhopTen`.
- `docThiTruongCoXa(client): Promise<string[]>`.
- `docBiDanhAnToan(client, markets): Promise<Map<market, Map<tenChuan, areaId>>>` (rỗng khi chưa áp 084).
- `ganPhuongS06(ad, { mk, wardMap, biDanh, slugList }): { areaId, phuongRaw, cach: "v3"|"ward"|"bi-danh"|"chu"|null }` — xuất từ `transform-chotot.mjs`.

- [ ] **Step 1:** thêm ca thuần vào `pipeline/lib/dvhc.test.mjs` cho `ganPhuongS06` (v3 → ward → bí danh → chữ, đúng thứ tự cũ cộng bí danh ở giữa) — FAIL.
- [ ] **Step 2:** sửa `lib/osm.mjs` + tách `ganPhuongS06` + S06 dùng `docThiTruongCoXa`; S03 dùng `docThiTruongCoXa` cho danh sách tên, `docThiTruongCoPhuong` cho nhóm chưa khai, `matchXaCuCoTienTo` khi `matchPhuongThiTruong` null.
- [ ] **Step 3:** `node --test pipeline/lib/dvhc.test.mjs` + ca «PX1-AC-7-db» ở Task 3 — PASS; `cd pipeline && npm test` — PASS (không hồi quy `tin-rao-gan-khu-vuc.test.mjs`).
- [ ] **Step 4: Commit** `feat(pipeline): PX1 transform S03/S06 khớp tên xã trên danh bạ + bí danh an toàn`

### Task 5: `reassign-areas.mjs` không xoá xã danh bạ

`independent: false` · phục vụ E6, E10

**Files:** Modify `pipeline/reassign-areas.mjs` (bước 4 truy vấn `doomed`, bước 5 `xoa`); Test thêm ca «PX1-AC-6» vào `pipeline/scripts/nap-dvhc.test.mjs`

- [ ] **Step 1:** ca «PX1-AC-6» theo E6 (hanoi, hcmc, danang; lượt thường + `xoaKhuVucLac`) — FAIL trên code cũ (xoá `vn-hcmc-hung-long`).
- [ ] **Step 2:** thêm `AND a.admin_code IS NULL` vào `doomed` và lọc `xoa` bỏ id có mã — chỉ khi `coDanhBa(client)`.
- [ ] **Step 3:** ca PX1-AC-6 + `scripts/reassign-areas.test.mjs` — PASS.
- [ ] **Step 4: Commit** `fix(pipeline): PX1 reassign-areas giữ xã danh bạ`

### Task 6: Thước trước/sau `pipeline/scripts/nap-dvhc-do.mjs`

`independent: false` · phục vụ E9

**Files:** Create `pipeline/scripts/nap-dvhc-do.mjs`; Create `_acceptance/danh-ba-phuong-xa-toan-quoc/doi-xa-khai-truoc.json` (`[]`)

- [ ] **Step 1:** viết thước theo design §2.7: một giao dịch; đối chứng code (S06 nối `originating_system_key = list_id`, S03 tin `cardinality(post_ids)=1`); nạp; gán lại; `soSanhTruocSau`; in bảng + tin mẫu; `--doi-chung-hong`; thoát 1 khi `do` khác rỗng; ROLLBACK.
- [ ] **Step 2:** `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_px1do --chay node scripts/nap-dvhc-do.mjs` — Expected: «đối chứng code: lệch 0», «PX1-AC-9 xanh», exit 0; với `--doi-chung-hong` exit 1.
- [ ] **Step 3: Commit** `feat(pipeline): PX1 thước tin có xã trước/sau theo tỉnh`

### Task 7: Tương thích DB chưa áp 084 `pipeline/scripts/nap-dvhc-cu.test.mjs`

`independent: false` · phục vụ E10

- [ ] **Step 1:** ca «PX1-AC-10» theo E10 (DROP cột/bảng trong giao dịch khi có; gán S06/S03 = area_id đang lưu; `runReassign` mới vs bản `git show origin/main:pipeline/reassign-areas.mjs` chép vào `pipeline/.tmp-main-reassign-<pid>.mjs`, xoá trong `finally`).
- [ ] **Step 2:** `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_px1cu --chay node --test --test-concurrency=1 scripts/nap-dvhc-cu.test.mjs` — PASS; chiều đỏ ghi trong ca.
- [ ] **Step 3: Commit** `test(pipeline): PX1 code mới chạy đúng khi chưa áp 084`

### Task 8: Tài liệu + việc phụ

`independent: false`

- [ ] **Step 1:** `pipeline/CLAUDE.md` thêm dòng `nap-dvhc.mjs`, `scripts/nap-dvhc-do.mjs`, sửa dòng `reassign-areas.mjs` (giữ xã danh bạ) và mục Conventions (submarket VN = phường OSM hoặc xã danh bạ).
- [ ] **Step 2:** `yeu-cau viec-phu` «ZCode: thu OSM admin_level 6 cho 30 tỉnh còn lại» (không chặn).
- [ ] **Step 3:** `/verify` pipeline; commit `docs(pipeline): PX1 bộ nạp danh bạ xã`.
