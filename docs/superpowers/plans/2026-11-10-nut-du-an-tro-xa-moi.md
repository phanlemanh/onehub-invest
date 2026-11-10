# DV1 — nút dự án trỏ mã xã hiện hành · kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 20 nút dự án mang đúng mã xã/phường hiện hành, suy từ xã cũ có nguồn qua `area_aliases`, ghi bằng lệnh `--sua-xa`.

**Architecture:** Tệp dữ liệu `pipeline/data/xa-nut-du-an.json` (xã cũ + nguồn) → lõi thuần `kiemMucXa`, `xaMoiCuaNut` ở
`pipeline/lib/danh-ba-vat-the.mjs` → `suaXaNut(c, …)` + cờ `--sua-xa` ở `pipeline/danh-ba-vat-the.mjs` (một giao dịch, khoá
cố vấn `danh-ba-vat-the`, rào `kiemDich`). Test thuần ở `pipeline/lib/danh-ba-vat-the.test.mjs`; test DB trên DB của riêng
lượt chép từ máy thu (`db/db-thu.sh --chay`).

**Tech Stack:** Node ESM (.mjs), `pg`, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-10-nut-du-an-tro-xa-moi-design.md` · hợp đồng `_acceptance/nut-du-an-tro-xa-moi/contract.md` · evals cùng thư mục.

## Global Constraints

- Tra xã cũ theo `old_code` (mã 5 số), không theo tên.
- Mã lỗi đúng sáu chuỗi: `thieu-nguon` · `xa-cu-khong-co` · `can-chon-xa` · `chon-ngoai-dich` · `ma-khong-co` · `tinh-khong-co`;
  thêm `thieu-ly-do` cho mục `cap: "tinh"` (AC-1).
- `retract_reason = 'sua-xa-nut'`; thông điệp đích dùng nguyên văn `THONG_DIEP` sẵn có.
- Lệnh thoát 2 cho lỗi người gọi (`LoiGoi`), 1 cho lỗi chạy; không in mã S08.
- Không ghi DB máy thu trong vòng (Hỏi-1). Không URL nào trong test trỏ `oneinvest` thật để ghi.
- Comment domain logic tiếng Việt; code tiếng Anh/Việt theo tệp sẵn có (tệp này dùng tên Việt không dấu).

## Review Focus

1. Mục có hai xã cũ cùng tách vào chung một đích (Đa Tốn + Dương Xá → Gia Lâm) — hợp phải khử trùng (E2 ô «nhiều xã cũ»).
2. `chon` chứa mã đúng nhưng `old_code` không tách — `chon` bị bỏ qua hay báo lỗi? Chốt: có `chon` thì luôn kiểm ⊂ đích và
   dùng `chon` (E2 thêm ô).
3. Chạy `--sua-xa` hai lần liên tiếp: lần hai không rút thêm phát biểu nào (E3 lần hai `rut = 0`).
4. Nút cấp tỉnh mà toà dưới nó có phát biểu kế thừa phường cũ — phải rút (phuongCuaToa trả không phường) — ô trong E6.
5. Tệp có khoá mở đầu `_` (ghi chú) — bỏ qua như `docTuDien` (E1).

---

### Task 1: Tệp xã của 20 nút

**Files:** Create `pipeline/data/xa-nut-du-an.json` · evals: E1, E5 · independent: true

- [ ] Từ bảng tra (thiết kế §3; nguồn của tác tử tra, chỉ URL đã thấy), ghi `{ "_ghi_chu": "...", "nut": { <slug>: muc } }`,
  20 mục; 15 `cap: "xa"`; năm nút Hỏi-2 `cap: "tinh"` với `tinh` = mã thị trường (`vn-hung-yen`, `vn-hcmc`, `vn-hanoi`) và
  `ly_do`. `chon` là `admin_code` mới, chỉ khi xã cũ tách. Không thêm tên nguồn S0x nào (dữ liệu công).
- [ ] Kiểm: `node -e` đọc JSON, đếm 20 khoá.

### Task 2: Lõi thuần

**Files:** Modify `pipeline/lib/danh-ba-vat-the.mjs` (thêm cuối) · Test `pipeline/lib/danh-ba-vat-the.test.mjs` · evals E1, E2, E5, E8 · independent: false (dùng Task 1)

**Interfaces — Produces:**
- `export const LOI_XA = Object.freeze([...])` — bảy mã lỗi.
- `export function kiemMucXa(slug: string, muc: object): string[]` — mã lỗi khuôn (`thieu-nguon`, `thieu-ly-do`, …), rỗng = lành.
- `export function xaMoiCuaNut(muc, { biDanh: Map<string,{targets:string[],split:boolean}>, maXa: Map<string,{id:string,region_type:string}>, thiTruong: Set<string> }): { area_ids: string[] } | { loi: string }` — hợp đích đã sắp, khử trùng; có `chon` → kiểm ⊂ hợp rồi dùng `chon`; xã tách mà vắng `chon` → `can-chon-xa`.
- `export function kiemTepXa(tep: object, slugs: string[]): string[]` — dòng lỗi «thiếu nút <slug>», «slug lạ <slug>», «<slug>: <mã>».
- `export function slugNutTuSeed(sql: string): string[]` — rút slug `'project'` từ câu INSERT của 026.

- [ ] Viết ca «DV1-AC-1», «DV1-AC-2», «DV1-AC-5», «DV1-AC-8» theo `expected` của E1, E2, E5, E8 (thông điệp ghim nguyên văn);
  E5 dựng `biDanh` từ `docDanhBa().xaCu` (`ma` → `{targets: vao, split: vao.length > 1}`) và `maXa` từ `xa.json` +
  `idXa`/`thiTruongCuaTinh`/`slugTrungTrongTinh` của `lib/dvhc.mjs`.
- [ ] `node --test pipeline/lib/danh-ba-vat-the.test.mjs` → đỏ (hàm chưa có); viết hàm; chạy lại → xanh (trừ E8 tới Task 5).

### Task 3: Lệnh `--sua-xa`

**Files:** Modify `pipeline/danh-ba-vat-the.mjs` · evals E3, E4, E6 · independent: false

**Interfaces — Produces:** `export async function suaXaNut(c, { tep = TEP_XA, thu = false, rut = true, runId }): Promise<{ doi: number, giu: number, rut: number, bang: {slug, cu, moi}[] }>`; `export const TEP_XA`.

- [ ] Trong một giao dịch + `pg_advisory_xact_lock(hashtext('danh-ba-vat-the'))`: đọc nút project (slug, id, area_ids);
  `kiemTepXa` → lỗi ném `LoiGoi` (gộp dòng); nạp `area_aliases` (old_code → targets, split) và `areas`
  (admin_code → id, region_type; thị trường); `xaMoiCuaNut` từng mục → lỗi ném `LoiGoi("<slug>: <mã>")`; UPDATE nút đổi;
  với toà có `region_node_id` thuộc nút đổi hoặc phân khu con của nút đổi: tính `phuongCuaToa` theo mã mới, nếu `rut` thì
  UPDATE `field_assertions` `retracted_at = now(), retract_reason = 'sua-xa-nut'` cho phát biểu `Building`/`area_id`/
  `registry_inherit` sống có `value` khác kết quả; `thu` → ROLLBACK.
- [ ] `main()`: `--sua-xa` rẽ sang `suaXaNut` (sau `kiemDich`, trước nhánh `--sao-luu`); `--tep`, `--thu`; in mỗi nút đổi
  một dòng `<slug> · <cũ> → <mới>` (mảng nối bằng `,`, rỗng là `∅`) rồi `tong_ket {...}`.

### Task 4: Test DB

**Files:** Create `pipeline/scripts/danh-ba-vat-the-xa.itest.mjs`, `pipeline/scripts/danh-ba-vat-the-xa-that.itest.mjs` · evals E3, E4, E6, E7 · independent: false

- [ ] Ca «DV1-AC-3», «DV1-AC-3 vàng», «DV1-AC-4», «DV1-AC-6» trên `DATABASE_URL` (DB của lượt; từ chối khi tên DB là
  `oneinvest`); lệnh thật qua `process.execPath pipeline/danh-ba-vat-the.mjs --sua-xa --db <url>`; `suaXaNut(c, { rut:false })`
  cho chiều đỏ E6. Bảng vàng 15 dòng chép tay từ thiết kế §3 (Phú Mỹ Hưng hai tên).
- [ ] Ca «DV1-AC-7»: phiên chỉ đọc tới DB máy thu `oneinvest` ở :5433 (chuỗi lấy từ `MAY_CHU` của
  `db-thu-dbv.mjs`, không viết tay tài khoản) với `default_transaction_read_only=on`.
- [ ] Chạy `bash db/db-thu.sh oneinvest_suite_dv1 --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-xa.itest.mjs`
  và bản `dv1t` → xanh.

### Task 5: Tài liệu + verify

**Files:** `pipeline/CLAUDE.md` (dòng `danh-ba-vat-the.mjs`), `docs/ROADMAP.md` (§2 as-built + §4) · evals E8, E8b · independent: false

- [ ] Ghi `--sua-xa [--tep] [--thu]`, tệp `pipeline/data/xa-nut-du-an.json`, rút `sua-xa-nut`, áp máy thu theo lời Mạnh.
- [ ] `/verify` (pipeline: `npm test` + `node --check` các .mjs đổi); commit.
