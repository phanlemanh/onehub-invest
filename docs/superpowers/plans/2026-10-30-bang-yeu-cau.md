# bang-yeu-cau — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Native — tuần tự trong phiên P1). Bước dùng `- [ ]`.

**Goal:** Bảng `inquiry_records` (+ view sống `inquiries`) chỉ ở DB local, và transform-zalo dựng mỗi nhóm bài S03 có phát
biểu `listing_intent = inquiry` lớp cao nhất thành một Yêu cầu kèm tiêu chí; chạy lại không nhân dòng, hết điều kiện thì nghỉ.

**Architecture:** Migration 058 (bảng bản ghi + view + CHECK theo sổ + `ref_field_lookup`) · sổ `mappings.yaml` khối
`inquiries` (RESO SavedSearch) + hai cột gắn trục kind/property_type · hàm thuần `pipeline/lib/yeu-cau.mjs` (tiêu chí,
khoá gom, gom nhóm) · `ghiYeuCau` cùng tệp (đọc phát biểu thắng bằng một câu SQL, upsert, nghỉ) · transform-zalo gọi
`ghiYeuCau` sau bước Kev. Thiếu bảng → bỏ bước, một dòng log.

**Tech Stack:** Node .mjs (`node:test`), PostgreSQL 16 (PostGIS :5433), `pg`.

**Spec:** `docs/superpowers/specs/2026-10-30-bang-yeu-cau-design.md` · hồ sơ `_acceptance/bang-yeu-cau/` (contract duyệt 30/10:
Hỏi-1 trần, Hỏi-2 gom, Hỏi-3 bảng ánh xạ; evals E1–E10 + E2b, E10b).

## Global Constraints

- Migration số **058** (liên làn cấp; kế tiếp là 059). Tạo bằng `/new-migration`; chỉ DB local; không vào `FILL`/`CLOUD_ALLOW`
  của `sync-cloud.mjs`. Main đã có 058 → báo liên làn, không tự lấy số.
- Cột (design doc §RESO): `inquiry_id text PK` · `source text NOT NULL` · `originating_system_key text NOT NULL` ·
  `post_ids text[] NOT NULL` · `kind text` · `property_type text` · `bedrooms int` · `area_m2 numeric` · `budget_min_vnd
  bigint` · `budget_max_vnd bigint` · `area_id text` · `market_id text` · `first_seen timestamptz` · `last_seen timestamptz` ·
  `intent_evidence jsonb NOT NULL` · `retired_at timestamptz` · `retired_reason text` · `created_at`/`updated_at timestamptz
  DEFAULT now()`. `area_id`/`market_id` KHÔNG khoá ngoại tới `areas` (reassign-areas xoá area không phải phường — FK sẽ chặn
  nó); không cột danh tính người tìm.
- CHECK có tên: `inquiry_records_kind_chk` (`kind IN ('sale','rent_lt')` — đúng bộ mã trục kind của sổ),
  `inquiry_records_property_type_chk` (đủ sáu mã trục property_type, kể cả `unknown`, vì `--check-db` so nguyên bộ; mã ghi
  không bao giờ là `unknown`), `inquiry_records_source_chk` (`source ~ '^S0[0-9]$'`), `inquiry_records_budget_chk`
  (`budget_min_vnd <= budget_max_vnd` khi cả hai có), `inquiry_records_retired_chk` (`(retired_at IS NULL) = (retired_reason
  IS NULL)`).
- Hằng mã lấy từ `vocab.generated.mjs` (`KIND.*`, `PROPERTY_TYPE.*`, `ASSERTION_FIELD.*`) — `vocab --lint` đỏ với chuỗi trần.
- `lib/yeu-cau.mjs` nhập hàm thuần của `../transform-zalo.mjs` (`parsePost`, `gatSo`, `soTy`, `parseVnNumber`,
  `lyDoGiaPhiLy`, `normText`, `extractPhones`) trong khi transform-zalo nhập `ghiYeuCau` — vòng nhập ES chỉ an toàn khi
  không tệp nào gọi hàm của tệp kia ở cấp đỉnh. Không thêm lời gọi cấp đỉnh.
