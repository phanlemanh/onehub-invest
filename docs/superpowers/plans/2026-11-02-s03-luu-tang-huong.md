# Lưu tầng và hướng của tin S03 — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đọc tầng và hướng từ bài S03, lưu qua phát biểu vào `floor_raw` và cột mới `unit_facing`, không đổi `offer_id`, không làm mất tầng của S06.

**Architecture:** Migration 067 thêm hai trường vào bộ máy phát biểu và ghi tầng cũ của S06 thành `legacy` trước khi đổi hàm phân xử. Bộ đọc thuần nằm trong `pipeline/transform-zalo.mjs`, phát biểu dựng ở `pipeline/lib/assert.mjs`. Transform kiểm 067 trước khi ghi nên chạy được trên DB chưa áp.

**Tech Stack:** PostgreSQL (PostGIS :5433), Node `.mjs`, `node:test`, sổ từ vựng `pipeline/vocab.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-02-s03-luu-tang-huong-design.md`; hợp đồng `_acceptance/s03-luu-tang-huong/contract.md`; tiêu chí đo `_acceptance/s03-luu-tang-huong/evals.yaml`.

## Global Constraints

- Mã nguồn chỉ `S0x`; không đưa tên nguồn thật, không đưa chữ bài thật vào kho. Câu trong ma trận do người viết.
- Không ghi DB `oneinvest` dùng chung; mọi phép ghi chạy trên DB thử `oneinvest_n1_sv2` (`bash db/db-thu.sh oneinvest_n1_sv2`), bọc `BEGIN…ROLLBACK` khi là phép đo.
- Không đổi `pipeline/sync-cloud.mjs`, không áp 067 lên cloud, không đụng route Zalo, OpenClaw.
- Hướng: nhãn `balcony|door|unspecified`; tám hướng chữ thường `north,south,east,west,northeast,northwest,southeast,southwest`; sắp theo chữ cái, bỏ trùng.
- Tầng: số 1–3 chữ số hoặc đúng `tầng thấp|tầng trung|tầng cao`.
- `method_version` của phát biểu mới: `transform-zalo@sv2`; lớp `observed`; phương pháp `parser`.
- Migration đánh số 067, chạy qua skill `/new-migration`; `npm test` chạy với `env -u DATABASE_URL`; trước mỗi commit mã chạy `/verify`.

## Review Focus

1. Tầng S06 ngoài miền mới (`1114`, một tin): AC-3 đòi giữ nguyên, AC-2 đòi từ chối giá trị 4 chữ số. 067 ghi `legacy` TRƯỚC khi tạo trigger; ca trong Task 1 ghim cả hai vế.
2. Chữ hoa, dấu tách lạ («Đông-Nam», «ĐÔNG NAM», «Đ.Nam»): ra đúng hoặc null, không đổ; ca trong Task 2.
3. Tên hướng nằm trong tên riêng («Tây Hồ», «Đông Anh», «Nam Từ Liêm», «Bắc Ninh»): null; ca trong Task 2.
4. Bài cùng lúc có «tầng cao» và «5 tầng»: giữ khoảng, không đọc số tầng của nhà; ca trong Task 2.
5. Chạy song song khi mã mới gặp DB áp 067 giữa lượt: kiểm 067 một lần đầu lượt, chạy trọn lượt theo kết quả đó; ca AC-10 trong Task 3.

---

### Task 1: Migration 067, sổ từ vựng, DQ, tài liệu RESO

**Files:**
- Create: `db/migrations/067_tang_huong_tin.sql`, `pipeline/scripts/luu-tang-huong.itest.mjs`, `pipeline/scripts/luu-tang-huong-db.sh`
- Modify: `pipeline/mappings.yaml:133`, khối `enums.assertion_field` và hai trục mới; sinh lại `pipeline/lib/vocab.generated.mjs`, `app/src/lib/vocab.generated.ts`, `agent/src/vocab.generated.ts`, `CONTEXT.md`; `pipeline/sql/450_dq_checks.sql`; `docs/architecture/reso-khung-phan-loai.md:89`; số đếm ở `pipeline/scripts/vocab.test.mjs`, `vocab-db.itest.mjs`, `phat-bieu-db.itest.mjs`, `dac-trung-s06-vocab-db.mjs` khi chúng ghim mã
- **Evals:** E1, E2, E10 (và nửa `writeOffers` của E3). **Independent:** không, các task sau cần 067.

