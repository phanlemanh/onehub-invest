# Sổ từ vựng một nguồn (PL6) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khối `enums:` của `pipeline/mappings.yaml` thành sổ từ vựng duy nhất. Từ sổ sinh hằng cho pipeline/agent/app,
khối thuật ngữ `CONTEXT.md` và bảng tra `ref_*`. Lint đỏ khi có enum viết tay ngoài sổ. Migration 043 VALIDATE bốn CHECK
của 025.

**Architecture:** Mọi logic thuần nằm ở `pipeline/lib/vocab-core.mjs`; CLI mỏng `pipeline/vocab.mjs` đọc/ghi đĩa và DB.
Tệp sinh được commit vào từng module và giữ khớp bằng `--check`. DB khớp sổ bằng `--check-db`.

**Tech Stack:** Node ESM (`node --test`), gói `yaml` (devDependency của pipeline), `pg`, TypeScript (agent, app, chạy test qua
`tsx`), PostgreSQL :5433.

**Spec:** `docs/superpowers/specs/2026-10-26-so-tu-vung-mot-nguon-design.md` · hợp đồng
`_acceptance/so-tu-vung-mot-nguon/contract.md` (đã duyệt 26/10, Hỏi-1 và Hỏi-2 theo khuyến nghị) · evals
`_acceptance/so-tu-vung-mot-nguon/evals.yaml`.

## Global Constraints

- Không sửa `collector/`, `app/src/components/ops/review-card.tsx`, `pipeline/sync-cloud.mjs`, migration đã commit.
- Migration mới đúng tên `db/migrations/043_ref_vocabulary.sql`, idempotent, áp local bằng lệnh của `.claude/rules/migrations.md`;
  không đẩy Supabase.
- Chữ hiển thị trên cổng không đổi byte nào (AC-6). Nhãn cũ lấy nguyên văn `app/src/lib/ops-labels.ts` và `FIELD_LABEL` của
  `review-card.tsx`.
- Văn bản NFC (ADR-0011 Qđ 4); code chữ thường snake_case `^[a-z][a-z0-9_]*$` hoặc mã bậc `^[A-Z][0-9]$`.
- Tệp sinh: dòng 1 đúng `// MÁY SINH từ pipeline/mappings.yaml — sửa sổ rồi chạy node pipeline/vocab.mjs --write`; khối
  `CONTEXT.md` giữa `<!-- VOCAB:BEGIN -->` và `<!-- VOCAB:END -->` (dòng đầu khối là câu «MÁY SINH …» dạng comment HTML).
- Ghi tệp luôn `\n`, kết thúc bằng một `\n`; thứ tự trục và giá trị = thứ tự trong sổ.
- Không tên nguồn thật, không PII tầng A (kho công khai).
- Mọi phép đo mới có cặp hai chiều trên cùng fixture, thông điệp đỏ ghim (MEASURE-BIRTH-CLAUSE).

## Review Focus

1. Sổ có nhãn gõ ở dạng NFD (bộ gõ Mac): người mong máy báo lỗi chứ không sinh nhãn lệch byte → `validateRegister` ném «label_vi
   không ở dạng NFC» kèm trục + code (Task 1).
2. `CONTEXT.md` mất mốc VOCAB (ai đó xoá tay): `--write` phải thoát 1 «thiếu mốc VOCAB» chứ không chèn lặng vào cuối tệp (Task 2).
3. Comment trong mã nhắc danh sách (`// sale | rent_lt`): lint không đỏ, vì comment không phải định nghĩa (Task 3).
4. Template literal có `${}` quanh code (`` `${kind}` ``) và chuỗi nối `'a' + '|' + 'b'`: lint đếm theo literal, không đỏ oan
   vì phép nối (Task 3).
5. `--check-db` khi DB không kết nối được: thoát 2 «không kết nối được DB» — không bao giờ thoát 0 (Task 5).

---

### Task 1: Sổ + bộ đọc/kiểm khuôn

phục vụ E1 · independent: false (mọi task sau dùng nó)

