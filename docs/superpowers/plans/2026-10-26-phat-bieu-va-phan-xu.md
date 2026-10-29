# PL15 · Bảng phát biểu + bộ phân xử — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (main loop, tuần tự). Steps use `- [ ]`.

**Goal:** Năm cột phân loại của tin (`property_type`, `bedrooms`, `bathrooms`, `street_raw`, `block_raw`) chỉ được dựng
bởi một bộ phân xử ba lớp từ bảng phát biểu chỉ-thêm, kèm nguồn gốc từng ô; xoá rồi dựng lại ra trùng từng ô.

**Architecture:** Migration 045 thêm `field_assertions` (trigger chỉ-thêm + kiểm cặp lớp↔phương pháp), cột
`field_provenance`, hàm `resolve_offer_fields` (thuần, set-based, có cổng «chưa cắt chuyển»), thay `apply_enrichment` /
`revert_enrichment`. JS: `pipeline/lib/assert.mjs` ghi lô phát biểu; ba transform ghi phát biểu rồi gọi phân xử; ba
lệnh đo (cắt chuyển, dựng lại, chạy thật) tự chứa trong một giao dịch ROLLBACK.

**Tech Stack:** PostgreSQL 16 (PostGIS image) plpgsql · Node 22 `.mjs` + `pg` · `node:test` · agent TS (tsx).

**Spec:** `docs/superpowers/specs/2026-10-26-phat-bieu-va-phan-xu-design.md` · hợp đồng
`_acceptance/phat-bieu-va-phan-xu/contract.md` · evals `_acceptance/phat-bieu-va-phan-xu/evals.yaml`.

## Global Constraints

- Migration số **045**, tệp `db/migrations/045_phat_bieu_va_phan_xu.sql`, idempotent, không giả định chạy trước 047/048,
  không ghi dòng nào vào bảng tin. Không sửa migration đã commit.
- Trục trường lấy từ sổ: `VOCAB.enrich_field` (`pipeline/lib/vocab.generated.mjs`) — không viết tay danh sách năm cột.
- Ba lớp: `fact` · `observed` · `inferred`. Sáu phương pháp: `hitl` · `source_field` (fact) · `parser` · `e1_rule` ·
  `e2_llm` · `legacy` (observed). `inferred` không phương pháp nào ghi ở vòng này. Hạng tạm: hitl 0, source_field 1,
  parser 2, e1_rule 3, e2_llm 4, legacy 9.
- Chủ thể `'<S0x>:<id gốc>'`, khớp `^S0[0-9]:.+$` (nguồn thử `TST` trong test: cho phép `^(S0[0-9]|TST):.+$`).
- Mặc định ô: `property_type = 'unknown'`, bốn cột kia `NULL`. `inferred` không bao giờ vào cột.
- Thông điệp ghim: `field_assertions: chỉ thêm` · `field_assertions: đã rút` · `field_assertions: rút phải có lý do` ·
  `phân xử: chưa cắt chuyển`. Lý do rút: `thay-boi-luot`, `hoan-tac:<lý do>`, `hitl-thay`.
- Cổng cắt chuyển = `EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen')`.
- Actor người bắt đầu `hitl:`; actor máy không. Không đổi mã gọi ở app/agent.
- `field_provenance` không vào `CLOUD_ALLOW`; `field_assertions` không vào `FILL` của `sync-cloud.mjs`.
- Test DB: mỗi ca `BEGIN … ROLLBACK`, `pg_advisory_xact_lock(33033)`, nạp 045 trong giao dịch khi DB chưa áp (khuôn
  `trongGiaoDich` của `nap-lai-db.itest.mjs`).
- Comment domain tiếng Việt; Conventional Commits; mỗi task một commit.

## Review Focus

1. Tin S03 gộp nhiều post mà các post ra phòng ngủ khác nhau → cùng lớp bất đồng, cột theo hạng/số chủ thể, `conflict`.
   Ghim ở Task 3 (ca ma trận `hai-post-bat-dong`).
2. Giá trị số viết khác dạng (`'2'`, `' 2 '`, `'02'`) → cùng `value_key`, cột ra số 2. Ghim ở Task 3 (ca `so-chuan-hoa`).
3. Tin S05 có `post_ids` rỗng hoặc NULL → chủ thể chỉ là post neo, phân xử không lỗi. Ghim ở Task 3 (ca `post-ids-rong`).
4. Lượt transform rỗng / stg lỗi → `writeOffers` vẫn ném trước khi ghi phát biểu nào (không rút phát biểu parser hàng
   loạt). Ghim ở Task 5 (ca `PD-AC-5 lượt rỗng`).
