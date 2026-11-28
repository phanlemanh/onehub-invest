# DA67 Danh bạ Ops đợt 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (native, trong vòng feature-loop). Steps dùng `- [ ]`.

**Goal:** Trang dự án đọc thuộc tính S16 + ô phủ bằng một câu; sửa nhãn, trạng thái, 404 Ops; danh sách bỏ bí danh trùng tên và ẩn Bậc dưới md.

**Architecture:** Một câu `SQL_GOP` trong `thuoc-tinh-can.ts` (ket MATERIALIZED + phu gộp + câu con ô phủ cũ); hai hàm cũ thành lớp mỏng. Phần UI là đổi chữ, một helper `biDanhKhacTen` ở `cay.ts`, một `not-found.tsx`.

**Tech Stack:** Next.js 16, TypeScript strict, pg, node:test + tsx, react-dom/server render tĩnh.

**Spec:** `docs/superpowers/specs/2026-11-27-danh-ba-ops-gop-cau-s16-va-nhan-design.md`; hợp đồng `_acceptance/danh-ba-ops-gop-cau-s16-va-nhan/contract.md`, evals `evals.yaml`.

## Global Constraints

- Chỉ `app/` (+ `_acceptance/<slug>/probes/`); không migration, không `pipeline/`.
- Giữ `v AS MATERIALIZED (SELECT * FROM v_unit_thuoc_tinh)` và `g AS MATERIALIZED`.
- Giữ nguyên một lần các chuỗi mà test DA40 cấy lỗi: `GROUP BY c.du_an, upper(btrim(c.ma_can)) HAVING count(DISTINCT c.toa) = 1`, `WHERE b.value IS NULL AND m.gia_tri IS NULL`, `} catch (e) {` (khối bắt lỗi đầu tiên của tệp).
- Nhãn: «Mở hàng», «Thu gọn hàng», «Chưa có toà», «Không có dự án này trong danh bạ», «Về danh bạ».
- Luật ReUI: không sửa `components/ui|reui`; dùng `ui/empty` + `ui/button`.
- DB máy thu chỉ đọc (`default_transaction_read_only=on`); lệnh kit chạy bằng bản 2.37.0 (HT41).

## Review Focus

- Toà có bí danh S16 nhưng không căn nào có thuộc tính → ô phủ vẫn «co» với số đúng (Task 1 ca E3).
- `toaKeys` rỗng → không chạy câu nào (Task 1 ca E6).
- Bí danh khác tên chỉ khác dấu câu (vd «Vinhomes Ocean Park 2» vs tên «Vinhomes Ocean Park») phải còn (Task 3 bảng viết trước).
- Mã nút là số âm/0 hay rất lớn → page/DuAnContent ra 404 Ops (Task 2 ca E9 + E13).
- Tên dự án có «đ/Đ» → fold đúng (Task 3).

---

### Task 1: Một câu S16 cho lưới + ô phủ — phục vụ E1, E2, E3, E4, E5, E6 · independent: true

**Files:**
- Modify: `app/src/lib/ops/thuoc-tinh-can.ts`
- Modify: `app/src/components/ops/registry/du-an-content.tsx:28`
- Test: `app/tests/thuoc-tinh-can.test.tsx` (thêm ca «toà không căn nào có thuộc tính»), `app/tests/danh-ba-ops-dot1.test.tsx` (DBO-AC-1, DBO-AC-5)
- Create: `_acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh`, `probes/so-s16.mts`

**Interfaces:**
- Produces: `docThuocTinhDuAn(toaKeys: string[], q?: Q): Promise<{ thuocTinh: KetQua<Map<string, ThuocTinhCan>>; phu: KetQua<PhuThuocTinh> }>`; `docThuocTinhCan`/`docPhuThuocTinh` giữ chữ ký, gọi hàm trên.

- [ ] Viết ca TTC «toà không căn nào có thuộc tính» (B3 có bí danh S16 `q-da/TOA3`, một căn không phát biểu): `phu` = co, coThuocTinh 0, trongDanhBa 1; lưới rỗng. Ca DBO-AC-1 (đếm câu chạm `v_unit_thuoc_tinh` = 1 qua q bọc; cột gộp có mặt ở hàng đầu và ô phủ bằng cột), DBO-AC-5 (`[]` → 0 câu; LOI_THU → hai ok false).
- [ ] Chạy, thấy đỏ (hàm chưa có).
- [ ] Viết `SQL_GOP` theo design §2.1; `docThuocTinhDuAn` tách hàng: dòng có `unit_key` → Map; số ô phủ lấy từ hàng đầu. `du-an-content` gọi một hàm.
- [ ] `bash probes/kiem.sh ttc` + `man` xanh; `kiem.sh may` (DB máy thu chỉ đọc) in khớp 5 dự án và tỉ lệ.
- [ ] Commit.

### Task 2: Nhãn và trạng thái — phục vụ E7, E8, E9 · independent: true

**Files:**
- Modify: `app/src/components/insight/insight-grid.tsx` (`DATA_GRID_VI.labels`)
- Modify: `app/src/components/ops/registry/du-an-view.tsx:61`
- Create: `app/src/app/ops/registry/[nodeId]/not-found.tsx`
- Test: `app/tests/danh-ba-ops-dot1.test.tsx` (DBO-AC-6, AC-7, AC-8)

- [ ] Ca: render RegistryGrid có hàng con → «Mở hàng»/«Thu gọn hàng», không «Expand row»; DuAnView ba ca chân ô Toà; NotFound render có chữ + href `/ops/registry`, không «Xem thị trường Việt Nam»; DuAnContent id không có / id phân khu ném notFound, id gốc không ném.
- [ ] Đỏ → sửa → xanh (`kiem.sh man`) → commit.

### Task 3: Danh sách — phục vụ E10, E11, E12 · independent: true

**Files:**
- Modify: `app/src/lib/ops/registry/cay.ts` (thêm `biDanhKhacTen(ten: string, biDanh: string[]): string[]`)
- Modify: `app/src/components/ops/registry/registry-grid.tsx:62` (dòng phụ dùng helper, tối đa 3), cột `bac` thêm `meta: { headerClassName: "hidden md:table-cell", cellClassName: "hidden md:table-cell" }`
- Test: `app/tests/danh-ba-ops-dot1.test.tsx` (DBO-AC-9, AC-10); Create `probes/bi-danh.mts`

- [ ] Ca bảng viết trước cho `biDanhKhacTen`; render grid; meta cột.
- [ ] Đỏ → sửa → xanh; `kiem.sh bidanh` in 329 → 0 → commit.

### Task 4: Kiểm module + nhìn — phục vụ E13

- [ ] `/verify` app (tsc, lint, test:lint-rules); preview worktree cổng riêng: chụp 375 dark, 1280 light, 404 ba loại mã, đo `/ops/registry/16`.
- [ ] Contract `status: implemented`.