- Test DB và thước chạy trên DB thử `oneinvest_p1_n1` (`bash db/db-thu.sh oneinvest_p1_n1`), mọi ca trong `BEGIN … ROLLBACK`;
  thứ tự nạp: `napPhatBieu` → `napKev` (33033 rồi khoá danh bạ) → `napYeuCau` (33033). Đọc `DATABASE_URL` từ môi trường,
  không ghi chuỗi có mật khẩu mới (P1-66). Fixture giả, không chuỗi tin thật.
- Mỗi phép đo mới có ca đỏ trên bản sao đột biến chép cạnh tệp thật (tên có bộ đếm — `import()` nhớ theo URL) rồi xoá.
- Luồng offer không đổi: tập offer và phát biểu Kev giống hệt lượt không có bước Yêu cầu (E8, E9).
- Không chạm hook, OpenClaw, importer, DATA-CONTRACT, `collector/**`, `pipeline/import-*`, `docs/plan/lo-trinh.json`.

## Review Focus

1. Bài nêu hai loại hình khác nhau («căn hộ hoặc nhà riêng») → lấy loại xuất hiện TRƯỚC trong chữ; trùng vị trí thì cụm dài
   hơn. Dòng ma trận YC-AC-3 «hai loại hình».
2. Số tiền không phải ngân sách — giá theo m² («45tr/m2»), số trong SĐT/URL → không thành ngân sách: đọc trên `gatSo(text)`,
   bỏ token đứng trước `/m2`/`/m²`. Dòng ma trận «giá theo m2».
3. Khoảng ngược («3–2 tỷ») → đảo cho min ≤ max (CHECK 058 chặn nếu không). Dòng ma trận «khoảng ngược».
4. Phát biểu `property_type` thắng mang `unknown` → coi như vắng, rơi về bảng ánh xạ chữ. Dòng ma trận «phát biểu unknown».
5. `dq-enum-vocab` chạy trên DB chưa áp 058 (máy thu sau gộp, trước bước triển khai) → mục `inquiries` trả `skip`, không văng,
   không ghi dòng `dq_check_results`. Vế đối chứng của `yeu-cau-vocab-db.mjs` (Task 2).

---

### Task 1: Migration 058 + bộ nạp trong giao dịch

**Files:**
- Create: `db/migrations/058_inquiry_records.sql` (qua `/new-migration`; header nêu «chỉ DB local, không sync cloud»)
- Create: `pipeline/lib/nap-058.mjs`
- Create: `pipeline/scripts/yeu-cau.itest.mjs` (khung `trongGiaoDich` như `kev-phat-bieu.itest.mjs` + ca YC-AC-1)

**Interfaces:**
- Produces: `export const MIG_058`; `export async function napYeuCau(client, { sql? }): Promise<void>` — giữ
  `pg_advisory_xact_lock(33033)`, nạp 058 (idempotent, gọi lại được). Không nạp 045/057 (người gọi làm).

- [ ] **Step 1:** Viết ca `YC-AC-1` (E1): nạp 045 + 057, đếm `sale_offer_records`/`inquiry_records` (nếu có), `napYeuCau`
  hai lần; `information_schema.columns` của `inquiry_records` đúng tên + kiểu ở Global Constraints; view `inquiries` loại dòng
  có `retired_at`; năm INSERT xấu (`kind='rent_st'`, `property_type='nha'`, `source='zalo'`, min 5e9 > max 3e9, `retired_at`
  có mà `retired_reason` trống) mỗi cái trong SAVEPOINT, lỗi khớp tên ràng buộc; một INSERT hợp lệ vào được; số dòng hai bảng
  không đổi sau hai lần áp. Ca đỏ: bản sao văn bản 058 bỏ dòng `inquiry_records_budget_chk` → assert «budget» đỏ.
