# DA2 truong-du-an-tren-tin — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native — phiên thợ trong đợt). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `field_assertions` nhận phát biểu `project_node_id`, `subzone_node_id`, `area_id` ở resource Property (migration 096), sổ từ vựng khai đủ.

**Architecture:** Một migration idempotent chạy sau 095: thay CHECK danh sách trường, thay thân hàm trigger 082 (giữ tên trigger), nạp hai mã `ref_lookup` và đổi nhãn `area_id`. `mappings.yaml` khai trục và `canonical.fields`; `vocab.mjs --write` sinh lại tệp sinh. Phép đo là một tệp test trên DB thử dựng từ `db/migrations` của nhánh.

**Tech Stack:** PostgreSQL 16 + PostGIS (:5433), Node `node:test`, `pg`, `yaml` của pipeline.

**Spec:** `docs/superpowers/specs/2026-11-12-truong-du-an-tren-tin-design.md` · hợp đồng `_acceptance/truong-du-an-tren-tin/contract.md` (approved, Mạnh 2026-11-12) · `evals.yaml`.

## Global Constraints

- Chỉ DB thử `oneinvest_dbv_tdt_<pid>` (qua `pipeline/scripts/db-thu-dbv.mjs`) và DB suite của `db-thu.sh`; KHÔNG áp 096 lên `oneinvest` chung, máy thu hay cloud.
- 096 idempotent: chạy hai lần không lỗi, dấu lược đồ không đổi (AC-4). Không sửa 082, 095.
- CHECK của 096 = đúng danh sách của 095 (đọc từ `db/migrations/095_tang_tren_tin.sql` dòng 10–…) + `'project_node_id', 'subzone_node_id'`.
- Thông điệp lỗi giữ nguyên chữ của 082 cho luật cũ («resource không khớp khoá», «trường % không thuộc resource %», «registry_inherit chỉ đi với lớp inferred», «area_id phải là phường/xã (submarket)»); luật mới gọi tên trường `project_node_id` / `subzone_node_id` và giá trị.
- Nhãn `area_id` = «Phường» (Hỏi-1, Mạnh duyệt 12/11).
- `resolve_offer_fields` không đổi.
- Comment domain tiếng Việt; tên code tiếng Anh; nguồn chỉ bằng mã `S0x`.

## Review Focus

1. Giá trị số hợp lệ nhưng lớn quá `bigint` (vd `99999999999999999999`) → phải bị từ chối có tên trường, không lỗi ép kiểu chung chung. Ca riêng `TDT-RF-1` trong cùng tệp (ngoài ma trận 17 ca của AC-2, để số ca của E2 giữ đúng hợp đồng).
2. `subzone_node_id` trỏ nút `building` thật sự là toà (không phải phân khu Grand Park) vẫn lọt — chấp nhận có tên tới DA1; ghi ở Known limits đề xuất, không test.
3. Thứ tự trigger: `field_assertions_gia_tri_095` và `_vat_the_082` cùng BEFORE INSERT — ca `floor_raw` ở Property vẫn ghi được (TDT-AC-3 phủ).
4. Áp 096 lần hai sau khi đã có dòng phát biểu ba trường → không lỗi (TDT-AC-4 chạy lần hai SAU AC-1 trên cùng DB).
5. `vocab --check-db` lệch nhãn `area_id` nếu 096 quên UPDATE nhãn cũ → TDT-AC-5 chạy `--check-db` trên DB thử bắt.

---

### Task 1: Migration 096 + phép đo DB (AC-1…AC-4)

**Files:**
- Create: `db/migrations/096_truong_du_an_tren_tin.sql`
- Create: `pipeline/scripts/truong-du-an-tren-tin.test.mjs`

**Evals phục vụ:** E1, E2, E3, E4. **independent:** không (Task 2 dùng cùng tệp test).

**Interfaces:**
- Consumes: `taoDbThu(ten, {hetSo?, thay?}) → url`, `apTep(ten, tep)`, `xoaDbThu(ten)` từ `pipeline/scripts/db-thu-dbv.mjs`.
- Produces: trong tệp test, helper `datNut(c) → {project, subzone, building, market, submarket}` (id nút `asset_nodes` và id `areas` do test chèn); `ban096Dot(bien: (sql) => sql) → đường tệp tạm` (chép 096 rồi biến đổi chuỗi, cho chiều đỏ qua opts `thay`).

