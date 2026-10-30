# PL19 thời gian và hiệu lực — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (phương thức đã chọn của đợt: tuần tự trong
> phiên — Native). Bước dùng ô `- [ ]`.

**Goal:** Mọi phát biểu có `observed_at`; mỗi tin có `offer_status` phân xử từ bằng chứng theo thời gian; giá và trạng
thái thành lịch sử RESO `HistoryTransactional` gom theo căn; căn lên B5 khi đang chào, còn trong cửa sổ 7 ngày và có ≥ 2
mốc giá.

**Architecture:** Một migration 059 (SQL thuần, idempotent) mang toàn bộ luật: điền lùi + NOT NULL, trục cột phát biểu,
cột trạng thái, bộ ghi bằng chứng, bộ phân xử trạng thái, bảng lịch sử + trigger, vị từ B5. Một script mỏng
`pipeline/trang-thai-chao.mjs` gọi hai hàm SQL mỗi lượt cloud-sync, đứng trước `bac-du-lieu`.

**Tech Stack:** PostgreSQL 16 (PostGIS :5433), Node .mjs + `pg`, `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-30-thoi-gian-va-hieu-luc-design.md` · hợp đồng
`_acceptance/thoi-gian-va-hieu-luc/contract.md` (Mạnh duyệt 30/10, Hỏi-1..4 nhánh A) · evals E1–E15.

## Global Constraints

- Số migration **059** (liên làn cấp); 057/058 của P1 chưa gộp — 059 không phụ thuộc chúng.
- Migration chưa gộp chỉ chạy trên DB thử `oneinvest_p2_tg` (`bash db/db-thu.sh oneinvest_p2_tg`); itest nạp 059 trong
  giao dịch `BEGIN … ROLLBACK` dưới `pg_advisory_xact_lock(56056)` (cùng khoá `bac-du-lieu.mjs`). Không `supabase db push`.
- Hook chặn sửa migration đã commit: **059 không commit tới khi Task 5 xong** — các task trước commit test và mã JS.
- Hỏi-1: quá cửa sổ → trạng thái giữ nguyên, không có giá trị «hết hạn». Hỏi-2: `freshness_window()` = `interval '7 days'`
  cho mọi nguồn. Hỏi-3: «có lịch sử giá» = căn có ≥ 2 dòng lịch sử giá (`NewListing` + `PriceChange` của mọi tin gắn).
  Hỏi-4: phát biểu `observed_at` mới nhất thắng; cùng thời điểm mới xét `assertion_method_rank` (045).
- Tên RESO: bảng `history_transactional` (`HistoryTransactional`), `field_name` ∈ {`ListPrice`, `StandardStatus`},
  `change_type` theo lookup RESO `ChangeType` (`NewListing`, `PriceChange`, `Withdrawn`, `BackOnMarket`,
  `ActiveUnderContract`, `Closed`) — trục mới `change_type` trong `mappings.yaml`, `dd_field: ChangeType`.
- Bảng/cột mới chỉ local: không thêm vào FILL của `sync-cloud.mjs`. Nguồn chỉ gọi bằng mã S0x.
- Chữ trong ca test và dòng in khớp nguyên văn `expected` của evals.yaml (thông điệp ghim chiều đỏ).

## Review Focus

1. Tin S06 đổi khoá (`doi_khoa`) rồi tin kế sống — không được thành `withdrawn` (E4 đã ghim; thêm ô tin kế giữ `active`).
2. Tin quay lại sau `withdrawn` mà `last_seen` mới bằng đúng `retired_at` (cùng lượt) — phân xử phải ra `active`, không
   hoà: bộ ghi dùng `greatest(last_seen, retired_at + 1µs)` khi tin đang sống sau nghỉ (Task 3, ô riêng).
3. Lượt nạp S06 đầy đủ ghi lại cùng giá cho ~28k tin — trigger không sinh dòng (E6 ghim) và không làm chậm: đo thời gian
   một UPDATE 28k dòng trên DB thử, ghi số vào evidence.
