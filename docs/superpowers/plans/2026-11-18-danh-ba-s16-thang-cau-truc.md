# DA37 danh-ba-s16-thang-cau-truc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ở năm dự án có S16, toà vào phân khu của khu S16 qua view hiệu lực, S16 thắng về cấu trúc, lệch cấu trúc thành số đếm.

**Architecture:** Migration 111 thay `v_toa_nut_vung` (thêm tầng S16 trên S09) và thêm `v_lech_cau_truc_s16`. Lệnh thẻ luật
`pipeline/phan-khu-s16.mjs` đúc/gán nút phân khu theo khuôn DA32. Bước S16 của `danh-ba-vat-the` đổi nhánh lệch toà thành gộp căn.
Job đêm in mốc. Bộ lùi của hàng trong `_acceptance/<slug>/lui/`.

**Tech Stack:** Node .mjs (ESM), `pg`, PostgreSQL 16 (PostGIS :5433), `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-17-danh-ba-s16-thang-cau-truc-design.md` · hợp đồng `_acceptance/danh-ba-s16-thang-cau-truc/contract.md` · evals cùng thư mục.

## Global Constraints

- Migration mới số 111, tên `db/migrations/111_v_toa_nut_vung_s16.sql`; idempotent (`CREATE OR REPLACE VIEW`); không sửa migration đã commit.
- Không `UPDATE buildings SET region_node_id`; không nới rào 082, 045, 055.
- Thẻ: `item_type = 'entity_match'`, `item_id` dạng `s16:%`; «cho nghỉ» = `status = 'rejected'`, `decision_note = 'S16 thắng cấu trúc (DA37)'`.
- Không in `toa_id`, `khu_id`, mã căn, tên nguồn thật ra stdout hay thẻ.
- itest dựng DB `oneinvest_dbv_s37_<pid>` qua `pipeline/scripts/db-thu-dbv.mjs` (`taoDbThu`, `xoaDbThu`), xoá khi xong.
- Mỗi phép đo mới có cặp hai-chiều cùng fixture (xanh khi lành, đỏ với thông điệp ghim khi phá).

## Review Focus

- Toà S16 ở bản thu có danh sách khu nhưng khu không có nút (chưa áp thẻ luật) → giữ tầng S09/gốc, không null.
- Khu S16 trùng tên với hai nút phân khu sẵn → thẻ luật ghi «mơ hồ», không gán, không đúc.
- `--ap` chạy hai lần với cùng băm sau khi dữ liệu đổi (băm mới) → lần hai thoát vì lệch băm, 0 ghi.
- Căn S08 lệch toà mà căn S16 cùng mã đã bị gộp từ lượt trước → không gộp vòng (merged_into trỏ căn đã merged).
- Job đêm không có bản thu S16 mới → dòng mốc vẫn in, «khoá mới 0».

---

### Task 1: Migration 111 và khung itest

**Files:** Create `db/migrations/111_v_toa_nut_vung_s16.sql`, `pipeline/scripts/danh-ba-s16-cau-truc.itest.mjs`. Evals: E1, E2, E6 (phần view). independent: false.

**Interfaces:** Produces view `v_toa_nut_vung(building_key, region_node_id, region_node_id_goc, nguon)` với `nguon ∈ {'s16_phan_khu','s09_cum','s09_phan_khu','goc'}`; view `v_lech_cau_truc_s16(du_an_node_id bigint, cap_nguon text, loai text, so int)`; nút phân khu S16 nhận diện bằng `asset_nodes.meta -> 's16_khu_ids' ? '<du_an>/<khu_id>'`.

