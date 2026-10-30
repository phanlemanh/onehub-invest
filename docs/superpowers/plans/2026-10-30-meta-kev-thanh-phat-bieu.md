# meta-kev-thanh-phat-bieu (PL5) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Native — tuần tự trong phiên P1). Bước dùng `- [ ]`.

**Goal:** Bảng nạp `stg_zalo_posts` có bảy cột điểm Kev, và transform-zalo đổi điểm của mọi bài S03 thành phát biểu
`listing_intent` / `kind` lớp `inferred`, phương pháp `kev`, không loại tin nào.

**Architecture:** Migration 057 (cột + CHECK + hàm canh + hạt giống sổ) · sổ `mappings.yaml` thêm trục `assertion_field`
và mã `kev` · hàm thuần `pipeline/lib/kev-phat-bieu.mjs` (dòng cột → phát biểu) · transform-zalo đọc điểm Kev bằng một
câu riêng (không đụng `loadStgPosts`, dùng chung với S05) rồi ghi qua `writeAssertions(…, { replaceOwn: true })` sau
`writeOffers`. Cột vắng → bỏ bước, một dòng log.

**Tech Stack:** Node .mjs (`node:test`), PostgreSQL 16 (PostGIS :5433), `pg`.

**Spec:** `docs/superpowers/specs/2026-10-30-meta-kev-thanh-phat-bieu-design.md` · hồ sơ `_acceptance/meta-kev-thanh-phat-bieu/`
(contract đã duyệt 30/10, evals E1–E9 + E8b).

## Global Constraints

- Migration số **057** (liên làn cấp; main hiện tới 055). Tạo bằng `/new-migration`; chỉ áp DB local, không cloud.
- Bảy cột cho phép NULL: `kev_p real`, `kev_intent text`, `kev_intent_p real`, `kev_kind text`, `kev_kind_p real`,
  `kev_model text`, `kev_at timestamptz`. CHECK `kev_intent IN ('offer','inquiry','not_listing')`, `kev_kind IN ('sale','rent')`.
- `kev` chỉ đi với `inferred`. Lớp `inferred` không vào cột canonical; năm cột và bộ phân xử không đổi.
- Không ngưỡng, không lọc theo Kev. Luồng dựng offer không đọc cột Kev.
- Test DB chạy trên DB thử `oneinvest_p1_n1` (`bash db/db-thu.sh oneinvest_p1_n1`), mọi ca trong `BEGIN … ROLLBACK`.
- Phép đo đọc `DATABASE_URL` từ môi trường, không ghi chuỗi có mật khẩu (P1-66). Fixture giả, không chuỗi tin thật.
- Không chạm hook, OpenClaw, importer, DATA-CONTRACT, `collector/**`, `pipeline/import-*`.
- Mỗi phép đo mới có ca đỏ trên bản sao đột biến chép cạnh tệp thật rồi xoá.

## Review Focus

1. Bảng `party_roles` (055) cũng gắn trục `assertion_method` bằng CHECK literal → thêm `kev` vào sổ làm `--check-db`
   đỏ ở `party_roles.method` nếu 057 không nới CHECK ấy. Hàm canh `party_roles_guard` vẫn phải từ chối `kev` ở mọi lớp
   (Task 2, ca KP-AC-1b).
2. Bài có `kev_intent` nhưng là bài thử (zalo-mock, e2e, nhóm TEST) → không có phát biểu: đọc điểm chỉ cho post_id mà
   `loadStgPosts` trả (Task 4, ca KP-AC-4 có một bài thử mang điểm).
3. Một post_id có nhiều snapshot (bản cũ v3 chỉ `kev_p`, bản mới v5 đủ điểm) → lấy đúng bản mới nhất theo
   `captured_at DESC`, cùng thứ tự `loadStgPosts` (Task 4, ca KP-AC-4 có post hai snapshot).
4. Lượt sau Kev đổi ý (offer → inquiry) cho cùng bài → phát biểu cũ bị rút `thay-boi-luot`, đúng một phát biểu sống
   (Task 4, ca KP-AC-4c).
5. DB máy thu đã có 057 nhưng chưa có 045 (không thể theo thứ tự số, nhưng DB thử cũ có thể thiếu) → bước Kev bỏ qua như
   thiếu cột, không văng (Task 4: điều kiện kiểm cả `field_assertions`).

---

### Task 1: Sổ từ vựng — trục `assertion_field`, mã `kev`