4. Test cũ chèn `field_assertions` không có `observed_at` (`phat-bieu-db.itest`, `bac-du-lieu.itest`,
   `dung-lai-canonical.mjs`, `write-offers.test`, `agent/tests/helpers/db.ts`, `agent/tests/enrich-apply.test.ts`) — sau
   059 áp lên DB chung chúng đỏ; sửa trong Task 2.
5. Căn không có tin sống nào (mọi tin nghỉ) — `property_data_level` vẫn B0 `truong-loi` như 056, B5 không rò.

---

### Task 1: observed_at bắt buộc, trục cột phát biểu, cột trạng thái

**Files:** Create `db/migrations/059_thoi_gian_hieu_luc.sql` (§1–§3) · Create `pipeline/scripts/trang-thai-chao.itest.mjs`
· Modify `pipeline/mappings.yaml`, `pipeline/lib/vocab.generated.mjs` (sinh), `CONTEXT.md` (sinh) · Modify
`_acceptance/config.yaml` (`idem_059` bỏ `IDEM_TRUOC` — 056 đã có trên DB nền).

**Interfaces — Produces:** cột `sale_offer_records.offer_status text NOT NULL DEFAULT 'unknown'` (CHECK đúng năm giá trị
trục `offer_status`); `field_assertions.field` CHECK = trục `assertion_field` (năm trường enrich + `offer_status`); helper
itest `trongGiaoDich(fn)` (nạp 059, khoá 56056) và `tin({…, source, last_seen, retired_at, retired_reason, post_ids})`.

- [ ] Viết ca `observed_at bắt buộc` (E1): fixture hai phát biểu `legacy` chèn với `observed_at` NULL TRƯỚC khi nạp 059
  (một có tin, một mồ côi) → sau 059: đếm sống thiếu = 0, có-tin = `least(last_seen, created_at)`, mồ côi = `created_at`,
  INSERT không `observed_at` ném lỗi. Chiều đỏ: chạy bản 059 thay `least(...)` bằng `last_seen` → ghim
  `'legacy phải lấy least(last_seen, created_at)'`.
- [ ] Viết ca `cột và trục` (E3): `sale_offers.offer_status` mặc định `unknown`; đọc CHECK từ `pg_constraint` khớp tập sổ;
  `checkDb` của `vocab.mjs` trên DB trong giao dịch trả 0 lệch; chiều đỏ: sổ thêm giá trị giả vào `offer_status` → lệch
  có tên trục.
- [ ] Chạy itest — đỏ (chưa có 059).
- [ ] Viết 059 §1–§3: `field_assertions_guard` bản mới cho phép đúng một UPDATE `observed_at` NULL → giá trị (không cột
  nào khác); điền lùi `legacy` theo `evidence->>'offer_id'` ⋈ `sale_offer_records`; phát biểu không-legacy còn NULL →
  `created_at`; `SET NOT NULL`; constraint `field_assertions_field_chk` drop + add theo `assertion_field`; seed
  `ref_lookup assertion_field` + `ref_field_lookup ('field_assertions','field','assertion_field')`,
  `('sale_offer_records','offer_status','offer_status')`; `ADD COLUMN IF NOT EXISTS offer_status`; tạo lại view
  `sale_offers`. Sổ: trục `assertion_field` (local, 6 điều kiện), `enrich_field.columns` bỏ `field_assertions.field`,
  `offer_status.columns: [sale_offer_records.offer_status]`; `node pipeline/vocab.mjs --write`.
- [ ] Dựng DB thử `bash db/db-thu.sh oneinvest_p2_tg`; chạy `config:executors.test.tg_db` — xanh; `node pipeline/vocab.mjs --check` exit 0.
- [ ] Commit itest + sổ + tệp sinh + config (chưa commit 059).

### Task 2: ba bộ ghi đều ghi observed_at; test cũ mang observed_at

**Files:** Modify `pipeline/lib/assert.mjs` (`writeAssertions`, `phatBieuPhongNgu`), `pipeline/phat-bieu-cat-chuyen.mjs`,
059 §4 (`apply_enrichment` bản 059 — thân 045 + `observed_at = r.created_at`) · Modify writers trong test ở Review Focus 4.