- [ ] **Step 2:** Chạy `bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && DATABASE_URL=…/oneinvest_p1_n1 node --test
  --test-name-pattern 'YC-AC-1' scripts/yeu-cau.itest.mjs` → đỏ (thiếu tệp).
- [ ] **Step 3:** Viết 058 (`CREATE TABLE IF NOT EXISTS`, CHECK thêm bằng `DO $$ … IF NOT EXISTS (pg_constraint) …`,
  `CREATE OR REPLACE VIEW inquiries AS SELECT * FROM inquiry_records WHERE retired_at IS NULL`, index
  `inquiry_records (source) WHERE retired_at IS NULL`, `INSERT INTO ref_field_lookup … ('inquiry_records','kind','kind'),
  ('inquiry_records','property_type','property_type') ON CONFLICT DO NOTHING`) và `nap-058.mjs`.
- [ ] **Step 4:** Áp 058 hai lần lên DB thử bằng psql (bước 5 của `/new-migration`, nhắm `oneinvest_p1_n1`, không DB dùng
  chung); chạy lại Step 2 → xanh, ca đỏ đỏ.
- [ ] **Step 5:** Commit `feat(db): 058 bảng Yêu cầu (inquiry_records + view inquiries), chỉ local`.

### Task 2: Sổ RESO, DQ, CONTEXT, executor

**Files:**
- Modify: `pipeline/mappings.yaml` — khối mới `inquiries:` (khuôn khối `media:`: `table: inquiry_records`, `dd_resource:
  SavedSearch`, `dd_version: "2.1"`, `checked_on`, `fields:` mỗi cột `dd:` theo bảng design doc, cột không có RESO thì
  `dd: null` + `rationale:`); trục `kind.columns` thêm `inquiry_records.kind`, `property_type.columns` thêm
  `inquiry_records.property_type`
- Regen: đích của `node vocab.mjs --write` (+ khối CONTEXT sinh nếu đổi)
- Modify: `pipeline/dq-enum-vocab.mjs` — `KIEM_ENUM` thêm `{bang:"inquiries",cot:"kind",truc:"kind"}`,
  `{bang:"inquiries",cot:"property_type",truc:"property_type"}`; `kiemEnum` trả `{status:"skip",bad:0}` và không ghi dòng
  khi `to_regclass(bang)` null
- Modify: `CONTEXT.md` mục «Yêu cầu» — thay câu «bảng lưu yêu cầu và ghép với listing là tính năng sau, cần số đo trước» bằng
  câu nói bảng `inquiries` (chỉ local) đã có, ghép với listing là hàng sau
- Create: `pipeline/scripts/yeu-cau-vocab-db.mjs` (khuôn `kev-vocab-db.mjs`)
- Create: `pipeline/scripts/yeu-cau.test.mjs` (ca YC-AC-2; Task 3 thêm ca)
- Modify: `_acceptance/config.yaml` `executors.script` — đúng hai khoá (giám sát duyệt P1-69):
  `yeu_cau_that: "bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node --test scripts/yeu-cau.itest.mjs scripts/kev-phat-bieu.itest.mjs scripts/phat-bieu-db.itest.mjs && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node scripts/do-yeu-cau.mjs"`
  · `yeu_cau_vocab: "cd pipeline && node vocab.mjs --check && node vocab.mjs --lint && node scripts/yeu-cau-vocab-db.mjs"`
  (chuỗi DB thử y khoá `kev_phat_bieu_that` đã duyệt; không thêm mật khẩu mới)

**Interfaces:**
- Consumes: `napYeuCau` (Task 1), `checkDb`/`readMappings` (`lib/vocab-core.mjs`), `kiemEnum`/`KIEM_ENUM`.
- Produces: khối sổ `inquiries` mà ca YC-AC-2 đọc; `kiemEnum(...)` có thêm kết quả `"skip"`.

