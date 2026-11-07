# DB1 Danh bạ toà · trục · căn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng danh bạ vật thể toà · trục · căn cao tầng cho Ocean Park 1 và Grand Park từ danh mục S08 (+ bí danh từ phát biểu toà trên tin), khoá mờ đúc một lần, UPI neo toà, chủ đầu tư và phường là phát biểu cấp toà.

**Architecture:** Migration 082 thêm ba bảng chỉ-thêm và mở khung chung (055) cùng `field_assertions` (045). Một bộ tách mã thuần, một lõi thuần tính kế hoạch đúc từ trạng thái hiện có, một lệnh ghi chạy một giao dịch. Mọi phép đo chạy trên DB thử dựng từ migration; dữ liệu thật chỉ chép đọc.

**Tech Stack:** PostgreSQL 17 + PostGIS (:5433), Node ESM `.mjs`, `node:test`, `pg` mượn từ `app/`.

**Spec:** `docs/superpowers/specs/2026-11-07-danh-ba-toa-truc-can-design.md` · hợp đồng `_acceptance/danh-ba-toa-truc-can/contract.md` · `evals.yaml` (E1–E13, E11b).

## Global Constraints

- Migration số **082**, tệp `db/migrations/082_danh_ba_vat_the.sql`, idempotent; không sửa migration đã commit.
- Khoá: `bld_` · `stk_` · `unt_` + ULID Crockford 26 ký tự (`^(bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}$`), cùng khuôn `pty_` của 055.
- UPI toà: `urn:onehub:upi:1:VN:<VN-HN|VN-SG>:<khoá toà>`; SubId căn: `<khoá trục>:<tầng>`, không biết trục thì `<khoá căn>`.
- Bí danh S08: kind `ma_nguon`, source `S08`, giá trị `<project_id>/<mã toà>`, `<project_id>/<mã toà>/<trục>`, `<project_id>/<mã căn>`.
- Phát biểu vật thể: `builder_name` lớp `fact` / `hitl`; `area_id` lớp `inferred` / `registry_inherit`.
- Không mã S08 thật, không tên toà/phân khu chỉ có từ S08 trong bất kỳ tệp kho nào (test dùng mã tổng hợp tiền tố `Q`).
- Không ghi DB `oneinvest`: lệnh dựng từ chối tên DB `oneinvest`; mọi test dùng DB thử `oneinvest_dbv_<pid>` / `oneinvest_dbv_that_<pid>`, xoá khi xong.
- Không chạm `agent/`, `pipeline/lib/eval-labels.mjs`, `pipeline/lib/label-*`, `pipeline/transform-zalo.mjs`.
- Từ điển chủ đầu tư và mọi tệp chứa dữ liệu S08: `state/danh-ba-vat-the/` (gitignored).
- Ngưỡng: tỉ lệ tách ≥ 0,90 mỗi khu (E7).

## Review Focus

- Mã S08 khớp hai khuôn (một khuôn quá rộng) → phải là lỗi của bộ tách, không lấy khuôn đầu (Task 2 ca chéo).
- Bộ dựng chạy hai lần đồng thời (hai tiến trình) → khoá trùng: lệnh dựng giữ `pg_advisory_xact_lock` một khoá cố định (Task 4 ca hai tiến trình).
- Dòng S08 có `product_code` rỗng hay chỉ khoảng trắng → bỏ qua, ghi sổ lý do «mã rỗng», không lỗi (Task 3).
- Tên toà trên tin có dấu, khoảng, chữ thường (`pr 6`, `Pr6`, `PR-6`) → chuẩn hoá về một dạng trước khi khớp (Task 3).
- `areas` của khu chứa cả id cấp market lẫn submarket → chỉ đếm submarket (Task 3 ca (d) của E13).

---

### Task 1: Migration 082 + sổ từ vựng + khung DB thử

**independent:** true · **phục vụ:** E1 (AC-1), E12 (AC-1)

