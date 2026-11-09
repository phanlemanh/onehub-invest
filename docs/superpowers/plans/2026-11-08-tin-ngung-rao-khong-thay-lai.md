# Tin ngừng rao khi không thấy lại — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migration 085 thêm luật «không thấy lại quá 21 ngày khi nguồn vẫn thu → ngừng rao (`withdrawn`, suy luận)» vào PL19,
sửa chỗ 059 dội phát biểu ấy, và `trang-thai-chao.mjs` chạy luật (bỏ qua êm khi DB chưa áp 085, có `--thu`).

**Architecture:** Toàn bộ luật nằm trong SQL (085): một hàm N, một hàm bằng chứng (đọc lần thấy cuối và mốc thu theo
nguồn), một hàm ghi (chèn/rút phát biểu), cộng bản thay `bang_chung_chao`. Lệnh Node chỉ nối thứ tự gọi trong một giao
dịch dưới khoá 56056. Phân xử `resolve_offer_status` của 059 giữ nguyên.

**Tech Stack:** PostgreSQL 16 + PostGIS (:5433), Node `.mjs` (`pg`), `node:test`, `db/db-thu.sh --chay`.

**Spec:** `docs/superpowers/specs/2026-11-08-tin-ngung-rao-khong-thay-lai-design.md` · hợp đồng
`_acceptance/tin-ngung-rao-khong-thay-lai/contract.md` (approved 2026-11-09) · evals `…/evals.yaml` E1–E10, E9b.

## Global Constraints

- N = 21 ngày cho `S03`, `S05`, `S06`; nguồn khác NULL (luật không đụng). N chỉ ở `ngung_rao_sau_ngay(source text) → integer`.
- Điều kiện ngừng rao: `moc_thu − lan_thay_cuoi > N ngày` (nghiêm ngặt; đúng 21 ngày còn `active`).
- Phát biểu luật: `field = 'offer_status'`, `value = 'withdrawn'`, `evidence_tier 'inferred'`, `method 'e1_rule'`,
  `method_version '085'`, `rule_id 'khong-thay-lai:' || offer_id`, `subject_key` = `subj` của 059 (`source || ':' ||
  coalesce(originating_system_key, post_ids[1])`), `observed_at = lan_thay_cuoi + N ngày`, evidence
  `{offer_id, bang_chung: 'khong-thay-lai', n_ngay, lan_thay_cuoi, moc_thu}`. Rút: `retract_reason 'thay-lai'`.
- Không xoá, không `UPDATE sale_offer_records` trong 085 ngoài đường của `resolve_offer_status`; không chạm `retired_*`, `seller_*`.
- Không thêm giá trị vào trục `offer_status`; không sửa migration đã commit (059 thay bằng CREATE OR REPLACE trong 085).
- Không áp 085 lên DB `oneinvest`; test chạy qua `config:executors.test.tnr_db` / `tnr_pl19` (DB của riêng lượt).
- Idempotent: mọi hàm `CREATE OR REPLACE`, không DDL bảng.
- Chuỗi in và thông điệp đỏ đúng nguyên văn trong `evals.yaml` (vd «TNR-AC-1 tin thiếu dòng stg bị ngừng rao»).
- Thông điệp người đọc tiếng Việt; tên hàm, cột tiếng Anh/không dấu như 059.

## Review Focus

1. `stg_chotot_ads.list_id` là `bigint`, `originating_system_key` là `text` — nối bằng `s.list_id::text = r.originating_system_key`;
   khoá S06 không phải số (dữ liệu cũ) không được làm câu lỗi cast. Ca: Task 1 thêm tin S06 có `originating_system_key 'abc'` → không lỗi, 0 phát biểu.
2. Tin S03 có `post_ids` rỗng hoặc mọi `post_id` không còn trong `stg_zalo_posts` → không có mốc thu → bỏ qua (không lấy
   mốc cả nguồn). Ca: Task 2, tin S03 `post_ids = '{khong-co}'` → 0 phát biểu.
