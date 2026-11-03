# SĐT S06 ghép theo tài khoản: kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: chạy tuần tự trong main loop theo superpowers:executing-plans (S3 của feature-loop, cả năm task `independent: false`). Steps dùng checkbox (`- [ ]`).

**Goal:** đưa SĐT người bán S06 từ `stg_chotot_ads.seller` lên `sale_offer_records.seller_phone`, ghép theo tài khoản có đúng một số, xuất xứ tách được.

**Architecture:** một câu SQL gom theo tập trong `pipeline/gan-sdt-s06.mjs`, gọi cuối `runTransformChotot` sau phân xử. Migration 068 vá định nghĩa `resolve_offer_fields` đang chạy để giữ khoá `field_provenance.seller_phone`.

**Tech Stack:** Node `.mjs`, `pg`, `node:test`, PostGIS local :5433, lược đồ riêng `pipeline/lib/luoc-do-rieng.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-02-sdt-s06-ghep-tai-khoan-design.md`. Hợp đồng và tiêu chí: `_acceptance/sdt-s06-ghep-tai-khoan/{contract.md,evals.yaml}`.

## Global Constraints

- Không gọi nguồn S06, không chạy bộ thu, không sửa `collect-*`, `import-*`, `sync-cloud`, `push-ops-facts`, `app/`, `data-api/`, `collector/`.
- Không áp 068 và không ghi thật lên DB máy thu trong vòng này; số «sau» đo bằng ROLLBACK.
- Test chạy BEGIN…ROLLBACK trên lược đồ riêng, số bịa. Đầu ra lệnh không mang SĐT. Chỉ dùng mã `S06`, không tên nguồn thật.
- E.164: `'^\+84[35789][0-9]{8}$'`. Băm: `left(encode(sha256(convert_to(p,'UTF8')),'hex'),32)`.
- Xuất xứ trực tiếp `{tier:"fact",method:"source_field",rule_id:"s06-so-tren-tin",measured:false}`. Ghép `{tier:"observed",method:"e1_rule",rule_id:"s06-cung-tai-khoan",tu_tin:<list_id nhỏ nhất mang số>,measured:false}`. Không có `v`.
- Mỗi phép đo mới có cặp hai chiều trên cùng fixture, chiều đỏ ghim thông điệp (MEASURE-BIRTH-CLAUSE).
- Comment logic miền tiếng Việt, tên hàm theo nếp `pipeline/lib/`.

## Review Focus

Năm loại đầu vào hợp đồng không nói thẳng; mỗi dòng có test ở task sở hữu:

1. Một tài khoản có nhiều tin cùng một số: phải đếm là một số, tin còn lại vẫn được ghép. (Task 2)
2. Số `0919…` và `+84919…` cùng tài khoản: dạng `0` là sai dạng, không tính thêm số thứ hai, đếm vào `sai_e164`. (Task 2)
3. Dòng stg mang số nhưng không có tin canonical (bị bỏ vì thiếu giá): vẫn đóng góp số cho tài khoản, `tu_tin` trỏ dòng stg đó. (Task 2)
4. `tu_tin` chọn nhỏ nhất theo số, không theo chữ: `list_id` 9 đứng trước 10. (Task 2)
5. `account_id` toàn khoảng trắng và `phone_hidden` dạng chuỗi `"true"`: khoảng trắng tính là trống mã, chuỗi vẫn là ẩn. (Task 2)

---

### Task 1: Migration 068 giữ khoá xuất xứ qua phân xử

`independent: false`. Phục vụ E1 (phần 068).

**Files:**
- Create: `db/migrations/068_giu_nguon_goc_sdt.sql`, `pipeline/lib/nap-068.mjs`
- Test: `pipeline/scripts/gan-sdt-s06.test.mjs`

**Interfaces:**
- Produces: `MIG_068: string`, `nap068(client, sql = MIG_068): Promise<boolean>` (trong giao dịch, trả `true` khi vừa áp), `daCoPhanGiu068(client): Promise<boolean>` (định nghĩa đang chạy có `fp_sdt`); helper test `withTx(fn)` dựng lược đồ riêng `gs_*` gồm `stg_chotot_ads`, `sale_offer_records`, `field_assertions`, `ops_audit`, một dòng `action='phat-bieu:cat-chuyen'`, và bản `resolve_offer_fields` chép từ public sang lược đồ riêng (thay `public.resolve_offer_fields` trong `pg_get_functiondef`).

