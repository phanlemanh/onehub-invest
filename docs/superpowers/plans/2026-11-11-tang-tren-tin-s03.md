# Tầng trên tin S03 (DV4) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tin S03 ghi tầng mang phát biểu `floor_raw` (số, RESO `UnitFloorLocation`) hoặc `floor_band` (dải, extension) có trích dẫn, qua migration 095.

**Architecture:** Bộ đọc luật `docTang` trong `pipeline/transform-zalo.mjs` (lấy từ phần tầng của SV2) → phát biểu `transform-zalo@dv4` qua `writeOffers` → `resolve_offer_fields` dựng cột `floor_raw`. Migration 095 nới CHECK, thêm trigger miền, ghi legacy cho tầng S06 cũ, vá thân phân xử theo khuôn mốc của 068/069, nạp sổ từ vựng.

**Tech Stack:** Node .mjs (node:test), PostgreSQL 16 + PostGIS (DB thử qua `db/db-thu.sh`), TypeScript (app, tsx test).

**Spec:** `docs/superpowers/specs/2026-11-11-tang-tren-tin-s03-design.md` · hợp đồng `_acceptance/tang-tren-tin-s03/contract.md` · evals `_acceptance/tang-tren-tin-s03/evals.yaml`.

## Global Constraints

- Migration số 095, tệp `db/migrations/095_tang_tren_tin.sql`; chạy lại an toàn (áp hai lần không lỗi, không thêm dòng).
- 095 chỉ nạp trên DB thử `oneinvest_u1_dv4` (dựng bằng `bash db/db-thu.sh oneinvest_u1_dv4`) hoặc DB của lượt suite; KHÔNG áp lên `oneinvest` dùng chung (luật đợt 27/10).
- `floor_raw` khớp `^[1-9][0-9]{0,2}$`; `floor_band` ∈ `low|mid|high`; sai → RAISE nêu tên trường. Trường lạ vẫn bị CHECK từ chối.
- CHECK `field_assertions_field_chk` = tập của 082 (`property_type, bedrooms, bathrooms, street_raw, block_raw, offer_status, street_number, unit_number, frontage_length, lot_size_dimensions, stories, latitude, longitude, builder_name, area_id`) + `floor_raw, floor_band`.
- Phát biểu: `method_version = 'transform-zalo@dv4'`, `evidence_tier = observed`, `method = parser`, `evidence = {"trich": "<đoạn>"}`, chủ thể là bài (`subjectKey(source, post_id)`).
- Không đổi `pipeline/sync-cloud.mjs`, không route Zalo, không lệnh áp cloud; nguồn gọi bằng mã S0x; chữ bài không vào kho (mẫu đọc tay ở `research-local/`).
- Ca test mang mã `DV4-AC-<n>` trong tên để executor lọc được.

## Review Focus

1. Bài có cả mã căn đủ và «tầng N» khác nhau («S1.12.08 tầng 15») — chữ «tầng N» thắng mã; test ở Task 1.
2. Chữ hoa, NFD, khoảng trắng lạ («TẦNG  9», «tầng 7») — vẫn đọc, `trich` vẫn là đoạn có thật sau NFC; test ở Task 1.
3. Bài đã có phát biểu `floor_band` ở lượt trước, lượt sau đọc ra số — phát biểu dải cũ phải rút (khác trường nên `replaceOwn` không tự rút); test ở Task 3.
4. DB có 068/069 áp theo thứ tự khác — vá mốc của 095 vẫn áp được, và báo lỗi có tên khi mốc mất; test ở Task 2.
5. Tin S06 có `floor_raw = '0'` (4 tin) — legacy giữ nguyên giá trị dù ngoài miền mới; test ở Task 2.

---

### Task 1: Bộ đọc tầng `docTang` (independent: true)

**Files:**
- Modify: `pipeline/transform-zalo.mjs` (thêm `docTang`, `maTrongBai`; `parsePost` gọi `docTang`)
- Test: `pipeline/scripts/tang-tren-tin.test.mjs`