**Files:**
- Create: `db/migrations/082_danh_ba_vat_the.sql`
- Modify: `pipeline/mappings.yaml` (sổ từ vựng: trục `catalog_tier`; `alias_kind` thêm `ma_nguon`; `assertion_resource` thêm `Building`/`Stack`/`Unit`; `assertion_field` thêm `builder_name` → RESO `Building.BuilderName`, `area_id` local; `assertion_method` thêm `registry_inherit` local — rationale theo ADR-0016 §11, đủ sáu điều kiện ADR-0011)
- Create: `pipeline/scripts/db-thu-dbv.mjs` (khung DB thử dùng chung cho Task 4, 5)
- Create: `pipeline/scripts/danh-ba-vat-the.itest.mjs` (ca DBV-AC-1)

**Interfaces:**
- Produces (SQL): bảng `buildings(building_key, status, merged_into, region_node_id bigint REFERENCES asset_nodes, upi text UNIQUE NOT NULL, iso_region text CHECK IN ('VN-HN','VN-SG'), catalog_tier, created_at)`, `stacks(stack_key, status, merged_into, building_key REFERENCES buildings, catalog_tier, created_at)`, `units(unit_key, status, merged_into, building_key, stack_key NULL, floor text NULL, sub_id text NOT NULL, catalog_tier, created_at)`; trigger chỉ-thêm (dùng lại `danh_ba_chi_them` mở rộng ba bảng: khoá, `upi`, `sub_id`, `created_at` không đổi); index `registry_aliases_ma_nguon_uq ON registry_aliases (source, kind, value) WHERE retired_at IS NULL AND kind = 'ma_nguon'`; CHECK `field_assertions` mở như design §4.1 + trigger `field_assertions_resource_khoa` ghép resource ↔ tiền tố khoá; seed `ref_lookup` sinh bằng `node pipeline/vocab.mjs --emit-seed`.
- Produces (JS): `taoDbThu(ten: string) → Promise<string /*url*/>` và `xoaDbThu(ten)` trong `pipeline/scripts/db-thu-dbv.mjs` — tạo DB trống trên :5433 rồi chạy `node scripts/ci-db-init.mjs` với `DATABASE_URL` trỏ DB đó.

- [ ] **Step 1: Viết ca DBV-AC-1 trong itest** — ma trận viết trước (mảng hằng đầu tệp): `[bảng, thao tác]` cho DELETE/TRUNCATE/đổi khoá/đổi upi/đổi sub_id trên ba bảng, mỗi phần tử một `assert.rejects(..., /chỉ thêm/)`, assert số ca = độ dài mảng; INSERT `bld_` sai khuôn bị CHECK từ chối; `field_assertions` nhận `('Building','bld_…','builder_name')`, từ chối `('Property','bld_…')` với `/resource không khớp khoá/`; băm tập dòng (sha256 của JSON các dòng đã sắp) của ca Người (ghi một người qua `pipeline/lib/danh-ba-nguoi.mjs`) và của `SELECT * FROM offer_subject_keys(...)`/bản tính cột chuẩn 045 trên mồi tin S03 nhỏ — trước 082 (DB thử dựng tới 079), sau 082, sau khi ghi một phát biểu Building: ba băm bằng nhau; chèn lại `sdt_bam` trùng → `/DBV-AC-1 bí danh Người trùng/`; dấu lược đồ sau áp 082 lần hai bằng lần một (`bash db/db-thu.sh --dau` không dùng được với DB thử → tính bằng câu trong `db/dau-luoc-do.sql` trên DB thử).
- [ ] **Step 2: Chạy, thấy đỏ** — `node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs` → FAIL (bảng `buildings` chưa có).
- [ ] **Step 3: Viết 082 + mappings.yaml + seed** — `node pipeline/vocab.mjs --write` rồi `--emit-seed` dán khối vào 082; `node pipeline/vocab.mjs --lint` sạch.
- [ ] **Step 4: Chạy, thấy xanh** — cùng lệnh → PASS; `node pipeline/vocab.mjs --check-db` trên DB thử sạch.
- [ ] **Step 5: Chiều đỏ** — bản chép 082 bỏ trigger chỉ-thêm (biến môi trường `DBV_MIG_THAY=<tệp>` cho `taoDbThu` dùng bản chép) → ca DELETE đỏ `/DBV-AC-1 xoá được vật thể/`; bản chép thay index bằng cột NULL → ca bí danh trùng đỏ.
- [ ] **Step 6: Commit** — `feat(db): 082 danh bạ vật thể toà, trục, căn (DB1)`.