3. Tin vừa ngừng rao rồi lại tụt với lần thấy cuối MỚI (thấy lại một lần rồi im tiếp) → phát biểu cũ rút `thay-lai`,
   phát biểu mới `observed_at` theo lần thấy cuối mới; chạy lại vẫn 0/0. Ca: Task 3.
4. DB đã áp 085 nhưng tin có phát biểu `withdrawn` nguồn (`het-trong-luot`) và tin đã nghỉ → luật không chèn (AC-6). Ca: Task 2.
5. Hai lượt `trang-thai-chao` cùng lúc → xếp hàng ở khoá 56056 (giữ `pg_advisory_xact_lock(KHOA)` ở đầu `chay`). Không thêm ca
   (đã có ở PL19); Task 4 chỉ không được bỏ dòng khoá.

---

## Cấu trúc tệp

| Tệp | Việc |
|---|---|
| Tạo `db/migrations/085_ngung_rao_khong_thay_lai.sql` | 4 hàm: `ngung_rao_sau_ngay`, `bang_chung_khong_thay_lai`, `ghi_khong_thay_lai`, bản thay `bang_chung_chao` |
| Tạo `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs` | Mọi ca TNR-AC-1…10, khung giao dịch ROLLBACK nạp 059 → 085 |
| Sửa `pipeline/trang-thai-chao.mjs` | gọi luật, kiểm `to_regproc`, dòng in thêm, `--thu` |
| Sửa `pipeline/scripts/trang-thai-chao.itest.mjs`, `pipeline/scripts/bac-du-lieu.itest.mjs` | env `PL19_NAP_THEM` nạp thêm tệp sau 059 |
| Sửa `CONTEXT.md` | mục «Trạng thái chào» + thuật ngữ «Ngừng rao» |
| Sửa `pipeline/CLAUDE.md`, `docs/ROADMAP.md` | dòng `trang-thai-chao.mjs`; §2 as-built, §4 trạng thái |

Thứ tự ca trong itest (node:test chạy theo thứ tự tệp, `--test-concurrency=1`): TNR-AC-8 chưa áp → TNR-AC-9 áp hai lần
(COMMIT) → các ca trong giao dịch (AC-1…7) → TNR-AC-8 đã áp → TNR-AC-10.

---

### Task 1: Khung itest + 085 lõi S06 (AC-1, AC-7 biên, AC-9)

**Independent:** không (mọi task sau dùng khung và 085). **Evals:** E1, E7 (phần biên), E9.

**Files:** Tạo `db/migrations/085_ngung_rao_khong_thay_lai.sql` (qua `/new-migration`, KHÔNG bước áp lên `oneinvest`),
tạo `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`.

**Interfaces — Produces:**
- SQL `ngung_rao_sau_ngay(p_source text) RETURNS integer` (IMMUTABLE): 21 cho S03/S05/S06, NULL khác.
- SQL `bang_chung_khong_thay_lai(p_offer_ids text[]) RETURNS TABLE (offer_id text, subj text, n_ngay integer,
  lan_thay_cuoi timestamptz, moc_thu timestamptz, cu_id bigint, cu_at timestamptz)` (STABLE). Một dòng mỗi tin sống
  (`retired_at IS NULL`) của nguồn có N, có `lan_thay_cuoi` và `moc_thu`, VÀ (đang tụt `> N`) HOẶC (đang có phát biểu luật
  sống `cu_id`). `cu_id/cu_at` = phát biểu sống `rule_id = 'khong-thay-lai:'||offer_id` (NULL nếu không).
  S06: `lan_thay_cuoi = greatest(r.last_seen, s.captured_at)`, nối `JOIN stg_chotot_ads s ON s.list_id::text = r.originating_system_key`
  (thiếu dòng stg → không có dòng), `moc_thu = max(captured_at)` theo `(region_v2, ad_type)` của toàn bảng stg.
  Tin có phát biểu `withdrawn` nguồn sống (`rule_id 'offer:'||offer_id`, method `source_field`) → loại.