- [ ] Ca `ba bộ ghi đều ghi observed_at` (E2): `writeAssertions` với `observed_at: null` → giá trị ≈ lúc gọi (cách
  `now()` ≤ 5 s); `apply_enrichment` trên đề xuất `created_at` cố định → `observed_at` bằng đúng nó; bước chuyển trên tin
  có `last_seen` cũ → `least(last_seen, created_at)`. Chiều đỏ: bản `apply_enrichment` của 045 → ghim
  `'apply_enrichment phải ghi observed_at'`.
- [ ] Đỏ → sửa: `writeAssertions` thay `observed_at ?? null` bằng `?? new Date()`; INSERT của bước chuyển thêm
  `observed_at = least(o.last_seen, clock_timestamp())`; 059 §4 `CREATE OR REPLACE FUNCTION apply_enrichment` thêm cột.
- [ ] Test cũ chèn phát biểu thêm `observed_at`; chạy `cd pipeline && npm test` và `cd agent && npm test` — xanh.
- [ ] Commit (trừ 059).

### Task 3: bộ ghi bằng chứng + phân xử trạng thái

**Files:** 059 §5 · itest.

**Interfaces — Produces:** `ghi_bang_chung_chao(p_offer_ids text[]) RETURNS jsonb` (`{"moi": n}`),
`resolve_offer_status(p_offer_ids text[]) RETURNS jsonb` (`{"offers": n, "changed": m}`), NULL = mọi tin.

- [ ] Ca `bộ ghi bằng chứng năm dạng` (E4) theo đúng expected; ca đầu–cuối `sống → nghỉ → quay lại`; ô Review Focus 1, 2.
  Chiều đỏ: (a) bản coi `doi_khoa` là gỡ → ghim `'đổi khoá không phải bằng chứng gỡ'`; (b) bản `active` mang `now()` →
  ca đầu–cuối ghim `'tin đã gỡ phải ra withdrawn'`.
- [ ] Ca `phân xử theo thời gian` (E5): bốn ô của AC-5 + ô chỉ-quá-cửa-sổ. Chiều đỏ: bản xếp `method_rank` trước
  `observed_at` → ghim `'trạng thái mới nhất phải thắng'`.
- [ ] Đỏ → viết §5. Bộ ghi: chủ thể = `offer_subject_keys(...)[neo]` như `apply_enrichment`; `active` S06
  `fact/source_field`, S03/S05 `observed/parser`, `observed_at = last_seen`; `withdrawn` chỉ `retired_reason =
  'het_trong_luot'`, `observed_at = retired_at`; tin sống có `withdrawn` sống cũ hơn `last_seen` → rút `active` cũ
  (`retract_reason 'quay-lai'`) rồi ghi mới. Phân xử: `DISTINCT ON (offer_id) ORDER BY observed_at DESC, method_rank,
  id` trên phát biểu sống field `offer_status`; ghi `offer_status` + `field_provenance.offer_status = {v, tier, method,
  ids, observed_at}` chỉ khi khác. `resolve_offer_fields` không đọc field `offer_status` (thêm `fa.field <> 'offer_status'`).
- [ ] tg_db xanh · commit itest.

### Task 4: lịch sử giá và trạng thái

**Files:** 059 §6 · `pipeline/mappings.yaml` (trục `change_type`) · itest.

**Interfaces — Produces:** bảng `history_transactional (id bigserial, resource_name text DEFAULT 'Property',
resource_record_key text, field_name text, previous_value text, new_value text, change_type text,
modification_timestamp timestamptz)`; view `property_price_history (property_id, offer_id, change_type, previous_value,
new_value, modification_timestamp)` chỉ `field_name = 'ListPrice'`.

- [ ] Ca `lịch sử giá và trạng thái` (E6) theo expected; chiều đỏ bản trigger thiếu `IS DISTINCT FROM` → ghim
  `'cùng giá không sinh dòng lịch sử'`. Ô hiệu năng (Review Focus 3): UPDATE cùng giá mọi tin S06 trên DB thử, in số giây.
