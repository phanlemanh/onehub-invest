# enrich-nguoi-s03 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tin S03 không số nhận số liên lạc qua người đăng: sổ liên lạc của Người (`party_contacts`), luật chọn số, bộ gán theo cơ chế số ghép S06, nhãn «Chưa xác minh» qua view.

**Architecture:** Migration 079 thêm bảng chỉ-thêm `party_contacts` và mở `seller_phone_inferred` cho dấu `s03-qua-nguoi-dang`. `pipeline/lib/lien-lac-nguoi.mjs` dựng liên lạc từ bài S03 sau `dungNguoi`; `pipeline/gan-sdt-qua-nguoi.mjs` ghi số vào tin không số (gọi trong `runTransformZalo` sau `writeOffers` và trong `buocDem` sau `dungNguoi`). App, API, sync không đổi ngoài một câu chữ.

**Tech Stack:** Node ESM `.mjs`, `pg`, `node:test`; PostgreSQL 16 (PostGIS :5433); Next.js app test bằng `node --import tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-06-enrich-nguoi-s03-design.md` · hợp đồng `_acceptance/enrich-nguoi-s03/contract.md` · evals `_acceptance/enrich-nguoi-s03/evals.yaml`

## Global Constraints

- Migration số **079** (giám sát cấp 06/11); viết bằng `/new-migration`; idempotent; KHÔNG áp lên DB máy thu `oneinvest` hay cloud.
- Hằng: dấu tin `s03-qua-nguoi-dang` (`tier: inferred`, `method: e1_rule`); rule liên lạc `so_tren_tin`, `so_trong_bai`; `kind` ∈ `sdt`, `chat_profile`; số `^\+84[35789][0-9]{8}$`.
- Lý do rút liên lạc: `so-chung`. Khoá advisory danh bạ `55055` dùng chung.
- Không in SĐT ra log hay đầu ra lệnh (dùng `inKhongSo` của `gan-sdt-s06.mjs`); không ghi số hay chữ bài vào kho; phiếu đọc mù chỉ ở `research-local/`.
- Không đọc bảng tầng A (`BANG_TANG_A`); nguồn chỉ là mã `S03`.
- Test DB chạy BEGIN…ROLLBACK trên lược đồ riêng (`luocDoRieng`), số bịa `+8490000xxxx`.
- Mỗi phép đo mới có cặp hai chiều cùng fixture, thông điệp ghim (MEASURE-BIRTH-CLAUSE).
- Chữ UI tiếng Việt; câu lời giải thích số: «Số không lấy trực tiếp từ chính tin này: suy từ tin hoặc bài khác của cùng tài khoản, hoặc chưa đủ bằng chứng. Khi gọi, hãy hỏi lại có đúng người đăng tin không.»

## Review Focus

1. Máy thu chạy main khi chưa áp 079 → transform S03 và `buocDem` phải chạy như hôm nay (Task 3, ca `chua-ap-079`).
2. Người đăng có số trên tin ở một tin và tin khác của cùng người không số, rồi transform chạy lại → tin không được rơi về NULL sau COMMIT (Task 3, ca `khong-khoang-ho`).
3. Số suy bị đọc lại bởi danh bạ/HD13/SD5 → không sinh bí danh, cặp một–một, liên lạc (Task 2, ca EN-AC-6).
4. Tin vừa có số riêng mới trong khi đang mang dấu suy → giữ số riêng, bỏ dấu, nhãn về false (Task 3, ô `suy-nay-rieng`).
5. Người đã gộp (merged) → liên lạc đọc ở người cuối chuỗi (Task 2, ô `da-gop`).

---

### Task 1: Migration 079 + từ vựng (independent: false)

**Files:**
- Create: `db/migrations/079_lien_lac_nguoi.sql`, `pipeline/lib/nap-079.mjs`
- Modify: `pipeline/mappings.yaml` (enum `contact_kind`, `contact_rule`; ghi chú `seller_phone_inferred`), `pipeline/lib/vocab.generated.mjs` + bản app (`node pipeline/vocab.mjs --write`)
- Test: `pipeline/scripts/enrich-nguoi-s03.test.mjs` (ca EN-AC-2 phần bảng, EN-AC-5 phần view)