- [ ] **Step 1:** Ca `YC-AC-2` (E2b, thuần): đọc `mappings.yaml` bằng bộ đọc sổ có sẵn; khối `inquiries` có `dd_resource ===
  "SavedSearch"`, mọi cột của Global Constraints có `dd` khác null hoặc `rationale`; `KIEM_ENUM` chứa hai mục trên; CONTEXT
  không còn chuỗi «bảng lưu yêu cầu và ghép với listing là tính năng sau» và có «inquiries». Ca đỏ: bản sao sổ (chép cạnh
  tệp thật) bỏ `rationale` của `post_ids` → lỗi nêu `post_ids`. Chạy → đỏ.
- [ ] **Step 2:** `yeu-cau-vocab-db.mjs` (E2): BEGIN, 33033, nạp 045 + 057; SAVEPOINT «chưa 058» (DB thử đã áp 058 thì DROP
  VIEW `inquiries`, DROP TABLE `inquiry_records`, xoá hai dòng `ref_field_lookup`): `checkDb` phải lệch và gọi tên
  `inquiry_records` — không thì exit 1; trong cùng SAVEPOINT `kiemEnum` hai mục `inquiries` trả `skip` (Review Focus 5);
  ROLLBACK TO; `napYeuCau` hai lần; `checkDb` 0 lệch — không thì exit 1; ROLLBACK.
- [ ] **Step 3:** Sửa sổ, `node vocab.mjs --write`, DQ, CONTEXT, config.yaml. Chạy `node vocab.mjs --check && node vocab.mjs
  --lint`, `npm test` (gồm `vocab.test.mjs` ghim AXES/NHAN — trục không đổi, chỉ thêm cột), `yeu-cau-vocab-db.mjs` → xanh.
- [ ] **Step 4:** Commit `feat(pipeline): sổ RESO SavedSearch cho inquiries, DQ enum, CONTEXT «Yêu cầu»`.

### Task 3: Hàm thuần — tiêu chí, khoá gom, gom nhóm

**Files:**
- Create: `pipeline/lib/yeu-cau.mjs` (phần thuần)
- Modify: `pipeline/scripts/yeu-cau.test.mjs` (ca YC-AC-3 + ca gom thuần)

**Interfaces:**
- Produces (thuần, xuất ra):
  - `docNganSach(text: string, kind: string|null): {min: number|null, max: number|null}` — đọc trên `gatSo(text)`, lấy biểu
    thức tiền ĐẦU TIÊN theo thứ tự: khoảng «A–B đv» / «A đv–B đv» / «từ A đến|tới B» → min/max (ngược thì đảo) · «tầm dưới
    | dưới | tối đa | không quá X» → max · «trên | từ | tối thiểu X» → min · mọi dạng còn lại («tầm | khoảng | tài chính |
    ngân sách X», «X» trơn) → max (Hỏi-1). Đơn vị: tỷ/tỉ/ty → `soTy`×1e9; triệu/tr/củ → `parseVnNumber`×1e6; token đứng
    trước `/m2|/m²` bỏ. Mỗi đầu qua `lyDoGiaPhiLy({kind, priceVnd})` → phi lý thì đầu đó null.
  - `docLoaiHinh(text): string|null` — bảng Hỏi-3 (spec §Tiêu chí), so cụm có ranh chữ (`(?<!\p{L})…(?!\p{L})`, cờ `u`),
    lấy cụm xuất hiện trước (Review Focus 1); «nhà» đứng một mình → null.
  - `docDichVu(text): string|null` — «cần mua | tìm mua» → `KIND.sale`; «cần thuê | tìm thuê» → `KIND.rent_lt`; cả hai →
    cụm trước.
  - `khoaNguoi(post: {sender_id?, text}): string|null` — `sender:<id>` · `phone:<SĐT đầu của extractPhones>` · null.
  - `inquiryId(source, post: {post_id, sender_id?, text}): string` — `'inq_' + sha256(`${source}|${khoaNguoi ?? 'post:'+post_id}|${normText(text)}`).hex.slice(0,16)`.
  - `tieuChiYeuCau(post, thang: {kind?, property_type?} , ctx: {phuongCua(post), thiTruongKhai(post)}): {kind, property_type,
    bedrooms, area_m2, budget_min_vnd, budget_max_vnd, area_id, market_id}` — `kind`: `thang.kind.value` rồi `docDichVu`;
    `property_type`: `thang.property_type.value` trừ `unknown`, rồi `docLoaiHinh`; `bedrooms`/`area_m2` từ `parsePost`;
    ngân sách `docNganSach(text, kind)`; `area_id = ph?.id`, `market_id = ph?.market ?? (khai.length === 1 ? khai[0] : null)`.
  - `gomYeuCau(source, items: Array<{post, thang, tieuChi}>): Array<InquiryRow>` — nhóm theo `inquiryId`; `post_ids` sắp
    theo (`posted_at`, `post_id`); `originating_system_key` = bài sớm nhất; `first_seen`/`last_seen` = min/max `posted_at`;
    tiêu chí + `intent_evidence` (`{assertion_id, method, tier, p}` của phát biểu inquiry) theo bài MỚI nhất.
    `InquiryRow` = các cột của bảng trừ `retired_*`, `created_at`, `updated_at`.