**Interfaces:**
- Produces: `export function docTang(text: string): { floor: string|null, floorBand: "low"|"mid"|"high"|null, trich: string|null }`; `parsePost(text).floor`, `.floorBand`, `.trichTang`.
- Phục vụ E4 (AC-3).

- [ ] **Step 1: Viết test ma trận** `DV4-AC-3 ma trận M1…M28`: bảng 28 ca chép nguyên mục «Ma trận viết trước» của design doc (mã, chữ, floor, floorBand); mỗi ca một `assert.deepEqual({floor, floorBand}, đáp án, mã)`; với mọi giá trị khác null `assert.ok(text.normalize("NFC").includes(trich))`; cuối test in `ma_ca_da_chay=<28 mã>` và `assert.equal(daChay.length, 28)`. Thêm ca Review Focus 1–2 (mã `R1`, `R2`).
- [ ] **Step 2: Ca đột biến** `DV4-AC-3 đột biến`: chạy ma trận với hai bản đột biến truyền qua tham số tuỳ chọn `docTang(text, { _dotBien: "bo-chan-nhieu-tang" | "doc-T-tran" })`; mỗi bản phải làm ít nhất một ca đỏ, test assert điều đó và ghim mã ca đỏ (M22 cho bản một, M17 cho bản hai).
- [ ] **Step 3: Chạy, thấy đỏ** — `node --test pipeline/scripts/tang-tren-tin.test.mjs` → FAIL «docTang is not a function».
- [ ] **Step 4: Viết `docTang`**: chuyển `TANG_SO`, `TANG_KHOANG`, `tangTuMa`, `chuKhoangTang`, `maTrongBai` từ nhánh `origin/claude/s03-luu-tang-huong` (`git show origin/claude/s03-luu-tang-huong:pipeline/transform-zalo.mjs`), bỏ phần hướng; bỏ «tang» không dấu khỏi `TANG_SO`/`TANG_KHOANG`; dải trả mã `low|mid|high`; có số thì `floorBand = null`; số ngoài 1–999 → null; nhiều mã căn khác nhau → cả ba null; `trich` = `m[0]` của khớp thắng (chuỗi trên chữ NFC). `parsePost` gán `out.floor`, `out.floorBand`, `out.trichTang`.
- [ ] **Step 5: Chạy xanh** — cùng lệnh → PASS, in đủ 28 mã. Chạy thêm `cd pipeline && node --test parse.test.mjs` (không hồi quy bộ đọc cũ).
- [ ] **Step 6: Commit** `feat(tang-tren-tin-s03): bộ đọc tầng docTang + ma trận 28 ca`.

### Task 2: Migration 095 + sổ từ vựng (independent: true)

**Files:**
- Create: `db/migrations/095_tang_tren_tin.sql`, `pipeline/scripts/tang-tren-tin-db.sh`, `pipeline/scripts/tang-tren-tin.itest.mjs`
- Modify: `pipeline/mappings.yaml` (trường `floor_raw` → `dd: UnitFloorLocation`, `checked_on: "2026-11-11"`; trường `floor_band` `dd: null` + rationale; trục `assertion_field` thêm hai mã; trục mới `floor_band`), các tệp sinh `pipeline/lib/vocab.generated.mjs`, `app/src/lib/vocab.generated.ts`, `agent/src/vocab.generated.ts` (bằng `node pipeline/vocab.mjs --write`)

**Interfaces:**
- Produces: DB có `field_assertions` nhận `floor_raw`/`floor_band`; trigger `field_assertions_gia_tri_095`; `resolve_offer_fields` dựng `floor_raw`; hằng `ASSERTION_FIELD.floor_raw`, `ASSERTION_FIELD.floor_band`, `FLOOR_BAND.{low,mid,high}`.
- `tang-tren-tin-db.sh <itest|do|luat>`: dựng `oneinvest_u1_dv4` nếu chưa có (`db-thu.sh … --neu-chua-co`) rồi chạy itest / `do-tang-tren-tin.mjs --toan-bo` / ca luật với `DATABASE_URL` trỏ DB thử.
- Phục vụ E1, E3 (AC-1, AC-2).

