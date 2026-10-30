# Họ Người theo nguồn (DB2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng danh bạ Người theo từng nguồn trên khung chung ADR-0016 §3 và nối mỗi tin rao với người đăng bằng một phát biểu vai `nguoi_dang`, nạp lại không nhân người.

**Architecture:** Migration 055 tạo bốn bảng chỉ-thêm (`parties`, `registry_aliases`, `registry_events`, `party_roles`). Bộ dựng `pipeline/lib/danh-ba-nguoi.mjs` gồm lõi thuần (rút định danh, giải người, chọn vai rút) cộng lớp DB, chạy ở bước cuối `refresh-bait-gap.mjs` trong giao dịch riêng. Thước nạp lại `nap-lai-nguoi.mjs` chạy hai lượt transform thật trong một giao dịch ROLLBACK trên DB thử.

**Tech Stack:** Node ESM (.mjs) + `pg`, PostgreSQL 16/PostGIS, `node:test`; app Next.js 16 + `node --import tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-30-ho-nguoi-theo-nguon-design.md` · hợp đồng `_acceptance/ho-nguoi-theo-nguon/contract.md` (đã duyệt 30/10, Hỏi-1…4 theo khuyến nghị) · phép đo `_acceptance/ho-nguoi-theo-nguon/evals.yaml`.

## Global Constraints

- Migration số `055`, tệp `db/migrations/055_danh_ba_nguoi.sql` (đã cấp 30/10); idempotent; KHÔNG áp lên Supabase.
- Mọi thử DB chạy trên `oneinvest_p3_nguoi` (`bash db/db-thu.sh oneinvest_p3_nguoi`); không mở giao dịch dài trên `oneinvest` :5433.
- Khoá người `^pty_[0-9A-HJKMNP-TV-Z]{26}$`; khoá đối tượng của bí danh `^(pty|prc|bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}$`; `source` `^S0[1-9]$`.
- `status` ∈ `active|merged|split|retired`; `alias_kind` ∈ `tai_khoan_nguon|sdt_bam|ten`; `registry_event_kind` ∈ `gop|tach|nghi`; `party_role` ∈ `nguoi_dang`.
- Lý do rút vai: `thay-boi-luot`. Vai chỉ ghi phương pháp `source_field` (lớp `fact`) hoặc `parser` (lớp `observed`).
- Mọi từ chối chỉ-thêm mang chữ `chỉ thêm` trong thông điệp.
- Kênh bài: `stg_zalo_posts.agent_id` `openclaw-hook` → S03, `apify-facebook` → S05.
- Không gộp liên nguồn; SĐT luôn là người riêng của nguồn (Hỏi-4); không đẩy bốn bảng lên cloud (không thêm vào `FILL` của `sync-cloud.mjs`).
- Không đọc `users`, `sessions`, `user_events`, `user_profile`, `source_registry`.
- Không sửa tệp làn ZCode (`scripts/zalo-*.sh`, `collector/**`, `pipeline/import-*`…).

## Review Focus

1. `sender_id` rỗng chuỗi `''` hay chỉ khoảng trắng → coi như không có tài khoản (không tạo bí danh rỗng). Test ở Task 2.
2. Hai bài của cùng một tin cùng một người gửi → MỘT vai, `evidence.post_ids` gồm cả hai. Test ở Task 2.
3. Một tin có `post_ids` NULL hay mảng rỗng (S06, hoặc tin S03 cũ) → không lỗi, chỉ đi đường SĐT/không định danh. Test ở Task 3.
4. `seller_ref` S06 không khớp `^ct:[0-9]+$` (giá trị lạ) → tin đếm vào `khong_dinh_danh.S06`, không ném. Test ở Task 2.
5. Bộ dựng chạy hai lần đồng thời (job đêm chồng `--thu`) → khoá advisory `pg_advisory_xact_lock(55055)` xếp hàng, không lỗi trùng khoá. Test ở Task 4 (hai client).

---

### Task 1: Migration 055 + bốn enum trong sổ từ vựng

**Files:**
- Create: `db/migrations/055_danh_ba_nguoi.sql`
- Modify: `pipeline/mappings.yaml` (khối `enums:` — thêm `registry_status`, `alias_kind`, `registry_event_kind`, `party_role`, mỗi khối `dd_field: null`, `local: true`, `rationale`, `checked_on: "2026-10-30"`, `columns`, `nullable: false`, `values` có `label_vi`)
- Regenerate: `pipeline/lib/vocab.generated.mjs`, `app/src/lib/vocab.generated.ts`, `agent/src/vocab.generated.ts` (`node pipeline/vocab.mjs --write`)
- Create: `pipeline/scripts/danh-ba-nguoi.itest.mjs` (ca AC-1, AC-2a)
- Phục vụ: E1, E2 (a), E2c · `independent: false`