### Task 2: Bộ tách mã căn S08

**independent:** true · **phục vụ:** E2 (AC-2), góp E7

**Files:**
- Create: `pipeline/lib/ma-can-s08.mjs`
- Create: `pipeline/lib/ma-can-s08.test.mjs`
- Create (local, gitignored): `state/danh-ba-vat-the/do-khuon.mjs` — chỉ đọc máy thu, in số mã theo khuôn và số không tách, để chọn khuôn; không commit

**Interfaces:**
- Produces: `export const KHUON: ReadonlyArray<{ id: string, mo_ta: string, re: RegExp }>`; `export function tachMa(ma: string): { toa: string, tang: string, truc: string, khuon_id: string } | { khong_tach: 'ma-rong' | 'khong-khop-khuon' | 'nhieu-khuon' | 'khong-co-tang' }`. `tang` là số nguyên viết thập phân không số 0 đầu (`"7"`), `truc` giữ nguyên chữ (`"05A"`), `toa` viết hoa.

- [ ] **Step 1: Đo khuôn trên dữ liệu thật (local)** — chạy `do-khuon.mjs`, ghi số mã theo dạng vào ghi chú local; chọn tập khuôn sao cho ≥ 0,90 mỗi khu. Dạng đã thấy: `<toà>-<tầng>-<trục>`, `<toà>.<tầng>.<trục>`, `<toà><tầng 2 số>.<trục>` (toà = chữ + số, tầng là 2 chữ số cuối trước dấu chấm), dạng dính liền cần đo thêm.
- [ ] **Step 2: Viết ma trận test** — mảng hằng `MA_TRAN` mã tổng hợp tiền tố `Q` (vd `Q12-07-03`, `Q1.07.03`, `QX907.15`, `QX1617.08`): mỗi khuôn ≥ 1 ca dương (assert từng trường) và ≥ 1 ca âm (thiếu tầng, thừa ký tự, tầng một chữ số); assert số ca = `MA_TRAN.length`; ca chéo: mọi mã của ma trận qua mọi `KHUON[i].re` — không mã nào khớp hai khuôn; mã rỗng/khoảng trắng → `ma-rong`.
- [ ] **Step 3: Chạy, thấy đỏ** — `node --test pipeline/lib/ma-can-s08.test.mjs` → FAIL (module chưa có).
- [ ] **Step 4: Viết `KHUON`, `tachMa`** — khớp toàn chuỗi (`^…$`), duyệt hết khuôn, >1 khớp → `nhieu-khuon`.
- [ ] **Step 5: Xanh + chiều đỏ** — PASS; bản chép bộ tách bỏ `$` của một khuôn → ca âm đỏ `/DBV-AC-2 khuôn <id> nhận mã sai/`.
- [ ] **Step 6: Commit** — `feat(pipeline): bộ tách mã căn S08 theo khuôn (DB1)`.

### Task 3: Lõi thuần — kế hoạch đúc, ứng viên toà, phường, kiểm FILL

**independent:** false (dùng `tachMa` của Task 2) · **phục vụ:** E11 (AC-11a), lõi của E3–E6, E8, E9, E13

**Files:**
- Create: `pipeline/lib/danh-ba-vat-the.mjs`
- Create: `pipeline/lib/danh-ba-vat-the.test.mjs`