**Files:**
- Modify: `pipeline/mappings.yaml` (trục `enrich_field` ~dòng 310, `assertion_method` ~336, thêm `assertion_field`)
- Regen: `pipeline/lib/vocab.generated.mjs`, `app/src/lib/vocab.generated.ts`, `agent/src/**/vocab.generated.ts`
  (đúng các đích `vocab.mjs --write` khai) và khối sinh trong `CONTEXT.md` nếu có
- Test: `node vocab.mjs --check && node vocab.mjs --lint`

**Interfaces:**
- Produces: hằng `ASSERTION_FIELD.listing_intent`, `ASSERTION_FIELD.kind`, `ASSERTION_METHOD.kev` trong
  `pipeline/lib/vocab.generated.mjs`; `node vocab.mjs --emit-seed` in hạt giống cho Task 2.

- [ ] **Step 1:** Sửa sổ:
  - `assertion_field` mới (`term_vi: Trường phát biểu`, `local: true`, `columns: [field_assertions.field]`, `nullable: false`),
    bảy mã theo thứ tự: năm mã của `enrich_field` (giữ `label_vi` + `dd_lookup`), `listing_intent` «Ý định tin»,
    `kind` «Loại giao dịch» (nhãn lấy đúng `term_vi` của hai trục ấy). Rationale trích PL18 «E2 là bộ đọc có trích dẫn»
    + thiết kế PL5.
  - `enrich_field.columns` → `[enrichment_proposals.field]`.
  - `assertion_method`: `columns` giữ `[field_assertions.method, party_roles.method]`; thêm
    `{ code: kev, label_vi: Bộ lọc Kev }` cuối; rationale sửa: «hitl, source_field lớp sự thật; parser, legacy lớp quan
    sát; e1_rule, e2_llm quan sát hoặc suy luận; kev chỉ suy luận (PL5)».
  - `listing_intent.note`: bỏ «Cột đến ở PL5», ghi «phát biểu theo bài qua assertion_field (PL5)».
- [ ] **Step 2:** `cd pipeline && node vocab.mjs --write` → `--check` xanh, `--lint` xanh.
- [ ] **Step 3:** `cd app && npx tsc --noEmit`; `cd agent && npx tsc --noEmit` — không thêm lỗi (agent có 2 lỗi tồn đọng).
- [ ] **Step 4:** Commit `feat(pipeline): sổ từ vựng thêm assertion_field và phương pháp kev (PL5)`.

### Task 2: Migration 057 + nạp trong giao dịch + ca KP-AC-1 + thước sổ–DB

**Files:**
- Create: `db/migrations/057_kev_phat_bieu.sql` (qua `/new-migration`)
- Create: `pipeline/lib/nap-057.mjs`
- Create: `pipeline/scripts/kev-phat-bieu.itest.mjs` (ca KP-AC-1, KP-AC-1b; Task 4 thêm ca)
- Create: `pipeline/scripts/kev-vocab-db.mjs`

**Interfaces:**
- Consumes: hạt giống `vocab.mjs --emit-seed` (Task 1).
- Produces: `napKev(client): Promise<void>` — nạp toàn văn 057 trong giao dịch người gọi giữ (idempotent, gọi hai lần được).

- [ ] **Step 1:** Viết ca `KP-AC-1` (trên DB thử, BEGIN, `napPhatBieu` + `napKev` hai lần, ROLLBACK):
  - `information_schema.columns` của `stg_zalo_posts` có đúng bảy cột `kev_%` với `data_type` viết trước
    (`real`, `text`, `real`, `text`, `real`, `text`, `timestamp with time zone`).
  - INSERT `field_assertions` (`listing_intent`, `inquiry`, `inferred`, `kev`) và (`kind`, `rent_lt`, `inferred`, `kev`) qua;
    (`kev`, `observed`) và (`kev`, `fact`) ném lỗi khớp `/cặp lớp\/phương pháp/`.
  - INSERT `stg_zalo_posts` với `kev_intent='mua'` và với `kev_kind='rent_lt'` ném lỗi CHECK.
  - Ca đỏ: bản sao 057 cạnh tệp thật (`057_kev_phat_bieu.dot-bien.sql`) bỏ `kev` khỏi nhánh `inferred` của hàm canh →
    INSERT (`kev`, `inferred`) ném; ca ghim chuỗi «kev / inferred». Xoá bản sao trong `finally`.