**Interfaces:**
- Produces: `ASSERTION_FIELD.floor_raw`, `ASSERTION_FIELD.unit_facing`; cột `sale_offer_records.unit_facing text`; hàm SQL `unit_facing_hop_le(text) RETURNS boolean IMMUTABLE`; CHECK `sale_offer_records_unit_facing_chk`; trigger `field_assertions_gia_tri_067`; `pipeline/scripts/luu-tang-huong-db.sh` dựng DB thử rồi chạy itest.

- [ ] **Step 1: Viết ca đỏ** trong `luu-tang-huong.itest.mjs`, đặt đúng mã ca `SV2-AC-1`, `SV2-AC-2`, `SV2-AC-8`, và ca `writeOffers` của `SV2-AC-3`:
  - `SV2-AC-1`: áp tệp 067 hai lần trong giao dịch; fixture tin S06 có tầng: `count(*) = 1` phát biểu `legacy` sau lần một và sau lần hai; bản sao tệp bỏ `NOT EXISTS` thì `count = 2`.
  - `SV2-AC-2`: ma trận đúng («12», «tầng cao», «tầng thấp», «balcony:southeast», «unspecified:northeast,southeast», «door:north») và sai («abc», «1234», «tầng 5», «cao», «balcony:nam», «sideways:east», «balcony:», «balcony:east,east», «balcony:west,east») ở cả phương pháp `parser` và `legacy`, và ghi thẳng cột; lỗi khớp `/floor_raw|unit_facing/`.
  - `SV2-AC-3` nửa ghi lại: tin S06 tầng `1114` qua 067 giữ `1114` sau `resolve_offer_fields` và sau hai lượt `writeOffers`.
  - `SV2-AC-8`: `mappings.yaml` có `unit_facing.dd: null`, `rationale`, `checked_on`; `floor_raw.dd: UnitFloorLocation`; `vocab --check`, `--check-db` thoát 0; tài liệu RESO chứa dòng tách hướng S03; DQ `s03-unit-facing-fill` là `skip` khi 0 phát biểu, `pass` khi đủ, `fail` khi có phát biểu mà dưới 5% tin.
- [ ] **Step 2: Chạy** `bash pipeline/scripts/luu-tang-huong-db.sh`. Đạt khi đỏ vì chưa có 067.
- [ ] **Step 3: Viết 067** qua `/new-migration`, đúng thứ tự:
  1. Cột `unit_facing`, thêm `field_assertions_field_chk` hai mã, `CREATE OR REPLACE VIEW sale_offers`.
  2. Ghi `legacy` cho mọi dòng có `floor_raw` khuôn `pipeline/phat-bieu-cat-chuyen.mjs` (subject `source:neo`, `observed`, `legacy`, `045`, `rule_id` `offer:<offer_id>`, `evidence.offer_id`, `NOT EXISTS`). **Bước này đứng trước trigger**, để `1114` đi vào mà trigger vẫn từ chối giá trị đó từ nay về sau.
  3. `unit_facing_hop_le`, CHECK cột, trigger giá trị (`RAISE` nêu tên trường).
  4. `resolve_offer_fields` chép nguyên thân bản 061, thêm hai cột ở `kq`, `upd` và cả hai vế `IS DISTINCT FROM`.
  5. Seed `ref_lookup` từ `node pipeline/vocab.mjs --emit-seed`.
- [ ] **Step 4: Cập nhật sổ, DQ, tài liệu**; `node pipeline/vocab.mjs --write`. DQ theo spec điều kiện 6. Không đổi `DirectionFaces` của S08.
- [ ] **Step 5: Chạy lại** Step 2 và `cd pipeline && env -u DATABASE_URL npm test`. Đạt khi xanh, kể cả ca đột biến.
- [ ] **Step 6: Commit** `feat(db): 067 lưu tầng, hướng qua phát biểu`.