**Interfaces:**
- Produces: bảng `parties(party_key text PK, status text, merged_into text NULL REFERENCES parties, source text, created_at timestamptz)`; `registry_aliases(id bigserial PK, object_key, kind, value, source, first_seen timestamptz, retired_at timestamptz NULL)`; `registry_events(id bigserial PK, object_key, kind, related_keys text[], reason text, changed_by text, at timestamptz)`; `party_roles(id bigserial PK, party_key REFERENCES parties, role, subject_key text, evidence_tier, method, evidence jsonb, observed_at, run_id, retracted_at, retract_reason)`.
- Chỉ mục: `registry_aliases_dinh_danh_uq (source, kind, value) WHERE retired_at IS NULL AND kind IN ('tai_khoan_nguon','sdt_bam')`; `registry_aliases_ten_uq (object_key, kind, value) WHERE kind = 'ten'`; `party_roles_song_uq (subject_key, role, party_key) WHERE retracted_at IS NULL`.
- Produces (itest helpers, export từ itest): `trongGiaoDich(fn)` (BEGIN → `pg_advisory_xact_lock(55055)` → nạp `SQL_055` → fn → ROLLBACK), `rangBuocChan(sql, values)` theo khuôn `media-canonical.itest.mjs`; `chotDbThuNguoi(dbName, coBangParties)` export từ `pipeline/lib/danh-ba-nguoi.mjs` (từ chối `oneinvest` khi chưa có `parties`).

- [ ] **Step 1: Write the failing test** — ca `AC-1 khung danh bạ`: nạp 055 hai lần, ảnh lược đồ bằng nhau; ma trận 18 dòng đúng E1 (mỗi dòng một `rangBuocChan`, assert đếm = 18; dòng 9–18 assert `/chỉ thêm/`); đối chứng dương: dòng (1) và UPDATE rút có lý do vào được. Ca `AC-2 enum và DQ (a)`: `checkDb(c, readMappings(ROOT))` lọc bốn trục → `[]`; xoá `ref_lookup ('party_role','nguoi_dang')` → lệch nhắc `party_role`.
- [ ] **Step 2: Run** `cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi node --test scripts/danh-ba-nguoi.itest.mjs` → FAIL (thiếu tệp 055).
- [ ] **Step 3: Implement migration** qua skill `/new-migration` (header, idempotent). Ràng buộc CHECK cho khoá, `status`, `merged_into` (`(status='merged') = (merged_into IS NOT NULL)`), `source`, cặp lớp/phương pháp `(evidence_tier, method) IN (('fact','hitl'),('fact','source_field'),('observed','parser'),('observed','e1_rule'),('observed','e2_llm'),('observed','legacy'),('inferred','e1_rule'),('inferred','e2_llm'))`, `retract_reason` bắt buộc khi `retracted_at` có. Trigger: `BEFORE DELETE FOR EACH ROW` + `BEFORE TRUNCATE FOR EACH STATEMENT` trên cả bốn bảng → `RAISE EXCEPTION '<bảng>: chỉ thêm — …'`; `party_roles` BEFORE UPDATE: chỉ cho đổi `retracted_at` từ NULL kèm `retract_reason`, mọi đổi khác `chỉ thêm`; `registry_aliases` BEFORE UPDATE: chỉ đặt `retired_at` một lần; `registry_events` cấm UPDATE; `parties` cấm đổi `party_key`, `source`, `created_at`. Seed `ref_lookup`/`ref_field_lookup` dán từ `node pipeline/vocab.mjs --emit-seed` (ON CONFLICT DO NOTHING). Enum khai ở mappings.yaml TRƯỚC, rồi `node pipeline/vocab.mjs --write`.
- [ ] **Step 4: Run** itest ở Step 2 → PASS; `cd pipeline && node vocab.mjs --check && node vocab.mjs --lint` → exit 0; `npm test` (pipeline) xanh (E2c).
- [ ] **Step 5: Phá thử** — bỏ trigger TRUNCATE của `registry_aliases` trong bản sao SQL nạp ở test → ca AC-1 đỏ `AC-1 ràng buộc không chặn: (TRUNCATE registry_aliases)`; hoàn lại.
- [ ] **Step 6: Commit** `feat(db): 055 danh bạ Người — khung chung ADR-0016 §3 + bốn enum (DB2b)`.