**Interfaces:**
- Produces: bảng `party_contacts(id, party_key, kind, value, evidence_tier, method, rule_id, evidence, observed_at, run_id, created_at, retracted_at, retract_reason)`; chỉ mục sống duy nhất `(party_key, kind, value, rule_id)`; trigger `party_contacts_guard`; view `sale_offers` giữ cột 070, cột cuối `seller_phone_inferred = seller_phone IS NOT NULL AND ((source='S06' AND rule IS DISTINCT FROM 's06-so-tren-tin') OR rule = 's03-qua-nguoi-dang')`.
- Produces (`nap-079.mjs`): `MIG_079: string`; `daCoBang079(c): Promise<boolean>` (`to_regclass('party_contacts')`); `daCoNhan079(c): Promise<boolean>` (`pg_get_viewdef('sale_offers')` chứa `s03-qua-nguoi-dang`); `nap079(c): Promise<boolean>` (chỉ trong giao dịch sẽ ROLLBACK).

- [ ] Step 1: Viết ca `EN-AC-2 bảng` (nhận sdt/chat_profile hợp lệ; CHECK từ chối `0900…`, chat_profile rỗng; DELETE, TRUNCATE, UPDATE đổi `value`, rút không lý do bị chặn — assert `message` chứa `party_contacts: chỉ thêm`) và `EN-AC-5 view` (ma trận 6 ô `s03-suy, s03-truc-tiep, s06-truc-tiep, s06-ghep, s06-mat-dau, khong-so`; `assert.equal(o.length, 6)`; danh sách cột view trước/sau 079 bằng nhau; md5 các cột cũ bằng nhau). Chiều đỏ: view thay bằng bản 070 → ô `s03-suy` sai, thông điệp nêu `s03-suy`.
- [ ] Step 2: `node --test --test-concurrency=1 pipeline/scripts/enrich-nguoi-s03.test.mjs` → FAIL (không có 079).
- [ ] Step 3: Viết 079 bằng `/new-migration` (header, idempotent, `ref_lookup` seed sinh bằng `node pipeline/vocab.mjs --emit-seed`), `nap-079.mjs` theo khuôn `nap-070.mjs`; enum ở `mappings.yaml` đủ sáu điều kiện (dd_field null, rationale tra DD 2.1 ngày 2026-11-06: `Contacts.MobilePhone`, `SocialMedia.SocialMediaUrlOrId`).
- [ ] Step 4: Test → PASS; `bash db/check-idempotent.sh db/migrations/079_lien_lac_nguoi.sql` xanh; `node pipeline/vocab.mjs --check` xanh.
- [ ] Step 5: Commit `feat(db): 079 sổ liên lạc của Người + nhãn số qua người đăng`.

### Task 2: Bộ dựng liên lạc + chặn tự nuôi (independent: false)

**Files:**
- Create: `pipeline/lib/lien-lac-nguoi.mjs`
- Modify: `pipeline/lib/danh-ba-nguoi.mjs` (hằng `RULE_QUA_NGUOI = "s03-qua-nguoi-dang"`; `coBangChungSdt`, `TIN_VAO_DANH_BA` loại thêm dấu này cho mọi nguồn; `rutDinhDanh` dùng `coBangChungSdt` cho S03/S05), `pipeline/do-danh-ba-sdt.mjs` (câu đọc tin lọc `TIN_VAO_DANH_BA`), `pipeline/refresh-bait-gap.mjs` (`buocDem` gọi `dungLienLac` sau `dungNguoi`, cùng giao dịch)
- Test: `pipeline/scripts/enrich-nguoi-s03.test.mjs` (EN-AC-1, EN-AC-2 phần bộ dựng, EN-AC-3, EN-AC-6)

