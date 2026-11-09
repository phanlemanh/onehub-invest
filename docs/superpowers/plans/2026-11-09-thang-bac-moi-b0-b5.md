# Thang bậc mới B0–B5 chạy hằng ngày — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bậc dữ liệu chạy mỗi ngày (087, 610, DO1, báo cáo ngày, hai trang Ops) theo thang FRAMING §3.4 viết lại 08/11.

**Architecture:** 087 là nguồn luật duy nhất: hai vị từ chờ bảng nối (`offer_located`, `offer_unit_key`), bậc tin
(`offer_data_level`), bậc căn (`unit_data_level`), tập đơn vị (`data_level_units`), cột `scale` để đánh dấu đổi thang. 610 và
DO1 cùng đọc `data_level_units()`; app đọc `levelOf` (cùng luật, truyền `located = false`).

**Tech Stack:** PostgreSQL (migration 087), Node .mjs (pipeline, scripts), Next.js/TS + jsdom (app), node:test.

**Spec:** `docs/superpowers/specs/2026-11-09-thang-bac-moi-b0-b5-design.md` · hợp đồng `_acceptance/thang-bac-moi-b0-b5/contract.md`
(duyệt 09/11, Hỏi-1 bỏ design-pass, Hỏi-2 B4 = mọi trường lõi `measured` hoặc `fact`).

## Global Constraints

- Migration chỉ thử trên DB của riêng lượt (`db/db-thu.sh … --chay`) hoặc trong BEGIN … ROLLBACK; không áp lên `oneinvest`.
- 087 idempotent (`CREATE OR REPLACE`, `ADD COLUMN IF NOT EXISTS`, `ON CONFLICT … DO UPDATE`); câu nạp `ref_lookup` ở cấp ngoài
  cùng, kết thúc `;` cuối dòng (vocab-db.itest phát lại câu ấy); CHECK của cột `scale` viết trong `ADD COLUMN` (không đặt tên
  `_check` riêng — vocab-db.itest phát lại mọi `ADD CONSTRAINT …_check`).
- Kiểu tham số `offer_data_level(text, text, numeric, numeric, text, boolean)` giữ nguyên.
- Giá trị `scale`: `thang-2310` (dòng cũ), `thang-0811` (mặc định mới).
- Nhãn: B0 «Có lời khai» · B1 «Tin» · B2 «Định vị» · B3 «Gắn căn» · B4 «Làm giàu» · B5 «Sống».
- Chỗ kẹt: B0 `truong-loi` · B1 `dinh-vi` · B2 `gan-can` · B3 `lam-giau` · B4 `hieu-luc` · B5 `giu-nhip`.
- Chữ UI: «Lên B2 cần định vị tin vào dự án, toà hoặc trục của danh bạ.» · «Lên B3 cần khớp đúng một căn của danh bạ.»
- Không đổi tên test có trong `scripts/ci-bo-qua.json` (describe «DF-AC-3 SQL khớp levelOf» và ca của nó).
- Chuỗi `m.id IN (w.id, w.parent_id)` trong 610 giữ nguyên.
- Không sửa `pipeline/sql/600_data_flow.sql`, `pipeline/scripts/trang-thai-chao.itest.mjs` (vùng hàng khác).

## Review Focus

1. **Gộp trước khi áp 087**: job đêm chạy 610 và DO1 trên DB máy thu chưa có 087 → `bac-du-lieu.mjs --write` và
   `do-hang-ngay.mjs --write` phải in «chưa áp 087 — bỏ qua», ghi một dòng `dq_check_results` `skip` và thoát 0, không ghi
   ảnh chụp hay dòng chuyển. Test ở Task 3 và Task 4.
2. **Ngày đổi thang chạy hai lần trong ngày**: lần hai cùng ngày vẫn không ghi dòng chuyển và giữ `tu_ngay`. Test Task 4.
3. **Tin vừa trỏ cụm vừa gắn căn qua fixture**: chỉ đếm ở căn. Test Task 3 (E4).
4. **Dòng DO1 đời trước (không `thang`) trộn dòng mới trong 14 ngày**: trang chỉ đọc `thang` của dòng mới nhất. Test Task 6 (E7).
5. **Báo cáo ngày chạy khi chỉ có một ảnh chụp thang mới**: NS3 không so, không lỗi. Test Task 5.