5. Quyết định người rồi người khác quyết lại cùng giá trị → không thêm dòng trùng (chỉ mục sống), không rút. Ghim ở
   Task 4 (ca ma trận E10 `hitl-cung-gia-tri`).

---

### Task 1: Sổ từ vựng — hai trục mới + thuật ngữ

**Files:**
- Modify: `pipeline/mappings.yaml` (khối `enums:` — thêm `evidence_tier`, `assertion_method`; `enrich_field.columns` thêm
  `field_assertions.field`)
- Regenerate: `pipeline/lib/vocab.generated.mjs`, `agent/src/vocab.generated.ts`, `app/src/lib/vocab.generated.ts` (chạy
  `node pipeline/vocab.mjs --write`; tên tệp app theo đầu ra lệnh), khối sinh trong `CONTEXT.md`
- Modify: `CONTEXT.md` (thuật ngữ tay: «Phát biểu» `field_assertion`, «Lớp căn cứ» `evidence_tier`, «Phân xử»
  `resolve`, «Nguồn gốc» `field_provenance` — mỗi mục nhãn · code · định nghĩa · _Avoid_)

**Interfaces:**
- Produces: `VOCAB.evidence_tier = ["fact","observed","inferred"]`, `VOCAB.assertion_method = ["hitl","source_field",
  "parser","e1_rule","e2_llm","legacy"]`, hằng `EVIDENCE_TIER`, `ASSERTION_METHOD` cùng khuôn `ENRICH_FIELD`.

- [ ] Thêm hai trục local (`dd_field: null`, `local: true`, `rationale`, `checked_on: "2026-10-26"`, `columns:
  [field_assertions.evidence_tier]` / `[field_assertions.method]`, `nullable: false`); nhãn: sự thật · quan sát có trích
  dẫn · suy luận; người quyết · trường nguồn · bộ đọc tin · luật E1 · LLM E2 · giá trị cũ.
- [ ] `node pipeline/vocab.mjs --write` rồi `--check` và `--lint` → exit 0.
- [ ] `cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs` → pass.
- [ ] Commit `feat(vocab): trục evidence_tier + assertion_method cho bảng phát biểu (PL15 task 1)`.

Phục vụ E3. independent: false (Task 2 đọc seed).

### Task 2: Migration 045 — bảng, chỉ-thêm, nguồn gốc

**Files:**
- Create: `db/migrations/045_phat_bieu_va_phan_xu.sql` (mục 1–4 dưới; mục 5–7 ở Task 3–4)
- Create: `pipeline/scripts/phat-bieu-db.itest.mjs` (ca PD-AC-1, PD-AC-2; helper `trongGiaoDich`, `napMigration045`)

**Interfaces:**
- Produces (SQL): bảng `field_assertions` (cột như design §4; `value_key text NOT NULL GENERATED ALWAYS AS
  (lower(btrim(value))) STORED`); chỉ mục `field_assertions_live_uq` UNIQUE `(subject_key, field, value_key, method,
  coalesce(rule_id,''))` WHERE `retracted_at IS NULL`; chỉ mục `(subject_key, field)` WHERE sống; trigger
  `field_assertions_guard` (BEFORE INSERT kiểm cặp lớp↔phương pháp; BEFORE UPDATE chỉ cho đặt `retracted_at` +
  `retract_reason` một lần; BEFORE DELETE lỗi) và `field_assertions_no_truncate` (BEFORE TRUNCATE); cột
  `sale_offer_records.field_provenance jsonb NOT NULL DEFAULT '{}'`; `CREATE OR REPLACE VIEW sale_offers` (SELECT * …
  WHERE retired_at IS NULL); `ref_lookup` + `ref_field_lookup` cho hai trục mới và `field_assertions.field`.
- Produces (JS test helper, xuất khẩu từ itest): `trongGiaoDich(client, fn)`, `napMigration045(client)` (nạp tệp khi
  `to_regclass('field_assertions') IS NULL`, ngược lại vẫn nạp lại = kiểm idempotent).

- [ ] Viết PD-AC-1 (ma trận CHECK đọc từ `VOCAB`, chèn trùng → lỗi chỉ mục, rút rồi chèn lại được, cột provenance trên
  view, `v_ruler_p2*` chạy, băm (offer_id, 5 cột) trước = sau) và PD-AC-2 (ma trận 6 dòng chặn + rút + đối chứng DROP
  TRIGGER trong savepoint). Chạy → đỏ (chưa có tệp 045).