- [ ] Step 1: itest `DA37-AC-1` — fixture toà chỉ S09, chỉ gốc, S09+S16; áp 111 hai lần (`pg_get_viewdef` bằng nhau); với toà không bí danh S16 `EXCEPT ALL` hai chiều với view dựng tạm từ thân 097 = 0; áp lại thân view 097 → định nghĩa cũ. Đỏ: đột biến bỏ điều kiện bí danh S16 → «toà không S16 đổi nút».
- [ ] Step 2: itest `DA37-AC-2` — toà ở bản có danh sách (khu K1) và bản không (khu K9) → khu K1; toà có K1, K2 ở hai bản có danh sách → không vào tầng S16 và có trong đếm. Đỏ: đột biến đọc khu từ `v_s16_toa` → «khu từ bản không danh sách».
- [ ] Step 3: itest `DA37-AC-6 (view)` — bảng kỳ vọng viết trước (dự án, cặp nguồn, loại, số) gồm lệch toà S08, lệch phân khu S09, lệch tên toà. Đỏ: bỏ cặp S09 → «thiếu cặp S09».
- [ ] Step 4: chạy `node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16-cau-truc.itest.mjs` → FAIL (chưa có 111).
- [ ] Step 5: viết 111 theo design §3.1 (CTE `s16`, `pk16`; `COALESCE(pk16.id, cum.id, pk.id, b.region_node_id)`); view đếm lệch.
- [ ] Step 6: chạy lại → PASS; phá thử từng đột biến → đỏ đúng thông điệp. Commit.

### Task 2: Lệnh thẻ luật phân khu S16

**Files:** Create `pipeline/lib/s16-phan-khu.mjs` (thuần), `pipeline/phan-khu-s16.mjs` (CLI); Modify itest. Evals: E3, E4. independent: false.

**Interfaces:** Consumes Task 1 view. Produces `keHoachPhanKhu(khuS16: {du_an,khu_id,khu_ten,so_toa}[], nutSan: {id,parent_id,name}[], noi: Record<du_an,nodeId>) → {dong: {du_an, khu_ten, nut: 'moi'|'san'|'mo-ho', node_id?, so_toa}[], bam: string}` và `bamKeHoach(dong) → hex64`; CLI `--the <tệp>` · `--ap --bam <hex> --nguoi <tên>` · `--dao <id> --nguoi <tên>`.

- [ ] Step 1: test thuần `s16-phan-khu.test.mjs` — ma trận ô: khu trùng một nút (chuẩn hoá `chuanHoaTenToa`) → `san`; trùng hai → `mo-ho`; không trùng → `moi`; băm đổi khi một dòng đổi.
- [ ] Step 2: itest `DA37-AC-3` — `--the` đầu ra không chứa token fixture (đối chứng dương: cấy token vào chuỗi giả thì `soatS16` bắt); `--ap` băm đúng → mỗi khu một nút, một dòng `project_link_rules` (source `S16`); băm lệch → 0 dòng ở `asset_nodes`, `project_link_rules`; áp lại → 0 nút mới; `--dao` → `meta.s16_khu_ids` rỗng ở mọi nút của dòng luật, `dao_by/dao_at` có. Đỏ: bỏ so băm → «băm lệch».
- [ ] Step 3: itest `DA37-AC-4` — trước áp 0 dòng `s16_phan_khu`; sau áp toà S09+S16 có `region_node_id` = id nút của khu nó (assert id); sau đảo về nút S09. Đỏ: xếp S09 trên S16 → «S09 thắng S16».
- [ ] Step 4: FAIL → viết lib + CLI theo design §3.2 (khuôn `pipeline/noi-du-an-s06.mjs`) → PASS → phá thử → commit.

### Task 3: Bước S16 — S16 thắng khi căn S08 lệch toà

**Files:** Modify `pipeline/lib/s16-dung.mjs` (nhánh `can-lech-toa`, `theLechS16`), itest. Evals: E5, E6, E7. independent: false.

**Interfaces:** `buocS16` trả thêm `tk.can_s08_gop`, `tk.the_cho_nghi`; `theLechS16(c, lech)` đổi thành gộp + cho nghỉ.