- [ ] **Step 1: Viết test đỏ `GS-AC-1 (068)`.** Ghi tay `field_provenance = {seller_phone:{…}, offer_status:{…}}` lên hai tin rồi gọi `resolveOffers`:
  - trước 068: khoá `seller_phone` mất, helper `kiemGiuKhoa` ném `MAT-NGUON-GOC-SDT`;
  - sau 068 (áp hai lần): khoá `seller_phone`, `offer_status` còn, 068 đổi 0 dòng, lượt hai `offers_changed = 0`, tin không khoá không sinh khoá; mọi khoá khác và các cột phát biểu giống hệt lượt trước 068 trên cùng tin (chạy trong SAVEPOINT rồi so);
  - `nap068` với bản hàm đã đổi mốc: ném lỗi chứa `MOC-068`.
- [ ] **Step 2: Chạy, xác nhận đỏ.** `node --test pipeline/scripts/gan-sdt-s06.test.mjs`. Mong đợi: FAIL vì chưa có `lib/nap-068.mjs`.
- [ ] **Step 3: Viết 068.** Header gồm mục đích, `KHÔNG sync cloud`, căn cứ. Khối DO đọc `pg_get_functiondef(to_regprocedure('resolve_offer_fields(text[])'))`; đã có `fp_sdt` thì RETURN. Chèn theo hai mốc nguyên văn: sau `field_provenance -> 'offer_status' AS fp_chao` thêm `, field_provenance -> 'seller_phone' AS fp_sdt`; trước ` AS field_provenance` của dòng `ELSE jsonb_build_object('offer_status', max(o.fp_chao::text)::jsonb) END` thêm `|| CASE WHEN max(o.fp_sdt::text) IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('seller_phone', max(o.fp_sdt::text)::jsonb) END`. Thiếu mốc nào thì `RAISE EXCEPTION 'MOC-068: …'`. `EXECUTE` định nghĩa mới. Không chép thân hàm.
- [ ] **Step 4: Viết `nap-068.mjs`** theo khuôn `nap-060.mjs`.
- [ ] **Step 5: Chạy lại test.** Mong đợi: ca `GS-AC-1 (068)` PASS.
- [ ] **Step 6: Commit** `feat(db): 068 giữ xuất xứ SĐT qua phân xử`. Chạy `/verify` trước commit.

### Task 2: Bộ gán `ganSdtS06` và ma trận 88 ô

`independent: false`. Phục vụ E2, E3, E5, E7.

**Files:**
- Create: `pipeline/gan-sdt-s06.mjs`
- Test: `pipeline/scripts/gan-sdt-s06.test.mjs`

**Interfaces:**
- Consumes: `daCoPhanGiu068`, `withTx` (Task 1).
- Produces: `SQL_GAN: string`; `ganSdtS06(client, {sql = SQL_GAN} = {}): Promise<{doi, truc_tiep, ghep, rut, tai_khoan_hai_so, sai_e164, bo_qua: null|"CHUA-AP-068"}>`. Tham số `sql` để test đột biến bằng `String.replace`; test assert chuỗi thay được, không thì đột biến vô hiệu.