- [ ] Viết mục 1–4 của 045. CHECK cột: `field`, `evidence_tier`, `method` mỗi cột MỘT CHECK literal riêng (bộ
  `--check-db` lấy CHECK đầu tiên chứa tên cột) — cặp lớp↔phương pháp nằm trong trigger, không trong CHECK.
- [ ] `cd pipeline && node --test --test-name-pattern 'PD-AC-[12]' scripts/phat-bieu-db.itest.mjs` → pass.
- [ ] Phá-thử: bỏ một nhánh trigger trong bản sao → PD-AC-2 đỏ đúng thông điệp; hoàn lại.
- [ ] Commit `feat(db): 045 bảng phát biểu chỉ-thêm + nguồn gốc ô (PL15 task 2)`.

Phục vụ E1, E2, E3, E4. independent: false.

### Task 3: Bộ phân xử + cổng cắt chuyển

**Files:**
- Modify: `db/migrations/045_phat_bieu_va_phan_xu.sql` (mục 5: `offer_subject_keys`, `assertion_rank`,
  `resolve_offer_fields`)
- Create: `pipeline/lib/assert.mjs`
- Create: `pipeline/scripts/fixtures/phan-xu-ma-tran.json`
- Modify: `pipeline/scripts/phat-bieu-db.itest.mjs` (PD-AC-3 ma trận, đảo thứ tự, chủ thể lạ; PD-AC-8 cổng phần resolve)

**Interfaces:**
- Produces (SQL): `offer_subject_keys(o sale_offer_records) RETURNS text[]` (S06 → `ARRAY[source||':'||osk]`; còn lại →
  `source||':'||post_id` cho mỗi `post_ids`, thêm post neo nếu thiếu, distinct); `resolve_offer_fields(p_offer_ids
  text[]) RETURNS jsonb` `{"offers":n,"cells_changed":m}` — `NULL` = mọi bản ghi; đầu thân: cổng → `RAISE EXCEPTION
  'phân xử: chưa cắt chuyển …'`. Mục provenance mỗi trường: `{"v":…, "tier":…, "method":…, "ids":[…], "conflict":bool,
  "lower_disagree":bool, "measured":false}`; ô chỉ suy luận: `{"goi_y":[{"v","method","ids"}]}` không `v`. Chỉ UPDATE
  bản ghi có ô hay provenance khác (đếm `cells_changed`).
- Produces (JS, `pipeline/lib/assert.mjs`): `subjectKey(source: string, id: string|number): string`;
  `writeAssertions(client, rows: Array<{subject_key, field, value, evidence_tier, method, method_version?, rule_id?,
  evidence?, observed_at?, changed_by?, run_id?}>, { replaceOwn = false } = {}): Promise<{inserted:number,
  retracted:number}>` — một câu `INSERT … SELECT FROM unnest(...) ON CONFLICT DO NOTHING`; `replaceOwn` rút trước
  (`thay-boi-luot`) phát biểu sống cùng `(subject_key, field, method)` khác `value_key`; `resolveOffers(client, offerIds:
  string[]|null): Promise<{offers, cells_changed}>`.

- [ ] Viết fixture ≥ 12 ca (tên: `khong-phat-bieu`, `fact-trai-observed`, `hitl-trai-source-field`,
  `cung-lop-dong-thuan`, `cung-lop-bat-dong`, `legacy-thua-parser`, `chi-inferred`, `da-rut`, `hai-post-hop`,
  `hai-post-bat-dong`, `so-chuan-hoa`, `post-ids-rong`, `chu-the-la`) — mỗi ca: phát biểu chèn + cột kỳ vọng + cờ kỳ vọng.
- [ ] Viết PD-AC-3 (số assert = Σ trường có kỳ vọng), ca đảo thứ tự, ca chủ thể lạ; PD-AC-8-cong-resolve (không audit →
  lỗi ghim, băm trước = sau; có audit trong savepoint → chạy). Chạy → đỏ.
- [ ] Viết mục 5 của 045 (set-based: CTE phát biểu sống theo chủ thể → xếp `(tier_rank, method_rank, n_chu_the DESC,
  value_key)` → `DISTINCT ON (offer_id, field)`), và `assert.mjs`.