### Task 2: Bộ đọc thuần

**Files:**
- Modify: `pipeline/transform-zalo.mjs` (sau `docToaTruc`, dòng 288–308; `parsePost` dòng 373)
- Create: `pipeline/scripts/luu-tang-huong.test.mjs`
- **Evals:** E4, E6. **Independent:** có, không chạm DB.

**Interfaces:**
- Consumes: `gatSo`, `MA_DANG`, `KHONG_PHAI_TOA` của `transform-zalo.mjs`.
- Produces: `export function docTangHuong(text): { floor: string|null, facing: string|null }`; `parsePost` trả thêm `floor`, `facing`.

- [ ] **Step 1: Viết ca đỏ** `SV2-AC-4` (mỗi dòng cột Hướng của «Ma trận viết trước») và `SV2-AC-5` (mỗi dòng cột Tầng), một assert một dòng, số assert khẳng định bằng số dòng. Thêm ca Review Focus 2, 3, 4. Hai ca đột biến chạy trên bản sao tạm của `transform-zalo.mjs`: bỏ danh sách nơi chốn thì ghim `SV2-AC-4` đỏ; bỏ chặn «tầng 2-3» thì ghim `SV2-AC-5` đỏ.
- [ ] **Step 2: Chạy** `node --test pipeline/scripts/luu-tang-huong.test.mjs`. Đạt khi đỏ vì chưa có hàm.
- [ ] **Step 3: Viết `docTangHuong`** chuyển từ bộ đọc nháp audit (luật ở spec mục «Bộ đọc»). Số tầng theo mẫu `(?:tầng|tang|lầu)\s*[:\-]?\s*(\d{1,2})(?![\d.,]|\s*(?:m\b|m2|tầng|tum|và|,|-\s*\d))`. Có số thì số thắng khoảng. Tầng trong mã lấy đoạn giữa của mã duy nhất, `PR6xx20` ra null. Bài nhiều mã trả cả hai null.
- [ ] **Step 4: Chạy lại** Step 2. Đạt khi xanh.
- [ ] **Step 5: Commit** `feat(pipeline): đọc tầng và hướng từ bài S03`.

### Task 3: Nối vào transform

**Files:**
- Modify: `pipeline/lib/assert.mjs` (cạnh `phatBieuToaTruc`, dòng 100), `pipeline/transform-zalo.mjs` (`posts.push` dòng 727, 734; `writeOffers` dòng 782)
- Test: `pipeline/scripts/luu-tang-huong.itest.mjs`
- **Evals:** E8, E12. **Independent:** không, cần Task 1, 2.

**Interfaces:**
- Consumes: `docTangHuong`, `ASSERTION_FIELD.floor_raw`, `ASSERTION_FIELD.unit_facing`.
- Produces: `export function phatBieuTangHuong(source, bai, methodVersion)`; `export async function co067(client): Promise<boolean>`.

- [ ] **Step 1: Viết ca đỏ** `SV2-AC-6` (phát biểu đúng chủ thể, lớp, phương pháp; cột đúng; lần hai 0 dòng mới; hai bài khác giá trị thì `field_provenance` có `conflict: true`; đổi bộ đọc qua tham số `parse` thì dòng cũ rút lý do `thay-boi-luot`, cột theo giá trị mới) và `SV2-AC-10` (DB thử chưa áp 067: lượt xong, stderr chứa `067`, 0 phát biểu hai trường, số tin bằng bản nền; đã áp thì ghi đủ).
- [ ] **Step 2: Chạy** `bash pipeline/scripts/luu-tang-huong-db.sh`. Đạt khi đỏ.
- [ ] **Step 3: Viết** `phatBieuTangHuong`, `co067`. Transform gọi `co067` một lần đầu lượt; chưa áp thì `console.warn` nêu `067` và không thêm phát biểu hai trường. Không đưa tầng, hướng vào khoá gom.
- [ ] **Step 4: Chạy lại** Step 2. Đạt khi xanh.
- [ ] **Step 5: Commit** `feat(pipeline): transform S03 ghi phát biểu tầng và hướng`.