**Interfaces:**
- Consumes: `tachMa` (Task 2).
- Produces:
  - `moiKhoa(tienTo: 'bld'|'stk'|'unt', now?: number, rand?: Function) → string` (cùng thuật toán `moiKhoaNguoi`).
  - `upiToa(iso: 'VN-HN'|'VN-SG', khoaToa: string) → string`.
  - `chuanHoaTenToa(s: string) → string` (bỏ dấu, khoảng, gạch; viết hoa: `pr 6` → `PR6`).
  - `keHoachDung({ dongS08: Array<{project_id, product_code, khu_id, iso}>, biDanh: Map<string /*value*/, string /*object_key*/> }) → { toa: Array<{key, moi: boolean, project_id, ma_toa, khu_id, iso}>, truc: [...], can: [...], biDanhMoi: Array<{object_key, value}>, soLyDo: Array<{project_id, ly_do, so}> }` — chỉ đúc khi chưa có bí danh; căn chỉ khi `tachMa` trả toà/tầng/trục.
  - `ungVienTuTin({ phatBieu: Array<{subject_key, value, khu_id|null, nguoi, nhom}>, toaTheoKhu: Map<khu_id, Map<tenChuanHoa, key[]>> }) → { biDanhTen: Array<{object_key, value, source}>, ungVien: Array<{khu_id, ten, so_nguoi_dang, so_nhom}> }` — khớp đúng một → bí danh; 0 hay ≥2 → ứng viên; `khu_id` null → bỏ.
  - `phuongCuaToa({ nutVung: {id, area_ids: string[]}, cap: Map<area_id, 'market'|'submarket'> }) → { area_id } | { ly_do: 'khu-nhieu-phuong' | 'khong-co-phuong' }`.
  - `kiemFill(fill: string[], chonDong?: Function) → string[] /*lỗi*/` — báo `DBV-AC-11 vật thể lên cloud: <bảng>`.

- [ ] **Step 1: Test** — ca thuần cho từng hàm (khoá đúng regex; UPI đúng khuôn; chuẩn hoá ba biến thể; kế hoạch lần hai trên bí danh lần một → 0 khoá mới; 7 mã trên lưới 3×10 → 7 căn; mã rỗng → sổ lý do; ứng viên đủ năm ca (a)(b)(c)(d)(e) của E8; phường năm ca (a)–(d) của E13); `kiemFill(FILL thật)` = `[]`, `kiemFill([...FILL,'units'])` có lỗi; nếu `registry_aliases`/`field_assertions` có trong FILL thì `chonDong` bắt buộc.
- [ ] **Step 2: Đỏ** — `node --test pipeline/lib/danh-ba-vat-the.test.mjs` → FAIL.
- [ ] **Step 3: Viết các hàm.**
- [ ] **Step 4: Xanh** — PASS.
- [ ] **Step 5: Commit** — `feat(pipeline): lõi danh bạ vật thể — kế hoạch đúc, ứng viên toà, phường (DB1)`.

### Task 4: Lệnh dựng ghi DB + ca DB thử

**independent:** false (cần Task 1, 3) · **phục vụ:** E3, E4, E5, E6, E8, E9, E10, E13

**Files:**
- Create: `pipeline/danh-ba-vat-the.mjs`
- Modify: `pipeline/scripts/danh-ba-vat-the.itest.mjs` (thêm ca DBV-AC-3…6, 8, 9, 10, 12)

**Interfaces:**
- Consumes: `taoDbThu`/`xoaDbThu` (Task 1), lõi (Task 3).
- Produces: CLI `node pipeline/danh-ba-vat-the.mjs --db <url> [--tu-dien <tệp json>] [--khu <asset_node_id,…>]`; mặc định hai khu đọc từ `asset_nodes` theo slug Ocean Park 1, Grand Park; từ chối URL có tên DB `oneinvest` (thoát 2); một giao dịch với `pg_advisory_xact_lock(hashtext('danh-ba-vat-the'))`; dòng cuối stdout `tong_ket {"khu":{…:{toa,truc,can}},"khoa_moi":n,"ti_le_tach":{…},"ly_do":{…},"ung_vien":n,"ung_vien_gop":n}` — không in mã. Từ điển: `{ "<project_id>": "<BuilderName>" }`, băm sha256 tệp vào `evidence.ban`.