**Interfaces:**
- Consumes: `extractPhones(text): string[]` (`pipeline/transform-zalo.mjs`); `KHOA_DANH_BA`, `KENH_NGUON`, `nguoiCuoi`, `khoaBiDanh`, `ALIAS_KIND` (`danh-ba-nguoi.mjs`); `daCoBang079` (Task 1).
- Produces: `rutLienLac(bai, tins, nguoiCuaTaiKhoan): { lienLac: {party_key, value, rule_id, evidence}[], so_chung: number, khong_nguoi: number }` (thuần); `chonSoNguoi(lienLacSong: {kind, value, rule_id, retracted_at}[]): {value, rule_id, contact_id} | null` (thuần, luật A); `dungLienLac(c, { runId, out }): Promise<{bo_qua: null|"CHUA-AP-079", lien_lac_moi, lien_lac_rut, so_chung, khong_nguoi, theo_rule}>`; `docSoNguoi(c): Promise<Map<party_key, {value, rule_id, contact_id}>>` (đọc liên lạc sống, đi qua `merged_into`).

- [ ] Step 1: Ca EN-AC-1 (7 ô `so-tren-tin, so-trong-bai, so-chung-hai-nguoi, so-da-suy, chua-co-nguoi, sai-dang, hai-rule-cung-so`, `assert.equal(o.length, 7)`; bài nạp vào `stg_zalo_posts`, tin ghi bằng `writeOffers` thật); chiều đỏ tắt luật số chung (tham số `{ loaiSoChung: false }` CHỈ cho đối chứng) → nêu `so-chung-hai-nguoi`.
- [ ] Step 2: Ca EN-AC-2 bộ dựng: lượt 2 `lien_lac_moi=0, lien_lac_rut=0`; thêm bài người thứ hai mang số → rút 1, `retract_reason='so-chung'`; xoá bài bằng chứng khỏi stg → liên lạc còn sống.
- [ ] Step 3: Ca EN-AC-3 thuần 8 ô `0-so, 1-tin, 1-bai, 1-tin-1-bai, 2-tin, 0-tin-2-bai, da-gop, ho-so-chat-va-da-rut`; chiều đỏ đảo ưu tiên → nêu `1-tin-1-bai`.
- [ ] Step 4: Ca EN-AC-6: sau khi đặt dấu suy lên tin (ghi trực tiếp fixture qua `ganSdtQuaNguoi` ở Task 3 — ca này chạy sau Task 3, viết ở đây với `test.todo` tới Task 3), đếm alias `sdt`, `parties`, `party_contacts`, và `capMotMot`, `sellersThieuNguoi`, `nhomNhieuNhieu`, `tinhSo` trước = sau; chiều đỏ: bản `rutDinhDanh` bỏ chặn (tham số `{ boChanSuy: true }` CHỈ cho đối chứng) sinh bí danh, nêu `nhan-so`.
- [ ] Step 5: Chạy → FAIL; viết `lien-lac-nguoi.mjs`, sửa hằng ở `danh-ba-nguoi.mjs`, lọc ở `do-danh-ba-sdt.mjs`, nối `buocDem`; dò bảng bằng `to_regclass` trước mọi câu đọc (không bắt lỗi SQL).
- [ ] Step 6: Test → PASS (trừ todo); `cd pipeline && npm test` xanh (danh bạ cũ, HD13, SD5 không đổi).
- [ ] Step 7: Commit `feat(pipeline): sổ liên lạc của Người S03 từ bài của chính người gửi`.

### Task 3: Bộ gán số qua người đăng + DQ (independent: false)

**Files:**
- Create: `pipeline/gan-sdt-qua-nguoi.mjs`
- Modify: `pipeline/transform-zalo.mjs` (sau `writeOffers`: `await ganSdtQuaNguoi(client, { rieng: new Map(rows.map(r => [r.offer_id, r.seller_phone])) })`), `pipeline/refresh-bait-gap.mjs` (sau `dungLienLac`: `ganSdtQuaNguoi(c)` + log một dòng theo rule), `pipeline/sql/450_dq_checks.sql` (khối `so-chua-xac-minh`: `nguon_khac` chỉ đếm tin không mang dấu `s03-qua-nguoi-dang`; detail thêm `S03 qua người đăng: N`)
- Test: `pipeline/scripts/enrich-nguoi-s03.test.mjs` (EN-AC-4, EN-AC-5 phần rào + 450, hoàn tất EN-AC-6)

