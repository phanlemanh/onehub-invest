# CG10 Giá tốt cấp dự án — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** tin có dự án được xếp hạng giá trong nhóm dự án × loại (× PN), nhãn «Giá tốt»; `/ops/deals` lọc theo dự án, mỗi căn một dòng, tab «Cần xác minh» đếm toàn tập; dải m² dự án × PN là phát biểu suy ra riêng.

**Architecture:** thêm cấp dự án vào đầu chuỗi chọn nhóm của `pipeline/sql/420_price_rank.sql` (nguồn dự án = view `offer_project` của 105, dò theo search_path); bảng tổng hợp mới `project_area_band` (migration 106) ghi cùng giao dịch của `xep-hang-gia.mjs`; đường đọc (`deals.ts`, `deals-chi-tiet.ts`, hai API) đọc `offer_price_rank.cap/nut` + `asset_nodes.name`, không đọc view.

**Tech Stack:** PostgreSQL 16 (PostGIS :5433), Node .mjs (pipeline, `node --test`), Next.js 16 app (`node --import tsx --test`), Hono data-api.

**Spec:** `docs/superpowers/specs/2026-11-15-gia-tot-cap-du-an-design.md` · hợp đồng `_acceptance/gia-tot-cap-du-an/contract.md` · evals `_acceptance/gia-tot-cap-du-an/evals.yaml`.

## Global Constraints