**Files:**
- Modify: `pipeline/mappings.yaml` (khối `enums:` dòng 212–230; thêm khối `enums_lint_allow:` ngay sau)
- Modify: `pipeline/package.json` (devDependencies `yaml@^2`)
- Create: `pipeline/lib/vocab-core.mjs`
- Test: `pipeline/scripts/vocab.test.mjs`

**Interfaces:**
- Produces:
  - `loadRegister(yamlText: string): Register`;
  - `validateRegister(reg: Register): void` — ném `VocabError` (thuộc tính `axis`, `code`);
  - `readMappings(root: string, mappingsPath?: string): Register` — đọc và kiểm khuôn;
  - `Register = { axes: Axis[], allow: Allow[], canonicalFields: string[] }`;
  - `Axis = { name, term_vi, dd_field: string|null, columns: string[], nullable: boolean, lint_keys: boolean, values: Value[] }`;
  - `Value = { code, label_vi, dd_lookup?: string, local: boolean, rationale?: string, checked_on?: string }`;
  - `Allow = { path: string, axis: string, reason: string }`.
  - Trục local cả khối khai `local: true` + `rationale` + `checked_on` ở cấp trục; giá trị kế thừa.
  - `source: values_from` giữ nguyên, bộ đọc bỏ qua.

- [ ] **Step 1: Viết test `VB-AC-1 sổ thật` và `VB-AC-1 sai khuôn`** (theo `expected` của E1).
  - Ma trận trục·code·nhãn 39 dòng viết sẵn trong test:
    - `kind`: sale «Bán» · rent_lt «Cho thuê».
    - `property_type`: apartment «Căn hộ» · house «Nhà riêng» · land «Đất» · room «Phòng» · commercial «Mặt bằng» ·
      unknown «Chưa rõ».
    - `confidence`: high «cao» · medium «trung bình» · low «thấp».
    - `price_tier`: P0 «giá giao dịch (P0)» · P1 «giá nội bộ (P1)» · P2 «giá công khai (P2)».
    - `enrich_field`: property_type «Loại hình» · bedrooms «Phòng ngủ» · bathrooms «WC» · street_raw «Đường» ·
      block_raw «Toà».
    - `listing_intent`: offer «Tin rao» · wanted «Tin tìm mua, tìm thuê» · not_listing «Không phải tin rao» ·
      unknown «Chưa rõ».
    - `offer_status`: active «Đang chào» · active_under_contract «Đã cọc» · closed «Đã bán» · withdrawn «Đã gỡ» ·
      unknown «Chưa rõ».
    - `data_level`: B0 «Có lời khai» · B1 «Đọc được» · B2 «Gắn căn» · B3 «Đã đo» · B4 «Xác minh» · B5 «Sống».
    - `capability_level`: N0 «Thu được» · N1 «Đọc được» · N2 «Đo được» · N3 «Tự động ở ngưỡng» · N4 «Tự duy trì».
  - Sáu đột biến (a)–(f) của E1, cộng (g) nhãn NFD → ném, thông điệp chứa trục và code.
  - Đường tệp tính từ `import.meta.url`.
- [ ] **Step 2:** `cd pipeline && node --test scripts/vocab.test.mjs` → FAIL (module chưa có).
- [ ] **Step 3: Viết lại khối `enums:` theo ma trận trên.**
  - `term_vi` từng trục: Loại tin · Loại hình · Độ tin trích xuất · Bậc giá · Trường làm giàu · Ý định tin · Trạng thái chào ·
    Bậc dữ liệu · Bậc năng lực.
  - `dd_field`:
    - PropertyType · PropertySubType · null(local) · null(local) · null — `dd_lookup` của từng trường là tên field RESO:
      PropertySubType, BedroomsTotal, BathroomsTotalInteger, StreetName, BuildingName;
    - null(local, ADR-0013 §9 ListingIntent) · StandardStatus · null(local DataLevel) · null(local CapabilityLevel).
  - `dd_lookup`:
    - kind: Residential / ResidentialLease;
    - property_type: Condominium, Townhouse, UnimprovedLand, room local, "CommercialSale / CommercialLease (PropertyType)",
      unknown local;
    - offer_status: Active, ActiveUnderContract, Closed, Withdrawn, unknown local.
  - `columns`:
    - kind, confidence, price_tier → `sale_offers.<cột>`;
    - property_type → `[sale_offers.property_type, properties.property_type]` (Hỏi-2);
    - enrich_field → `[enrichment_proposals.field]` với `lint_keys: false`;
    - bốn trục mới → `[]`.
  - `enums_lint_allow:` để rỗng ở task này.