- SQL `ghi_khong_thay_lai(p_offer_ids text[]) RETURNS jsonb` `{"moi": int, "rut": int}` (plpgsql): rút trước —
  `cu_id` mà tin không còn tụt, hoặc `cu_at <> lan_thay_cuoi + n_ngay` → `retracted_at = clock_timestamp(), retract_reason 'thay-lai'`;
  rồi chèn cho tin tụt mà không còn phát biểu sống, `ON CONFLICT DO NOTHING`.
- JS (trong itest): `trongGiaoDich(fn, { sql059 = …, sql085 = docTep(085) })` — BEGIN, khoá `KHOA`, nạp 059 qua
  `sqlNapLai` (`lib/nap-view-song.mjs`) rồi 085, chạy `fn(c)`, ROLLBACK. Fixture: `tin({source, last_seen, first_seen,
  retired_at, retired_reason, post_ids, osk})`, `stgS06({list_id, captured_at, region_v2: 99901, ad_type: 's'})`,
  `stgZalo({post_id, group_name, posted_at})`; mốc vùng giả dựng bằng một dòng stg `captured_at = MOC`.
  `list_id` fixture = số âm theo pid để không đụng dữ liệu thật.

- [ ] **Step 1: Viết ca TNR-AC-9 và TNR-AC-1 (đỏ trước).**
  - «TNR-AC-9 áp hai lần»: đọc 085, chạy hai lần mỗi lần `BEGIN; <085>; COMMIT` → không ném; `to_regproc` ba hàm khác NULL.
    Chiều đỏ: bản chép thay `CREATE OR REPLACE FUNCTION ngung_rao_sau_ngay` → `CREATE FUNCTION ngung_rao_sau_ngay` chạy lần hai trong giao dịch ROLLBACK phải ném; assert thông điệp «TNR-AC-9 áp lần hai lỗi».
  - «TNR-AC-1»: A (`captured_at = MOC − 22 ngày`, `last_seen = first_seen = MOC − 40 ngày`), B (`last_seen = MOC − 40`,
    `captured_at = MOC − 1`), E (S06 không dòng stg, `last_seen = MOC − 40`), F (S06 `osk 'abc'`). Sau `ghi_bang_chung_chao(NULL)`,
    `ghi_khong_thay_lai(NULL)`, `resolve_offer_status(NULL)`: A `withdrawn`, phát biểu thắng đúng các trường Global Constraints,
    `observed_at = captured_at(A) + 21 ngày`, evidence `n_ngay = 21`; B `active`; E, F 0 phát biểu `khong-thay-lai:%`.
    Hai chiều đỏ đúng E1 (thay chuỗi trong bản chép 085: nhánh dùng `r.last_seen` cho tin thiếu stg; `lan_thay_cuoi` từ `r.last_seen`).
- [ ] **Step 2:** `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tnr --chay node --test --test-concurrency=1 scripts/trang-thai-chao-ngung-rao.itest.mjs` → đỏ (thiếu tệp 085).
- [ ] **Step 3:** Viết 085 (header theo mẫu 059: `-- 085_ngung_rao_khong_thay_lai.sql — V6 tin-ngung-rao-khong-thay-lai: …`,
  trỏ spec; không cờ cloud). Các chuỗi ca đỏ thay phải có nguyên văn trong 085 — mỗi ca đỏ `assert.ok(sql085.includes(cu))` trước khi thay (khuôn của PL19 itest).
- [ ] **Step 4:** Thêm «TNR-AC-7 biên»: `ngung_rao_sau_ngay` 21/21/21/NULL cho S03/S05/S06/S01; tin S06 tụt đúng 21 ngày → `active`,
  21 ngày + 1 giây → `withdrawn`; đỏ khi bản chép đổi `>` thành `>=` («TNR-AC-7 biên N»). Chạy lại Step 2 → xanh.
