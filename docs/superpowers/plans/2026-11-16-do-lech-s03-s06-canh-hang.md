# Độ lệch S03 so mặt bằng S06 (CG15) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tính sẵn mặt bằng giá S03 và S06 theo nhóm cấp dự án của CG10 và hiện nó cạnh hạng của tin S03 trên `/ops/deals` và trang một căn.

**Architecture:** Bảng mới `project_source_baseline` (migration 107) do câu `423_project_source_baseline.sql` ghi trong cùng giao dịch của `xepHangGia`, sau 422, xoá trọn rồi chèn. App đọc bằng LEFT JOIN có dò bảng (`to_regclass`), gắn `matBang` vào `DealRow` của tin S03 cấp dự án; chữ dựng bằng một hàm thuần trong `deals-chi-tiet.ts`.

**Tech Stack:** PostgreSQL (SQL thuần), Node `.mjs` pipeline với `node --test`, Next.js 16 + React (TSX), `node:test` + tsx cho app.

**Spec:** `docs/superpowers/specs/2026-11-16-do-lech-s03-s06-canh-hang-design.md` · hợp đồng `_acceptance/do-lech-s03-s06-canh-hang/contract.md` · evals `_acceptance/do-lech-s03-s06-canh-hang/evals.yaml`.

## Global Constraints