**Interfaces:**
- Consumes: `docSoNguoi` (Task 2); `daCoPhanGiu068` (`nap-068.mjs`); `daCoBang079`, `daCoNhan079` (Task 1); `inKhongSo` (`gan-sdt-s06.mjs`).
- Produces: `ganSdtQuaNguoi(c, { rieng?: Map<string, string|null> }): Promise<{doi, gan, rut, bo_dau, khong_chon, theo_rule: Record<string, number>, bo_qua: null|"CHUA-AP-068"|"CHUA-AP-079"}>`; CLI `node pipeline/gan-sdt-qua-nguoi.mjs [--thu]`.

- [ ] Step 1: Ca EN-AC-4 qua `runTransformZalo` thật: 7 ô `rieng, nhan-so, khong-chon, suy-nay-rieng, suy-het-so, s06, s05` × sống/nghỉ; assert `seller_phone`, `seller_phone_hash` (sha256 32 ký tự như transform), `field_provenance.seller_phone.{rule_id, party_key}`; md5 dòng S06/S05 trước = sau; lượt gán 2 `doi=0`; client thứ hai đọc sau COMMIT lượt transform thứ hai: 0 tin nhận số mà NULL. Chiều đỏ: transform không truyền lời gọi (tham số test) → ô `nhan-so` NULL, thông điệp nêu `nhan-so`.
- [ ] Step 2: Ca EN-AC-5 rào: lược đồ bản 078 (bỏ `party_contacts`, view 070) → `runTransformZalo`, `buocDem` thoát êm, log `CHUA-AP-079`, md5 tin S03 không đổi, `parties` có người mới; chiều đỏ bỏ rào → lỗi `relation "party_contacts" does not exist` được ghim. View ghi đè về 070 → `CHUA-AP-079`, 0 số suy mới; bỏ phần giữ 068 → `CHUA-AP-068`, `doi=0`. Khối 450 `so-chua-xac-minh` trên lược đồ riêng: tin S03 có dấu → `pass`; thêm tin S05 nhãn true không dấu (view đột biến) → `fail`.
- [ ] Step 3: Bỏ `test.todo` của EN-AC-6.
- [ ] Step 4: Chạy → FAIL; viết `gan-sdt-qua-nguoi.mjs` (đọc tin S03 + `docSoNguoi`, quyết trong JS, ghi bằng một UPDATE … FROM unnest chỉ chạm dòng đổi), nối hai lời gọi, sửa 450.
- [ ] Step 5: Test → PASS; `cd pipeline && npm test` xanh.
- [ ] Step 6: Commit `feat(pipeline): tin S03 không số nhận số qua người đăng (dấu s03-qua-nguoi-dang)`.

### Task 4: Lệnh đo dữ liệu thật + phiếu đọc mù (independent: false)

**Files:**
- Create: `pipeline/do-lien-lac-nguoi.mjs`
- Test: `pipeline/scripts/enrich-nguoi-s03.test.mjs` (ca `EN-AC-8 bất biến`: hàm `kiemBatBien(so)` thuần, ca đột biến từng mã)

**Interfaces:**
- Consumes: `nap068`, `nap070`, `nap079`, `dungNguoi`, `dungLienLac`, `ganSdtQuaNguoi`, `inKhongSo`.
- Produces: `kiemBatBien(so): string[]` với mã `DB-DOI`, `GAN-LECH-SO` (sau − trước ≠ gán), `KHONG-GAN`, `LECH-MOC:<rule|ban|thue>` (lệch > 15% so với mốc 06/11 `{tren_tin: 662, trong_bai: 80, thue: 586, ban: 156, tin_song: 4359}` quy đổi theo tin S03 sống); CLI từ chối DB tên `oneinvest` (thoát 2); `--mau 30 --ra <tệp>` ghi phiếu đọc mù (hạt cố định 20261106) — chỉ cho đường dưới `research-local/`.