### Task 2: Lõi thuần của bộ dựng

**Files:**
- Create: `pipeline/lib/danh-ba-nguoi.mjs` (phần thuần)
- Create: `pipeline/scripts/danh-ba-nguoi.test.mjs`
- Phục vụ: E5, E9 · `independent: false` (Task 3 dùng)

**Interfaces:**
- Produces:
  - `export const VAI_GHI = ["nguoi_dang"]`, `export const PHUONG_PHAP_GHI = ["source_field", "parser"]`, `export const LY_DO_RUT = "thay-boi-luot"`, `export const KENH_NGUON = { "openclaw-hook": "S03", "apify-facebook": "S05" }`, `export const BANG_TANG_A = ["users","sessions","user_events","user_profile","source_registry"]`.
  - `export function moiKhoaNguoi(now = Date.now(), rand = randomBytes): string` — ULID Crockford 26 ký tự, tiền tố `pty_`.
  - `export function rutDinhDanh(tin, baiTheoId): { taiKhoan: { value: string, ten: string|null, post_ids: string[] }[], sdt: string|null, field: "seller_ref"|"post_ids"|null }` — `tin` = `{ offer_id, source, originating_system_key, seller_ref, seller_name, seller_phone_hash, post_ids, first_seen, retired_at }`; `baiTheoId: Map<post_id, { sender_id, sender_name, source }>`. S06: `seller_ref` khớp `^ct:([0-9]+)$` → một tài khoản; S03/S05: gom người gửi theo `sender_id.trim()` khác rỗng, chỉ bài cùng nguồn.
  - `export function giaiNguoi(tins, biDanh, { taoKhoa = moiKhoaNguoi } = {}): { nguoiMoi: { party_key, source }[], biDanhMoi: { object_key, source, kind, value }[], vai: { subject_key, party_key, method, evidence_tier, evidence }[], khongDinhDanh: Record<string, number> }` — `biDanh: Map<"S0x|kind|value", party_key>` (hàm cập nhật bản sao, không đột biến đầu vào); duyệt `tins` theo `(first_seen, offer_id)`; luật §2.2 design (Hỏi-4: SĐT luôn người riêng); `subject_key = source + ":" + originating_system_key`; `evidence = { offer_id, field, post_ids? }`.
  - `export function chonVaiRut(vaiSong, vaiLuotNay, tinsLuotNay, baiTheoId): vaiSong[number][]` — rút chỉ khi có bằng chứng thay (design §2.2 bước 3): cùng `post_id` trong `evidence.post_ids` còn nối được mà người gửi khác; `field = 'seller_ref'` và tài khoản của tin đổi; `method = 'parser'` và tin nay có tài khoản. Tin không có mặt trong lượt hay bài không nối được → giữ.
  - `export const SQL: Record<string, string>` (mọi câu SQL của mô-đun) và `export function bangDuocDoc(sql: string): string[]` — tên trong `BANG_TANG_A` xuất hiện sau `FROM|JOIN|INTO|UPDATE`.

- [ ] **Step 1: Write the failing tests** — ca `AC-5 luật bí danh SĐT` đúng bảy dòng (a)–(g) của E5 với bộ bí danh trong bộ nhớ, assert đếm = 7; chiều đỏ: bản sao luật `giaiNguoiGanSdt` (lối khác của Hỏi-4, viết trong test) → dòng (a) cho kết quả khác, ghim `AC-5 SĐT gắn vào người tài khoản: h`. Ca `AC-9 chỉ local, không suy, không tầng A`: `FILL ∩ bốn bảng = []` (chiều đỏ với mảng mẫu có `parties`); `VAI_GHI` = `["nguoi_dang"]`, mọi `method` mà `giaiNguoi` sinh trên ma trận E5 ⊆ `PHUONG_PHAP_GHI`; `Object.values(SQL).flatMap(bangDuocDoc)` = `[]`, `bangDuocDoc("JOIN users u")` = `["users"]`. Thêm ca Review Focus 1, 2, 4 và ca `chonVaiRut`: bài mất → `[]`; người gửi đổi → vai cũ; tin chỉ-SĐT nay có tài khoản → vai parser.
- [ ] **Step 2: Run** `cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs` → FAIL (thiếu mô-đun).
- [ ] **Step 3: Implement** các hàm trên (không import `pg` ở lõi thuần; `randomBytes` từ `node:crypto`).
- [ ] **Step 4: Run** → PASS; `cd pipeline && npm test` xanh; `node vocab.mjs --lint` không báo enum viết tay trong `lib/danh-ba-nguoi.mjs` (dùng `VOCAB.party_role`, `VOCAB.alias_kind` thay chuỗi trần nếu lint đòi).
- [ ] **Step 5: Commit** `feat(pipeline): lõi giải người theo nguồn (DB2b)`.