- [ ] **Step 2:** Viết ca `KP-AC-1b`: INSERT `party_roles` với `method='kev'` ở cả ba lớp đều ném (hàm canh 055 không đổi).
- [ ] **Step 3:** Chạy → đỏ (chưa có 057).
- [ ] **Step 4:** Tạo 057 bằng `/new-migration`, idempotent:
  1. `ALTER TABLE stg_zalo_posts ADD COLUMN IF NOT EXISTS` bảy cột; hai CHECK có tên `stg_zalo_posts_kev_intent_chk`,
     `stg_zalo_posts_kev_kind_chk` (khối `DO … IF NOT EXISTS pg_constraint`).
  2. `field_assertions_field_chk` và `field_assertions_method_chk`: DROP IF EXISTS rồi ADD với bộ mã của sổ (Task 1).
  3. `party_roles`: DROP CHECK nội tuyến của `method` (tên tra `pg_constraint` theo `pg_get_constraintdef` chứa
     `method`, vì 055 không đặt tên) rồi ADD `party_roles_method_chk` cùng bộ mã sổ.
  4. `CREATE OR REPLACE FUNCTION field_assertions_guard()` chép thân 045, thêm `'kev'` vào danh sách phương pháp và
     nhánh `(NEW.evidence_tier = 'inferred' AND NEW.method IN ('e1_rule', 'e2_llm', 'kev'))`.
  5. Hạt giống từ `vocab.mjs --emit-seed`: `ref_lookup` (trục `assertion_field`, mã `kev`), `ref_field_lookup`
     `field_assertions.field → assertion_field`.
  Comment đầu tệp: chỉ DB local (stg_* và field_assertions không lên cloud).
- [ ] **Step 5:** `nap-057.mjs`: đọc toàn văn 057, `napKev(client)` chạy nó (khuôn `nap-045.mjs`, cùng cảnh báo «chỉ trong
  giao dịch sẽ ROLLBACK»).
- [ ] **Step 6:** `kev-vocab-db.mjs`: nối `DATABASE_URL` (mặc định DB thử `oneinvest_p1_n1`), BEGIN, `napPhatBieu` +
  `napKev`, gọi `checkDb(client, readMappings(...))` → in «--check-db (đã áp 057): N lệch»; SAVEPOINT trước 057 cho ca đối
  chứng: không áp 057 thì `checkDb` phải có lệch gọi tên `field_assertions` (không có → exit 1). ROLLBACK. Exit 0 khi
  vế một sạch và vế hai đỏ đúng chỗ.
- [ ] **Step 7:** `bash db/db-thu.sh oneinvest_p1_n1`, rồi
  `cd pipeline && DATABASE_URL=…/oneinvest_p1_n1 node --test scripts/kev-phat-bieu.itest.mjs && node scripts/kev-vocab-db.mjs` → xanh.
- [ ] **Step 8:** Commit `feat(db): migration 057 — cột Kev ở bảng nạp, phương pháp kev lớp suy luận (PL5)`.

### Task 3: Hàm thuần đổi điểm Kev thành phát biểu (KP-AC-3)

**Files:**
- Create: `pipeline/lib/kev-phat-bieu.mjs`
- Create: `pipeline/scripts/kev-phat-bieu.test.mjs` (chạy trong `npm test`)

**Interfaces:**
- Produces: `kevThanhPhatBieu(row: {post_id, kev_p, kev_intent, kev_intent_p, kev_kind, kev_kind_p, kev_model, kev_at},
  source = "S03"): { rows: AssertionRow[], ngoaiBo: number }` — `AssertionRow` đúng khuôn `writeAssertions` (`lib/assert.mjs`).

- [ ] **Step 1:** Ma trận `KP-AC-3` viết trước, bảy dòng, `assert.equal(soAssert, MA_TRAN.length)`:
  | dòng | vào | ra |
  |---|---|---|
  | tin rao bán | intent `offer` 0.91, kind `sale` 0.88 | `listing_intent=offer` (p 0.91) + `kind=sale` (p 0.88) |
  | Yêu cầu thuê | intent `inquiry` 0.62, kind `rent` 0.7 | `listing_intent=inquiry` + `kind=rent_lt` |
  | không phải tin | intent `not_listing` 0.95, kind null | chỉ `listing_intent=not_listing` |
  | chỉ ý định | intent `offer`, kind null, kind_p null | chỉ `listing_intent=offer` |
  | v3 | chỉ `kev_p` 0.8 + model + at | rỗng |
  | gate down | mọi điểm null | rỗng |
  | ngoài bộ | intent `mua`, kind `rent_lt` | rỗng, `ngoaiBo = 2` |
  Mỗi phát biểu: `subject_key 'S03:<post_id>'`, `evidence_tier 'inferred'`, `method 'kev'`, `method_version = kev_model`,
  `observed_at = kev_at`, `evidence = { p, kev_p, model }`.