- [ ] `node --test --test-name-pattern 'PD-AC-3|PD-AC-8 cổng' scripts/phat-bieu-db.itest.mjs` → pass.
- [ ] Phá-thử: đổi hạng legacy lên 1 → ca `legacy-thua-parser` đỏ nêu tên ca; hoàn lại.
- [ ] Commit `feat(db): bộ phân xử ba lớp + cổng cắt chuyển (PL15 task 3)`.

Phục vụ E5, E15. independent: false.

### Task 4: Đường enrich qua phát biểu

**Files:**
- Modify: `db/migrations/045_phat_bieu_va_phan_xu.sql` (mục 6–7: `apply_enrichment`, `revert_enrichment` CREATE OR
  REPLACE cùng chữ ký 033/036)
- Modify: `pipeline/scripts/phat-bieu-db.itest.mjs` (PD-AC-6 ma trận + đảo thứ tự + `hitl-cung-gia-tri`; PD-AC-8 cổng
  phần apply/revert)
- Modify: `agent/tests/enrich-db.test.ts` (ca ghim fill-gap đổi theo nghĩa mới; tên ca nêu «theo thứ tự phương pháp»;
  mồi `ops_audit phat-bieu:cat-chuyen` trong giao dịch test)

**Interfaces:**
- Consumes: `resolve_offer_fields`, `offer_subject_keys` (Task 3).
- Produces: `apply_enrichment(p_ids bigint[], p_actor text) RETURNS integer` — mỗi đề xuất queued → phát biểu trên
  `source||':'||originating_system_key` của tin: actor `hitl:%` → `fact/hitl`, `changed_by = p_actor`, rút hitl sống
  khác giá trị (`hitl-thay`); còn lại `observed/e1_rule|e2_llm`, `run_id = r.run_id`, `evidence = r.evidence` + id đề
  xuất; rồi `resolve_offer_fields(<tin chạm>)`; `applied` khi cột = `value_key` đề xuất (so lower), ngược lại `skipped`;
  cascade `properties` giữ nguyên 033. `revert_enrichment(p_ids, p_actor, p_reason)` — giữ kiểm actor/lý do 036, rút
  phát biểu của đề xuất (`evidence->>'proposal_id'`), `hoan-tac:<lý do>`, phân xử lại, mở lại `superseded` như 036,
  ghi `ops_audit enrich:revert`.

- [ ] Viết PD-AC-6 theo ma trận E10 + ca `hitl-cung-gia-tri`; PD-AC-8 cổng (apply, revert). Chạy → đỏ.
- [ ] Viết mục 6–7.
- [ ] `node --test --test-name-pattern 'PD-AC-6|PD-AC-8 cổng' scripts/phat-bieu-db.itest.mjs` → pass.
- [ ] Sửa `agent/tests/enrich-db.test.ts`; `cd agent && npm test` → pass.
- [ ] Commit `feat(db): apply/revert enrichment qua phát biểu + phân xử (PL15 task 4)`.

Phục vụ E10, E11, E15. independent: false.

### Task 5: Ba transform ghi phát biểu

**Files:**
- Modify: `pipeline/lib/write-offers.mjs` (bỏ `ENRICH_COLS` và năm cột khỏi upsert; tham số `assertions`; gọi
  `resolveOffers` sau đối soát)
- Modify: `pipeline/transform-zalo.mjs`, `pipeline/transform-fb.mjs` (mỗi post có `bedrooms` → một phát biểu
  `observed/parser`, `method_version 'transform-zalo@045'`/`'transform-fb@045'`, `observed_at = posted_at`; bỏ
  `property_type: "unknown"` khỏi hàng)
- Modify: `pipeline/transform-chotot.mjs` (bỏ `property_type` khỏi INSERT/UPDATE; gom phát biểu `fact/source_field`
  `rule_id 'category:<n>'` và `'rooms'`, `observed_at = list_time`; ghi lô + `resolveOffers(<tin S06 của lượt>)` cuối lượt)
- Modify: `pipeline/scripts/write-offers.test.mjs`, `pipeline/scripts/nap-lai*.mjs` (chỗ còn dùng `ENRICH_COLS` hay
  COALESCE bedrooms), `pipeline/lib/nap-lai-matrix.mjs` nếu gieo dữ liệu qua năm cột
- Modify: `pipeline/scripts/phat-bieu-db.itest.mjs` (PD-AC-5 S06/S03/S05/ghi-SQL/lượt rỗng; PD-AC-9; PD-AC-8 cổng phần
  transform)