### Task 3: Lớp DB của bộ dựng — `dungNguoi`, `sellersThieuNguoi`

**Files:**
- Modify: `pipeline/lib/danh-ba-nguoi.mjs` (phần DB)
- Modify: `pipeline/scripts/danh-ba-nguoi.itest.mjs` (ca AC-3, AC-4, AC-6, AC-8)
- Phục vụ: E3, E4, E6, E8 · `independent: false`

**Interfaces:**
- Consumes: Task 2 (`rutDinhDanh`, `giaiNguoi`, `chonVaiRut`, `SQL`, `LY_DO_RUT`); Task 1 (bảng, chỉ mục).
- Produces:
  - `export async function dungNguoi(client, { runId = <ISO>, traBiDanh = true } = {}): Promise<{ nguoi_moi: number, bi_danh_moi: number, vai_moi: number, vai_rut: number, khong_dinh_danh: Record<string, number>, theo_nguon: Record<string, { nguoi_moi: number, vai_moi: number }> }>` — chạy trong giao dịch của người gọi; lấy `pg_advisory_xact_lock(55055)`; đọc mọi `sale_offer_records` (kể cả nghỉ) + bài `stg_zalo_posts` của `post_ids`; nạp bí danh sống (`traBiDanh: false` → bộ bí danh rỗng — CHỈ cho đối chứng E7); ghi `parties`, `registry_aliases` (cả `ten`, `ON CONFLICT DO NOTHING` cho `ten`), `party_roles` mới, UPDATE rút vai theo `chonVaiRut`; in một dòng `danh-ba-nguoi: +<n> người · +<n> bí danh · +<n> vai · rút <n> · không định danh <S0x=n …>`.
  - `export async function sellersThieuNguoi(client): Promise<string[]>` — `"<phone_hash>:<S0x>"` cho mỗi (dòng `sellers`, nguồn trong `sources`) không có bí danh sống `sdt_bam` của nguồn ấy.

- [ ] **Step 1: Write the failing tests** — `AC-3 S06 tài khoản` (E3, fixture khoá `TEST-DB2b-*`), `AC-4 S03/S05 người gửi` (E4, 7 dòng kể cả tin nghỉ), `AC-6 chạy lại` (E6: lượt 2 toàn 0; đổi sender → rút `thay-boi-luot`, tổng dòng +1; xoá bài → lượt 4 `{vai_moi:0, vai_rut:0}`), `AC-8 sellers có người` (E8 hai chiều), cộng Review Focus 3 (tin `post_ids` NULL). Mỗi ca trong `trongGiaoDich`.
- [ ] **Step 2: Run** itest → FAIL (`dungNguoi` chưa có).
- [ ] **Step 3: Implement** `dungNguoi`, `sellersThieuNguoi` (chèn theo lô bằng `unnest($1::text[], …)`; không DELETE).
- [ ] **Step 4: Run** itest → PASS; `cd pipeline && npm test` xanh.
- [ ] **Step 5: Phá thử** — trong bản sao gọi `dungNguoi(c, { traBiDanh: false })` ở lượt 2 của ca AC-6 → ném lỗi trùng `registry_aliases_dinh_danh_uq`; ghim chữ trong ca `AC-6 chạy lại nhân dòng`.
- [ ] **Step 6: Commit** `feat(pipeline): dungNguoi ghi danh bạ Người + vai người đăng (DB2b)`.

### Task 4: Nối vào chạy đêm + lệnh vận hành

**Files:**
- Modify: `pipeline/refresh-bait-gap.mjs` (thêm `buocDem`, `main` gọi nó)
- Create: `pipeline/dung-nguoi.mjs` (CLI: mặc định COMMIT; `--thu` ROLLBACK)
- Modify: `pipeline/scripts/danh-ba-nguoi.itest.mjs` (ca AC-10)
- Phục vụ: E10 · `independent: false`