- [ ] **Step 2:** Hai ca đỏ trên bản sao `kev-phat-bieu.dot-bien.mjs` (chép cạnh tệp thật, import động, xoá trong
  `finally`): bỏ đổi `rent → rent_lt` → dòng «Yêu cầu thuê» trượt; bỏ kiểm ngoài bộ → dòng «ngoài bộ» trượt.
- [ ] **Step 3:** Chạy `node --test scripts/kev-phat-bieu.test.mjs` → đỏ.
- [ ] **Step 4:** Viết hàm; bộ hợp lệ lấy từ `VOCAB.listing_intent` (trừ `unknown`) và `{sale, rent}`; dùng
  `ASSERTION_FIELD`, `ASSERTION_METHOD.kev`, `EVIDENCE_TIER.inferred`, `subjectKey` của `lib/assert.mjs`.
- [ ] **Step 5:** Xanh, `npm test` xanh. Commit `feat(pipeline): hàm đổi điểm Kev thành phát biểu (PL5)`.

### Task 4: Transform-zalo ghi phát biểu Kev (KP-AC-4/5/6)

**Files:**
- Modify: `pipeline/transform-zalo.mjs` (`runTransformZalo`, sau `writeOffers` ~dòng 436)
- Modify: `pipeline/lib/kev-phat-bieu.mjs` (thêm phần đọc DB)
- Test: `pipeline/scripts/kev-phat-bieu.itest.mjs`

**Interfaces:**
- Consumes: `kevThanhPhatBieu` (Task 3), `writeAssertions` (`lib/assert.mjs`), `napKev` (Task 2).
- Produces: `docDiemKev(client, postIds: string[]): Promise<null | Row[]>` — `null` khi thiếu cột `kev_intent` hoặc bảng
  `field_assertions`; ngược lại dòng mới nhất mỗi post (`DISTINCT ON (post_id) … ORDER BY post_id, captured_at DESC`) chỉ
  cho `postIds`. `runTransformZalo` trả thêm `kev: { bai, phatBieu, ngoaiBo } | null`.

- [ ] **Step 1:** Fixture tổng hợp trong giao dịch: nhóm `S03` giả, năm bài + một bài thử (marker có sẵn của
  `lib/test-posts.mjs`) mang điểm; một post có hai snapshot (cũ v3, mới v5). Chuỗi bài giả, không chuỗi thật.
- [ ] **Step 2:** Ca `KP-AC-4`: chạy `runTransformZalo` hai lần → ba bài có điểm mỗi bài đúng một `listing_intent` sống
  (offer, inquiry, not_listing; bài «khách tìm thuê 2pn…» có phát biểu dù không thành offer); hai bài có `kev_kind` mỗi
  bài đúng một `kind` sống (`sale`, `rent_lt`); bài gate down và bài thử 0; post hai snapshot lấy điểm bản mới; lượt hai
  `inserted 0, retracted 0`. `KP-AC-4c`: sửa `kev_intent` một bài rồi chạy lại → một dòng rút `thay-boi-luot`, một sống.
  Hai ca đỏ trên bản sao: transform chỉ ghi cho bài thành offer → ghim bài «khách tìm thuê»; `replaceOwn` khoá
  (chủ thể, phương pháp) → ghim «kind bị rút». (Bản sao `replaceOwn` là `lib/assert.dot-bien.mjs`.)
- [ ] **Step 3:** Ca `KP-AC-5`: chụp tập (offer_id, post_ids, kind, price_vnd) + năm cột canonical của offer S03 sau lượt
  có Kev; `UPDATE stg_zalo_posts SET kev_* = NULL` cho fixture; chạy lại; hai tập bằng nhau. Ca đỏ: bản sao transform bỏ
  bài `not_listing` khỏi luồng offer → ghim chính bài ấy.
- [ ] **Step 4:** Ca `KP-AC-6`: trong giao dịch `ALTER TABLE stg_zalo_posts DROP COLUMN` bảy cột `kev_*`; chạy transform,
  bắt `console.log` → số offer bằng lượt có cột, 0 phát biểu `kev`, đúng một dòng chứa «chưa áp 057».