- [ ] **Step 1:** Ma trận `YC-AC-3` (E3) viết trước: mỗi dòng `{chu, thang, mong}` với `mong` đủ bảy trường (kind,
  property_type, bedrooms, area_m2, budget_min_vnd, budget_max_vnd, area_id). Dòng tối thiểu: «2–3 tỷ», «từ 2 đến 3 tỷ»,
  «dưới 3 tỷ», «tối đa 3 tỷ», «tầm dưới 3 tỷ», «trên 2 tỷ», «từ 2 tỷ», «tầm 3 tỷ», «khoảng 3 tỷ», «tài chính 3 tỷ», «ngân sách
  15tr», «8 củ», «12 triệu», «thuê 2 tỷ» (phi lý → null), «45tr/m2» (Review Focus 2), «3–2 tỷ» (Review Focus 3); mỗi mục bảng
  Hỏi-3 một dòng + «nhà» đứng một mình → null + «căn hộ hoặc nhà riêng» (Review Focus 1); «cần mua», «tìm thuê»; có phường
  (ctx giả với `matchPhuongThiTruong` trên danh sách phường giả); có phát biểu kind (thắng chữ); phát biểu property_type
  `unknown` (Review Focus 4). Số assert = số dòng. Hai ca đỏ trên bản sao `lib/yeu-cau.mjs`: bỏ nhánh «dưới/tối đa» → ghim dòng
  «dưới 3 tỷ»; bỏ ưu tiên `thang.kind` → ghim dòng «có phát biểu kind». Ca gom thuần: hai bài cùng `sender_id` cùng chữ khác
  dấu câu → một hàng, `post_ids` hai phần tử theo thời gian; khác người → hai hàng; không người gửi lẫn SĐT → mỗi bài một hàng.
- [ ] **Step 2:** `npm test` → đỏ. Viết phần thuần. `npm test` → xanh, ca đỏ đỏ; `node vocab.mjs --lint` sạch.
- [ ] **Step 3:** Commit `feat(pipeline): bộ đọc tiêu chí Yêu cầu (ngân sách Hỏi-1, loại hình Hỏi-3, gom Hỏi-2)`.

### Task 4: Ghi Yêu cầu trong transform-zalo

**Files:**
- Modify: `pipeline/lib/yeu-cau.mjs` (phần DB)
- Modify: `pipeline/transform-zalo.mjs` — tách `taoNguCanhPhuong` (không đổi hành vi offer), gọi `ghiYeuCau` sau bước Kev,
  trả `yeuCau` trong kết quả
- Modify: `pipeline/lib/scan-delete.mjs` — `BANG` thêm `inquiry_records|inquiries`
- Modify: `pipeline/scripts/yeu-cau.itest.mjs` (YC-AC-4 … YC-AC-8)