- [ ] Step 1: itest `DA37-AC-5` trên hai DB (S08 trước / S16 trước): mã X đúng một căn `active` ở toà S16 mang bí danh S16; căn S08 `merged`, `merged_into` = căn sống, bí danh S08 trên căn cũ; 0 thẻ `can-lech-toa` mới; thẻ pending của X → `rejected` + ghi chú; tập hai DB bằng nhau. Đỏ: giữ nhánh thẻ → «thẻ lệch mới».
- [ ] Step 2: itest `DA37-AC-6 (thẻ)` — 0 thẻ mới ở dự án có S16; đối chứng dương: cùng lệch ở dự án không S16 ra đúng một thẻ. Đỏ: chặn theo mọi dự án → «mất thẻ ngoài dự án S16».
- [ ] Step 3: itest `DA37-AC-7` — dựng lại hai lần: băm `(building_key, region_node_id)` bằng nhau, 0 khoá mới, 0 thẻ mới, thẻ `can-mo-ho`/`toa-trung-ten` không đổi. Đỏ: đúc lại khi có bí danh → «khoá mới ở lần hai».
- [ ] Step 4: FAIL → sửa theo design §3.3 (không gộp căn đã `merged`) → PASS → chạy lại itest DA33 `pipeline/scripts/danh-ba-s16.itest.mjs` (ca AC-6, AC-7 của DA33 đổi theo Q-B: cập nhật kỳ vọng lệch toà kèm dòng sổ `fix`) → commit.

### Task 4: Job đêm in mốc

**Files:** Modify `pipeline/danh-ba-vat-the.mjs` (`buocVatTheDem`), `pipeline/lib/s16-dung.mjs` (trả `moc`); itest. Evals: E8. independent: false.

- [ ] Step 1: itest `DA37-AC-8` — năm khu đã có toà → tập dựng bằng năm slug; đầu ra có «S16: khoá mới <n>, mốc <ISO>» khớp `created_at` dòng mới; không bản thu mới → «khoá mới 0». Đỏ: bỏ một khu → ca nêu slug.
- [ ] Step 2: FAIL → `buocS16` trả `moc` (`SELECT now()` trong giao dịch) → in dòng → PASS → commit.

### Task 5: Lượt đo thật và đường lùi

**Files:** Create `pipeline/scripts/danh-ba-s16-cau-truc-that.mjs`; `_acceptance/danh-ba-s16-thang-cau-truc/lui/` (`dau-van-tay.sh`, `ghi-khoa.sh`, `go-khoa.sh` chép từ DA33 rồi thêm: rút `field_assertions` của lượt bằng `retracted_at`, `retract_reason='lui-da37'`; trả căn `merged` về `active`; trả thẻ về `pending` với ghi chú cũ). Evals: E2b, E9, E10. independent: false.

- [ ] Step 1: script chép DB máy thu sang `oneinvest_dbv_s37that_<pid>` (`taoDbThu`), áp 111, `--the` rồi `--ap` với băm in ra, dựng năm khu; so tám ô với bảng kỳ vọng AC-10 (khu 61; nút = 61; toà S16 treo 109 → 0; merged 2; rejected 2; 38/20 pending; 0 `region_node_id`; lần hai 0 khoá); lệch ±1 → thoát 1 nêu ô.
- [ ] Step 2: cùng script phần E9 — dấu vân tay trước áp → chuỗi áp → ghi khoá → lùi → dấu vân tay bằng nhau (bảng theo AC-9), phần dư đếm đúng; tệp khoá sai DB → thoát 4. Đỏ: bỏ bước trả thẻ → «thẻ lệch không về pending».
- [ ] Step 3: chạy `node pipeline/scripts/danh-ba-s16-cau-truc-that.mjs` → thoát 0 → commit.

### Task 6: Hồ sơ áp

**Files:** Create `_acceptance/danh-ba-s16-thang-cau-truc/ap-may-thu.md`. Evals: không (hồ sơ). independent: false.

- [ ] Step 1: năm thứ: lệnh áp (111 ×2, `--the`, lời Mạnh «Áp thẻ luật S16 <băm>», `--ap`, dựng năm khu), số chạy thử từ Task 5, sao lưu (pg_dump qua `docker exec`), cách lùi (bộ `lui/`), lệnh kiểm sau; ba chỗ GS lệch ở DA33 (pg_dump qua docker, khoá `conrelid='public.…'::regclass`, sổ nguồn không dùng tên hai từ). Commit.