- [ ] **Step 1: Test** — fixture tổng hợp nạp vào `stg_s08_inventory`, `s08_project_links`, `asset_nodes`, `areas` của DB thử (hai khu, ba dự án, hai khuôn, mã toà trùng giữa hai khu và giữa hai dự án cùng khu, một phân khu có `area_ids`); mỗi ca gọi lệnh qua `child_process` (đường lệnh thật): DBV-AC-3 bảng kỳ vọng; DBV-AC-4 hai lần, `khoa_moi=0`, tập khoá bằng; DBV-AC-5 lưới 3×10 / 7 mã; DBV-AC-6 hai lần chụp; DBV-AC-8 năm ca qua `field_assertions` thật (`block_raw`) + `collection_units.project_node_ids`; DBV-AC-9 từ điển tạm; DBV-AC-10 chạy nguyên văn câu SQL rút từ `agent/src/enrich/run.ts` (regex trên `asset_nodes WHERE node_type = 'building'`); DBV-AC-12 năm ca vùng; ca Review Focus: hai tiến trình dựng cùng lúc → không khoá trùng.
- [ ] **Step 2: Đỏ** — FAIL (lệnh chưa có).
- [ ] **Step 3: Viết lệnh.**
- [ ] **Step 4: Xanh** — `node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs` → PASS.
- [ ] **Step 5: Chiều đỏ** — mỗi ca một bản chép lệnh có lỗi đúng như `expected` của E3–E6, E8–E10, E13 (biến môi trường `DBV_LENH=<bản chép>`), thông điệp ghim khớp.
- [ ] **Step 6: Commit** — `feat(pipeline): lệnh dựng danh bạ vật thể trên DB thử (DB1)`.

### Task 5: Đo trên dữ liệu thật (chép chỉ đọc) + quét kho

**independent:** false (cần Task 4) · **phục vụ:** E7 (AC-7), E11b (AC-11)

**Files:**
- Create: `pipeline/scripts/danh-ba-vat-the-that.itest.mjs`

**Interfaces:**
- Consumes: `taoDbThu`, lệnh dựng (Task 4).

- [ ] **Step 1: Test** — đọc máy thu bằng phiên `default_transaction_read_only=on`: `stg_s08_inventory` cao tầng của dự án `s08_project_links.status='noi'` thuộc hai khu, `s08_project_links`, các dòng `asset_nodes`/`areas` liên quan; chép vào DB thử `oneinvest_dbv_that_<pid>`; chạy lệnh hai lần; assert `ti_le_tach[khu] ≥ 0.90`, số không tách = tổng sổ lý do, `khoa_moi=0` lần hai, tập (dự án, mã toà) rút độc lập ⊆ toà có bí danh, mọi dự án ≥ 1 toà, 0 căn không bí danh, đối chiếu số mã với câu đếm độc lập trên máy thu; stdout không chứa mã nào trong tập đã chép. DBV-AC-11b: tập mã + tên phân khu chỉ có từ S08 (trừ tên có trong `asset_nodes`) quét `git ls-files` → 0 khớp; đối chứng dương trên tệp tạm ngoài kho. In số, không in mã.
- [ ] **Step 2: Chạy** — `node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-that.itest.mjs` → PASS (đỏ ở ngưỡng thì quay Task 2 thêm khuôn).
- [ ] **Step 3: Commit** — `test(pipeline): đo danh bạ vật thể trên bản chép chỉ đọc (DB1)`.

### Task 6: Tài liệu

**independent:** true · **phục vụ:** Known limits Hỏi-1, ROADMAP as-built

**Files:**
- Modify: `docs/adr/0016-danh-ba-vat-the-va-nguoi.md` §3 — câu «3 dòng `asset_nodes.node_type = building` chuyển sang `buildings`» → ba dòng là phân khu, ở họ Vùng (Mạnh duyệt Hỏi-1, 07/11) — commit riêng
- Modify: `docs/ROADMAP.md` §2 as-built, §4 trạng thái
- Modify: `CONTEXT.md` nếu thêm nhãn mới («ứng viên toà», «bậc dòng danh mục») kèm slug/code/_Avoid_

- [ ] **Step 1: Sửa ba tệp** — không tên S08 nào.
- [ ] **Step 2: Kiểm** — `node --test app/eslint-plugin-onehub-ui/tests/route-slugs.test.mjs` vẫn xanh (CONTEXT đổi); `node pipeline/vocab.mjs --lint` sạch.
- [ ] **Step 3: Commit** — `docs(adr-0016): ba dòng asset_nodes building là phân khu (DB1, Hỏi-1)` và `docs(roadmap): DB1 as-built`.

## Thứ tự

Task 1 ∥ Task 2 ∥ Task 6 → Task 3 → Task 4 → Task 5. Trước Task 4: tệp `state/danh-ba-vat-the/chu-dau-tu.json` từ bảng nháp Mạnh đã duyệt.