- [ ] **Step 1: Test** `DV4-AC-1` trong `tang-tren-tin.itest.mjs` (mỗi ca BEGIN…ROLLBACK, nạp 095 bằng `readFileSync`): áp hai lần; một tin S06 fixture có `floor_raw='7'` → 1 dòng legacy sau lần một, vẫn 1 sau lần hai; ma trận nhận/từ chối của AC-1 (mỗi dòng một assert, thông điệp lỗi chứa tên trường); `floor_lol` bị từ chối; tin `floor_raw='0'` vẫn giữ sau `resolve_offer_fields` (Review Focus 5). Ca đối chứng: bản sao chữ 095 bỏ `NOT EXISTS` của bước legacy → đếm lần hai ra 2, test assert phát hiện được và ghim `DV4-AC-1`.
- [ ] **Step 2: Test** `DV4-AC-2`: tin S06 fixture có `floor_raw` qua 095 rồi `writeOffers(client, "S06", [row], {})` hai lượt → `floor_raw` còn nguyên; đối chứng: xoá phát biểu legacy của tin rồi `resolve_offer_fields` → `floor_raw` null.
- [ ] **Step 3: Test** `DV4-AC-1 mốc`: áp 095 trên hàm phân xử đã bị đổi mốc (thay chuỗi mốc trong `pg_get_functiondef` rồi EXECUTE) → lỗi chứa `MOC-095` (Review Focus 4).
- [ ] **Step 4: Chạy đỏ** — `bash pipeline/scripts/tang-tren-tin-db.sh itest` → FAIL (thiếu tệp 095).
- [ ] **Step 5: Viết 095** theo bốn phần design doc «Migration 095»: (1) CHECK; (2) INSERT legacy khuôn PL15 (lấy câu legacy của 067 trên nhánh SV2, đổi rule `'offer:'||offer_id`, `method_version '045'`), ĐỨNG TRƯỚC trigger; (3) trigger `field_assertions_gia_tri_095` BEFORE INSERT; (4) DO-block vá `resolve_offer_fields` theo khuôn 069: ba mốc — dòng `max(w.v) FILTER (WHERE w.field = 'longitude')` trong CTE `kq` thêm `floor_raw`, `longitude = k.longitude` trong `UPDATE SET` thêm `floor_raw = k.floor_raw`, hai bộ so `IS DISTINCT FROM` thêm `floor_raw`; dấu đã-vá `/* floor_raw_095 */`; mất mốc → `RAISE EXCEPTION 'MOC-095: …'`; (5) `ref_lookup` từ `node pipeline/vocab.mjs --emit-seed` sau khi sửa mappings.
- [ ] **Step 6: Sửa mappings + sinh lại** — `node pipeline/vocab.mjs --write && node pipeline/vocab.mjs --check`.
- [ ] **Step 7: Chạy xanh** — `bash pipeline/scripts/tang-tren-tin-db.sh itest` → ca DV4-AC-1, DV4-AC-2 PASS.
- [ ] **Step 8: Commit** `feat(tang-tren-tin-s03): migration 095 tầng của tin + sổ từ vựng`.

### Task 3: Phát biểu tầng từ transform S03 (independent: false — cần Task 1, 2)

**Files:**
- Modify: `pipeline/lib/assert.mjs` (thêm `phatBieuTang`, `co095`, `rutDaiCu`), `pipeline/transform-zalo.mjs` (posts mang `floor`, `floorBand`, `trichTang`; nối vào `writeOffers` sau `co095`)
- Test: `pipeline/scripts/tang-tren-tin.itest.mjs`

**Interfaces:**
- Consumes: `docTang`/`parsePost` (Task 1), hằng `ASSERTION_FIELD.floor_raw|floor_band` (Task 2).
- Produces: `export function phatBieuTang(source: string, bai: Array<{post_id, posted_at, floor, floorBand, trichTang}>, methodVersion: string): AssertionRow[]`; `export async function co095(client): Promise<boolean>` (đọc `pg_get_constraintdef` của `field_assertions_field_chk` chứa `floor_band`).
- Phục vụ E5, E7 (AC-4, AC-6).