**Interfaces:**
- Consumes: `writeAssertions`, `resolveOffers`, `subjectKey` (Task 3).
- Produces: `writeOffers(client, source, offers, { actor, assertions = [] })` — `assertions` ghi bằng
  `writeAssertions(..., { replaceOwn: true })` SAU upsert, TRƯỚC `resolveOffers(offers.map(o => o.offer_id))`; lượt rỗng
  vẫn ném trước mọi ghi.

- [ ] Viết PD-AC-5 (bốn ca + ghi-SQL qua client giả + lượt rỗng), PD-AC-9, PD-AC-8 cổng transform. Chạy → đỏ.
- [ ] Sửa bốn tệp đường ghi.
- [ ] `node --test scripts/phat-bieu-db.itest.mjs` và `cd pipeline && npm test` và `node --test scripts/nap-lai-db.itest.mjs`
  → pass; `node pipeline/scripts/nap-lai-ba-luot.mjs` → `ĐẠT` (thước tự nạp 045 + cắt chuyển trong giao dịch nếu cần —
  thêm vào thước khi nó gọi transform mới).
- [ ] Commit `feat(pipeline): transform S03/S05/S06 ghi phát biểu rồi phân xử, gỡ ENRICH_COLS (PL15 task 5)`.

Phục vụ E8, E16, E17. independent: false.

### Task 6: Bộ quét ghi thẳng + ma trận chỗ gọi + rào cloud

**Files:**
- Create: `pipeline/lib/scan-canonical-write.mjs`, `pipeline/lib/enrich-call-sites.mjs`
- Create: `pipeline/scripts/phat-bieu.test.mjs` (PB-AC-5, PB-AC-6, PB-AC-10)
- Modify: `pipeline/scripts/phat-bieu-db.itest.mjs` (ca PD-AC-5 pg_proc + đối chứng hàm cấy)

**Interfaces:**
- Produces: `scanCanonicalWrite(files: Array<{path, text}>, fields: string[]): string[]` (`'<path>:<line>'`; câu là
  chuỗi từ `UPDATE|INSERT INTO` tới `;` hoặc hết template, gộp nhiều dòng; bỏ thân `resolve_offer_fields`);
  `scanProcs(client, fields): Promise<string[]>` (tên hàm); `CALL_SITES: Array<{file, fn, vai: 'nguoi'|'may'}>` (ba
  phần tử hôm nay); `readActorPrefix(text, line): string|null`; `cloudLeaks(allow, fill): string[]`.
- Consumes: `CLOUD_ALLOW`, `FILL` từ `sync-cloud.mjs`; `VOCAB.enrich_field`.

- [ ] Viết ba ca PB + ca pg_proc (ma trận đối chứng 6 dạng viết trước; số assert = 6). Chạy → đỏ.
- [ ] Viết hai lib.
- [ ] `cd pipeline && node --test scripts/phat-bieu.test.mjs` + itest ca pg_proc → pass; phá-thử cấy một dòng thật →
  đỏ nêu tệp:dòng; hoàn lại.
- [ ] Commit `test(pipeline): quét ghi thẳng năm cột, chỗ gọi enrich, rào cloud (PL15 task 6)`.

Phục vụ E9, E19, E22. independent: false (quét cây thật cần Task 4–5 xong).

### Task 7: Lệnh cắt chuyển

**Files:**
- Create: `pipeline/phat-bieu-cat-chuyen.mjs`
- Modify: `pipeline/scripts/phat-bieu-db.itest.mjs` (PD-AC-8)

**Interfaces:**
- Produces: `chupMoc(client): Promise<Map<string, string|null>>` (khoá `offer_id|field`, mọi bản ghi tin, năm trường);
  `catChuyen(client, { actor = 'cat-chuyen:045', ghiAudit = true }): Promise<{truoc, sau, legacyMoi, s05NullUnknown:
  string[], lech: Array<{offer_id, field, truoc, sau}>}>` — ghi legacy cho ô khác mặc định chưa có phát biểu sống đỡ
  (chủ thể = post neo / list_id), ghi `ops_audit phat-bieu:cat-chuyen` (mở cổng) rồi `resolve_offer_fields(NULL)`, so
  từng ô với mốc. CLI: `--thu` = BEGIN … ROLLBACK, in hai bảng + `legacy mới`, lượt hai, `cat-chuyen --thu: ĐẠT
  (ROLLBACK)`; không cờ = COMMIT thật (bước sau merge). Nạp 045 trong giao dịch khi DB chưa áp.