---

### Task 1: Migration 087, sổ từ vựng, nhãn

**Files:**
- Create: `db/migrations/087_thang_bac_moi.sql`
- Modify: `pipeline/mappings.yaml` (trục `data_level`, nhãn), sinh lại `pipeline/lib/vocab.generated.mjs`, `agent/src/vocab.generated.ts`, `app/src/lib/vocab.generated.ts`, khối VOCAB của `CONTEXT.md`
- Modify: `CONTEXT.md` (thuật ngữ «Phân bố bậc»: đơn vị = tin + căn của danh bạ; code `data_level_units`, `unit_data_level`)
- Modify: `pipeline/scripts/vocab.test.mjs` (VB-AC-1 ghim nhãn mới)
- Create: `pipeline/scripts/thang-bac.itest.mjs` (ca TB-AC-1 ref_lookup, TB-AC-3)
- Modify: `_acceptance/config.yaml` không đổi (khoá `tb_*` đã có)

**Interfaces — Produces (087):**
- `offer_located(p_offer_id text) RETURNS boolean` — `false`.
- `offer_unit_key(p_offer_id text) RETURNS text` — `NULL`.
- `offer_data_level(p_kind text, p_property_type text, p_price_vnd numeric, p_area_m2 numeric, p_area_id text, p_located boolean) RETURNS TABLE (data_level text, ke_thieu text)` — DROP rồi CREATE (đổi tên tham số).
- `unit_data_level() RETURNS TABLE (unit_key text, data_level text, ke_thieu text, source text, area_id text, property_type text, offer_ids text[])` — căn có tin gắn (`offer_unit_key(o.offer_id) IS NOT NULL`), bậc cao nhất; B3 đủ trường lõi; B4 thêm mọi trường lõi `measured = 'true'` hoặc `tier = 'fact'`; B5 thêm `offer_status = 'active'`, `last_seen >= now() - freshness_window()`, căn có ≥ 2 mốc giá (đếm dòng `history_transactional` loại `new_listing`/`price_change` của các tin gắn, hoặc ≥ 2 tin gắn). Căn không có tin đủ trường lõi → không trả dòng.
- `data_level_units() RETURNS TABLE (unit_key text, unit text, data_level text, ke_thieu text, source text, area_id text, property_type text, offer_ids text[])` — `tin:<offer_id>` cho mọi tin S03/S05/S06 của `sale_offers` mà `offer_unit_key` NULL; `can:<unit_key>` từ `unit_data_level()`.
- `DROP FUNCTION IF EXISTS property_data_level(bigint[])`.
- `ALTER TABLE data_level_snapshot ADD COLUMN IF NOT EXISTS scale text NOT NULL DEFAULT 'thang-2310' CHECK (scale IN ('thang-2310','thang-0811'))`, rồi `ALTER COLUMN scale SET DEFAULT 'thang-0811'`; cùng thế cho `data_level_unit`.
- `INSERT INTO ref_lookup … ('data_level','B1',NULL,'Tin',true,2) … ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET label_vi = EXCLUDED.label_vi;` cho B1–B4.