- [ ] **Step 1: Test** `DV4-AC-4` trên DB thử đã áp 095 (ROLLBACK): nạp 3 bài S03 fixture vào `stg_zalo_posts` của giao dịch (một bài «tầng 12», một bài «tầng trung», một bài khác tin «tầng 9» cùng tin với bài thứ tư «tầng 10»), chạy `runTransformZalo` hai lần; assert chủ thể, lớp, phương pháp, `evidence.trich`; cột `floor_raw` = '12'; tin dải: `floor_raw` null và `field_provenance.floor_band.v = 'mid'`; lần hai số dòng `field_assertions` không đổi; sửa chữ bài «tầng 12» → «tầng 14» rồi chạy lại → dòng cũ `retract_reason='thay-boi-luot'`; tin hai bài khác tầng → `field_provenance.floor_raw.conflict = true`; bài «tầng trung» đổi thành «tầng 8» → dòng `floor_band` cũ bị rút (Review Focus 3).
- [ ] **Step 2: Test** `DV4-AC-6`: cùng fixture trên DB thử CHƯA áp 095 → transform xong, stderr chứa `095`, số tin bằng lượt nền, 0 dòng `field IN ('floor_raw','floor_band')`; rồi áp 095 trong cùng giao dịch, chạy lại → có dòng (đối chứng dương).
- [ ] **Step 3: Chạy đỏ** — `bash pipeline/scripts/tang-tren-tin-db.sh itest` → DV4-AC-4, DV4-AC-6 FAIL.
- [ ] **Step 4: Viết** `phatBieuTang` (khuôn `phatBieuToaTruc`, thêm `evidence: { trich }`, bỏ bài có giá trị mà `trich` rỗng); `co095`; `rutDaiCu(client, giu, methodVersion)` rút phát biểu `floor_band`/`floor_raw` cùng `method_version` của bài lượt này đã chuyển sang trường kia (khuôn `rutLoaiHinhCu`). Trong `runTransformZalo`: posts thêm ba trường; `const coTang = await co095(client)`; không có → `console.warn("transform-zalo: DB chưa áp migration 095, bỏ phát biểu tầng ở lượt này")`; có → nối `phatBieuTang("S03", posts, "transform-zalo@dv4")` vào `assertions` và gọi `rutDaiCu` sau `writeOffers`.
- [ ] **Step 5: Chạy xanh** — `bash pipeline/scripts/tang-tren-tin-db.sh itest` → mọi ca DV4 PASS; `cd pipeline && npm test` xanh.
- [ ] **Step 6: Commit** `feat(tang-tren-tin-s03): phát biểu tầng từ transform S03 có trích dẫn`.

### Task 4: Dòng DQ `s03-floor-fill` + nhãn (independent: false — cần Task 2)

**Files:**
- Modify: `pipeline/sql/450_dq_checks.sql`, `app/src/lib/dq-labels.ts`
- Test: `app/tests/dq-tang-tren-tin-label.test.tsx`, ca `DV4-AC-7` trong `pipeline/scripts/tang-tren-tin.itest.mjs` và `pipeline/scripts/tang-tren-tin.test.mjs`

**Interfaces:**
- Produces: dòng `dq_check_results(check_name='s03-floor-fill', entity='S03', status ∈ skip|pass|fail, detail '{"co_tang":n,"tong":m,"ti_le":r}')`; mẫu số = tin `sale_offers` S03 `property_type='apartment'` `offer_status='active'`; tử số = tin có `floor_raw` hoặc `field_provenance ? 'floor_band'`; `skip` khi không có phát biểu `floor_raw|floor_band` nào của S03; `pass` khi `ti_le ≥ 0.05`.
- Phục vụ E8, E9 (AC-7).