- [ ] Step 1: Ca thuần `kiemBatBien` (một ca xanh + một ca mỗi mã đỏ, ca tắt rule `so_trong_bai` → `LECH-MOC:so_trong_bai`).
- [ ] Step 2: Viết lệnh theo khuôn `chayThu` của `gan-sdt-s06.mjs` (md5 bằng client thứ hai; ROLLBACK).
- [ ] Step 3: `bash db/db-thu.sh oneinvest_en && DATABASE_URL=…/oneinvest_en node pipeline/do-lien-lac-nguoi.mjs` → exit 0, dòng in không có SĐT.
- [ ] Step 4: Commit `feat(pipeline): lệnh đo sổ liên lạc S03 trên DB thử`.

### Task 5: Chữ nhãn + API (independent: false — cần view 079)

**Files:**
- Modify: `app/src/components/listing/offer-label-help.tsx` (`phone.body`), `app/src/components/marketing/methodology-definitions.tsx` (mục `so-chua-xac-minh`), `CONTEXT.md` (mục «Chưa xác minh» cạnh Xem số; thuật ngữ mới «Liên lạc của Người»: code `party_contacts`, `contact_kind`, slug —, định nghĩa, `_Avoid_`)
- Test: `app/tests/enrich-nguoi-s03.test.tsx` (theo khuôn `app/tests/so-ghep-nhan.test.tsx`)

- [ ] Step 1: Test hai route thật trên lược đồ tạm có view 079: tin S03 suy → danh sách `hasPhone true, phoneInferred true`, JSON không khớp `/\+84\d{9}|0\d{9}/`; `/contact` `inferred: true`; S03 trực tiếp `inferred: false`; `OFFER_LABEL_HELP.phone.body` và mục `so-chua-xac-minh` chứa «tin hoặc bài khác». Chiều đỏ: view 070 → nêu `phoneInferred` của `s03-suy`.
- [ ] Step 2: Sửa chữ ở ba chỗ; `cd app && node --import tsx --test tests/enrich-nguoi-s03.test.tsx` PASS; `cd app && npx tsc --noEmit` xanh.
- [ ] Step 3: Commit `feat(app): lời giải thích số chưa xác minh gồm số từ bài của cùng tài khoản`.

### Task 6: Tài liệu (independent: true)

**Files:** `docs/adr/0016-danh-ba-vat-the-va-nguoi.md` (§8 dòng sửa đổi 06/11: liên lạc là phát biểu ở `party_contacts`, khác bí danh định danh), `docs/ROADMAP.md` (§2 as-built, §4 việc chờ: áp 079 trên máy thu, liên lạc `chat_profile` giao ZCode qua liên lạc), `docs/superpowers/specs/2026-11-06-enrich-nguoi-s03-design.md` (đính chính nếu code khác thiết kế).

- [ ] Step 1: Viết; Step 2: commit `docs: enrich-nguoi-s03 as-built`.

### Task 7: Đọc mù 30 Người (independent: false — sau Task 4)

- [ ] Step 1: `DATABASE_URL=…/oneinvest_en node pipeline/do-lien-lac-nguoi.mjs --mau 30 --ra ~/dev/onehub-invest/research-local/enrich-nguoi-s03/phieu-30.md`.
- [ ] Step 2: Tác tử tươi (không phải phiên viết code) đọc phiếu, gắn `dung | sai | khong_ro` + một câu lý do không chứa số hay tên, ghi `_acceptance/enrich-nguoi-s03/evidence/doc-mu-30.md` (30 dòng, cuối tệp dòng tổng).
- [ ] Step 3: Dưới ngưỡng (≥ 27 đúng, ≤ 1 rõ người khác) → ghi dòng sổ `fix`, không tự siết luật — trình ở Cổng Bằng chứng.
- [ ] Step 4: Commit `chore(acceptance): enrich-nguoi-s03 đọc mù 30 Người`.

## Thứ tự

Task 1 → 2 → 3 → 4 → 7; Task 5 sau Task 1; Task 6 bất kỳ lúc nào. Chỉ một task `independent: true` → thi hành tuần tự trong phiên chính, không fan-out.