- [ ] **Step 1: Viết ca TB-AC-1 (ref_lookup) và TB-AC-3 trong `thang-bac.itest.mjs`** — mỗi ca BEGIN, `pg_advisory_xact_lock(56056)`, nạp 087 THẬT, ROLLBACK. TB-AC-1: nhãn `ref_lookup` so trọn mảng của Global Constraints; `checkDb` lọc `axis = 'data_level'` trả `[]`; chiều đỏ: trước khi nạp 087 cùng giao dịch → có msg «ref_lookup lệch sổ ở data_level · B2». TB-AC-3: bảng tạm `tb_unit_map(offer_id, unit_key)` + `CREATE OR REPLACE offer_unit_key` đọc bảng đó; năm căn (buildings/units của 082 với khoá `unt_` + 26 ký tự Crockford) theo bảng kỳ vọng của E3; đột biến bỏ vế `last_seen` → ghim «TB-AC-3 quá cửa sổ vẫn B5»; không fixture → rỗng; `to_regprocedure('property_data_level(bigint[])') IS NULL`.
- [ ] **Step 2: Chạy, thấy đỏ** — `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tb --chay node --test scripts/thang-bac.itest.mjs` → lỗi «không tìm thấy 087».
- [ ] **Step 3: Viết 087** theo Interfaces; header theo mẫu 083 (số do giám sát cấp, không sync cloud, áp máy thu là lời riêng của Mạnh).
- [ ] **Step 4: Sổ từ vựng** — sửa nhãn trong `pipeline/mappings.yaml`, `node pipeline/vocab.mjs --write`, `node pipeline/vocab.mjs --check` thoát 0; sửa VB-AC-1 trong `vocab.test.mjs`; sửa thuật ngữ «Phân bố bậc» của `CONTEXT.md`.
- [ ] **Step 5: Chạy lại** Step 2 + `node --test pipeline/scripts/vocab.test.mjs` → xanh. Áp 087 hai lần trên DB thử để chứng idempotent: `bash db/db-thu.sh oneinvest_tb087 && for i in 1 2; do docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest_tb087 -v ON_ERROR_STOP=1 < db/migrations/087_thang_bac_moi.sql; done`.
- [ ] **Step 6: Commit** `feat(db): 087 thang bậc mới B0–B5 — vị từ chờ bảng nối, bậc tin, bậc căn, tập đơn vị, cột scale`.

phục vụ E1, E1b, E3 · independent: false (mọi task sau đọc 087)

### Task 2: checkDb đọc đúng CHECK danh sách

**Files:** Modify `pipeline/lib/vocab-core.mjs` (`checkDb`); Test `pipeline/scripts/thang-bac.itest.mjs` (ca TB-AC-9).

**Interfaces — Produces:** `export function chonCheckCot(defs, cot) → {conname, def, convalidated} | undefined` — ưu tiên def khớp `\(?${cot}\)? = ANY \(\(?ARRAY\[` hoặc `${cot} IN \(`; không có thì phần tử đầu (luật cũ). `checkDb` dùng nó thay `defs[0]`.

- [ ] **Step 1: Viết ca TB-AC-9** theo E9 (sổ bản sao thêm B9; đối chứng đỏ: bộ chọn `defs[0]` giữ trong test).
- [ ] **Step 2: Chạy, thấy đỏ** (msg chứa «thừa [moi]»).
- [ ] **Step 3: Thêm `chonCheckCot`, dùng trong `checkDb`.**
- [ ] **Step 4: Chạy lại** TB-AC-9 + `cd pipeline && node --test scripts/vocab-db.itest.mjs` (DB của riêng lượt) → xanh.
- [ ] **Step 5: Commit** `fix(pipeline): checkDb chọn CHECK danh sách của chính cột, thôi vớ CHECK chéo data_level_change`.

phục vụ E9 · independent: true

### Task 3: 610 và ảnh chụp bậc

**Files:** Modify `pipeline/sql/610_data_level.sql`, `pipeline/bac-du-lieu.mjs`; Modify `pipeline/scripts/bac-du-lieu.itest.mjs` (bỏ ca căn = cụm, thêm nạp 087), `pipeline/scripts/s03-len-cong.itest.mjs` (đếm `tin_le` theo luật mới nếu cần), `pipeline/scripts/trang-thai-roundtrip.mjs` (B5 qua `unit_data_level`); Test `pipeline/scripts/thang-bac.itest.mjs` (TB-AC-4 hai ca).

**Interfaces:**
- 610: `INSERT INTO data_level_snapshot (snap_date, market_id, property_type, unit, data_level, n, scale)` từ `data_level_units()`; `scale` = `'thang-0811'`.
- `bac-du-lieu.mjs`: `export async function co087(client) → boolean` (`to_regprocedure('data_level_units()') IS NOT NULL`); `--write` khi `co087` false → in «bac-du-lieu: chưa áp 087 — bỏ qua», chèn `('data-level:distribution','all','skip','chua-ap-087')`, thoát 0.