- Migration số **107**, idempotent (`CREATE TABLE IF NOT EXISTS`), chỉ máy thu; không chạm `sync-cloud.mjs`, data-api (Hỏi-2).
- Đủ để so: **từ 5 phiếu mỗi bên** (Hỏi-1). Đếm theo **phiếu** như CG10 (`p:<min property_id>` hay `o:<offer_id>`), chữ ghi **«căn»** (Hỏi-3).
- Chỉ nguồn `S03` và `S06`; tin vào mẫu = dòng `offer_price_rank` có `cap = 'du_an' AND gia_tri IS NOT NULL AND (ly_do IS NULL OR ly_do IN ('nhom-5-9', 'pn-duoi-10'))` (đã vào nhóm, không bị loại ra).
- `lech_pct = round((trung_vi_s03 / trung_vi_s06 - 1) * 100, 1)` — dương: S03 cao hơn mặt bằng; NULL khi một bên dưới 5.
- `trang_thai` ∈ `du` · `thieu-s03` · `thieu-s06` · `thieu-hai`.
- Dò bảng/view theo `search_path`, KHÔNG ghi `public.` (bài học #456). Log khi chưa áp: đúng chuỗi `xep-hang-gia: chưa áp 107 — bỏ mặt bằng hai nguồn`.
- Bốn câu chữ (thiết kế §2.3), số tiền dùng `lib/format.ts` như ô «Giảm so thước» hiện có:
  `S06 <tv> · <n6> căn · S03 <±x,x%>` · `S06 chưa đủ để so (<n6> căn)` · `S03 chưa đủ để so (<n3> căn) · S06 <tv> · <n6> căn` · `Chưa đủ căn hai nguồn để so (S03 <n3> · S06 <n6>)`. Thuê giá tháng: `tr/tháng`.
- Không ghi tệp vào `_acceptance/do-lech-s03-s06-canh-hang/` từ eval nào (đo trên máy thu ghi `.acceptance-runs/`).
- Mỗi phép đo mới kèm cặp hai chiều trên cùng fixture (MEASURE-BIRTH-CLAUSE): vật lành xanh, đột biến đỏ với thông điệp ghim.

## Review Focus

1. Căn S06 có tin S03 ghép vào cùng phiếu (`property_offers` chứa cả tin S03) — phiếu thuộc cả hai bên; mỗi bên đếm phiếu của nguồn đó một lần. Ca trong Task 2.
2. Nhóm có dòng hạng mà toàn tin S06 (không S03) — vẫn ghi dòng `thieu-s03` với `n_s03 = 0`, không bỏ. Ca trong Task 2 (AC-2).
3. `pn_nhom` NULL trong khoá — hai nhóm dall khác dự án không đụng khoá duy nhất; khoá dùng `coalesce(pn_nhom, -1)`. Ca trong Task 2 (AC-3 đối chứng bán/thuê).
4. Lược đồ cloud (không 107) đọc danh sách — không lỗi SQL vì JOIN bảng không có. Ca trong Task 3 (AC-5).
5. Trung vị S06 bằng 0 hay NULL — `lech_pct` NULL, không chia cho 0. Ca trong Task 2.

---

### Task 1: Migration 107 + câu 423 + bước chấm

independent: false · phục vụ E1, E2, E3, E4

**Files:**
- Create: `db/migrations/107_project_source_baseline.sql`
- Create: `pipeline/sql/423_project_source_baseline.sql`
- Modify: `pipeline/xep-hang-gia.mjs` (export `SQL_423`, gọi trong giao dịch sau 422)
- Create: `pipeline/scripts/do-lech-s03-s06.test.mjs`
- Modify: `pipeline/test-nua.json` (thêm tệp test vào nửa nhẹ hơn)

**Interfaces:**
- Consumes: `dbCa`, `duAn`, `tin`, `can`, `pct`, `M` từ `pipeline/scripts/gia-tot-du-an-fixture.itest.mjs` (nguồn qua `tin(c, { nguon: 'S06' })`).
- Produces: bảng `project_source_baseline(nut text, kind text, property_type text, thuoc text, pn_nhom int, n_s03 int, trung_vi_s03 numeric, n_s06 int, trung_vi_s06 numeric, lech_pct numeric(7,1), trang_thai text, run_id text, computed_at timestamptz)` với unique index `(nut, kind, property_type, thuoc, coalesce(pn_nhom, -1))`; `xepHangGia(c, { boDo107?: boolean })` trả thêm `matBang: number | null` (số dòng ghi, null khi chưa áp 107); `export const SQL_423`.

- [ ] **Step 1: Viết test hỏng** — `do-lech-s03-s06.test.mjs`, các ca:
  - `CG15-HT-1`: DB thử có bảng 107; đối chứng `dbCa` bỏ 107 (thêm tuỳ chọn `bo107` vào fixture) thì không có.
  - `CG15-AC-1`: dự án D, bán căn hộ 2PN: 7 phiếu S03 (hai tin trùng giá), 9 phiếu S06 (một `can()` hai tin) + đủ tin để nhóm `dpn` từ 10 phiếu → `n_s03 === 7`, `n_s06 === 9`, trung vị bằng `pct(sorted, 0.5)` lệch ≤ 0,1, `lech_pct` đúng công thức, `trang_thai === 'du'`. Ba đột biến bằng chuỗi thay trong `SQL_423` (đếm `offer_id` thay phiếu · bỏ điều kiện nguồn · đảo dấu) chạy qua `xepHangGia(c, { sql423 })` → `assert.rejects(kiem(...), /<khoá nhóm>/)`.
  - `CG15-AC-2`: bảy ô một assert mỗi ô (S03 4 + S06 ≥5 → `thieu-s03`; S03 ≥5 + S06 4 → `thieu-s06`; cả hai <5 → `thieu-hai`; chỉ S06 → `thieu-s03`, `n_s03 0`; S05/S02 không vào `n`; S03 cấp phường không sinh dòng; S03 phi lý không vào mẫu) + đối chứng dương nhóm đủ hai bên có `lech_pct`. Thêm ca căn S06 chứa một tin S03 (Review Focus 1) và trung vị S06 = 0 (Review Focus 5 — dữ liệu thử không có giá 0 nên ca kiểm biểu thức qua SELECT trực tiếp trên hàm/CTE nếu tách được, không thì ghi rõ trong test là bảo đảm bằng `NULLIF`).
  - `CG15-AC-3`: thuê có m² (`gia-m2`) và thuê thiếu m² 2PN (`gia-thang-pn`) cùng dự án → hai dòng khoá khác `thuoc`; khoá mỗi dòng bằng khoá nhóm `offer_price_rank` của mọi tin S03 trong nhóm; nhóm bán và thuê cùng dự án là hai dòng (đột biến bỏ `kind` khỏi khoá đỏ).
  - `CG15-AC-4`: chạy lại → so mọi cột trừ `computed_at`, `run_id`; `sauXoa` ném → hai bảng giữ dòng cũ; `boDo107` hoặc DB bỏ 107 → log đúng chuỗi, `offer_price_rank` bằng lượt có 107; `dbCa({ view: false })` → bảng rỗng; đọc tệp 107 áp hai lần không lỗi.
- [ ] **Step 2: Chạy, thấy đỏ** — `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg15 --chay node --test --test-concurrency=1 scripts/do-lech-s03-s06.test.mjs` → FAIL (bảng/SQL chưa có).
- [ ] **Step 3: Viết 107 và 423.** 423: CTE `m` = `offer_price_rank h JOIN sale_offers o USING (offer_id)` lọc `o.source IN ('S03','S06')` cộng điều kiện «tin vào mẫu» của Global Constraints (có ngoặc quanh vế `ly_do`), phiếu như 422 (`coalesce('p:'||min(property_id), 'o:'||offer_id)`), `DISTINCT ON (khoá nhóm, nguồn, phiếu)` lấy tin `last_seen` sau cùng; gom theo khoá nhóm với `count(*) FILTER (WHERE source='S03')`, `percentile_cont(0.5) … FILTER`; `trang_thai` và `lech_pct` theo Global Constraints, chia bằng `NULLIF(trung_vi_s06, 0)`.
- [ ] **Step 4: Nối vào `xepHangGia`** — dò `to_regclass('project_source_baseline')`; có thì `DELETE FROM project_source_baseline` cùng chỗ xoá bảng hạng (trước `sauXoa`) và chạy `SQL_423` sau 422 (chỉ khi `coView`); chưa có thì log chuỗi Global Constraints. Thêm `matBang` vào kết quả và dòng log tổng.
- [ ] **Step 5: Chạy xanh** — cùng lệnh Step 2 cộng `scripts/gia-tot-du-an.test.mjs` (CG10 không hồi quy): PASS. Thêm tệp vào `test-nua.json`; `node --test scripts/chia-nua.test.mjs` PASS.
- [ ] **Step 6: Commit** — `feat(gia-tot): mặt bằng S03 so S06 theo nhóm cấp dự án (107, 423)`.

### Task 2: Đọc ở app + chữ trên màn

independent: false (cần bảng của Task 1) · phục vụ E5, E6

**Files:**
- Modify: `app/src/lib/deals-chi-tiet.ts` (type `MatBang`, `DealChiTiet.matBang?`, `chuMatBang`)
- Modify: `app/src/lib/deals.ts` (JOIN có dò bảng trong `dealsSql`, `toDealRow`, `matBangCua` cho trang một căn)
- Modify: `app/src/components/ops/deals-grid.tsx` (dòng phụ trong ô «Giảm so thước»)
- Modify: `app/src/components/ops/deal-body.tsx` (hàng «Mặt bằng S06 cùng dự án» trong khối «Vì sao giá tốt»)
- Create: `app/tests/do-lech-s03-s06-doc.test.tsx`

**Interfaces:**
- Consumes: bảng `project_source_baseline` (Task 1), fixture `dbCa`/`tin`/`can` (import từ pipeline như `gia-tot-du-an-doc.test.tsx`).
- Produces: `export type MatBang = { nS03: number; medianS03: number | null; nS06: number; medianS06: number | null; lechPct: number | null; trangThai: 'du' | 'thieu-s03' | 'thieu-s06' | 'thieu-hai' }`; `export function chuMatBang(m: MatBang, metric: string | null): string` (một trong bốn câu); `DealChiTiet.matBang?: MatBang | null`.

- [ ] **Step 1: Viết test hỏng** — `do-lech-s03-s06-doc.test.tsx`:
  - `CG15-AC-5`: DB thử dựng như Task 1 AC-1 + chấm; `getDeals({ project })` và trang một căn: mỗi dòng S03 `cap du_an` có `matBang` bằng từng trường dòng bảng (SELECT đối chiếu); dòng S06, cấp phường, không dự án → `null`; DB bỏ 107 → không ném, mọi `matBang` null; đối chứng dương cùng fixture có bảng thì khác null.
  - `CG15-AC-6`: bảy `MatBang` viết trước → `chuMatBang` bằng đúng chuỗi ghim (dùng giá trị cụ thể, ví dụ medianS06 58_000_000, nS06 92, lechPct −4,1 → `S06 58 tr/m² · 92 căn · S03 −4,1%`); nhóm 9 căn 10 tin → «9 căn»; thuê `gia-thang-pn` → «tr/tháng»; dựng `DealsGrid` và `DealBody` (renderToStaticMarkup như các test hiện có) với dòng không `matBang` → không chứa «S06». Ba đột biến bằng bản chép nguồn `deals-chi-tiet.ts` thay chuỗi (đảo dấu · câu thieu-s06 cho thieu-s03 · `nS03` thế `nS06`) → test đỏ với thông điệp nêu ca.
- [ ] **Step 2: Chạy, thấy đỏ** — `cd app && bash ../db/db-thu.sh oneinvest_suite_cg15_doc --chay node --import tsx --test --test-concurrency=1 tests/do-lech-s03-s06-doc.test.tsx` → FAIL.
- [ ] **Step 3: Cài `chuMatBang`, `MatBang`; JOIN trong `dealsSql`** — điều kiện `o.source = 'S03' AND h.cap = 'du_an'`, khoá `b.nut = h.nut AND b.kind = h.kind AND b.property_type = h.property_type AND b.thuoc = h.thuoc AND coalesce(b.pn_nhom,-1) = coalesce(h.pn_nhom,-1)`; chỉ chèn JOIN khi `to_regclass('project_source_baseline')` có (cùng cách `coBang` hiện dùng cho 104). `matBangCua(d)` cho trang một căn theo mẫu `daiM2Cua`.
- [ ] **Step 4: UI** — `deals-grid.tsx`: dưới dòng «Thước …» của ô Giảm so thước, thêm `<span className="text-xs text-muted-foreground">{chuMatBang(...)}</span>` khi có `matBang`. `deal-body.tsx`: thêm `<Dong nhan="Mặt bằng S06 cùng dự án" value={chuMatBang(...)} />` khi có. Không đổi literal tiêu đề khối (CGT tests ghim).
- [ ] **Step 5: Chạy xanh** — lệnh Step 2 PASS; `cd app && npx tsc --noEmit && npx eslint <các tệp đổi>` sạch; chạy kèm `tests/gia-tot-du-an-doc.test.tsx` không hồi quy.
- [ ] **Step 6: Commit** — `feat(ops-deals): hiện mặt bằng S06 cạnh hạng tin S03`.

### Task 3: Đo trên bản chép máy thu + hồ sơ áp

independent: false (cần Task 1) · phục vụ E7, E8

**Files:**
- Create: `pipeline/scripts/do-lech-s03-s06-do.mjs`
- Create: `pipeline/scripts/do-lech-s03-s06-db.sh` (`do` · `ghi-thu`, theo mẫu `gia-tot-du-an-db.sh`, DB `oneinvest_n1_cg15_do` / `oneinvest_n1_cg15`)
- Create: `_acceptance/do-lech-s03-s06-canh-hang/ap-may-thu.md` (năm thứ: lệnh áp kèm kiểm trước, số chạy thử, sao lưu, lùi, kiểm sau)
- Modify: `_acceptance/config.yaml` không đổi (executors đã khai ở S1)

**Interfaces:**
- Consumes: `xepHangGia`, `SQL_423` (Task 1).
- Produces: lệnh `bash pipeline/scripts/do-lech-s03-s06-db.sh do` thoát 0 khi đạt, ghi `.acceptance-runs/do-lech-s03-s06-canh-hang/do-may-thu.md`.

- [ ] **Step 1: Viết `do-lech-s03-s06-do.mjs`** — áp 107 (đọc tệp), chấm hai lần, đếm độc lập bằng câu SQL riêng (không dùng `SQL_423`: tự gom theo phiếu và nguồn từ `offer_price_rank` + `sale_offers` + `property_offers`) rồi so từng khoá nhóm (`lech = 0`), lần hai = lần một, `tin_s03_co_mat_bang ≥ 1500`; in bảng đếm bán/thuê × thước × trạng thái và mẫu số; ghi `.acceptance-runs/...`. Cờ `--doi-chung-tin` (chạy 423 đã thay phiếu bằng offer_id) và `--doi-chung-nguon` (bỏ lọc nguồn) phải thoát ≠ 0 nêu `lech`.
- [ ] **Step 2: Viết `do-lech-s03-s06-db.sh`** — như `gia-tot-du-an-db.sh`, chế độ `do` chạy thường + hai đối chứng, mong đợi hai đối chứng đỏ (đảo mã thoát), xoá DB thử khi xong; `ghi-thu` giữ DB `oneinvest_n1_cg15` đã áp 104/105/106/107 và chấm.
- [ ] **Step 3: Chạy (cần khoá s4 của đợt, chỉ khi máy rảnh)** — `bash pipeline/scripts/do-lech-s03-s06-db.sh do` → thoát 0; ghi số vào `ap-may-thu.md` §2.
- [ ] **Step 4: Viết `ap-may-thu.md`** theo mẫu `_acceptance/gia-tot-cap-du-an/ap-may-thu.md`, thay 106 → 107 và lệnh kiểm sau áp (`SELECT trang_thai, count(*) FROM project_source_baseline GROUP BY 1`).
- [ ] **Step 5: Commit** — `test(gia-tot): đo mặt bằng hai nguồn trên bản chép máy thu + hồ sơ áp 107`.

## Thứ tự và cách chạy

Task 1 → Task 2 → Task 3, tuần tự trong vòng chính (Task 2, 3 dùng bảng và hàm của Task 1). Mọi lệnh chạy suite/đo trên bản chép xin khoá của đợt và chỉ chạy khi giám sát báo máy rảnh. Xong Task 3 → hợp đồng `implemented` → S4.