- [ ] **Step 5:** Commit `feat(pipeline): 085 luật không thấy lại → ngừng rao, lõi S06 (V6)`.

### Task 2: Mốc thu S03 theo nhóm, S05 theo nguồn; tin đã nghỉ và nguồn không N (AC-2, AC-5, AC-6)

**Independent:** không (sửa 085 của Task 1). **Evals:** E2, E5, E6.

**Files:** Sửa `db/migrations/085_ngung_rao_khong_thay_lai.sql`, `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`.

**Interfaces — Consumes:** khung + fixture Task 1. **Produces:** `bang_chung_khong_thay_lai` phủ S03/S05 với cùng chữ ký.
- S03: `lan_thay_cuoi = r.last_seen`; `moc_thu = max(g.posted_at)` trên mọi bài của các nhóm có `post_id = ANY (r.post_ids)`
  (`stg_zalo_posts p` → `group_name` → `stg_zalo_posts g`). Không nối được nhóm → không dòng.
- S05: `lan_thay_cuoi = r.last_seen`; `moc_thu = max(last_seen)` của tin sống S05.

- [ ] **Step 1:** Viết «TNR-AC-2» đúng E2 (nhóm X ngừng, Y đang thu; C, D, X1; khối S05 đặt mọi tin sống S05 `last_seen = now() − 60 ngày`)
  cộng tin S03 `post_ids '{khong-co}'` (Review Focus 2) → 0 phát biểu. Hai chiều đỏ của E2.
- [ ] **Step 2:** Viết «TNR-AC-6» (bốn ô ma trận E6, so trạng thái với giao dịch riêng chỉ nạp 059; 4 × 2 assert; đối chứng A; đỏ khi bỏ `retired_at IS NULL`).
- [ ] **Step 3:** Viết «TNR-AC-5» (chụp sáu cột mọi dòng `sale_offer_records` + `count(sale_offers)` trước/sau; A đổi; chiều đỏ: bản chép chèn
  `UPDATE sale_offer_records SET retired_at = now() WHERE offer_id = …` vào `ghi_khong_thay_lai` → «TNR-AC-5 ngừng rao chạm dòng tin»).
- [ ] **Step 4:** Chạy lệnh Task 1 Step 2 → đỏ ở AC-2; viết nhánh S03/S05 trong 085 → xanh cả tệp.
- [ ] **Step 5:** Commit `feat(pipeline): 085 mốc thu S03 theo nhóm, S05 theo nguồn (V6)`.

### Task 3: Không dội, thấy lại (AC-3, AC-4)

**Independent:** không. **Evals:** E3, E4.

**Files:** Sửa `db/migrations/085_ngung_rao_khong_thay_lai.sql`, `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`.

**Interfaces — Produces:** `bang_chung_chao(p_offer_ids text[])` bản 085 — chép NGUYÊN chữ ký, kiểu trả và thân 059 §5b, chỉ thêm
vào câu con `doi_at` điều kiện `AND coalesce(fa.rule_id, '') NOT LIKE 'khong-thay-lai:%'`.

- [ ] **Step 1:** Viết «TNR-AC-3» (fixture AC-1 + AC-2, ba vòng ghi/ghi luật/phân xử; vòng 2, 3: `moi = rut = 0` ở cả hai hàm,
  trạng thái như vòng 1, không phát biểu nào của fixture `retract_reason 'quay-lai'`; chiều đỏ: nạp lại thân 059 của `bang_chung_chao` sau 085 → «TNR-AC-3 phát biểu ngừng rao bị dội»).
- [ ] **Step 2:** Viết «TNR-AC-4» đúng E4 (đặt `captured_at(A) = MOC`, `last_seen(C) = M`; rút `thay-lai`; `history_transactional` của A
  đúng hai dòng `withdrawn` rồi `back_on_market`; chiều đỏ bỏ câu rút) + ca Review Focus 3 (A tụt lại với lần thấy cuối mới → một phát biểu sống, `observed_at` mới; vòng kế 0/0).
