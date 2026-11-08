# DB1b dung-danh-ba-may-thu — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (tuần tự trong phiên chính — mọi task chung tệp).

**Goal:** Lệnh dựng danh bạ vật thể ghi được DB máy thu bằng cờ tường minh (+ `--sao-luu` ở lần đầu), chặn đích ngoài
máy theo máy chủ pg thật, kiểm slug khu, và có bước đêm trong `refresh-bait-gap` chỉ giữ tươi khu đã dựng.

**Architecture:** Hàm thuần mới ở `pipeline/lib/danh-ba-vat-the.mjs` (đích, đếm, so); lệnh `pipeline/danh-ba-vat-the.mjs`
dùng chúng ở `main()` và export `buocVatTheDem(c)`; `refresh-bait-gap.mjs` gọi bước đêm sau `buocDem`.

**Tech Stack:** Node ESM, `pg`, `node:test`, DB thử `oneinvest_dbv_*` qua `pipeline/scripts/db-thu-dbv.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-08-dung-danh-ba-may-thu-design.md` · hợp đồng `_acceptance/dung-danh-ba-may-thu/contract.md`.

## Global Constraints

- Không chạm `db/migrations/**`, `_acceptance/config.yaml`, tệp làn ZCode; executor dùng sẵn `dbv_kho`, `dbv_db`, `dbv_that`.
- Không ghi DB `oneinvest` trong test; ca dữ liệu thật chỉ đọc máy thu (`default_transaction_read_only=on`).
- Đầu ra phép đo không in mã S08; URL mẫu có mật khẩu dựng bằng nối chuỗi (git-secrets chặn chuỗi liền).
- Thoát 2 = lỗi người gọi (đích, cờ, slug); thoát 1 = lỗi chạy.
- `refresh-bait-gap.mjs` không đọc biến môi trường nào để thay mô-đun bước đêm.

## Review Focus

1. URL `postgres:///x` không host, `PGHOST` rỗng → pg dùng socket mặc định (máy này) → coi là máy này (T1 ca socket).
2. `--khu` có khoảng trắng hay phần tử rỗng (`a,,b`) → bỏ phần tử rỗng, trim; rỗng hẳn → thoát 2 (T2).
3. `--sao-luu` trỏ thư mục chứ không phải tệp → thoát 2 như tệp không có (T2).
4. Bước đêm khi toà gắn phân khu mà phân khu đã bị xoá khỏi `asset_nodes` → bỏ khu đó, in một dòng, không ném (T3).
5. Hai bước đêm chạy chồng (zalo-import 00:00 kéo dài sang job khác) → khoá cố vấn có sẵn trong `dung()` giữ tuần tự (đã đo DBV-AC-4 hai tiến trình).

---

### Task 1: Hàm thuần đích · đếm · so (independent: false)

**Files:** Modify `pipeline/lib/danh-ba-vat-the.mjs`; Test `pipeline/lib/danh-ba-vat-the.test.mjs`. Phục vụ E1, E2 (phần thuần), E8.

**Interfaces — Produces:**
- `kiemDich(thamSo: {host?: string, database?: string} | null, {dbThat?: boolean}) → {ok: true, loai: 'thu'|'that'} | {ok: false, ly_do: string}` — máy này = `localhost`, `127.0.0.1`, `::1`, hoặc host mở đầu `/` (socket); DB thử = máy này ∧ `/^oneinvest_\w+$/`; thông điệp: «đích ngoài máy này», «URL không đọc được», «đích không phải DB thử — khai --db-that nếu chủ ý ghi DB máy thu». Không nhúng URL/mật khẩu.
- `thamSoTuUrl(url: string) → {host, database} | null` — `new pg.Client({connectionString}).connectionParameters` trong try (ném → null).
- `demTheoKhu(c) → Promise<Map<slug, {toa, truc, can}>>` — SQL đếm trên ba bảng, khu = project của `region_node_id` hoặc cha của nó.
- `soDem(may: Map, ban: Map) → Array<{khu, cap: 'toa'|'truc'|'can', may: number, ban: number}>`.
- `nhanSo(demMay: Map) → 'so' | 'chua-so'` — `'so'` khi có ít nhất một khu có toà > 0.

- [ ] Ca «DBM-AC-1 bảng đích» (18 ô, 3 tên × 3 máy × 2 cờ) và «DBM-AC-2 ngoài máy» (16 ô + 2 đối chứng dương, URL đi qua `thamSoTuUrl` thật, `PGHOST` đặt/bỏ trong ca) — chạy đỏ.
- [ ] Viết hàm; `node --test pipeline/lib/danh-ba-vat-the.test.mjs` xanh.
- [ ] Phá thử: bản chép tạm đọc host bằng `new URL().hostname` → ô `?host=` đỏ «DBM-AC-2 kiểm khác máy pg nối»; khôi phục.
- [ ] Commit.