- [ ] **Step 1: Viết test đỏ** — `describe("TDT")` một DB thử chung (`oneinvest_dbv_tdt_${process.pid}`, `before` tạo, `after` xoá):
  - `TDT-AC-1`: 4 giá trị × 9 cặp lớp/phương pháp (danh sách nguyên văn ở AC-1) = 36 INSERT Property khoá `S03:tdt-<i>`; đọc lại tập `(field, value, evidence_tier, method)` `deepEqual` tập đã chèn, đếm = 36. Chiều đỏ (DB thử thứ hai dựng với `ban096Dot` bỏ `'project_node_id'` khỏi CHECK): INSERT `project_node_id` phải ném; nếu ghi được thì ca đỏ với thông điệp «TDT-AC-1 không ghi được project_node_id» (phép đo không phân biệt).
  - `TDT-AC-2`: ma trận 17 ca của AC-2 (đếm = 17), mỗi ca `assert.rejects` với regex ghim (bảng ở evals E2); sau ma trận `count(*)` ba trường không đổi. Hai chiều đỏ: bỏ kiểm `node_type` của `project_node_id` → ca «id subzone» phải được nhận, ghim «TDT-AC-2 nhận project_node_id trỏ nút subzone»; bỏ kiểm chữ số của `subzone_node_id` → ghim «TDT-AC-2 nhận subzone_node_id không phải số».
  - `TDT-RF-1`: `project_node_id='99999999999999999999'` rejects `/project_node_id/` (không phải lỗi ép kiểu `bigint out of range`).
  - `TDT-AC-3`: Building `area_id` (submarket, inferred·registry_inherit) và `builder_name` (fact·hitl) ghi được; Property `floor_raw '12'`, `floor_band 'upper'` ghi được; Building khoá `S03:x` rejects `/resource không khớp khoá/`; registry_inherit + fact rejects `/registry_inherit chỉ đi với lớp inferred/`. Chiều đỏ: bỏ `'floor_raw'` khỏi CHECK → ghim «TDT-AC-3 mất trường tầng của 095».
  - `TDT-AC-4`: `dau(c)` = `pg_get_constraintdef` của `field_assertions_field_chk` + `pg_get_functiondef('field_assertions_vat_the_082'::regproc)` + dòng `ref_lookup` `lookup_name='assertion_field'` sắp theo `lookup_value`; `apTep` 096 lần hai (sau AC-1) → không ném, `dau` trước = sau. Đối chứng dương: DB dựng `hetSo: 95` có `dau` khác.
- [ ] **Step 2: Chạy, thấy đỏ** — `cd pipeline && node --test scripts/truong-du-an-tren-tin.test.mjs` → đỏ vì thiếu 096 (`apTep` không thấy tệp / CHECK từ chối `project_node_id`).
- [ ] **Step 3: Viết 096** theo khuôn `/new-migration` (header, idempotent):
  1. `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT field_assertions_field_chk CHECK (field IN (<095> , 'project_node_id', 'subzone_node_id'))`.
  2. `CREATE OR REPLACE FUNCTION field_assertions_vat_the_082()`: giữ luật khoá↔resource; luật resource↔trường: `builder_name` ⇔ Building; `area_id` ⇒ resource IN (Building, Property); `project_node_id`, `subzone_node_id` ⇒ Property; giữ registry_inherit⇔inferred và area_id submarket; thêm miền: `value ~ '^[1-9][0-9]{0,18}$'` rồi `EXISTS asset_nodes WHERE id = value::bigint AND node_type = 'project'` (subzone: `IN ('subzone','building')`); lỗi `'field_assertions: project_node_id phải là id nút dự án, nhận «%»'` (tương tự cho subzone «nút phân khu»). Không `DROP/CREATE TRIGGER` lại (tên giữ nguyên, hàm thay tại chỗ).
  3. `INSERT INTO ref_lookup … ('assertion_field','project_node_id','SubdivisionName','Dự án',true,<sort 095+1>), ('assertion_field','subzone_node_id',NULL,'Phân khu',true,<+2>) ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET …`; `UPDATE ref_lookup SET label_vi='Phường' WHERE lookup_name='assertion_field' AND lookup_value='area_id'`. Giá trị phải khớp `vocab.mjs --emit-seed` sau Task 2 (dán từ đó nếu lệch).
- [ ] **Step 4: Chạy lại, xanh** — cùng lệnh; cả 4 ca xanh, ba chiều đỏ ghim đúng tên.
- [ ] **Step 5: Đăng ký sổ migration** — cập nhật dòng 096 ở `/Users/manhphan/dev/onehub-coord/SO-MIGRATION.md` (đã cấp; chỉ đổi trạng thái «đã viết») nếu sổ có cột trạng thái; không có thì bỏ.
- [ ] **Step 6: Commit** — `feat(db): 096 trường dự án, phân khu, phường trên tin (DA2)`.

### Task 2: Sổ từ vựng + mappings (AC-5)