**Interfaces:**
- Consumes: `refreshBaitGap(c)` (sẵn có), `dungNguoi` (Task 3).
- Produces: `export async function buocDem(c, { savepoint = false, runId } = {}): Promise<ReturnType<refreshBaitGap> & { nguoi: Awaited<ReturnType<typeof dungNguoi>> }>` — chạy `refreshBaitGap(c)` (tự-commit như hôm nay khi `savepoint=false`), rồi `dungNguoi` trong `BEGIN…COMMIT` (hay `SAVEPOINT dung_nguoi … RELEASE` khi `savepoint=true`); lỗi → `ROLLBACK`/`ROLLBACK TO SAVEPOINT` rồi ném lại. `main()` gọi `buocDem(c)`; nhánh `catch` sẵn có giữ `process.exit(1)`.

- [ ] **Step 1: Write the failing test** — `AC-10 chạy đêm` đúng E10: trong `trongGiaoDich`, `buocDem(c, { savepoint: true })` → có `nguoi`; chiều đỏ: `DROP TABLE party_roles` → `buocDem` ném, sau đó `bait_gap_pct` của tin fixture P1 và dòng `sellers` fixture vẫn mang giá trị lượt này, `parties` không có người của lượt lỗi (ghim `AC-10 bộ dựng lỗi kéo bait gap: <cột>`); ca tiến trình `spawnSync(node, ["refresh-bait-gap.mjs"], { env: { DATABASE_URL: ".../khong_ton_tai_db2b" } })` → `status !== 0`. Cộng Review Focus 5: client A `BEGIN` + nạp 055 + `dungNguoi` (giữ khoá 55055, chưa ROLLBACK); client B `BEGIN` + `dungNguoi` khởi chạy (chờ khoá); A `ROLLBACK`; B hoàn tất không lỗi rồi `ROLLBACK` — assert B không ném.
- [ ] **Step 2: Run** itest → FAIL.
- [ ] **Step 3: Implement** `buocDem`, sửa `main`, viết `dung-nguoi.mjs` (in kết quả `dungNguoi`, thoát 1 khi ném).
- [ ] **Step 4: Run** itest → PASS; `node --check pipeline/refresh-bait-gap.mjs pipeline/dung-nguoi.mjs`; `cd pipeline && npm test` xanh (kể cả `bait-gap-sellers.test.mjs`).
- [ ] **Step 5: Commit** `feat(pipeline): danh bạ Người chạy cuối bước bait gap, giao dịch riêng (DB2b)`.

### Task 5: Kiểm enum DQ + nhãn trên /ops/quality

**Files:**
- Modify: `pipeline/dq-enum-vocab.mjs` (tách hàm xuất)
- Modify: `app/src/lib/dq-labels.ts`, `app/src/components/ops/quality/dq-checks-table.tsx` (truyền `entity` vào `dqCheckName`), `app/tests/ops-nhan-theo-context.test.tsx` (lời gọi `dqCheckName(r.check_name, r.entity)`)
- Create: `app/tests/dq-nhan-danh-ba.test.tsx`
- Modify: `CONTEXT.md` (thuật ngữ mới: «Danh bạ người», «Người đăng», «Bí danh» — nhãn · code · slug `—` · định nghĩa · `_Avoid_`)
- Modify: `pipeline/scripts/danh-ba-nguoi.itest.mjs` (ca AC-2 (b))
- Phục vụ: E2 (b), E2b · `independent: true` (chỉ cần Task 1)

**Interfaces:**
- Produces: `export const KIEM_ENUM = [{ bang: "sale_offers", cot: "kind", truc: "kind" }, …, { bang: "parties", cot: "status", truc: "registry_status" }, { bang: "registry_aliases", cot: "kind", truc: "alias_kind" }, { bang: "registry_events", cot: "kind", truc: "registry_event_kind" }, { bang: "party_roles", cot: "role", truc: "party_role" }]`; `export async function kiemEnum(c, { bang, cot, truc }): Promise<{ status: "pass"|"fail", bad: number }>` ghi một dòng `dq_check_results` (`check_name` = `enum-vocab:<cot>`, `entity` = `<bang>`, chi tiết theo khuôn chữ hiện có). `dqCheckName(check: string, entity?: string): DqText` — tra `COT_ENUM_THEO_BANG["<entity>.<cot>"]` trước, rồi `COT_ENUM` như cũ (không truyền `entity` → hành vi cũ). `DOI_TUONG` thêm `parties`, `registry_aliases`, `registry_events`, `party_roles`; `GIA_TRI_ENUM` thêm nhãn `label_vi` của bốn trục.