- [ ] **Step 4:** Cài `yaml`, viết `vocab-core.mjs` phần đọc/kiểm.
  - Code khớp `^[a-z][a-z0-9_]*$|^[A-Z][0-9]$`.
  - `label_vi === label_vi.normalize("NFC")`.
  - Một cột chỉ thuộc một trục.
- [ ] **Step 5:** Test xanh, chạy `cd pipeline && npm test` → xanh.
- [ ] **Step 6:** Commit `feat(vocab): sổ từ vựng 9 trục trong mappings.yaml + bộ đọc`.

### Task 2: Bộ sinh, `--write`, `--check`

phục vụ E2, E3, E3b · independent: false

**Files:**
- Create: `pipeline/vocab.mjs` (CLI) — các cờ:
  - `--root <dir>` (mặc định: gốc kho suy từ vị trí tệp), `--mappings <tệp>`;
  - `--write`, `--check`, `--lint`, `--check-db`, `--check-field-targets [tệp]`, `--emit-seed`;
  - mã thoát: 0 khớp · 1 lệch/đỏ · 2 dùng sai / không chạy được.
- Modify: `pipeline/lib/vocab-core.mjs`
- Create (sinh): `pipeline/lib/vocab.generated.mjs`, `agent/src/vocab.generated.ts`, `app/src/lib/vocab.generated.ts`
- Modify: `CONTEXT.md` — thêm mục `## Từ vựng dữ liệu (máy sinh)` với hai mốc, đặt trước `## Dữ liệu & nguồn`.
- Test: `pipeline/scripts/vocab.test.mjs`

**Interfaces:**
- Consumes: `readMappings`.
- Produces:
  - `renderTargets(reg): { path: string, content: string }[]` (bốn đích; đích CONTEXT là nội dung khối);
  - `spliceContext(text: string, block: string): string` — ném «thiếu mốc VOCAB»;
  - `checkTargets(root, reg): string[]` (đường lệch).
- Mỗi tệp sinh export:
  - `VOCAB: Record<axis, readonly string[]>`;
  - `PROPERTY_TYPE`, `KIND`, … (`Object.freeze({apartment:"apartment",…})`, một hằng mỗi trục, tên = trục viết hoa);
  - `CANONICAL_FIELDS: readonly string[]`;
  - `promptEnum(axis): string` (nối `|`).
- Tệp TS thêm kiểu `PropertyType = (typeof VOCAB.property_type)[number]` cho từng trục.
- Tệp app thêm `LABELS_VI: Record<axis, Record<code, string>>`.

- [ ] **Step 1:** Viết test `VB-AC-2` và `VB-AC-3` theo `expected` của E2/E3 (thư mục tạm có `mappings.yaml` + `CONTEXT.md`
  thật). Thêm ca Review Focus 2: `CONTEXT.md` tạm bỏ mốc → `--write` thoát 1, stderr chứa «thiếu mốc VOCAB», tệp không đổi.
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Cài `renderTargets` + `spliceContext` + CLI `--write`/`--check`.
  - Khối CONTEXT: mỗi trục một mục `**<term_vi>**: …` kèm `- Code: \`<trục>\` · RESO: <dd_field hoặc «local»>`, và
    `- Giá trị: \`code\` «nhãn» · …` (một dòng).
  - `--check` in dòng cuối `vocab --check: 4/4 đích khớp sổ`.