**Files:**
- Modify: `pipeline/mappings.yaml` (trục `assertion_field` dòng ~376–402; `canonical.fields` cạnh `floor_band` ~624)
- Modify (sinh): ba tệp `vocab.generated` mà `vocab.mjs --write` đổi
- Modify: `pipeline/scripts/truong-du-an-tren-tin.test.mjs` (thêm TDT-AC-5)
- Modify: `CONTEXT.md` chỉ khi `vocab --check` đòi (nhãn «Phường», «Phân khu» đã có thuật ngữ)

**Evals phục vụ:** E5, E6b. **independent:** không (dùng DB thử của Task 1).

**Interfaces:**
- Consumes: DB thử và `url` của `describe("TDT")` Task 1.
- Produces: không.

- [ ] **Step 1: Viết TDT-AC-5 đỏ** — đọc `mappings.yaml` bằng `yaml` của pipeline: trục có `{code: project_node_id, dd_lookup: SubdivisionName}`, `subzone_node_id` không `dd_lookup`, `area_id.label_vi === "Phường"`; `canonical.fields.subzone_node_id.dd === null`, `rationale` chứa sáu dấu `["DD 2.1", "VN", "096", "trigger", "mappings", "dq-enum-vocab"]` + `"DA9"`, có `checked_on`, `existsSync("pipeline/dq-enum-vocab.mjs")`; `canonical.fields.project_node_id.dd === "SubdivisionName"`; `canonical.fields.area_id` có mặt. `spawnSync node vocab.mjs --check` thoát 0; `--check-db` với `DATABASE_URL=url` thoát 0. Chiều đỏ: trong DB thử, `BEGIN; DELETE ref_lookup … subzone_node_id; COMMIT` trên DB thử phụ (dựng riêng, không đụng DB chung của các ca khác) → `--check-db` thoát 1; không thì ghim «TDT-AC-5 check-db không thấy thiếu subzone_node_id».
- [ ] **Step 2: Chạy, thấy đỏ** (mappings chưa có mã).
- [ ] **Step 3: Sửa mappings** — trục: thêm `project_node_id` («Dự án», `dd_lookup: SubdivisionName`, comment `# DA2 (096): resource Property, id nút asset_nodes project`), `subzone_node_id` («Phân khu», comment cho nút `subzone`/`building` Grand Park tới DA1), `area_id` nhãn «Phường» + comment Building hoặc Property; nối rationale trục «+ ba trường của tin (DA2, migration 096: project_node_id → SubdivisionName tra DD 2.1 12/11, subzone_node_id extension, area_id mở cho Property)», `checked_on: "2026-11-12"`. `canonical.fields`: `project_node_id` (`dd: SubdivisionName`), `subzone_node_id` (`dd: null`, rationale đủ sáu điều kiện ADR-0011 Qđ 3: (1) tra DD 2.1 12/11 — ComplexName chỉ ở Building; (2) lý do VN: phân khu là nhánh bán riêng của đại dự án; (3) migration 096; (4) trigger miền nút subzone/building; (5) khai ở đây; (6) DQ miền giá trị `pipeline/dq-enum-vocab.mjs`, độ phủ DA9 — thoả một phần tới khi DA9 gộp; `checked_on`), `area_id` (local, DD không có cấp phường) — theo đúng hình dạng khối `floor_band`.
- [ ] **Step 4: Sinh lại** — `node pipeline/vocab.mjs --write`; `node pipeline/vocab.mjs --emit-seed | grep -A2 project_node_id` khớp dòng INSERT của 096 (lệch → sửa 096, chạy lại Task 1 Step 4).
- [ ] **Step 5: Chạy, xanh** — `cd pipeline && node --test scripts/truong-du-an-tren-tin.test.mjs` (5 ca).
- [ ] **Step 6: Commit** — `feat(pipeline): khai trường dự án, phân khu, phường trên tin trong sổ từ vựng (DA2)`.

### Task 3: Suite hồi quy + tài liệu (AC-6)

**Files:**
- Modify: `docs/ROADMAP.md` (§2 as-built một dòng, §4 trạng thái DA2)
- Không tệp mã mới.

**Evals phục vụ:** E6, E6b, E6c. **independent:** không.

- [ ] **Step 1:** `cd app && npx next typegen` (rồi `git checkout app/next-env.d.ts` nếu đổi) — môi trường worktree.
- [ ] **Step 2:** `node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs` → exit 0, không sửa ca.
- [ ] **Step 3:** `cd app && npx tsc --noEmit && npm run lint` → exit 0.
- [ ] **Step 4:** Ghi ROADMAP; commit `docs: DA2 as-built`. Cây sạch (`git status --porcelain` rỗng) trước khi xin lượt S4 — `cd pipeline && npm test` và `cd app && npm test` chạy trong S4 dưới khoá s4, không chạy ở đây.