- [ ] **Step 1: Test luật** `DV4-AC-7 mappings` (thuần, trong `tang-tren-tin.test.mjs`): đọc `pipeline/mappings.yaml` bằng `readMappings` của `pipeline/lib/vocab-core.mjs`; assert `floor_raw.dd = 'UnitFloorLocation'`, `floor_band.dd = null` có `rationale`, `checked_on`, trục `floor_band` đúng ba mã; ca đỏ: bản mappings giả thiếu `rationale` (chuỗi YAML trong test) → hàm kiểm của test ra lỗi ghim `DV4-AC-7`.
- [ ] **Step 2: Test DQ** `DV4-AC-7 dq` (itest, ROLLBACK, 095 đã áp): ba fixture dựng qua `runTransformZalo` thật — không bài có tầng → `skip`; 1/2 tin căn hộ có tầng → `pass`; 1/30 → `fail`. Thêm `vocab --check-db`: `spawnSync("node", ["pipeline/vocab.mjs","--check-db"])` với `DATABASE_URL` DB thử đã áp 095 thoát 0; DB thử chưa áp → thoát khác 0 (đối chứng). Lưu ý `--check-db` không chạy trong giao dịch: ca này dùng DB của lượt (`db-thu.sh oneinvest_suite_dv4 --chay`) áp 095 thật.
- [ ] **Step 3: Test nhãn** `DV4-AC-7 nhãn` (`dq-tang-tren-tin-label.test.tsx`, khuôn `dq-danh-ba-sdt-label.test.tsx`): `dqCheckName('s03-floor-fill','S03').known === true`, `dqDetail` có chữ tiếng Việt; đối chứng `dqCheckName('khong-co-kiem-nay','S03').known === false`.
- [ ] **Step 4: Chạy đỏ** — `node --test pipeline/scripts/tang-tren-tin.test.mjs`, `bash pipeline/scripts/tang-tren-tin-db.sh luat`, `cd app && node --import tsx --test tests/dq-tang-tren-tin-label.test.tsx` → FAIL.
- [ ] **Step 5: Viết** khối INSERT DQ (khuôn các dòng có sẵn trong 450, DELETE dòng cũ cùng `check_name` trước) và nhãn `"s03-floor-fill": "S03: tỉ lệ tin căn hộ có tầng"` + diễn giải detail.
- [ ] **Step 6: Chạy xanh** cả ba lệnh; `cd app && npx tsc --noEmit`.
- [ ] **Step 7: Commit** `feat(tang-tren-tin-s03): kiểm DQ s03-floor-fill kèm nhãn`.

### Task 5: Lệnh đo `do-tang-tren-tin.mjs` (independent: false — cần Task 1–4)

**Files:**
- Create: `pipeline/scripts/do-tang-tren-tin.mjs`

**Interfaces:**
- `--toan-bo` (gọi qua `tang-tren-tin-db.sh do`, DB thử): trong một giao dịch ROLLBACK — chụp `(offer_id, floor_raw)` và cột phân xử; áp 095; `resolve_offer_fields(NULL)`; in `floor_raw_lech=<a>/<N> cot_doi=<b>`; rồi `runTransformZalo` bản mới, in `offer_id_lech=<c>`, `co_tang=<n>/<m>`, chạy 450 phần `s03-floor-fill` trên chính kết quả, in `dq_s03_floor_fill=<status> ti_le=<r>`; chạy lại transform với bản đột biến đưa `floor` vào khoá gom (tham số `{ _dotBienKhoaTang: true }` của `runTransformZalo`), in `dot_bien_lech=<d>`. Thoát 0 chỉ khi a=0, b=0, c=0, d>0, n/m ∈ [0.08, 0.25], r = n/m.
- `--mau [tệp]` (mặc định `~/dev/onehub-invest/research-local/tang-tren-tin-s03/mau-doc-tay.jsonl`): mỗi dòng `{post_id, floor, floorBand, nhom}`; đọc chữ bài từ DB máy thu chỉ đọc (`default_transaction_read_only=on`), chạy `docTang`, in `dung=<n>/<m> moc_thanh_tang=<x>/<k> sot=<a>/<b> sot_T_tran=<t>`; thoát 0 khi n/m ≥ 0.95 và x = 0; thiếu tệp → thoát 2 với thông điệp. Không in chữ bài.
- `--rut-mau <tệp ra>`: rút 300 `post_id` (hạt giống `dv4-1111`, `ORDER BY md5(post_id || seed)`): 200 có từ dẫn hay mã căn đủ, 100 không (gồm ≥20 «T<số>/20xx», ≥20 «T<số>» trần); ghi `{post_id, nhom}` (không chữ bài) vào tệp ra ở `research-local/`.
- `--ranh-gioi --base <ref>`: `git diff --name-only <base>...HEAD`; in `sync_cloud_doi`, `route_zalo_doi` (đường chứa `/zalo`), `ap_cloud` (chuỗi `supabase db push` hay Management API trong diff), `ten_nguon` (đọc `real_name` của `source_registry` local, đếm tệp diff chứa), `mau_ignored` (`git check-ignore` tệp mẫu); `--thu-ten-nguon <thư mục>` là đối chứng: quét thư mục chỉ định thay cho diff.
- Phục vụ E2, E6, E10, E11 (AC-2, AC-5, AC-8, AC-9).