- [ ] **Step 3:** Chạy → đỏ ở AC-3; thêm bản thay `bang_chung_chao` vào 085 → xanh cả tệp.
- [ ] **Step 4:** Commit `fix(pipeline): 085 bang_chung_chao bỏ phát biểu khong-thay-lai khỏi doi_at (V6)`.

### Task 4: Lệnh `trang-thai-chao.mjs` (AC-8)

**Independent:** không (cần 085 cho ca «đã áp»). **Evals:** E8.

**Files:** Sửa `pipeline/trang-thai-chao.mjs`, `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`, `pipeline/CLAUDE.md` (dòng bảng).

**Interfaces — Produces:**
- `chay(client) → { moi, rut, dem, tong, luat }`; `luat` = `null` khi `to_regproc('ghi_khong_thay_lai') IS NULL`, ngược lại
  `{ moi, rut, theoNguon: { S03: n, S05: n, S06: n } }` (`theoNguon` = số tin sống có `offer_status = 'withdrawn'` và có
  phát biểu sống `rule_id = 'khong-thay-lai:' || offer_id`, đếm sau phân xử).
- Thứ tự: khoá → `ghi_bang_chung_chao(NULL)` → `ghi_khong_thay_lai(NULL)` (nếu có) → `resolve_offer_status(NULL)` → đếm.
- `dongIn(kq)` giữ nguyên chữ 059 (dòng `trang-thai-chao: …` khớp từng chữ bản main); thêm `dongLuat(kq)`:
  `luat === null` → `trang-thai-chao: chưa áp 085 — bỏ qua luật không thấy lại`; ngược lại
  `trang-thai-chao: ngừng rao S03 <n> · S05 <n> · S06 <n> · <moi> phát biểu luật mới · <rut> rút`.
- `main()` đọc `--thu` từ `process.argv`: có cờ → ROLLBACK thay COMMIT, in thêm dòng `trang-thai-chao: --thu, đã hoàn tác`.

- [ ] **Step 1:** Viết «TNR-AC-8 chưa áp» (đặt đầu tệp, trước TNR-AC-9) đúng E8 (i), (ii): spawn tiến trình con với
  `DATABASE_URL` của lượt; tệp lệnh = `process.env.TNR_LENH ?? "trang-thai-chao.mjs"`; bản main ghi bằng
  `git show origin/main:pipeline/trang-thai-chao.mjs` vào `pipeline/.trang-thai-chao.main-<pid>.mjs` (xoá ở `finally`).
  Viết «TNR-AC-8 đã áp» (sau TNR-AC-9) đúng E8. Ba chiều đỏ: bản chép lệnh ghi cạnh tệp thật rồi spawn qua `TNR_LENH`.
- [ ] **Step 2:** Chạy → đỏ; sửa lệnh → xanh cả tệp.
- [ ] **Step 3:** Cập nhật dòng `trang-thai-chao.mjs` ở `pipeline/CLAUDE.md` (085, `--thu`, «chưa áp 085»). Commit `feat(pipeline): trang-thai-chao chạy luật 085, --thu (V6)`.

### Task 5: PL19 không vỡ khi nạp 085 (AC-9, E9b)

**Independent:** có — chỉ cần tệp 085 tồn tại; chạy song song được với Task 4 sau Task 3. **Evals:** E9b.

**Files:** Sửa `pipeline/scripts/trang-thai-chao.itest.mjs`, `pipeline/scripts/bac-du-lieu.itest.mjs`.