- [ ] **Step 1: Viết hai ca TB-AC-4** theo E4 (đếm đơn vị; hai bộ đếm một tập — gọi `donViHienTai` của Task 4, nên ca hai viết ở Task 4 Step 1) và ca «chưa áp 087 bỏ qua» (Review Focus 1: giao dịch không nạp 087 → `ghiAnhChup` không chạy, dòng `skip`).
- [ ] **Step 2: Chạy, thấy đỏ.**
- [ ] **Step 3: Sửa 610, `bac-du-lieu.mjs`, itest cũ, `trang-thai-roundtrip.mjs`.**
- [ ] **Step 4: Chạy lại** `config:executors.test.tb_db` → xanh.
- [ ] **Step 5: Commit** `feat(pipeline): 610 đếm tin và căn theo thang 08/11, ghi scale; bỏ qua có tên khi chưa áp 087`.

phục vụ E4 · independent: false (cần Task 1)

### Task 4: DO1 — đơn vị chung, đổi thang lập mốc lại

**Files:** Modify `pipeline/do-hang-ngay.mjs` (`donViHienTai`, nhánh đổi thang, `thang` trong detail, chốt chưa 087), `pipeline/lib/do-hang-ngay.mjs` (`chuyenBac`: lý do `gan-can` = tin chuyển sang căn của danh bạ); Modify `pipeline/scripts/do-hang-ngay.test.mjs`, `pipeline/scripts/do1-dung-thu.mjs` (fixture qua `offer_unit_key`, không qua `property_offers`); Test `pipeline/scripts/thang-bac.itest.mjs` (TB-AC-5, TB-AC-4 ca hai).

**Interfaces:**
- `donViHienTai(client)` đọc `data_level_units()`; `core` dựng như cũ từ `offer_ids`.
- `export const THANG = 'thang-0811'`; `export async function tuNgayThang(client) → string` = `min(snap_date)::text FROM data_level_snapshot WHERE scale = THANG` (null → ngày chạy).
- `doHangNgay`: `data_level_unit` có dòng `scale <> THANG` → không ghi `data_level_change`, đẩy `{check_name:'do1-chuyen-bac', entity:'tat-ca', status:'skip', detail:{ly_do:'doi-thang', don_vi, thang:{ma:THANG, tu_ngay}}}`, thay `data_level_unit` (scale mới). Mọi dòng `do1-chuyen-bac` khác mang `detail.thang`. Chưa áp 087 → một dòng `skip` `ly_do: 'chua-ap-087'`, không ghi gì khác.

- [ ] **Step 1: Viết TB-AC-5** (theo E5, ảnh chụp thang mới ngày D−2), ca chạy hai lần cùng ngày (Review Focus 2), TB-AC-4 ca hai (tập khoá 610 = `donViHienTai`), ca chưa 087.
- [ ] **Step 2: Chạy, thấy đỏ.**
- [ ] **Step 3: Sửa DO1 và lib; sửa `do-hang-ngay.test.mjs`, `do1-dung-thu.mjs`.**
- [ ] **Step 4: Chạy lại** `tb_db` + `cd pipeline && npm test` (bộ đủ) → xanh.
- [ ] **Step 5: Commit** `feat(pipeline): DO1 đọc tập đơn vị chung, lập mốc lại ngày đổi thang 08/11`.

phục vụ E4, E5 · independent: false (cần Task 1, 3)

### Task 5: Báo cáo ngày

**Files:** Modify `scripts/lib/bao-cao-ngay.mjs`, `scripts/bao-cao-ngay.mjs`; Test `scripts/bao-cao-ngay.test.mjs`.

**Interfaces:** `oBacGiam(truoc, sau, opts)` — hàng có `scale`; khác thang (tập `scale` của hai ảnh chụp khác nhau) → `{nghi: [], roi: [], doiThang: true}`; `export function demNs1(sau) → {NS1, NS1b}` (chuyển từ `bao-cao-ngay.mjs:77-78`); markdown in «đổi thang, không so» khi `doiThang`. Câu SQL đọc ảnh chụp thêm cột `scale` (thiếu cột — DB chưa 087 → coi như `thang-2310`).