- [ ] **Step 5:** Chạy → đỏ.
- [ ] **Step 6:** Sửa `runTransformZalo`: sau `writeOffers`, `docDiemKev(client, posts.map(p => p.post_id))`; `null` →
  `console.log("kev: chưa áp 057 — bỏ bước phát biểu Kev")`; ngược lại gom `kevThanhPhatBieu` mọi dòng, một lần
  `writeAssertions(client, rows, { replaceOwn: true })`, log `kev: <bài> bài có điểm · <phát biểu> phát biểu · <ngoài bộ> ngoài bộ`.
  Không sửa bước parse/dedup/writeOffers.
- [ ] **Step 7:** Xanh; `phat-bieu-db.itest.mjs` vẫn xanh; `npm test` xanh. Commit
  `feat(pipeline): transform-zalo ghi phát biểu Kev cho mọi bài S03 (PL5)`.

### Task 5: Thước KV3 trên DB thử (E7)

**Files:**
- Create: `pipeline/scripts/do-kev-phat-bieu.mjs`

- [ ] **Step 1:** Viết thước (DB thử qua `DATABASE_URL`, BEGIN … ROLLBACK): `napPhatBieu` + `napKev`; đếm bài S03 thật
  (`loadStgPosts`), < 500 → exit 1; lượt A: transform, ghi giây + tập offer; điền điểm tổng hợp bảy cột cho mọi bài S03 (phân
  phối cố định theo băm post_id: 60% offer, 25% inquiry, 15% not_listing; kind sale/rent; 3% gate down); lượt B: giây, số
  phát biểu `kev` thêm (= số bài có điểm, lệch → exit 1), tập offer (lệch A → exit 1), byte/bài
  `avg(pg_column_size(kev_p)+…+pg_column_size(kev_at))` của bảy cột; kiểm `field_assertions` không có trong `CLOUD_ALLOW`
  của `sync-cloud.mjs` (có → exit 1).
- [ ] **Step 2:** Ca đỏ: chạy với biến môi trường `DO_KEV_DOT_BIEN=lech-offer` (bỏ một offer ở lượt B) → exit 1. Ghi vào
  đầu tệp như các thước trước.
- [ ] **Step 3:** Chạy cả executor `kev_phat_bieu_that` → xanh. Commit `test(pipeline): thước KV3 phát biểu Kev (PL5)`.

### Task 6: Thước dữ liệu thật v5 (E9) — dựng nay, chạy thật sau phần (1)

**Files:**
- Create: `pipeline/scripts/so-kev-du-lieu-that.mjs`

- [ ] **Step 1:** Viết thước (`DATABASE_URL` từ môi trường; chỉ đọc + BEGIN READ ONLY cho phần đếm):
  - ngày v5 gần nhất = ngày giờ VN lớn nhất có bài S03 mang `kev_intent`; không có (hoặc thiếu cột) → in «chưa có dữ liệu
    v5», exit 2;
  - in khoá nhận diện; số bài; số bài gate down; số bài có `kev_at` thiếu `kev_intent` (≠ 0 → exit 1);
  - tỉ lệ ra `inquiry` trên bài khớp `/khách tìm|cần mua|cần thuê/i` (Hỏi-1: in, không ngưỡng); số bài ấy và số có phát
    biểu `listing_intent` sau transform (≠ nhau → exit 1);
  - số bài stg S03 và số offer của ngày ấy cạnh trung vị 7 ngày trước (chỉ in).
  - Phần «offer có Kev = xoá trắng Kev» và «có phát biểu» chạy transform trong BEGIN … ROLLBACK trên DB thử dựng từ DB máy
    thu (`--db-thu oneinvest_p1_n1`, mặc định), không ghi DB `oneinvest`.
- [ ] **Step 2:** Chạy trên DB thử hiện tại → exit 2 «chưa có dữ liệu v5» (đúng mong đợi tới khi ZCode giao phần 1).
  Ca đỏ: fixture một ngày v5 giả trong giao dịch với một bài `kev_at` không `kev_intent` → exit 1.
- [ ] **Step 3:** Commit `test(pipeline): thước dữ liệu thật v5 cho phát biểu Kev (PL5)`.

### Task 7: Tài liệu as-built

**Files:**
- Modify: `docs/ROADMAP.md` §2.2 (transform S03 ghi phát biểu Kev) và §4 (PL5: phần 2 xong trên mẫu, chờ v5)
- Modify: `pipeline/CLAUDE.md` (bước Kev của transform-zalo, «chưa áp 057»)

- [ ] **Step 1:** Sửa hai tệp; `/verify` module pipeline. Commit `docs: PL5 as-built`.

---

Sau Task 7: contract `status: implemented` → S4 (xin lượt `s4`). Cổng Bằng chứng chờ E9 có ngày v5 thật.