- Nhãn: `gia-tot` khi nhóm ≥ 10 phiếu, `gia_tri ≤ p20` và dưới trung vị ≥ 5% (làm tròn 1 chữ số); 5–9 có số không nhãn; < 5 không chấm. `can_xac_minh` khi dưới trung vị > 35%, vẫn giữ nhãn.
- Chuỗi chọn cấp (Hỏi-1 duyệt): dự án ≥10 → `du_an`; dự án 5–9 và nhóm phường ≥10 → phường; dự án 5–9 và phường <10 → `du_an` + `nhom-5-9`; dự án <5, `xung_dot`, không dự án → chuỗi phường CG9 y nguyên.
- `cap = 'du_an'`, `nut = <project_node_id>::text`. Không DDL cho `offer_price_rank`.
- Dò bảng/view bằng `to_regclass('<tên>')` KHÔNG ghi `public.` (bài học #456).
- Không chạm `pipeline/sync-cloud.mjs`, `pipeline/refresh-bait-gap.mjs`. Không tên nguồn thật trong mã/test (chỉ `S0x`).
- Dải m²: chỉ căn hộ có dự án (`mot_du_an`), mẫu là tin có `area_m2` trong 15–300 m² và không phi lý ON11, nhóm dự án × PN ≥ 10 mẫu (mỗi căn một mẫu như phiếu), p10/p50/p90; không ghi `area_m2`, không dùng để chia giá.
- Lọc dự án trên danh sách: giới hạn 300 dòng-căn; không lọc giữ 30 như CG9.
- Câu chữ (ghim trong test): «So với N căn cùng dự án <tên>, cùng loại (<loại>)[, cùng kPN]: thấp hơn trung vị X%, nằm trong 20% rẻ nhất — Giá tốt.»; thuê giá tháng thêm «, theo giá thuê tháng»; dải «≈ a–b m² · suy ra»; trống «Dự án chưa đủ căn để xếp hạng» / «Không tìm thấy dự án», nút «Bỏ lọc dự án».
- Test DB: mỗi ca chép RỖNG `offer_price_rank`, `project_area_band` vào lược đồ riêng (bài học hotfix #461); view `offer_project` dựng từ `db/migrations/105_offer_project.sql` khi tệp có, không thì từ bản chép `pipeline/scripts/gia-tot-du-an-view105.sql` (thân 105 của DV7 a15c1d9f).
- Commit kết bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Tin có dự án mà phiếu S06 (căn trong `property_offers`) nằm ở hai dự án khác nhau — phiếu phải góp đúng một lần mỗi dự án, không trùng → ca trong Task 2.
2. Dự án có `name` NULL hay trống trong `asset_nodes` — câu không được ra «cùng dự án ,» → Task 4 ca «tên vắng thì viết “cùng dự án này”».
3. `?project=` là số quá lớn / chuỗi (`abc`, `1;drop`) — trang không ném, API 400 → Task 5, Task 6.
4. Tin rời dự án giữa hai lượt chấm nhưng còn dòng cũ — bảng xoá trọn rồi chèn nên không còn dòng `du_an` thừa → Task 3 (AC-4).
5. Danh sách gom căn khi tin đại diện là tin cần xác minh còn tin khác của căn thì không — đại diện theo tin thấy sau cùng, cờ theo đại diện; ca ghim trong Task 5.

---

### Task 1: Migration 106 và hạ tầng test cấp dự án — independent: false

**Files:** Create `db/migrations/106_project_area_band.sql` · Create `pipeline/scripts/gia-tot-du-an-view105.sql` (chép nguyên thân `CREATE OR REPLACE VIEW offer_project` từ `git show feat/du-an-cua-tin-len-dinh-vi:db/migrations/105_offer_project.sql`, dòng 11 tới hết câu view, kèm đầu tệp ghi nguồn và «xoá khi DV7 gộp») · Create `pipeline/scripts/gia-tot-du-an-fixture.itest.mjs` · Modify `_acceptance/config.yaml` (bốn executor `cg10_db`, `cg10_doc`, `cg10_ranh`, `cg10_do`).

**Interfaces — Produces:**
- `project_area_band(project_node_id bigint, bedrooms int, p10 numeric, p50 numeric, p90 numeric, n int, run_id text NOT NULL, computed_at timestamptz DEFAULT now(), PRIMARY KEY (project_node_id, bedrooms))`, idempotent (`CREATE TABLE IF NOT EXISTS`), không FK.
- `withTxDuAn(fn, { boView = false, bo106 = false, luocDoView = null } = {})` trong fixture: BEGIN, `luocDoRieng` với bảng tin, `property_offers`, `properties`, `asset_nodes`, `field_assertions`, `s06_offer_project` (khi là bảng), `offer_price_rank`, `project_area_band` (trừ `bo106`), dựng view `offer_project` (trừ `boView`; `luocDoView` = tên lược đồ khác để đặt view), luôn ROLLBACK.
- `duAn(c, { id, ten, cha = null })`, `tinDuAn(c, { id, duAn, phuong, loai, kind, pn, m2, gia, giaThang, nguon = "S06", lastSeen })` — tin S06 gắn dự án qua `s06_offer_project`, S03 qua `field_assertions(field='project_node_id')`.

- [ ] **Step 1:** ca `CG10-HT-1` trong `pipeline/scripts/gia-tot-du-an.test.mjs`: trong `withTxDuAn`, `SELECT project_node_id, status FROM offer_project WHERE offer_id=$1` của tin dựng bằng `tinDuAn` trả `(id, 'mot_du_an')`; `to_regclass('project_area_band')` khác NULL; với `bo106` thì NULL. Đối chứng: `boView` → `to_regclass('offer_project')` NULL.
- [ ] **Step 2:** chạy `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg10 --chay node --test --test-concurrency=1 scripts/gia-tot-du-an.test.mjs` → đỏ (thiếu fixture/106).
- [ ] **Step 3:** viết 106, bản chép view, fixture; thêm executor vào config (`cg10_db` = lệnh trên; `cg10_doc` = `cd app && bash ../db/db-thu.sh oneinvest_suite_cg10_doc --chay node --import tsx --test --test-concurrency=1 tests/gia-tot-du-an-doc.test.tsx`; `cg10_ranh`, `cg10_do` ở Task 6, 7).
- [ ] **Step 4:** chạy lại → xanh; áp 106 hai lần trên DB lượt không lỗi.
- [ ] **Step 5:** commit `feat(db): 106 project_area_band + hạ tầng test cấp dự án (CG10)`.

### Task 2: 420 chấm cấp dự án — independent: false · phục vụ E1, E2, E3

**Files:** Modify `pipeline/sql/420_price_rank.sql` · Test `pipeline/scripts/gia-tot-du-an.test.mjs`.

**Interfaces — Consumes:** Task 1 fixture. **Produces:** `SQL_420` (đủ cấp dự án, tham số `$1` run_id, `$2` phi lý — không đổi chữ ký) và `SQL_420_PHUONG` (bản chỉ phường = câu CG9 hiện tại, giữ nguyên byte để AC-4 so được), cả hai export từ `xep-hang-gia.mjs` ở Task 3.

- [ ] **Step 1: ca `CG10-AC-1`** — một dự án trải hai phường, 12 phiếu căn hộ bán (2PN ×10, 1PN ×2), 6 tin thuê có m²: assert từng tin `cap='du_an'`, `nut=String(id)`, `n/trung_vi/p20/hang_pct/duoi_trung_vi_pct` lệch ≤ 0,1 so với hàm `tinhNhom(giaTri[])` viết trong test; tập `nhan='gia-tot'` = tập ≤ p20 ∧ ≥ 5%; 2PN `pn_nhom=2`; 1PN `ly_do='pn-duoi-10'`; tin thuê so trong nhóm thuê. Ba đột biến (thay chuỗi trong `SQL_420`: bỏ điều kiện `>= 5`, nhóm theo `area_id` thay dự án, ghi `'re-trong-phuong'` ở cấp dự án) → `assert.throws`/khác, thông điệp chứa mã tin.
- [ ] **Step 2: ca `CG10-AC-2`** — tám ô một assert mỗi ô (bảng ở hợp đồng AC-2) + ô Review Focus 1 (căn S06 ở hai dự án: `n` mỗi dự án đếm căn một lần) + đối chứng dương; trong cùng lệnh `cg10_db` chạy cả `scripts/hang-gia.test.mjs` (thêm vào lệnh executor) để CG9 xanh không sửa ca.
- [ ] **Step 3: ca `CG10-AC-3`** — thuê thiếu m²: 2PN ×10 có giá tháng → `cap='du_an'`, `thuoc='gia-thang-pn'`, `pn_nhom=2`, trung vị = median giá tháng tính tay; 1PN ×6 theo luật lùi; thiếu cả hai `thieu-dt-va-pn`; đột biến bỏ PN khỏi khoá `dth` đỏ.
- [ ] **Step 4:** chạy → đỏ. **Step 5:** sửa 420: thêm `pj` vào CTE `tin` (`LEFT JOIN offer_project op ON op.offer_id=o.offer_id AND op.status='mot_du_an'`), CTE `vd`, `vmd` (DISTINCT ON phiếu × dự án × loại × kind / × PN), khoá `dall|`, `dpn|`, `dth|` trong `mem`, CTE `c0/c1/c2` chọn cấp theo Global Constraints (JOIN bảng `st`, không subquery tương quan — đo 15/11: subquery vượt 300 s), cột ra `cap`/`nut`/`nhan` theo cấp. **Step 6:** chạy → xanh. **Step 7:** commit `feat(pipeline): 420 chấm cấp dự án (CG10)`.

### Task 3: Dò view, dải m², chạy lại — independent: false · phục vụ E4, E5

**Files:** Modify `pipeline/xep-hang-gia.mjs` · Create `pipeline/sql/421_project_area_band.sql` · Test `pipeline/scripts/gia-tot-du-an.test.mjs`.

**Interfaces — Produces:** `xepHangGia(c, opts)` trả thêm `{ capDuAn: boolean, dai: number | null }` (`dai` = số dòng dải, null khi chưa áp 106); in đúng các dòng «xep-hang-gia: chưa có offer_project — chỉ chấm cấp phường» và «xep-hang-gia: chưa áp 106 — bỏ dải diện tích».

- [ ] **Step 1: ca `CG10-AC-4`** — bốn môi trường (không view / view ở lược đồ `cg10_view` có trong `search_path` / view mà `bo106` / đủ): assert dòng in, `cap` tập hợp, bảng không view bằng từng dòng kết quả `SQL_420_PHUONG`; chạy hai lần so từng dòng trừ `computed_at`, `run_id`; sửa view tạm để tin rời dự án → lượt sau `cap='phuong'`; đột biến dò `public.offer_project` đỏ ở ca lược đồ khác; đột biến chèn dải không dò bảng đỏ ở ca `bo106`.
- [ ] **Step 2: ca `CG10-AC-5`** — 12 mẫu dự án × 2PN, 7 mẫu × 1PN, 1 tin m² 400: một dòng dải, p10/p50/p90/n lệch ≤ 0,1 so `percentile_cont` tính tay; `area_m2` và mọi cột `offer_price_rank` bằng lượt chạy `bo106`; đột biến dùng p50 làm m² đỏ; `sauXoa` ném → cả hai bảng giữ dòng cũ.
- [ ] **Step 3:** chạy → đỏ. **Step 4:** sửa `xep-hang-gia.mjs`: dò `to_regclass('offer_project')`, `to_regclass('project_area_band')`; chọn `SQL_420` hay `SQL_420_PHUONG`; khi có 106: `DELETE FROM project_area_band` rồi chạy 421 trong cùng giao dịch, cùng khoá advisory. **Step 5:** chạy → xanh. **Step 6:** commit `feat(pipeline): dò view 105, dải m² dự án × PN (CG10)`.

### Task 4: Trang một căn đọc cấp dự án — independent: false · phục vụ E6

**Files:** Modify `app/src/lib/deals-chi-tiet.ts`, `app/src/lib/deals.ts` (`dealSql`, `COT_HANG`, `toDealRow`), `app/src/app/ops/deals/[offerId]/page.tsx` · Create `app/tests/gia-tot-du-an-doc.test.tsx`.

**Interfaces — Produces:** `HangGia` thêm `level: string | null`, `node: string | null`, `nodeName: string | null`; `DealChiTiet` thêm `daiM2: { p10: number; p90: number } | null`; `cauChungMinh(d)` đổi câu theo `level`; `chuDaiM2(dai): string` → «≈ a–b m² · suy ra» (làm tròn số nguyên).

- [ ] **Step 1:** ca `CG10-AC-6` năm tin (bảng ở hợp đồng) — mỗi câu một assert nguyên văn theo Global Constraints, cặp dương/âm; Review Focus 2: `asset_nodes.name` NULL → «cùng dự án này»; lược đồ không `project_area_band` → `getDeal` không ném, `daiM2 = null`; đột biến N = số tin (thay `h.n` bằng `count` trong câu) đỏ.
- [ ] **Step 2:** chạy `config:executors.script.cg10_doc` → đỏ. **Step 3:** sửa: `COT_HANG` thêm `h.cap AS rank_level, h.nut AS rank_node, pn.name AS rank_node_name` (`LEFT JOIN asset_nodes pn ON h.cap='du_an' AND pn.id::text=h.nut`); `dealSql` thêm dải khi `to_regclass('project_area_band')` có (truy vấn riêng, lỗi 42P01 → null); trang thêm dòng dải và nút «Xem cả dự án» (`/ops/deals?project=<node>`, `ui/button variant=link`). **Step 4:** chạy → xanh; `cd app && npx tsc --noEmit && npm run lint` xanh. **Step 5:** commit `feat(app): trang một căn nói cấp dự án và dải m² suy ra (CG10)`.

### Task 5: Danh sách lọc dự án, gom căn, tab toàn tập — independent: false · phục vụ E7

**Files:** Modify `app/src/lib/deals.ts` (`dealsSql`, `getDeals`), `app/src/app/ops/deals/page.tsx`, `app/src/components/ops/deals-grid.tsx`, `app/src/lib/deals-chi-tiet.ts` (`tabCua`) · Test `app/tests/gia-tot-du-an-doc.test.tsx`.

**Interfaces — Produces:** `getDeals({ project?: string; limit?: number; minDiscountPct?: number }) → { rows: DealRow[]; mayThu: boolean; duAn: { id: string; ten: string | null } | null; xacMinh: { tong: number; rows: DealRow[] } }`; `DealRow.soTin: number`; `parseProject(v: string | undefined): string | null` (chỉ chữ số, ≤ 18 ký tự).

- [ ] **Step 1:** ca `CG10-AC-7` (fixture hợp đồng) — lọc `project`, giới hạn 300 (35 dòng ra 35), `soTin=3` với đại diện tin `last_seen` mới nhất (Review Focus 5: đại diện cần xác minh còn tin khác không thì dòng mang cờ đại diện), đếm/liệt kê tab = 3 khi thường đủ 30, đếm tab theo dự án có đối chứng dự án thứ hai, chỉ tin bán, id có thật 0 dòng → `rows=[]`, `duAn.ten` có; id lạ → `duAn=null`; Review Focus 3: `parseProject("abc")`, `"1;drop"`, 19 chữ số → null, trang không ném. Đột biến đếm tab trên 30 dòng đã cắt đỏ.
- [ ] **Step 2:** chạy → đỏ. **Step 3:** sửa `dealsSql` (CTE `ds` gom `DISTINCT ON (coalesce(min property_id, offer_id))` theo `last_seen DESC`, `count(*) OVER` cho `so_tin`; điều kiện `h.cap='du_an' AND h.nut=$3` khi có dự án; LIMIT 300 khi có dự án), truy vấn tab riêng (`can_xac_minh = true`, cùng điều kiện, giới hạn 300, đếm `count(*)` toàn tập); trang: tiêu đề «Căn giá tốt · <tên>», nút «Bỏ lọc dự án», hai trạng thái trống (`ui/empty`); grid: cột «N tin», đếm tab lấy `xacMinh.tong`. **Step 4:** chạy → xanh; tsc + lint; ReUI self-check trên tệp đổi. **Step 5:** commit `feat(ops): /ops/deals lọc dự án, mỗi căn một dòng, tab Cần xác minh toàn tập (CG10)`.

### Task 6: Hai API + rà ranh giới + sync — independent: false · phục vụ E8

**Files:** Modify `data-api/src/routes/deals.ts`, `app/src/app/api/v1/deals/route.ts` · Create `pipeline/scripts/gia-tot-du-an-ranh-gioi.mjs` (chép khuôn `hang-gia-ranh-gioi.mjs`: so diff với điểm tách nhánh, `refresh-bait-gap.mjs` không đổi, 0 dòng thêm chứa tên nguồn thật đọc từ `source_registry` local, `--doi-chung` dựng hai cây tạm phải đỏ) · Test `app/tests/gia-tot-du-an-doc.test.tsx` (ca API), `pipeline/sync-cloud.test.mjs` (ca `CG10-AC-8` sync chép dòng `du_an` đúng số) · config `cg10_ranh`.

**Interfaces — Produces:** query `project` (chỉ chữ số, sai → 400 `{ error: "project" }`); `rank.node: string | null` thêm vào khối `rank` của cả hai API.

- [ ] **Step 1:** ca `CG10-AC-8` (hợp đồng) + bảng khoá cũ viết trước; ca sync dùng cloud giả có `offer_price_rank` → số dòng `cap='du_an'` chép = đếm độc lập. **Step 2:** chạy `cg10_ranh` → đỏ. **Step 3:** sửa hai route, viết công cụ rà. **Step 4:** xanh. **Step 5:** commit `feat(api): /v1/deals lọc dự án, rank.node (CG10)`.

### Task 7: Đo trên dữ liệu thật + hồ sơ áp máy thu — independent: false · phục vụ E9, chuẩn bị E10

**Files:** Create `pipeline/scripts/gia-tot-du-an-db.sh` (chế độ `do`, `ghi-thu` theo khuôn `hang-gia-db.sh`; áp 105 từ `db/migrations` hay bản chép, áp 106), `pipeline/scripts/gia-tot-du-an-do.mjs` (đếm độc lập theo cấp × kind × thước × ô; `can_ho_cap_du_an`, `op1_danh_sach_can` qua chính câu `dealsSql({ project: "1" })` của app — import `app/src/lib/deals.ts` qua tsx hoặc chép câu bằng hàm export dùng chung; `--doi-chung-khoa`, `--doi-chung-hong`), `_acceptance/gia-tot-cap-du-an/ap-may-thu.md` (năm thứ: lệnh áp 106, số chạy thử, sao lưu `pg_dump`, lùi `DROP TABLE project_area_band` + chấm lại bản 420 cũ, lệnh kiểm sau áp) · config `cg10_do`.

- [ ] **Step 1:** viết công cụ; chạy `bash pipeline/scripts/gia-tot-du-an-db.sh do` (giữ khoá s4) → in mẫu số, `lech=0`, `nhan_nhom_duoi_10=0`, `sai_khoa=0`, `can_ho_cap_du_an ≥ 10000`, `op1_danh_sach_can ≥ 100`; hai đối chứng đỏ đúng; ghi `_acceptance/gia-tot-cap-du-an/do-may-thu.md`.
- [ ] **Step 2:** `ghi-thu` dựng `oneinvest_n1_cg10` cho E10. **Step 3:** commit `chore(acceptance): đo dữ liệu thật CG10 + hồ sơ áp 106`.

## Thứ tự và song song

Task 1 → 2 → 3 (cùng 420/xep-hang-gia); 4 → 5 (cùng `deals.ts`); 6 sau 4 (khối `rank`); 7 cuối. Không task nào độc lập thật — chạy tuần tự trong vòng chính; Workflow song song không dùng.