- [ ] Đỏ → §6: bảng + CHECK `change_type`/`field_name`; unique index một `NewListing` mỗi `resource_record_key`; điền lùi
  `NewListing` (`new_value = price_vnd`, thời điểm `first_seen`) `ON CONFLICT DO NOTHING`; trigger AFTER INSERT
  (`NewListing`), AFTER UPDATE OF `price_vnd` (`PriceChange`, chỉ khi khác), AFTER UPDATE OF `offer_status`
  (`withdrawn`→`Withdrawn`, `active_under_contract`→`ActiveUnderContract`, `closed`→`Closed`, về `active` từ trạng thái
  khác `unknown`→`BackOnMarket`; `unknown`→bất kỳ = lần xác định đầu, không ghi); view qua `property_offers`. Sổ trục
  `change_type` + seed `ref_lookup`/`ref_field_lookup`; `vocab.mjs --write`.
- [ ] tg_db + vocab check xanh · commit.

### Task 5: vị từ B5

**Files:** 059 §7 (`freshness_window()`, `property_data_level` bản 059) · itest · `pipeline/scripts/bac-du-lieu.itest.mjs`
(nạp 059 sau 056 khi tệp có).

- [ ] Ca `B5 và tụt về B4` (E7) đủ sáu căn + ảnh chụp `ghiAnhChup` trước/sau (B5 −1, B4 +1). Chiều đỏ: bản bỏ vế cửa sổ →
  ghim `'quá cửa sổ phải về B4'`; bản lượng từ «mọi tin» → ghim `'căn lấy tin tốt nhất'`.
- [ ] Đỏ → §7: lv 5 khi đủ điều kiện B4 ∧ `o.offer_status = 'active'` ∧ `o.last_seen >= now() - freshness_window()` ∧
  căn có ≥ 2 dòng `property_price_history`; `ke_thieu` 4 → `hieu-luc`, 5 → `giu-nhip`.
- [ ] `config:executors.test.tg_db` và `bac_db` (trỏ `oneinvest_p2_tg`) xanh; `idem_059` exit 0.
- [ ] Commit 059 (lần đầu và duy nhất) + itest.

### Task 6: script trang-thai-chao, phép đo bản chép, nhịp cloud-sync

**Files:** Create `pipeline/trang-thai-chao.mjs`, `pipeline/scripts/trang-thai-roundtrip.mjs` · Modify
`scripts/cloud-sync.sh`, `scripts/job-exit.test.mjs`, `pipeline/CLAUDE.md` (bảng script).

**Interfaces — Produces:** `chay(client) → {moi, dem: {active, active_under_contract, closed, withdrawn, unknown},
tong}`; CLI in `trang-thai-chao: <tong> tin · active … · <moi> phát biểu mới`, thoát 1 khi lỗi DB. Advisory lock 56056.

- [ ] job-exit: dãy bước kết thúc `push-ops-facts`, `trang-thai-chao`, `bac-du-lieu`; ca `trang-thai-chao hỏng → ≠0`.
  Đỏ → thêm `job_run cloud-sync trang-thai-chao node "$ROOT/pipeline/trang-thai-chao.mjs"` ngay trước bước bậc.
- [ ] Roundtrip in đúng các dòng `AC-8 …` của E8 (đếm độc lập bằng SQL riêng; chiều đỏ cổng không DB). Chạy trên
  `oneinvest_p2_tg` (đã áp 059 thật bằng psql — DB thử, không phải DB chung).
- [ ] `config:executors.script.tg_roundtrip` + `job_exit` xanh · commit.

### Task 7: thuật ngữ và bộ suite

**Files:** `pipeline/mappings.yaml` (khối thuật ngữ nếu CONTEXT sinh từ sổ, ngược lại `CONTEXT.md`) — «Trạng thái chào»
(cột `offer_status`, «chỉ đổi theo bằng chứng, quá cửa sổ không đổi») và «Lịch sử giá» (`history_transactional`, gom
theo căn), mỗi khối có `_Avoid_` (vd «hết hạn», «price_history»).

- [ ] Viết thuật ngữ; chạy E12 (`cd pipeline && npm test`), E13 (`cd app && npm test`), E14 (typecheck + lint app),
  vocab check — xanh.
- [ ] `/verify`, commit; contract `status: implemented`; vào S4.