- [ ] **Step 4:** Thêm hai mốc rỗng vào `CONTEXT.md`, chạy `node pipeline/vocab.mjs --write`, rồi `--check` → 0.
- [ ] **Step 5:** Test xanh, `cd pipeline && npm test` xanh.
- [ ] **Step 6:** Commit `feat(vocab): bộ sinh hằng pipeline/agent/app + khối CONTEXT.md, --check`.

### Task 3: Lint enum viết tay

phục vụ E4 · independent: false

**Files:**
- Modify: `pipeline/lib/vocab-core.mjs`, `pipeline/vocab.mjs`
- Test: `pipeline/scripts/vocab-lint.test.mjs`

**Interfaces:**
- Produces:
  - `scanText(text: string, path: string, reg: Register): Hit[]` với `Hit = { path, line, axis, codes: string[] }`;
  - `lintTree(root, reg): { hits: Hit[], allowed: Hit[], allowBad: Allow[], allowStale: Allow[], collectorCount: number }`;
  - CLI `--lint` in mỗi hit `<path>:<line> · <axis> · <code,code>` và dòng cuối
    `vocab --lint: <n> chỗ viết tay ngoài sổ · ngoại lệ <k>`.
- Bộ quét (thuật toán):
  - Duyệt ký tự, bỏ comment `//` `/* */` `--`.
  - Gom literal `'…'` `"…"` `` `…` `` (đoạn tĩnh) theo id của cặp ngoặc trong cùng đang mở; ngoài mọi ngoặc thì theo dòng.
  - Literal chứa `|` tách thành nhiều code.
  - Khoá object chưa nháy chỉ tính khi object có ≥2 khoá là code và mọi giá trị là literal chuỗi; bỏ hẳn với trục
    `lint_keys: false`.
  - Nhóm có ≥2 code khác nhau của cùng trục → Hit tại dòng của code đầu.
- Vùng quét: `pipeline/`, `agent/src/`, `app/src/`, `data-api/src/`, `scripts/`; đuôi `.mjs .js .ts .tsx .sql`.
- Bỏ qua:
  - `node_modules`, `*.generated.*`, `*.test.*`, `*.itest.*`, thư mục `tests/`, `__fixtures__`;
  - `db/migrations/`, `collector/` (chỉ đếm);
  - `scripts/pre-merge-check.sh`, `scripts/product-map.mjs`, `scripts/check-lo-trinh.sh`.

- [ ] **Step 1:** Viết test theo `expected` của E4: sáu dạng, một code, vùng không quét, ngoại lệ, trùng chữ. Thêm ca Review
  Focus 3 (comment) và 4 (template literal `${}`, chuỗi nối `'a' + '|' + 'b'`) → 0 hit.
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Cài bộ quét, `lintTree`, CLI `--lint`.
- [ ] **Step 4:** Test xanh. Chạy `node pipeline/vocab.mjs --lint` trên cây thật, ghi lại danh sách hit cho Task 4 (lúc này đỏ là
  đúng).
- [ ] **Step 5:** Commit `feat(vocab): lint enum viết tay ngoài sổ`.

### Task 4: Chuyển các chỗ viết tay sang hằng sinh

phục vụ E5, E5b, E6, E6b–E6e · independent: false

**Files:**
- Modify: `pipeline/dq-enum-vocab.mjs` (`VOCAB` → import, các trục có `columns` trên `sale_offers`)
- Modify: `pipeline/transform-chotot.mjs:47` (`PT` dùng `PROPERTY_TYPE.*`)
- Modify: `agent/src/enrich/route.ts`
  - `EnrichField` = kiểu sinh, `ENRICH_FIELDS = VOCAB.enrich_field`;
  - `PROPERTY_TYPES = new Set(VOCAB.property_type.filter(c => c !== PROPERTY_TYPE.unknown))`, giữ comment «unknown coi như
    trống».
- Modify: `agent/src/agents/enrich-text.ts` (dòng property_type trong prompt → `${promptEnum("property_type")}`, byte giữ nguyên)
- Modify: `agent/src/agents/context-resolver.ts:68-73` (`TYPE_RULES` dùng `PROPERTY_TYPE.*`)
- Modify: `app/src/lib/ops-labels.ts`
  - `propertyTypeLabel = nhan(LABELS_VI.property_type)`, tương tự kind / confidence / price_tier;
  - comment JSDoc giữ.