- [ ] **Step 1: Viết test đỏ `GS-AC-2`.** Sinh ô bằng tích Đề-các bốn trục, assert 88 ô và đúng 8 ô gạch «số riêng hợp lệ × tài khoản 0 số». Kỳ vọng từng ô đọc từ bảng L1–L9 viết tay trong test. Assert số, băm (so `node:crypto`), `tier`, `method`, `rule_id`; `tu_tin` là dòng stg cùng tài khoản mang đúng số. Đột biến cùng fixture: bỏ điều kiện ẩn số ghim `AN-SO-BI-GHEP`; `n >= 1` thay `n = 1` ghim `HAI-SO-BI-GHEP`; `tu_tin` đổi sang tin khác tài khoản ghim `TU-TIN-LECH`.
- [ ] **Step 2: Viết test đỏ `GS-AC-3a`, `GS-AC-3b`.** Lượt một có số ghép; lượt hai đổi stg (chuyển ẩn số, hoặc thêm số thứ hai) thì số, băm, khoá xuất xứ bị rút; tin trực tiếp và không rõ gốc giữ nguyên. Đột biến bỏ từng bước rút ghim `CON-SO-GHEP-SAU-AN`, `CON-SO-GHEP-HAI-SO`.
- [ ] **Step 3: Viết test đỏ `GS-AC-5`, `GS-AC-7` và năm dòng Review Focus.** Số sai dạng không vào tin, không tính vào tài khoản, `sai_e164` đúng số dòng, đột biến bỏ lọc ghim `SAI-E164-VAO-TIN`. Tin S03 cùng `originating_system_key` không đổi, đột biến bỏ lọc nguồn ghim `DUNG-NGUON-KHAC`. Tin S06 có `retired_at` vẫn được gán.
- [ ] **Step 4: Chạy, xác nhận đỏ.** Mong đợi: FAIL vì chưa có `gan-sdt-s06.mjs`.
- [ ] **Step 5: Viết `SQL_GAN` và `ganSdtS06`.** Khi `daCoPhanGiu068` là false: không ghi, `console.log` một dòng chứa `CHUA-AP-068`, trả `bo_qua`. Câu SQL gồm các CTE:
  - `nen`: mỗi dòng stg ra `list_id`, `tk = nullif(btrim(payload->>'account_id'),'')`, `an = coalesce(payload->>'phone_hidden','') = 'true'`, `so` là `seller->>'phone'` khi khớp E.164 (sai dạng thành null, đếm riêng);
  - `tk`: gom theo `tk` khác null: `count(distinct so)`, số duy nhất, `min(list_id)` trên dòng mang số đó;
  - `muc`: nối `sale_offer_records r` với `nen` qua `r.source='S06' AND r.originating_system_key = s.list_id::text`, lớp giá trị đang có theo `field_provenance->'seller_phone'->>'rule_id'`: trống, trực tiếp, ghép, không rõ gốc (có số mà không khoá);
  - `UPDATE … RETURNING`: áp L1–L9, chỉ ghi dòng có đổi (`IS DISTINCT FROM` trên số, băm, khoá) để chạy lại ra `doi = 0`. Rút là null số, null băm, bỏ khoá xuất xứ.
- [ ] **Step 6: Chạy lại test.** Mong đợi: PASS cả GS-AC-2, 3a, 3b, 5, 7.
- [ ] **Step 7: Commit** `feat(pipeline): gán SĐT S06 theo tài khoản`. Chạy `/verify` trước commit.

### Task 3: Nối vào `runTransformChotot`

`independent: false`. Phục vụ E1 (phần chuỗi), E4, E6.

**Files:**
- Modify: `pipeline/transform-chotot.mjs:122` (sau `resolveOffers`, không đổi câu INSERT)
- Test: `pipeline/scripts/gan-sdt-s06.test.mjs`

**Interfaces:**
- Consumes: `ganSdtS06` (Task 2), `nap068` (Task 1).
- Produces: giá trị trả của `runTransformChotot` thêm khoá `sdt` là kết quả `ganSdtS06`.

- [ ] **Step 1: Viết test đỏ `GS-AC-1`, `GS-AC-4`, `GS-AC-6`.** Chuỗi qua `runTransformChotot` thật, dòng stg dạng hợp đồng v5:
  - lượt một có số; lượt hai không đổi stg thì `sdt.doi = 0`; xoá `seller.phone` rồi lượt ba thì số, băm, xuất xứ từng tin không đổi. Đột biến gán null khi stg trống ghim `MAT-SO-KHI-STG-TRONG`;
  - tin do `ganSdtS06` thật ghi, qua phân xử, khoá còn nguyên;
  - hai nhánh cùng fixture chỉ khác một lần áp 068: có thì tin có số, không có (kể cả áp lại bản hàm không phần giữ) thì 0 số, log chứa `CHUA-AP-068`, không ném.