- [ ] **Step 1: Viết ca TB-AC-6 hai ca** theo E6 + ca một ảnh chụp (Review Focus 5).
- [ ] **Step 2: Đỏ.** **Step 3: Sửa.** **Step 4:** `node --test scripts/bao-cao-ngay.test.mjs` xanh.
- [ ] **Step 5: Commit** `feat(scripts): báo cáo ngày không so hai ảnh chụp khác thang bậc`.

phục vụ E6 · independent: true (chỉ đọc cột `scale` qua câu SQL; test thuần)

### Task 6: App — bậc của tin, ngăn chi tiết, lọc, dòng đổi thang

**Files:** Modify `app/src/lib/data-level.ts` (`LevelInput.located`), `app/src/lib/data-flow-queries.ts` (bỏ `EXISTS property_offers AS linked`, `located: false`), `app/src/components/ops/data-flow/record-sheet.tsx` (`LevelGate`), `app/src/components/ops/data-flow/records-filter.tsx` (chú thích `LEVEL_VARIANT`), `app/src/lib/do-hang-ngay.ts` (kiểu `chuyenBac.thang`), `app/src/components/ops/quality/do-hang-ngay.tsx` (phần tử `data-do1-thang`), `app/scripts/bac-roundtrip.ts`; Tests: create `app/tests/thang-bac.test.tsx` (E1, E7, E8), `app/tests/thang-bac-db.itest.tsx` (E12 trước, rồi nạp 087 thật: E7b, E8b); modify `app/tests/data-level.test.tsx`, `app/tests/data-level-sql.itest.tsx` (ma trận 128 ô), `app/tests/ops-dong-chay.test.tsx` (chữ, lọc B2), `app/tests/do-hang-ngay-quality.test.tsx`, `app/tests/dong-chay-cloud.test.tsx` (chú thích).

**Interfaces:** `levelOf({…, located: boolean}) → TinLevel`; dòng đổi thang: `<p data-do1-thang="">Thang bậc 08/11 (B2 Định vị, B3 Gắn căn) áp từ {fmtDate(tu_ngay)} — dòng chuyển bậc tính từ ngày này.</p>`, thêm câu «Ngày đổi thang là lần hạ một lần, không phải tụt bậc.» khi `ly_do = 'doi-thang'`. Thành phần ReUI có sẵn (`FramePanel`, chữ `text-sm text-muted-foreground`), không thêm vùng.

- [ ] **Step 1: Viết test** theo E1, E2, E7, E7b, E8, E8b, E12 + Review Focus 4.
- [ ] **Step 2: Đỏ.** **Step 3: Sửa mã app.**
- [ ] **Step 4:** `config:executors.test.tb_app`, `tb_app_db`, `cd app && npx tsc --noEmit && npm run lint && npm test` → xanh; `config:executors.design.tb_gate` → 0 P0.
- [ ] **Step 5: Nhìn** — dev server cổng 3464 trên DB thử có 087 (`oneinvest_tb087`), chụp `/ops/quality` và ngăn tin `/ops/data-flow` ở sáng, tối, 390 px (đối chiếu `onehub-ui/loop.md`).
- [ ] **Step 6: Commit** `feat(ops): bậc tin theo thang 08/11 ở Dòng chảy, dòng đổi thang ở Chất lượng`.

phục vụ E1, E2, E7, E7b, E8, E8b, E11, E12 (E10 chấm ở S4) · independent: false (cần Task 1, 4)

### Task 7: Tài liệu

**Files:** Modify `docs/ROADMAP.md` (§2 as-built, §4 trạng thái), `pipeline/CLAUDE.md` (bậc theo 087, chốt chưa 087).

- [ ] **Step 1: Sửa.** **Step 2: Commit** `docs: thang bậc 08/11 chạy hằng ngày (ROADMAP, pipeline/CLAUDE.md)`.

phục vụ — · independent: true