**Interfaces:**
- Consumes: Task 1 `napYeuCau`; Task 3 `tieuChiYeuCau`, `gomYeuCau`; PL5 `napKev`, bước Kev của transform.
- Produces:
  - `export async function taoNguCanhPhuong(client): Promise<{phuongCua(post): {id, slug, market}|null, thiTruongKhai(post): string[]}>`
    trong `transform-zalo.mjs` (gói `docThiTruongCoPhuong`, `docPhuongHopLe`, `docThiTruongNhom`, bộ nhớ `entries` hiện có).
  - `docPhatBieuThang(client, source, postIds): Promise<Map<post_id, {listing_intent?, kind?, property_type?}>>` — một câu
    `SELECT DISTINCT ON (subject_key, field) … FROM field_assertions WHERE retracted_at IS NULL AND subject_key = ANY($1) AND
    field = ANY(listing_intent, kind, property_type) ORDER BY subject_key, field, <tier: fact 0 · observed 1 · inferred 2>,
    assertion_method_rank(method), observed_at DESC NULLS LAST, id DESC`; mỗi ô `{assertion_id, value, method, tier, p}`
    (`p` = `evidence->>'p'`).
  - `ghiYeuCau(client, posts, ctx, source = "S03"): Promise<null | {xet, yeuCau, them, capNhat, songLai, nghi}>` — thiếu bảng
    (`to_regclass('inquiry_records')` null) → log `yêu cầu: chưa áp 058 — bỏ bước Yêu cầu`, trả null. Bài đủ điều kiện = bài
    trong `posts` có `thang.listing_intent.value === "inquiry"`. Upsert `ON CONFLICT (inquiry_id) DO UPDATE` ghi ĐỦ cột (kể cả
    `post_ids` tập đầy đủ của lượt), gỡ `retired_*`, `updated_at = now()`; đếm `them`/`capNhat`/`songLai` bằng tập id + trạng
    thái nghỉ đọc trước khi ghi. Nghỉ: `UPDATE inquiry_records SET retired_at = now(), retired_reason = 'het-phat-bieu' WHERE
    source = $1 AND retired_at IS NULL AND inquiry_id <> ALL($2)`. Không `DELETE`.

- [ ] **Step 1:** Ca DB viết trước (fixture: chèn bài vào `stg_zalo_posts` mượn `snapshot_id` có sẵn bằng subquery, đặt cột
  `kev_*` như PL5; chạy `runTransformZalo` thật):
  - `YC-AC-4` (E4): Yêu cầu thuê có điểm, tin rao, không phải tin, bài thử mang `kev_intent='inquiry'`, bài «khách tìm…» mọi
    điểm trống → tập `inquiry_id` sống đúng tập viết trước, tiêu chí viết trước; lượt hai `them=0, nghi=0`. Ca đỏ: bản sao
    `transform-zalo.mjs` (chép cạnh tệp thật) đọc bài không qua lọc bài thử → ghim «bài thử thành Yêu cầu».
  - `YC-AC-5` (E5) và `YC-AC-5b`: đúng kịch bản E5 (ba lượt; lượt ba đổi `kev_intent` của B thành `offer` rồi chạy transform —
    không chèn tay `field_assertions`). Hai ca đỏ: bản sao `lib/yeu-cau.mjs` bỏ người khỏi khoá → ghim «khác người»; bản sao
    upsert `post_ids = inquiry_records.post_ids || EXCLUDED.post_ids` → ghim 5b (lượt ba không co).
  - `YC-AC-6` (E6): đổi ý → nghỉ `het-phat-bieu`, dòng còn; đổi về → sống lại cùng `inquiry_id`. Răng quét: `scanDeleteRecords`
    đỏ trên tệp mẫu chứa `DELETE FROM inquiry_records`, sạch trên `codeTree(pipeline)`.
  - `YC-AC-7` (E7): bài có Kev `inquiry` + chèn phát biểu `hitl`/`fact` `offer` (qua `writeAssertions`) → không thành Yêu cầu;
    rút phát biểu hitl → thành. Ca đỏ: bản sao `lib/yeu-cau.mjs` sắp theo `observed_at` trước lớp → ghim bài ấy.
  - `YC-AC-8` (E8): không nạp 058 (DB thử đã áp thì DROP VIEW/TABLE trong giao dịch) → transform chạy hết; số offer và số phát
    biểu kev bằng lượt có bảng (chạy lượt có bảng trong SAVEPOINT trước); bắt `console.log` → đúng 1 dòng «chưa áp 058».
