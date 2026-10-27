# wanted → inquiry «Yêu cầu» — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi giá trị `wanted` của trục `listing_intent` thành `inquiry` «Yêu cầu» ở sổ, hằng, DB (migration 050) và cloud
(tệp catchup), ghi mô hình Listing ↔ Yêu cầu vào CONTEXT.md, và sửa ba nhãn «Tin» chỉ bài ở `/ops/collections`.

**Architecture:** Sổ `pipeline/mappings.yaml` là nguồn duy nhất; `vocab.mjs --write` sinh hằng và khối VOCAB. DB đổi
bằng một `UPDATE` idempotent. Mọi phép đo nằm ở test sẵn có của sổ, một test app mới, và ba răng của hồ sơ
(`_acceptance/wanted-thanh-inquiry/rang/`).

**Tech Stack:** Node `node:test`, `pg`, `yaml`; app Next.js 16 + `tsx` + `react-dom/server`.

**Spec:** `docs/superpowers/specs/2026-10-27-wanted-thanh-inquiry-design.md` · hợp đồng
`_acceptance/wanted-thanh-inquiry/contract.md` (AC-1…AC-7, Mạnh duyệt 27/10) · `evals.yaml` (E1…E7b).

## Global Constraints

- Nhãn: `offer` «Tin rao» · `inquiry` «Yêu cầu» · `not_listing` «Không phải tin rao» · `unknown` «Chưa rõ»; `term_vi` «Ý định tin».
- Migration số **050**, tên `db/migrations/050_wanted_thanh_inquiry.sql`; không sửa 043.
- KHÔNG chạy migration chưa gộp trên DB `oneinvest` :5433. DB thử tên `oneinvest_u1_inquiry_<pid>`, xoá trong `finally`.
- Không đụng `stg_*`, DATA-CONTRACT, collector.
- Bản chụp markup trước vòng chụp ở sha main **a4a47d15**.
- Ba nhãn Đ5: «S03 · Cộng đồng» (= `sourceLabel("S03", roles)`), «Bài S03 · Cộng đồng hôm nay», «n bài bị cổng chặn».
- Commit theo Conventional Commits, kết bằng dòng Co-Authored-By.

## Review Focus

1. `vocab-db.itest.mjs` có ba ca so DB với sổ sau khi chỉ áp 043 (VD-AC-7, VD-AC-8, emitSeed): sau vòng, 043 một mình
   ≠ sổ, nên các ca ấy phải áp 043 rồi 050 (Task 2 Step 1).
2. Test ném giữa chừng thì DB thử phải biến mất (E3 `--ep-loi`).
3. Test app mới chạy trong glob `npm test` của CI (clone nông, không DB): `tu-ngu-collections.test.tsx` không được gọi git
   hay DB; việc dựng lại ở sha nằm ở răng `fixture-goc.mjs`, không ở test.
4. `vocab --lint` quét chuỗi prompt: fixture `offer|wanted` trong `vocab-lint.test.mjs` phải đổi thành `offer|inquiry`, kẻo
   ca VL-AC-4 đỏ vì code ngoài sổ.
5. `LO-TRINH.html` / `PRODUCT-MAP.md` phải sinh lại ở commit cuối (CI `product-map --check`).

---

### Task 1: Sổ từ vựng + tệp sinh (AC-1, AC-2) — independent: false

**Files:**
- Modify: `pipeline/mappings.yaml` (khối `enums.listing_intent`)
- Regenerate: `pipeline/lib/vocab.generated.mjs`, `agent/src/vocab.generated.ts`, `app/src/lib/vocab.generated.ts`, khối VOCAB của `CONTEXT.md`
- Test: `pipeline/scripts/vocab.test.mjs`, `pipeline/scripts/vocab-lint.test.mjs`

**Interfaces:** Produces `LISTING_INTENT.inquiry === "inquiry"`; nhãn app `LABELS_VI.listing_intent.inquiry === "Yêu cầu"`.