- Modify: `pipeline/mappings.yaml` `enums_lint_allow:` — đúng tập ghim ở AC-5, mỗi mục `path`, `axis`, `reason`:
  - `review-card.tsx`, `bench-gate.mjs`, `bench-extraction.mjs`;
  - `500_asset_stats.sql`, `resolve-properties.mjs` (confidence + property_type), `agent/src/enrich/run.ts`;
  - `compare-types.ts`.
- Test: `pipeline/scripts/vocab-lint.test.mjs` (ca `VL-AC-5 ma trận kiểm kê`)
- Test: `app/tests/vocab-labels.test.tsx` (glob app là `tests/*.test.tsx` — evals E6 ghi `.test.ts`; sửa đường ở evals,
  ghi dòng sổ `fix`)
- Test: `agent/tests/enrich-route.test.ts` (thêm ca `unknown` bị bỏ, prompt giữ byte)

**Interfaces:**
- Consumes: tệp sinh của Task 2, `scanText` của Task 3.

- [ ] **Step 1:** Viết ba test.
  - `VL-AC-5 ma trận kiểm kê`: sáu tệp import tệp sinh và `scanText` cho 0 hit; tập `allow` bằng tập 8 mục ghim; đối chứng
    bản trước vòng của `dq-enum-vocab.mjs` qua `git show <merge-base>:…` cho ≥1 hit trục kind.
  - Nhãn 14 dòng giữ byte.
  - `route` bỏ `unknown` + prompt chứa đúng `"property_type": "apartment|house|land|room|commercial|unknown"`.
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Sửa các tệp trên.
  - Hit thật nào ngoài tập ghim của AC-5 → chuyển sang hằng.
  - Không chuyển được thì DỪNG, ghi dòng sổ `fix` và báo: tập ngoại lệ là phạm vi đã duyệt, thêm mục là lệch hợp đồng.
- [ ] **Step 4:** Chạy đủ suite:
  - `node pipeline/vocab.mjs --lint` → 0;
  - `node pipeline/vocab.mjs --check` → 0;
  - `cd pipeline && npm test`, `cd agent && npm test && npx tsc --noEmit`, `cd app && npx tsc --noEmit && npm run lint`,
    `cd app && npm test`, `cd app && npm run test:lint-rules` → xanh.
- [ ] **Step 5:** Commit `refactor(vocab): định nghĩa enum đọc từ sổ (pipeline, agent, app)`.

### Task 5: Migration 043 + `--emit-seed` + `--check-db`

phục vụ E7, E8, E8b · independent: false

**Files:**
- Modify: `pipeline/lib/vocab-core.mjs`, `pipeline/vocab.mjs`
- Create: `db/migrations/043_ref_vocabulary.sql`
- Test: `pipeline/scripts/vocab-db.itest.mjs` (cần DB :5433; không thuộc glob `npm test`)

**Interfaces:**
- Produces:
  - `emitSeed(reg): string` — `INSERT … ON CONFLICT (lookup_name, lookup_value) DO UPDATE` cho `ref_lookup`, `ref_field_lookup`;
  - `checkDb(client, reg): Promise<{ axis, value?, column?, msg }[]>`;
  - CLI `--check-db`:
    - dòng cuối `vocab --check-db: <n> cột · <m> lookup khớp sổ`;
    - DB không kết nối được → thoát 2 «không kết nối được DB».
- Migration 043, thứ tự:
  1. Header theo `.claude/rules/migrations.md` (PL6, nguồn: design doc; không PII).
  2. `CREATE TABLE IF NOT EXISTS ref_lookup(lookup_name text, lookup_value text, standard_lookup_value text, label_vi text NOT NULL, is_local boolean NOT NULL, sort_order int NOT NULL, PRIMARY KEY(lookup_name, lookup_value))`.
  3. `ref_field_lookup(table_name text, column_name text, lookup_name text NOT NULL, PRIMARY KEY(table_name, column_name))`.
  4. Seed dán nguyên văn `node pipeline/vocab.mjs --emit-seed`.
  5. `ALTER TABLE sale_offers VALIDATE CONSTRAINT` ×4.
  6. Khối `DO` thêm `properties_property_type_chk CHECK (property_type IS NULL OR property_type IN (<6 giá trị>)) NOT VALID`
     nếu chưa có, rồi `VALIDATE`.