- [ ] **Step 1:** Viết lệnh theo bốn chế độ trên, dùng lại `runTransformZalo`, `docTang`.
- [ ] **Step 2: Đối chứng** — `node pipeline/scripts/do-tang-tren-tin.mjs --ranh-gioi --thu-ten-nguon <thư mục tạm có tệp chứa một real_name>` → `ten_nguon=1`, thoát khác 0; bản sửa tạm 095 bỏ bước legacy → `--toan-bo` ra `floor_raw_lech>0`, thoát khác 0 (chạy rồi hoàn lại).
- [ ] **Step 3: Chạy** `bash pipeline/scripts/tang-tren-tin-db.sh do` và `node pipeline/scripts/do-tang-tren-tin.mjs --ranh-gioi --base origin/main` → thoát 0.
- [ ] **Step 4: Commit** `feat(tang-tren-tin-s03): lệnh đo toàn bộ, mẫu, ranh giới`.

### Task 6: Mẫu đọc tay 300 bài (independent: false — cần `--rut-mau` của Task 5)

**Files:** chỉ `research-local/tang-tren-tin-s03/` ở checkout chính (gitignored), không tệp nào trong kho.

- [ ] **Step 1:** `node pipeline/scripts/do-tang-tren-tin.mjs --rut-mau ~/dev/onehub-invest/research-local/tang-tren-tin-s03/mau-id.jsonl`.
- [ ] **Step 2:** Dispatch một tác tử tươi (không cho xem mã bộ đọc, không cho xem kết quả `docTang`): đọc chữ từng bài theo `post_id` từ DB máy thu chỉ đọc, ghi `{post_id, floor, floorBand, nhom}` theo quy tắc đáp án của design doc (tầng nơi căn rao nằm; dải; null khi không nói hay nhiều căn) vào `mau-doc-tay.jsonl`.
- [ ] **Step 3:** `git check-ignore ~/dev/onehub-invest/research-local/tang-tren-tin-s03/mau-doc-tay.jsonl` thoát 0; `node pipeline/scripts/do-tang-tren-tin.mjs --mau` → in số. Đỏ dưới 95% → sửa bộ đọc ở Task 1 (ghi dòng sổ `fix`), không sửa đáp án.

### Task 7: Tài liệu (independent: true)

**Files:**
- Modify: `docs/architecture/reso-khung-phan-loai.md` (dòng tầng: `UnitFloorLocation` + extension `floor_band`), `CONTEXT.md` (thuật ngữ «Dải tầng» · `floor_band` · định nghĩa · _Avoid_ «khoảng tầng»; bảng trục `assertion_field` thêm `floor_raw` «Tầng», `floor_band` «Dải tầng»), `docs/ROADMAP.md` (§2 as-built, §4 trạng thái DV4)

- [ ] **Step 1:** Sửa ba tệp. **Step 2:** `cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs` (CONTEXT.md không phá thước slug). **Step 3:** Commit `docs(tang-tren-tin-s03): RESO tầng, thuật ngữ dải tầng, ROADMAP`.

---

Kết thúc S3: `/verify` các module đổi (pipeline, app, agent vì tệp vocab sinh), rồi hợp đồng sang `implemented` và vào S4 (báo giám sát một dòng trước khi xin khoá s4 — luật chấm trước với PL18 ở `transform-zalo.mjs`).