### Task 2: Lệnh tay — cờ, sao lưu, slug, bước đêm (independent: false)

**Files:** Modify `pipeline/danh-ba-vat-the.mjs`; Test `pipeline/scripts/danh-ba-vat-the.itest.mjs`. Phục vụ E1b, E2 (lệnh, đêm), E3, E7.

**Interfaces — Consumes:** Task 1. **Produces:**
- `dung(c, {khuSlugs, ...})` — `khuSlugs` rỗng → ném `LoiGoi`; slug không có nút → ném `LoiGoi("khu không có: a, b")` trước khi ghi (ROLLBACK); tổng kết thêm `khu_khong_s08: string[]` + `console.warn`.
- `class LoiGoi extends Error` (export) — `main()` bắt → thoát 2.
- `buocVatTheDem(c) → Promise<{bo_qua?: string} | tong_ket>` — rào theo thứ tự: `kiemDich(c.connectionParameters, {dbThat: true})` ném; `to_regclass('public.buildings')` null → «danh-ba-vat-the: bỏ qua — DB chưa áp 082»; khu đã có toà rỗng → «danh-ba-vat-the: bỏ qua — chưa dựng lần đầu (lần đầu là lệnh tay --db-that --sao-luu)»; còn lại `dung(c, {khuSlugs: khuDaDung})` không từ điển.
- `main()`: `--db-that`, `--sao-luu <tệp>` (chỉ đòi khi `loai === 'that'` và `SELECT count(*) FROM buildings` = 0; tệp phải `statSync().isFile()` và `size > 0`); kiểm đích TRƯỚC `connect()`.

- [ ] Itest: «DBM-AC-1 lệnh thật» (a–f; DB tên khác tạo bằng helper mới `taoDbKhac(ten)` trong itest, tên `dbvm_<pid>`), «DBM-AC-2 lệnh/đêm», «DBM-AC-3» (a, b), «DBM-AC-7» (symlink) — chạy đỏ.
- [ ] Viết mã; `node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs` xanh, mọi ca DBV cũ vẫn xanh.
- [ ] Phá thử qua `DBV_LENH` (bỏ kiểm đích, bỏ rào sao lưu, bỏ kiểm slug, lối vào so chuỗi thô) — từng ca đỏ đúng thông điệp ghim.
- [ ] Commit.

### Task 3: Bước đêm trong refresh-bait-gap (independent: false)

**Files:** Modify `pipeline/refresh-bait-gap.mjs` (`main()`: sau `await buocDem(c)` gọi `await buocVatTheDem(c)` trong try riêng; lỗi → `console.error("danh-ba-vat-the: …")` rồi `process.exitCode = 1`); Test itest như Task 2. Phục vụ E4, E5, E6.

- [ ] Itest «DBM-AC-4» (a hetSo 81, b, c, ca hàm khu rỗng), «DBM-AC-5» (khu hai phân khu, mã q3 mới + q1 mới), «DBM-AC-6» (trigger `ep-hong-dbm` trên units, DB đối chứng, ca tĩnh `process.env.DBV_`) — chạy đỏ.
- [ ] Viết mã; itest xanh.
- [ ] Phá thử bằng bản chép tệp gọi trực tiếp `buocVatTheDem` (rào đếm bí danh; KHU_MAC_DINH; bỏ đường cha phân khu; gọi trong cùng giao dịch buocDem) — đỏ đúng thông điệp.
- [ ] Commit.

### Task 4: So bản chép thật (independent: false)

**Files:** Modify `pipeline/scripts/danh-ba-vat-the-that.itest.mjs`, itest Task 2 (ca «DBM-AC-8»). Phục vụ E8, E8b.

- [ ] «DBM-AC-8»: hai DB thử, `soDem` rỗng, căn thêm tay → một dòng lệch; `nhanSo` hai chiều.
- [ ] Ca thật: `nhanSo(demTheoKhu(may))`; `'chua-so'` → in «máy thu chưa dựng — chưa so»; `'so'` → `soDem` rỗng.
- [ ] Chạy `dbv_that` (ngoài CI, đọc máy thu chỉ đọc) xanh; commit.

### Task 5: Tài liệu vận hành (independent: false)

**Files:** `pipeline/CLAUDE.md` (một dòng bảng Key Scripts), `docs/ops/runtime-map.md` (bước đêm, cờ, «bản này chưa đồng bộ lên cloud — phạm vi vòng»). Phục vụ E9.

- [ ] Viết; tự soát năm câu của E9; commit.