**Interfaces — Produces:** env `PL19_NAP_THEM` = đường tới một tệp SQL (tương đối với `pipeline/`); khi có, mỗi giao dịch của hai
bộ nạp tệp đó NGAY SAU 059, và module in một lần ở cấp tệp `PL19_NAP_THEM: <basename>`. Vắng env → hành vi như cũ.
Ca đỏ của PL19 thay chữ trong `sql059()` vẫn chạy trước tệp nạp thêm (085 đè `bang_chung_chao` — ghi chú ở đầu tệp: ca đỏ nào
thay chữ trong §5b thì cũng phải thay chữ tương ứng trong tệp nạp thêm, hoặc bỏ qua tệp nạp thêm cho ca đó; chọn bỏ qua bằng
tham số `{ them: false }` của `trongGiaoDich`).

- [ ] **Step 1:** Thêm env vào hai tệp; chạy `config:executors.test.tnr_pl19` → mọi ca xanh, stdout có dòng `PL19_NAP_THEM: 085_ngung_rao_khong_thay_lai.sql`.
- [ ] **Step 2:** Chiều đỏ tay (không vào tệp): trỏ `PL19_NAP_THEM` vào bản chép 085 mà `bang_chung_chao` bỏ nhánh `het_trong_luot` → ca gỡ trong lượt của PL19 đỏ; ghi lệnh và kết quả vào thân commit.
- [ ] **Step 3:** Chạy cả bộ không env (`cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tnr19 --chay node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs`) → xanh như main. Commit `test(pipeline): PL19 itest nạp thêm 085 qua PL19_NAP_THEM (V6)`.

### Task 6: Từ vựng, đo dữ liệu thật, tài liệu (AC-7 CONTEXT, AC-10)

**Independent:** không (AC-10 cần Task 4). **Evals:** E7 (CONTEXT), E10.

**Files:** Sửa `CONTEXT.md`, `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`, `docs/ROADMAP.md`.

- [ ] **Step 1:** Viết «TNR-AC-7 CONTEXT» (đọc `CONTEXT.md`, assert đúng E7) và «TNR-AC-10 dữ liệu thật» (cuối tệp; spawn `--thu`, parse
  `S03 <n> · S05 <n> · S06 <n>` từ dòng luật; câu SQL độc lập viết trong tệp test, không gọi hàm 085, `N = 21`, cộng `Number(process.env.TNR_LECH ?? 0)`;
  bằng từng nguồn; in ba số; `count(field_assertions)` trước = sau). Chạy → đỏ ở CONTEXT.
- [ ] **Step 2:** Sửa `CONTEXT.md:222`: bỏ «quá cửa sổ không đổi: tin lâu không thấy lại vẫn giữ trạng thái»; câu mới nêu luật
  (không thấy lại quá 21 ngày khi nguồn hay nhóm vẫn thu là bằng chứng suy luận ngừng rao; thấy lại thì về Đang chào), thêm
  `ghi_khong_thay_lai`, `ngung_rao_sau_ngay` vào dòng Code. Thêm mục ngay sau:
  `**Ngừng rao**: …` · `- Code: offer_status = withdrawn + phát biểu rule_id khong-thay-lai:<offer_id> (085) · RESO: StandardStatus Withdrawn` ·
  `- Slug URL: —` · `_Avoid_: hết hạn, expired, tin chết, rút (rút là nghỉ bản ghi — rác, gộp nhầm)`.
- [ ] **Step 3:** Chạy cả tệp → xanh; chạy chiều đỏ `TNR_LECH=1` → đỏ «TNR-AC-10 lệnh lệch số đếm độc lập».
- [ ] **Step 4:** ROADMAP §2 as-built (PL19 + 085 chưa áp máy thu) và §4 trạng thái V6. Chạy `/verify` cho `pipeline`.
  Commit `docs: CONTEXT Ngừng rao, ROADMAP V6 (085)`.

---

## Sau kế hoạch (không phải task)

S4 xin lượt `s4` của đợt, chạy evals; Gate 2; mở PR (`tu_merge: false`). Áp 085 máy thu: lời riêng của Mạnh sau gộp, `pg_dump` trước,
đo trước bằng `node pipeline/trang-thai-chao.mjs --thu` trên DB thử chép từ máy thu.