- [ ] **Step 2: Chạy, xác nhận đỏ.** Mong đợi: FAIL ở assert số trên tin, vì transform chưa gọi bộ gán.
- [ ] **Step 3: Gọi `ganSdtS06(client)`** ngay sau dòng `resolveOffers`, log một dòng đếm, thêm `sdt` vào giá trị trả.
- [ ] **Step 4: Chạy lại test và suite pipeline.** `node --test pipeline/scripts/gan-sdt-s06.test.mjs` rồi `cd pipeline && npm test`. Mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(pipeline): transform S06 gán SĐT sau phân xử`. Chạy `/verify` trước commit.

### Task 4: Lệnh đo `--thu`

`independent: false`. Phục vụ E8.

**Files:**
- Modify: `pipeline/gan-sdt-s06.mjs`
- Test: `pipeline/scripts/gan-sdt-s06.test.mjs`

**Interfaces:**
- Consumes: `ganSdtS06`, `nap068`.
- Produces: `doSdtS06(client)` trả `{ban:{song,nghi,truoc,sau,truc_tiep,ghep}, thue:{…}, tai_khoan_hai_so, an_so_bi_ghep, sai_e164, ghep_lech_tu_tin}`; `kiemBatBien(so): string[]` trả các mã lỗi; `inKhongSo(dong)` ném `RO-SO` khi chuỗi khớp `+84` hay `0` mười chữ số; `demDocLap(client)` đếm tin sẽ ghép bằng câu riêng trên stg, không dùng `SQL_GAN`.

- [ ] **Step 1: Viết test đỏ `GS-AC-8`.** Cùng fixture hai chiều: tin ẩn số mang số ghép thì `kiemBatBien` trả `AN-SO-BI-GHEP`; câu đếm lệch trả `DEM-LECH`; chuỗi có SĐT qua `inKhongSo` ném `RO-SO`; md5 trước và sau lệch trả `DB-DOI`. Tin nghỉ tách riêng khỏi tin sống trong `doSdtS06` (E7).
- [ ] **Step 2: Chạy, xác nhận đỏ.**
- [ ] **Step 3: Viết `--thu`.** Một client, BEGIN, tự áp 068, đo trước, gán, đo sau, in `da_ap_068=true`, dòng bán, dòng thuê, các bất biến, ROLLBACK; md5 cột `seller_phone`, `seller_phone_hash` của S06 đo trước BEGIN và sau ROLLBACK bằng client thứ hai. Có mã lỗi thì `process.exit(1)`. `kind='rent_lt'` là thuê. Có đường chạy tay không cờ (ghi thật, in số đếm).
- [ ] **Step 4: Chạy.** `node --test pipeline/scripts/gan-sdt-s06.test.mjs` rồi `node pipeline/gan-sdt-s06.mjs --thu`. Mong đợi: `an_so_bi_ghep=0 sai_e164=0 ghep_lech_tu_tin=0`, `ghep` > 0 và bằng câu đếm độc lập, exit 0, không dòng nào mang số.
- [ ] **Step 5: Commit** `feat(pipeline): lệnh đo --thu cho gán SĐT S06`. Chạy `/verify` trước commit.

### Task 5: Ranh giới, thuật ngữ, tài liệu

`independent: false`. Phục vụ E9.

**Files:**
- Create: `_acceptance/sdt-s06-ghep-tai-khoan/probes/ranh-gioi.sh`
- Modify: `CONTEXT.md`, `docs/ROADMAP.md` (§2, §4), `pipeline/CLAUDE.md` nếu có mục tương ứng

- [ ] **Step 1: Viết probe.** Chạy `node --test pipeline/sync-cloud.test.mjs`; lấy `git diff --name-only $(git merge-base HEAD origin/main)`, thoát 1 kèm tên tệp nếu chạm `pipeline/sync-cloud*`, `pipeline/push-ops-facts*`, `app/`, `data-api/`, `collector/`, `pipeline/collect-*`, `pipeline/import-*`. Nhận danh sách tệp giả qua biến môi trường `RANH_GIOI_THEM` để đo chiều đỏ.
- [ ] **Step 2: Chạy hai chiều.** Thật: exit 0. `RANH_GIOI_THEM=pipeline/import-chotot.mjs`: exit 1, in đúng tên tệp đó.
- [ ] **Step 3: Thêm thuật ngữ** «số ghép theo tài khoản» vào `CONTEXT.md` đủ nhãn, code, định nghĩa, `_Avoid_`.
- [ ] **Step 4: Cập nhật ROADMAP** §2 as-built, §4 trạng thái, ghi phần chưa làm: lên cloud số gốc và xuất xứ, hiển thị và nhãn, chạy `dung-nguoi`, áp 068 thật.
- [ ] **Step 5: Commit** `docs(sdt-s06-ghep-tai-khoan): ranh giới, thuật ngữ, ROADMAP`.