- [ ] **Step 1: Write the failing tests** — `AC-2 nhãn dòng kiểm danh bạ` đúng E2b (ba dòng + dòng `registry_events`; chiều đỏ `party_roles_x` → `known:false`); itest `AC-2 enum và DQ (b)`: `kiemEnum` cho bốn mục danh bạ → bốn dòng `pass`.
- [ ] **Step 2: Run** `cd app && node --import tsx --test tests/dq-nhan-danh-ba.test.tsx` → FAIL; itest → FAIL.
- [ ] **Step 3: Implement** như Interfaces; `main()` của `dq-enum-vocab.mjs` lặp `KIEM_ENUM` (bỏ qua bảng chưa tồn tại bằng `to_regclass`).
- [ ] **Step 4: Run** cả hai → PASS; `cd app && npx tsc --noEmit && npm run lint`; `cd app && npm test` (ON12-AC-5 vẫn xanh).
- [ ] **Step 5: Commit** `feat(ops): nhãn kiểm từ vựng danh bạ Người trên /ops/quality (DB2b)`.

### Task 6: Thước nạp lại trên dữ liệu thật

**Files:**
- Create: `pipeline/scripts/nap-lai-nguoi.mjs`
- Phục vụ: E7, E8 (dữ liệu thật) · `independent: false` (cần Task 3, 4)

**Interfaces:**
- Consumes: `runTransformZalo`, `runTransformFb`, `runTransformChotot`, `napPhatBieu`, `buocDem`, `dungNguoi({ traBiDanh:false })`, `sellersThieuNguoi`, `chotDbThuNguoi`.
- Produces: `export async function chayNapLaiNguoi(client, { out = console.log } = {}): Promise<{ luot1, luot2, ketQua2, bangNhau: boolean, doiChungDo: boolean, sellersThieu: string[] }>`; CLI in đúng các dòng E7 (`luot1`, `luot2`, `ket-qua luot2: …`, `bang-nhau: …`, `doi-chung bo-tra-bi-danh: …`, `sellers_thieu_nguoi: <n>`, `rollback: dem truoc = dem sau`), thoát 0/1/2 theo E7.

- [ ] **Step 1: Implement** theo khuôn `chayBaLuot`: BEGIN, `pg_advisory_xact_lock(33033)` rồi `(55055)`, nạp 055 nếu chưa có, `napPhatBieu`, hai lượt (ba transform + `buocDem(c, { savepoint: true })`), đếm sống + tổng dòng `party_roles` theo nguồn sau mỗi lượt; đối chứng trong `SAVEPOINT doi_chung`: `dungNguoi(c, { traBiDanh: false })` phải ném lỗi trùng khoá `registry_aliases` → `ROLLBACK TO SAVEPOINT`; ROLLBACK cuối; đếm `parties` (nếu có), `party_roles`, `sale_offer_records` trước/sau trên kết nối mới.
- [ ] **Step 2: Run** `cd pipeline && NGUOI_DB_URL= DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi node scripts/nap-lai-nguoi.mjs` (nền, có thể vài phút) → exit 0 với đủ dòng E7, `sellers_thieu_nguoi: 0`.
- [ ] **Step 3: Phá thử** — chạy với `--doi-chung-hong` (cờ nội bộ cho đối chứng gọi `traBiDanh: true`) → thoát 1, dòng `doi-chung … khong do`.
- [ ] **Step 4: Commit** `feat(pipeline): thước nạp lại danh bạ Người hai lượt trên dữ liệu thật (DB2b)`.

### Task 7: Tài liệu as-built

**Files:**
- Modify: `pipeline/CLAUDE.md` (bảng Key Scripts: `dung-nguoi.mjs`, `scripts/nap-lai-nguoi.mjs`; mục Database Schema: bốn bảng)
- Modify: `docs/ROADMAP.md` §2 as-built + §4 trạng thái DB2b
- Phục vụ: — · `independent: true`

- [ ] **Step 1: Viết** các dòng trên (chỉ mô tả cái đã có).
- [ ] **Step 2: Commit** `docs: as-built danh bạ Người DB2b`.