- [ ] **Step 2:** Chạy `yeu_cau_that` phần itest → đỏ.
- [ ] **Step 3:** Viết phần DB của `yeu-cau.mjs`, `taoNguCanhPhuong` + nối transform, mở rộng `scan-delete`. Chạy itest →
  xanh, mọi ca đỏ đỏ; `npm test` xanh (gồm `nap-lai.test.mjs` của răng quét).
- [ ] **Step 4:** Commit `feat(pipeline): transform-zalo dựng bảng Yêu cầu từ phát biểu inquiry (upsert, nghỉ, chưa áp 058)`.

### Task 5: Thước dữ liệu thật + tài liệu + không lùi

**Files:**
- Create: `pipeline/scripts/do-yeu-cau.mjs`
- Modify: `docs/ROADMAP.md` (§2.2 as-built, §4 dòng hàng), `pipeline/CLAUDE.md` (dòng transform-zalo, bảng schema thêm
  `inquiry_records`/`inquiries`, gotcha «nạp 058 trong giao dịch»)

**Interfaces:**
- Consumes: `runTransformZalo`, `napPhatBieu`, `napKev`, `napYeuCau`, `ghiYeuCau`, `taoNguCanhPhuong`, `FILL`/`CLOUD_ALLOW`.

- [ ] **Step 1:** `do-yeu-cau.mjs` (E9), một giao dịch ROLLBACK trên DB thử: nạp 045 + 057 + 058; điểm Kev tổng hợp cho mọi
  bài S03 thật (`kev_intent = 'inquiry'` khi chữ khớp «cần mua|cần thuê|tìm mua|tìm thuê|khách tìm», còn lại `offer`;
  `kev_at = now()`, `kev_model = 'tong-hop'`); số bài S03 ≤ 500 → exit 1. SAVEPOINT A: bỏ bảng (như YC-AC-8), đo giây
  `runTransformZalo`, chụp tập offer (`offer_id, kind, price_vnd, post_ids`), ROLLBACK TO. Lượt có bảng: đo giây, so tập offer
  (lệch → exit 1). In: số bài, số bài có phát biểu inquiry sống, số Yêu cầu sống; quan hệ — bài inquiry vắng mọi `post_ids`
  sống = 0, bài nằm trong > 1 `post_ids` sống = 0, mỗi Yêu cầu một bộ (nguồn, `khoaNguoi`, `normText`) và không hai Yêu cầu
  chung bộ (sai → exit 1); với sáu tiêu chí: số bài có dấu hiệu chữ (regex tiền/loại hình/dịch vụ/PN/m2/phường có trong chữ)
  và tỉ lệ đọc ra trên mẫu số ấy (chỉ in); giây thêm; `inquiry_records`/`inquiries` không trong `FILL` và khoá `CLOUD_ALLOW`
  (có → exit 1). Đối chứng luôn chạy (SAVEPOINT B): gọi `ghiYeuCau` của bản sao `lib/yeu-cau.mjs` bỏ người khỏi khoá →
  quan hệ «một bộ mỗi Yêu cầu» phải đỏ, không thì exit 1 «đối chứng hỏng».
- [ ] **Step 2:** Chạy trọn `yeu_cau_that` (E1, E4–E9, E10b) và `yeu_cau_vocab` (E2) và `npm test` (E2b, E3, E10) → xanh;
  `node --check` các `.mjs` vừa đổi; `/verify pipeline`.
- [ ] **Step 3:** ROADMAP + `pipeline/CLAUDE.md`; vẽ lại bản đồ sản phẩm; contract `status: implemented`.
- [ ] **Step 4:** Commit `feat(pipeline): thước bảng Yêu cầu trên dữ liệu thật; docs`.