- [ ] **Step 1:** Trong `vocab.test.mjs`, ma trận `NHAN` đổi dòng `["listing_intent","wanted","Tin tìm mua, tìm thuê"]` thành `["listing_intent","inquiry","Yêu cầu"]`. Thêm vào ca 'VB-AC-1 sổ thật': với `const li = reg.axes.find((a) => a.name === "listing_intent")`: `assert.deepEqual(li.values.map((v) => v.code), ["offer","inquiry","not_listing","unknown"])`, `assert.match(li.rationale, /bên mua/)`, `assert.match(li.rationale, /SavedSearch/)`. Trong `vocab-lint.test.mjs` đổi hai chuỗi `offer|wanted` / `"offer,wanted"` thành `offer|inquiry` / `"offer,inquiry"`.
- [ ] **Step 2:** `cd pipeline && node --test scripts/vocab.test.mjs` → FAIL ở 'VB-AC-1 sổ thật' (sổ còn `wanted`).
- [ ] **Step 3:** Sửa sổ: `- { code: inquiry, label_vi: Yêu cầu }`; `rationale`: «extension ListingIntent (ADR-0013 §9) — yêu cầu là bên mua, đối xứng với listing bên bán (ROADMAP §3 #21); không phải Property, gần nhất SavedSearch»; `checked_on: "2026-10-27"`; `note` thêm «wanted → inquiry: Mạnh 27/10, migration 050».
- [ ] **Step 4:** `node pipeline/vocab.mjs --write` rồi `node pipeline/vocab.mjs --check` → «4/4 đích khớp sổ»; `cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs` → PASS; `node pipeline/vocab.mjs --lint` → 0 chỗ.
- [ ] **Step 5:** Commit `refactor(vocab): wanted → inquiry «Yêu cầu» (listing_intent)`.

### Task 2: Migration 050 + test DB trên DB riêng (AC-3) — independent: false (cần Task 1)

**Files:**
- Create: `db/migrations/050_wanted_thanh_inquiry.sql`
- Modify: `pipeline/scripts/vocab-db.itest.mjs`
- Create: `_acceptance/wanted-thanh-inquiry/rang/db-rieng.mjs`

**Interfaces:**
- Produces: hằng SQL của migration = đúng một câu
  `UPDATE ref_lookup SET lookup_value = 'inquiry', label_vi = 'Yêu cầu' WHERE lookup_name = 'listing_intent' AND lookup_value = 'wanted';`
  (Task 3 chép nguyên văn).
- Produces: `db-rieng.mjs` xuất `xoaDbTam(ten: string): Promise<void>`, ném `Error("tên DB ngoài khuôn")` khi `ten` không khớp `/^oneinvest_u1_inquiry_\d+$/`.

- [ ] **Step 1:** Trong `vocab-db.itest.mjs`: đọc thêm `MIG050`. Mọi chỗ «áp 043 rồi so sổ» (VD-AC-7 đầu, VD-AC-8, phía `tuMig` của ca emitSeed) áp `MIG` rồi `MIG050`. Thêm ca `VD-IQ-3` trong `trongGiaoDich`:
  - tiền đề, áp `MIG` → `checkDb` có lệch chứa `"inquiry"`;
  - áp `MIG050` → 0 lệch;
  - dòng `(listing_intent, inquiry)` = `{label_vi:"Yêu cầu", is_local:true, sort_order:2}`; `count(lookup_value='wanted') = 0`; số dòng theo trục bằng trước khi áp;
  - áp `MIG050` lần hai không ném.
- [ ] **Step 2:** Viết `db-rieng.mjs`:
  - tạo `oneinvest_u1_inquiry_${process.pid}` qua kết nối tới DB `postgres`;
  - `DATABASE_URL=<db tạm> node scripts/ci-db-init.mjs`, rồi `cd pipeline && node --test scripts/vocab-db.itest.mjs` cùng env;
  - `finally` → `xoaDbTam`; in «db riêng: dựng · áp N migration · test xanh · đã xoá».
  - Cờ `--ep-loi` đặt env `VOCAB_DB_EP_LOI=1`; itest đọc env này, ném sau ca đầu. Răng vẫn xoá DB và thoát 1.
  - Cuối lượt tự chạy hai đối chứng tên (`oneinvest`, `oneinvest_u1_inquiry_x`) → mỗi cái ném «tên DB ngoài khuôn».
  - Kiểm `pg_database` không còn `oneinvest_u1_inquiry_%`.
- [ ] **Step 3:** Viết migration 050 (header theo khuôn 048: nguồn, số do liên làn cấp, «chỉ ref_lookup, không cột, không stg_*»; áp :5433 chỉ sau gộp).
- [ ] **Step 4:** `node _acceptance/wanted-thanh-inquiry/rang/db-rieng.mjs` → exit 0 + dòng «đã xoá»; `… --ep-loi` → exit 1 + «đã xoá»; `pg_database` sạch.
- [ ] **Step 5:** Commit `feat(db): 050 wanted → inquiry trong ref_lookup`.

### Task 3: Tệp catchup cloud (AC-6) — independent: false (cần câu UPDATE của Task 2)

**Files:**
- Create: `docs/ops/cloud-schema-catchup-2026-10-27-050.sql`
- Modify: `scripts/check-cloud-catchup.mjs` (`HO_SO["wanted-thanh-inquiry"] = [{ path: "docs/ops/cloud-schema-catchup-2026-10-27-050.sql" }]`)

- [ ] **Step 1:** Tệp có:
  - header «CHƯA ÁP — áp sau gộp, giám sát chạy ĐO TRƯỚC, Mạnh duyệt»;
  - `-- ĐO TRƯỚC`: `SELECT lookup_value, label_vi, sort_order FROM ref_lookup WHERE lookup_name='listing_intent' ORDER BY sort_order;` kèm kỳ vọng ghi chú (đo 27/10: 1 dòng `wanted`);
  - `-- ÁP`: nguyên văn câu UPDATE của 050;
  - cách lùi: UPDATE ngược, ghi trong chú thích.
- [ ] **Step 2:** `node scripts/check-cloud-catchup.mjs wanted-thanh-inquiry` → exit 0 (bộ kiểm tự chạy đối chứng chèn ALTER).
- [ ] **Step 3:** Commit `docs(ops): catchup cloud cho 050`.

### Task 4: Ba nhãn ở `/ops/collections` (AC-7) — independent: true

**Files:**
- Create: `app/tests/fixtures/tu-ngu-collections/sync-activity.html`, `…/collections-tiles.html` (dòng đầu `<!-- sha: a4a47d15… sha256: <hex> -->`)
- Create: `app/tests/tu-ngu-collections.test.tsx`
- Create: `_acceptance/wanted-thanh-inquiry/rang/fixture-goc.mjs`
- Modify: `app/src/components/ops/collections/sync-activity.tsx:24`, `collections-tiles.tsx:95,100`

**Interfaces:** Test xuất (trong tệp) `soNutVanBan(truoc: string, sau: string): Array<[string,string]>` — tách markup theo nút văn bản, trả các cặp khác.

- [ ] **Step 1:** Chụp bản «trước»: `fixture-goc.mjs --ghi`:
  - lấy hai component ở sha `a4a47d15` (`git show`), đặt bản tạm `.__goc-*.tsx` cạnh tệp gốc;
  - render bằng props cố định (roles `{S03:"Cộng đồng", S01:"Tự thu"}`, 7 ngày số mồi, funnel `{passed:5, skipped:2, messages:7}`);
  - ghi fixture kèm sha + sha256, rồi xoá bản tạm.
  - Không cờ thì chế độ kiểm: render lại và so byte; đối chứng đổi một ký tự bản sao → «lệch bản chụp».
- [ ] **Step 2:** Test `TN-AC-7`:
  - băm nội dung fixture khớp dòng đầu;
  - render component hiện tại → `soNutVanBan` trả đúng ba cặp `[("Tin S03 · Cộng đồng","S03 · Cộng đồng"),("Tin S03 · Cộng đồng hôm nay","Bài S03 · Cộng đồng hôm nay"),("2 tin bị cổng chặn","2 bài bị cổng chặn")]`;
  - roles `{}` → nút «S03»;
  - đối chứng phá: thêm một thay vào bản sao → hàm trả bốn cặp.
- [ ] **Step 3:** Chạy test → FAIL (component chưa đổi).
- [ ] **Step 4:** Đổi `label: \`Tin ${sourceLabel("S03", roles)}\`` → `label: sourceLabel("S03", roles)`; `` `${…} tin bị cổng chặn` `` → `bài`; `` `Tin ${s03} hôm nay` `` → `` `Bài ${s03} hôm nay` ``.
- [ ] **Step 5:** `cd app && node --import tsx --test tests/tu-ngu-collections.test.tsx` → PASS; `node _acceptance/wanted-thanh-inquiry/rang/fixture-goc.mjs` → «ok bản chụp khớp render ở a4a47d15» ×2; `cd app && npx tsc --noEmit && npm run lint` xanh.
- [ ] **Step 6:** Commit `fix(ops): «bài» thay «tin» cho bài thô ở trang Thu thập`.

### Task 5: Docs sống (AC-5) — independent: false (CONTEXT.md chung với Task 1)

**Files:** `CONTEXT.md`, `docs/adr/0013-kien-truc-du-lieu-tin-can-reso.md:111`, `docs/architecture/reso-khung-phan-loai.md:43,169`, `docs/ROADMAP.md` (§3 #21)

- [ ] **Step 1:** `CONTEXT.md`:
  - khối **Listing** thêm «bên bán, đối xứng với Yêu cầu»;
  - thay khối tạm **Yêu cầu mua** bằng ba khối **Yêu cầu** (bên mua; dịch vụ ở `kind` cùng bộ mã, loại hình, ngân sách, gắn tiêu chí; RESO gần nhất `SavedSearch`; code `listing_intent = inquiry`), **Yêu cầu mua** (`kind = sale`), **Yêu cầu thuê** (`kind` ∈ `rent_lt`, `rent_st`);
  - _Avoid_ của Yêu cầu: «tin tìm mua», «wanted».
- [ ] **Step 2:** ADR-0013 §9 và reso-khung §8: `ListingIntent` (offer · inquiry · not_listing); reso-khung §2: «Yêu cầu (inquiry)» thay «Tin «wanted»». ROADMAP #21: «`wanted` → `inquiry` «Yêu cầu» (Mạnh 27/10; loại con Yêu cầu mua / Yêu cầu thuê)».
- [ ] **Step 3:** `node pipeline/vocab.mjs --check` vẫn 4/4 (khối VOCAB không bị sửa tay).
- [ ] **Step 4:** Commit `docs(context): mô hình Listing (bên bán) ↔ Yêu cầu (bên mua)`.

### Task 6: Răng quét tên cũ + đích sinh + docs + catchup (AC-2, AC-4, AC-5, AC-6) — independent: false (cuối)

**Files:** Create `_acceptance/wanted-thanh-inquiry/rang/con-ten-cu.mjs`

**Interfaces:** Xuất `quet(goc: string): { do: string[], lichSu: Map<string,number>, doiTen: number }` và `soCatchup(migration: string, catchup: string): { khop: number, tong: number, thieu: string[] }`.

- [ ] **Step 1:** Viết răng:
  - Bảng lịch sử 12 mục, chép nguyên văn AC-4.
  - Regex sáu dạng: `"wanted"`, `'wanted'`, `` `wanted` ``, `code:\s*wanted\b`, `(?:\||/)wanted\b|\bwanted(?:\||/)`, `Tin tìm mua, tìm thuê`.
  - Dòng có `→ \`?inquiry` là dòng đổi tên.
  - Quét `git ls-files`.
  - Bốn khối in: «đích sinh», «docs sống» (đúng các chuỗi của E5), «catchup» («ok catchup: 1/1 UPDATE khớp migration 050»), «bảng lịch sử».
  - Cuối lượt tự chạy đối chứng trên bản sao thư mục tạm: 6 ca cấy → mỗi ca 1 đỏ; `const wanted = 1` → 0; dòng đổi tên → 0; catchup bỏ UPDATE → «thiếu 1/1». Sai kỳ vọng → «răng hỏng», thoát 1.
- [ ] **Step 2:** `node _acceptance/wanted-thanh-inquiry/rang/con-ten-cu.mjs` → exit 0, «tên cũ: 0 chỗ ngoài bảng lịch sử».
- [ ] **Step 3:** Sinh lại bản đồ: `node scripts/product-map.mjs --root .` → `--check` xanh. Commit `test(acceptance): răng quét tên cũ wanted`.

## Thứ tự

Task 1 → 2 → 3 → 5 → 6 tuần tự; Task 4 độc lập nhưng làm trong cùng worktree (một task independent duy nhất, không fan-out).