- [ ] Viết PD-AC-8 (ca dương, chạy lại 0, đối chứng có parser). Chạy → đỏ.
- [ ] Viết lệnh; `node pipeline/phat-bieu-cat-chuyen.mjs --thu` → `ĐẠT`, đếm `field_assertions`/`ops_audit` trước = sau.
- [ ] Commit `feat(pipeline): lệnh cắt chuyển giá trị có sẵn thành phát biểu legacy (PL15 task 7)`.

Phục vụ E14, E15. independent: false.

### Task 8: Thước dựng lại + kiểm nguồn gốc

**Files:**
- Create: `pipeline/scripts/dung-lai-canonical.mjs`
- Modify: `pipeline/scripts/phat-bieu-db.itest.mjs` (PD-AC-4 đối chứng, PD-AC-7 ba đối chứng qua tiến trình con)

**Interfaces:**
- Consumes: `chupMoc`, `catChuyen` (Task 7).
- Produces: `kiemNguonGoc(client): Promise<{nO, moCoi: Array<{offer_id, field, ly_do}>}>`; `dungLai(client, { doiChung })
  : Promise<{N, maTran, lech, luotHai}>`. CLI mặc định: một giao dịch — nạp 045 khi chưa áp → `chupMoc` → `catChuyen` →
  đặt năm cột mặc định + `field_provenance '{}'` (UPDATE thẳng trong giao dịch đo) → `resolve_offer_fields(NULL)` → so
  với mốc (trừ `s05NullUnknown`) → lượt hai `cells_changed = 0` → ROLLBACK; in ma trận + `dung-lai: ĐẠT`. `--nguon-goc`;
  `--doi-chung=ghi-thang|rut|legacy-khac` → exit 1 khi thấy lệch (đúng chờ đợi). N = 0 → exit 2.

- [ ] Viết PD-AC-4 + PD-AC-7. Chạy → đỏ.
- [ ] Viết lệnh; chạy ba chế độ + `--nguon-goc` trên DB local → kết quả như E6, E12, E13.
- [ ] Commit `feat(pipeline): thước xoá-rồi-dựng-lại năm cột + kiểm nguồn gốc (PL15 task 8)`.

Phục vụ E6, E7, E12, E13. independent: false.

### Task 9: Chạy thật, cấu hình, tài liệu

**Files:**
- Create: `pipeline/scripts/phat-bieu-chay-that.mjs` (một giao dịch: 045 khi chưa áp → `catChuyen` → `runTransformChotot`,
  `runTransformZalo`, `runTransformFb` → `resolve_offer_fields(NULL)`; in giây từng bước; tổng > 300 → exit 1 nêu bước
  chậm nhất; ROLLBACK)
- Modify: `pipeline/CLAUDE.md` (bảng script + Gotcha «năm cột chỉ qua phân xử; cắt chuyển trước lượt đêm đầu»),
  `docs/ops/runtime-map.md` (bước triển khai sau merge: pull → `node pipeline/phat-bieu-cat-chuyen.mjs` → lượt đêm),
  `docs/ROADMAP.md` (§2 as-built + §4 trạng thái PL15), `docs/architecture/classification-enrich-review.md` §7.0 (thang ba
  lớp: Mạnh đồng ý 26/10 qua PL15 Hỏi-1)
- Verify config: các khoá executors đã thêm ở S1 (`phat_bieu`, `phat_bieu_db`, `idem_045`, `dung_lai`, `nguon_goc`,
  `cat_chuyen_thu`, `chay_that_thu`)

- [ ] Viết lệnh; `node pipeline/scripts/phat-bieu-chay-that.mjs --thu` → `ĐẠT (ROLLBACK)`, tổng ≤ 300.
- [ ] `bash db/check-idempotent.sh db/migrations/045_phat_bieu_va_phan_xu.sql field_assertions sale_offer_records` →
  `IDEMPOTENT PASS` (áp thật DB local — cổng giữ phân xử đóng tới cắt chuyển sau merge); `node pipeline/vocab.mjs
  --check-db` → khớp.
- [ ] `/verify` cho pipeline, agent, app.
- [ ] Commit `docs(pl15): chạy thật, bước triển khai sau merge, ROADMAP (PL15 task 9)`.

Phục vụ E1, E3, E18, E20, E21. independent: false.