### Task 4: Bên đọc gặp khoảng tầng

**Files:**
- Create: `app/tests/luu-tang-huong.test.tsx`
- Modify: chỉ khi ca đỏ thật: thêm `export` cho hàm so tầng ở `agent/src/agents/judge-entity.ts`, `app/src/lib/ops/review-can-cu.ts`. Không đổi giao diện.
- **Evals:** E13. **Independent:** có.

**Interfaces:**
- Consumes: `khoaTang`, `TRUONG` của `pipeline/do-the-duyet.mjs`.

- [ ] **Step 1: Viết ca** `SV2-AC-11`: ba khoảng so với `12` ở `review-can-cu.ts` và `judge-entity.ts` ra `thieu`, chữ hiện nguyên; `12` với `13` ra `lech` (đối chứng); `TRUONG.tang({ floor_raw: "tầng cao" })` là `true`.
- [ ] **Step 2: Chạy** `cd app && node --import tsx --test tests/luu-tang-huong.test.tsx`. Đạt khi xanh; đỏ thì sửa đúng chỗ đỏ, không đổi giao diện.
- [ ] **Step 3: Commit** `test(app): bên đọc floor_raw gặp khoảng tầng`.

### Task 5: Phép đo trên 250 nhãn, bản sao DB, ranh giới

**Files:**
- Create: `pipeline/scripts/do-luu-tang-huong.mjs`
- **Evals:** E3, E5, E7, E9, E11. **Independent:** không, cần Task 1–3.

**Interfaces:**
- Consumes: `docTangHuong`, `runTransformZalo`, tệp 067; nhãn `research-local/s03-audit-0211/labels_huong.jsonl`, `posts.jsonl` ở checkout chính.
- Produces: ba chế độ `--nhan`, `--db`, `--ranh`, in đúng các dòng số của `evals.yaml`; thoát 1 khi một ngưỡng hỏng.

- [ ] **Step 1: Viết `--nhan`** in `huong_dung=<n>/109 huong_thua=<m>/141`, `khoang_dung=<n>/25 khoang_thua=<a>`, `so_dung=<k>/5 so_thua=<b>`; thiếu tệp nhãn thì đỏ với thông điệp; không in chữ bài. In kèm câu «nhãn do tác tử gắn, không phải nhãn vàng».
- [ ] **Step 2: Viết `--db`** trên DB thử `oneinvest_n1_sv2_do` (dựng bằng `db/db-thu.sh` khi chưa có, bọc `giu-nhip` vì chép lâu), trong `BEGIN…ROLLBACK`: áp 067, `resolve_offer_fields(NULL)`, so toàn bảng trước và sau: `floor_raw_lech=0/<N>`, `cot_doi=0`; transform bản có và bản đột biến đưa hướng vào khoá: `offer_id_lech=0`, `dot_bien_lech>0`; `tin_co_huong`, `tin_co_tang`, `bat_dong_huong`, `bat_dong_tang`. Bản 067 bỏ bước legacy thì `floor_raw_lech` đỏ.
- [ ] **Step 3: Viết `--ranh`** so với `origin/main`: `sync_cloud_doi=0`, `unit_facing_trong_sync=0`, `route_zalo_doi=0`, `ten_that=0` (tên đọc từ `source_registry` local, không in; đối chứng tệp giả trong bản sao thì đỏ), `nhan_gitignore=1`, `cau_bai_trong_diff=0`.
- [ ] **Step 4: Chạy cả ba chế độ.** Đạt khi đủ ngưỡng trong `evals.yaml`. Số thật lệch ngưỡng thì sửa bộ đọc, không sửa ngưỡng; lệch do nhãn thì ghi sổ và báo ở Gate 2.
- [ ] **Step 5: Commit** `test(pipeline): thước đo lưu tầng và hướng`, rồi chạy `design-floor-s3.mjs`, đặt `status: implemented`, vào S4.