- `checkDb`:
  - đọc `ref_lookup` / `ref_field_lookup`;
  - với mỗi cột trong `columns` tìm CHECK có `pg_get_constraintdef` nhắc cột đó, rút literal `'x'::text` và so tập với trục;
  - thiếu → msg chứa «cần migration mới»; không có CHECK → «thiếu CHECK».

- [ ] **Step 1:** Viết `vocab-db.itest.mjs` theo `expected` của E7/E8.
  - Một client, `BEGIN … ROLLBACK`; dựng tiền đề trước khi áp; ca đối chứng dòng `khong_co`.
  - Ca Review Focus 5: `checkDb` với chuỗi kết nối cổng chết → CLI thoát 2.
- [ ] **Step 2:** Chạy `cd pipeline && node --test scripts/vocab-db.itest.mjs` → FAIL.
- [ ] **Step 3:** Cài `emitSeed`, viết migration, cài `checkDb` + CLI.
- [ ] **Step 4:** Itest xanh.
  - Áp 043 vào DB local: `docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 < db/migrations/043_ref_vocabulary.sql`.
  - Áp lần hai → không lỗi.
  - `node pipeline/vocab.mjs --check-db` → 0.
- [ ] **Step 5:** Commit `feat(db): 043 ref_lookup/ref_field_lookup + VALIDATE CHECK 025 + CHECK properties.property_type`.

### Task 6: Khoá tên trường FIELD_TARGET (G3)

phục vụ E9 · independent: false

**Files:**
- Modify: `pipeline/lib/vocab-core.mjs`, `pipeline/vocab.mjs`
- Test: `pipeline/scripts/vocab.test.mjs` (ca `VB-AC-9`)

**Interfaces:**
- Produces: `checkFieldTargets(yamlText: string, reg): { ok: boolean, errors: string[], recognized: number }`.
- Khuôn đọc: khoá cấp một khớp `^S0\d$`; dưới đó `fields:` là mảng mục có `canonical: <tên>`.
  - Khoá cấp một khác, hoặc 0 mục `canonical` → lỗi «không nhận khuôn».
  - Tên ∉ `reg.canonicalFields` (khoá `canonical.fields` của `mappings.yaml`) → lỗi «<S0x>: trường <tên> không có trong
    mappings.yaml».
- CLI:
  - mặc định đọc `collector/docs/field-targets.yaml`;
  - vắng → thoát 0 «chưa có tệp»;
  - không ghi tệp nào.

- [ ] **Step 1:** Viết ca (a)–(e) theo `expected` của E9. (d) băm `collector/` trước/sau.
- [ ] **Step 2:** FAIL → cài → xanh.
- [ ] **Step 3:** Commit `feat(vocab): --check-field-targets khoá tên trường G3 theo mappings.yaml`.

### Task 7: Tài liệu trạng thái + chạy lại đủ đo

phục vụ (không eval riêng — đóng vòng) · independent: false

**Files:**
- Modify: `docs/ROADMAP.md` §2 as-built (một dòng PL6) và §4 trạng thái.
- Modify: `pipeline/CLAUDE.md` bảng Key Scripts (một dòng `vocab.mjs`).

- [ ] **Step 1:** Cập nhật hai tệp.
- [ ] **Step 2:** Chạy toàn bộ lệnh của `evals.yaml`, đúng các `config:` ref; mọi lệnh thoát 0.
- [ ] **Step 3:** Commit `docs(vocab): ROADMAP + pipeline/CLAUDE.md cho PL6`.
- [ ] **Step 4:** Đặt contract `status: implemented` (vòng S4 chấm).
