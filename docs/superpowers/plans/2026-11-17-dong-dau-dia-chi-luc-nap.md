# TG2 `dong-dau-dia-chi-luc-nap` — kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lượt nạp S03 đóng dấu dự án, phường, phân khu và bán/thuê từ thẻ địa chỉ nhóm **đã duyệt** lên mọi tin
của nhóm, thành phát biểu mang mã thẻ và phiên bản thẻ; sửa thẻ thì tin cũ tính lại ở lượt nạp kế.

**Architecture:** Đi đúng khuôn mà `transform-zalo.mjs` đã dùng cho tầng (DV4) và loại hình: một **bộ đọc** DB
(kèm cổng dò lược đồ và bộ lọc giá trị), một hàm **thuần** sinh dòng phát biểu, một hàm **rút** theo căn cứ.
**Hai điểm cắm tách bạch** trong `runTransformZalo`: đọc thẻ **trước vòng parse** (vì ô bán/thuê đi vào `suyLoai`),
sinh và ghi phát biểu **trước `writeOffers`**. Không migration, không bảng mới, không đổi cột `area_id`/`phuong_raw`.

**Tech Stack:** Node ESM (`.mjs`), `pg`, `node:test`; `pipeline/lib/assert.mjs` (`writeAssertions`, `retractRule`,
`subjectKey`), `pipeline/lib/write-offers.mjs`, `pipeline/lib/test-posts.mjs` (`loadStgPosts`).

**Spec:** `docs/superpowers/specs/2026-11-16-dong-dau-dia-chi-luc-nap-design.md`
**Hợp đồng:** `_acceptance/dong-dau-dia-chi-luc-nap/contract.md` (11 AC) · **Eval:** `evals.yaml` (15 eval)

## Global Constraints

- **Không migration.** Cặp `inferred` + `e1_rule` đã hợp lệ (`045_phat_bieu_va_phan_xu.sql:84-86`); ba trường
  `project_node_id`, `area_id`, `subzone_node_id` đã mở cho `Property` (`096_truong_du_an_tren_tin.sql:12-13`).
- **Trigger 096 NÉM, không bỏ qua.** `096_truong_du_an_tren_tin.sql:36-47` ném `RAISE EXCEPTION` khi `area_id`
  không trỏ một `areas` cấp `submarket`, khi `project_node_id` không trỏ nút `project`, khi `subzone_node_id`
  không trỏ nút `subzone|building`. Một ô thẻ hỏng là **vỡ cả giao dịch transform đêm**. ⇒ **Bộ đọc lọc trước
  khi ghi** và đếm số ô bị bỏ; không bao giờ đẩy giá trị chưa kiểm vào `writeAssertions`.
- **Ô `purpose` của thẻ là `'ban' | 'thue' | 'ca_hai'`** (`108:...purpose_chk`), còn `suyLoai` so với
  `KIND.sale = "sale"` / `KIND.rent_lt = "rent_lt"`. **Bộ đọc ánh xạ** (`ban→sale`, `thue→rent_lt`,
  `ca_hai→null`); không nơi nào khác được so chuỗi thô.
- **`pr.kind` đi vào `repostKey`** (`pipeline/transform-zalo.mjs:764`) nên đổi `kind` **đổi cả `offer_id`**.
  Mọi phép so trước/sau của AC-8 và AC-11 so theo **tập bài** (`post_id`), không theo `offer_id`.
- **Tệp test mới phải được đăng ký hai chỗ**, không thì `npm test` lặng lẽ bỏ qua và eval xanh giả:
  glob trong `pipeline/package.json:11`, và nửa chạy trong `pipeline/test-nua.json` (`pipeline/scripts/chia-nua.test.mjs:20-31` đỏ khi thiếu).
- **Mọi itest chạy qua `bash ../db/db-thu.sh <suite> --chay …`** (DB của riêng lượt), như `npm test` đang làm.
  **Không bao giờ** chạy itest thẳng trên `DATABASE_URL` máy thu — itest tự áp 108 + 109, và áp chúng lên máy
  thu là việc của TG1, ngoài phạm vi hàng này.
- **Vùng được ghi:** `pipeline/transform-zalo.mjs`, `pipeline/lib/dia-chi-the-nhom.mjs` (mới),
  `pipeline/scripts/dong-dau-dia-chi-that.mjs` + `quet-doc-stg.mjs` + `mau-bai-lac-du-an.mjs` (mới), test của
  chúng, `pipeline/package.json`, `pipeline/test-nua.json`, `_acceptance/config.yaml`.
  **Không chạm** `pipeline/scripts/du-an-tren-tin-s03.mjs`, `db/migrations/**`, `collector/**`.
- `rule_id = 'dia-chi-the-nhom'` · `method_version = 'dong-dau-dia-chi@1'` · lớp `inferred` · phương pháp `e1_rule`.
- Căn cứ mỗi dòng: `{the: "<card_code>", ban: <version>, nguon_o: "the"|"chu_bai"}` — **ba khoá, đúng tên này**.
- **Khoá nhóm là tầng A**: không vào `evidence`, không vào log, không lên cloud. Mọi chỗ in ra dùng `card_code`.
  (Khoá nhóm vẫn đi trong bộ nhớ của transform — `posts[].conversation_id` đã mang nó sẵn.)
- **`pg` trả `bigint` thành chuỗi.** `project_node_ids` và `subzone_node_id` là `string[]`/`string|null` ở tầng JS;
  fixture test thuần phải dùng chuỗi, không dùng số.
- Thẻ được đóng dấu: `status = 'da_duyet' AND retired_at IS NULL`. Không bao giờ `nhap`, không bao giờ `bac`.
- **Ngưỡng tạm** (Cổng Phạm vi chưa ký, ba Hỏi còn treo ở giá trị khuyến nghị): ô Định vị **90%** trên cửa sổ
  `all`, cận trên Wilson **≤ 10%**, cỡ mẫu **n = 100**. Ba số này chỉ sống trong Task 5 và Task 6.
- **Mốc nền phải đo lại ngay trước lượt chấm, không chép.** Số trôi mỗi ngày: 16/11 là 5.438/6.637 = 81,93%;
  17/11 đo lại là **5.470/6.649 = 82,27%**, `xung_dot` = 0, `kind` rỗng = 0.

## Review Focus

Sáu ca thiết kế hàm ý mà chưa test nào của hợp đồng chạm tới. Mỗi dòng có test ghim ở task sở hữu mã.

1. **Ô thẻ trỏ nút hoặc phường không còn hợp lệ** — trigger 096 ném và **vỡ cả giao dịch transform**, không phải
   một dòng bị bỏ. Bộ đọc phải lọc, đếm số ô bỏ, và lượt vẫn thoát 0. → Task 1.
2. **Nhóm từng có thẻ duyệt, nay `bac` hoặc thẻ biến mất** — nhóm rời Map nên phép so cặp `(the, ban)` không bao
   giờ chạm nó, dòng cũ sống mãi với căn cứ đã chết. → Task 4.
3. **Thẻ đã duyệt với mọi ô trống** (`project_node_ids = '{}'`, ba ô NULL) — người bấm «nhận» một nháp rỗng.
   Phải sinh **0 dòng**, không ném. → Task 2.
4. **Chữ bài nêu tên ngoài danh bạ** (3 tin, trục B): nhãn bạc có `cc='chu_bai'` và `trich_ok`, nhưng tên không
   khớp nút nào. Chữ bài **không** thắng bằng cách làm bài mất dự án — rơi về thẻ. → Task 2.
5. **Bài không có khoá nhóm** (`conversation_id` NULL): không khớp thẻ nào, 0 dòng, không ném. → Task 2.
6. **Nhóm được cấp thẻ MỚI sau khi bác thẻ cũ**: `card_code` đổi mà `version` lại về 1. Phép rút so **cặp
   `(the, ban)`**, không chỉ `ban`. → Task 4.

---

### Task 1: Bộ đọc thẻ — cổng lược đồ, ánh xạ, lọc giá trị

**Files:**
- Create: `pipeline/lib/dia-chi-the-nhom.mjs`
- Test: `pipeline/tests/dia-chi-the-nhom.itest.mjs`
- Modify: `pipeline/package.json:11` (thêm glob `'tests/dia-chi-the-nhom.itest.mjs'`), `pipeline/test-nua.json`

**Interfaces:**
- Consumes: `pipeline/lib/eval-labels.mjs` → `khoaNhomThat`.
- Produces:
  - `export const RULE_ID = "dia-chi-the-nhom"`, `export const METHOD_VERSION = "dong-dau-dia-chi@1"`,
    `export const LY_DO_RUT = Object.freeze({ doiBan: "the-doi-ban", thayDV6: "thay-bang-the-nhom" })`
  - `export async function coBangThe(client): Promise<boolean>` — true chỉ khi có bảng `group_address_cards`
    **và** có cột `retired_at`.
  - `export async function docTheDaDuyet(client, khoaNhom = khoaNhomThat): Promise<{ the: Map<string, The>, oBo: Record<string, number> }>`
    — Map khoá bằng khoá nhóm đã chuẩn hoá.
    `The = { card_code: string, version: number, duAn: string|null, areaId: string|null, phanKhu: string|null, mucDich: "sale"|"rent_lt"|null }`.
    **Ba phép biến đổi nằm trọn ở đây, không nơi nào khác:**
    (i) `purpose` ánh xạ `ban→"sale"`, `thue→"rent_lt"`, `ca_hai→null`;
    (ii) `duAn` = phần tử duy nhất của `project_node_ids` khi `cardinality = 1`, còn lại `null`;
    (iii) **lọc theo trigger 096**: `duAn` giữ lại chỉ khi là nút `asset_nodes.node_type='project'`, `areaId`
    chỉ khi là `areas.region_type='submarket'`, `phanKhu` chỉ khi là nút `subzone|building`; ô bị bỏ cộng vào
    `oBo` theo tên ô. Giá trị `bigint` giữ nguyên dạng **chuỗi**.

- [ ] **Step 1: Viết test đỏ** `pipeline/tests/dia-chi-the-nhom.itest.mjs`:
  - ba ca lược đồ của AC-7: `khong_co_bang` → `coBangThe` false · `thieu_retired_at` (áp 108, bỏ 109) → false ·
    `du_ca_hai` → true;
  - `sau_o_trang_thai` (AC-2): dữ liệu sáu ô (`nhap` sống · `da_duyet` nhận · `da_duyet` sửa · `bac` ·
    `nhap` đã nghỉ · nhóm không thẻ) → `the` có **đúng hai** khoá;
  - `anh_xa_muc_dich`: ba thẻ `purpose` = `ban` / `thue` / `ca_hai` → `mucDich` = `"sale"` / `"rent_lt"` / `null`;
  - **Review Focus 1** `o_khong_hop_le`: thẻ `da_duyet` có `area_id` không có trong `areas`, `project_node_ids`
    trỏ một nút `subzone`, `subzone_node_id` trỏ một nút `project` → cả ba ô về `null`, `oBo` đếm `{duAn:1, areaId:1, phanKhu:1}`, **không ném**;
  - `kieu_chuoi`: `duAn` và `phanKhu` là `string`, không phải `number`.
- [ ] **Step 2: Chạy, xác nhận đỏ** — `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tg2 --chay node --test tests/dia-chi-the-nhom.itest.mjs`
- [ ] **Step 3: Viết `pipeline/lib/dia-chi-the-nhom.mjs`.** `coBangThe` hỏi `to_regclass('public.group_address_cards')`
      rồi `information_schema.columns` cho `retired_at` — cùng khuôn `co095` (`pipeline/lib/assert.mjs:195`).
      `docTheDaDuyet` làm cả ba phép biến đổi bằng **một câu** nối `asset_nodes` và `areas` (LEFT JOIN, ô không
      khớp về NULL) để khỏi phải quay lại DB từng ô.
- [ ] **Step 4: Đăng ký tệp test** — thêm glob vào `pipeline/package.json:11` và xếp nửa trong `pipeline/test-nua.json`.
- [ ] **Step 5: Chạy, xác nhận xanh** — lệnh Step 2, rồi `cd pipeline && node --test scripts/chia-nua.test.mjs`.
- [ ] **Step 6: Commit** — `git add pipeline/lib/dia-chi-the-nhom.mjs pipeline/tests/dia-chi-the-nhom.itest.mjs pipeline/package.json pipeline/test-nua.json`

**Verify:** `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tg2 --chay node --test tests/dia-chi-the-nhom.itest.mjs`
**Phục vụ:** E9 (AC-7), nền cho E2 (AC-2) · **independent: true**

---

### Task 2: Hàm thuần — thứ tự ưu tiên và ba dòng phát biểu

**Files:**
- Modify: `pipeline/lib/dia-chi-the-nhom.mjs`
- Create: `pipeline/scripts/dia-chi-the-nhom.test.mjs` (hàm thuần, không DB — đặt ở `scripts/` vì glob
  `'scripts/*.test.mjs'` của `package.json:11` đã bắt sẵn)
- Modify: `pipeline/test-nua.json`

**Interfaces:**
- Consumes: Task 1 (`RULE_ID`, `METHOD_VERSION`, kiểu `The`); `pipeline/lib/assert.mjs` → `subjectKey`;
  `pipeline/lib/vocab.generated.mjs` → `ASSERTION_FIELD`, `ASSERTION_METHOD`, `EVIDENCE_TIER`.
- Produces: `export function phatBieuDiaChiNhom({ bai, the, nhanDuAn })` →
  `{ dong: Dong[], baiDong: string[], demTheoNguon: { the: number, chu_bai: number, bo: number } }`.
  - `bai: { post_id: string, conversation_id: string|null }[]` — **khoá nhóm đã chuẩn hoá** (Task 4 dựng bản đồ này);
  - `the: Map<string, The>` từ `docTheDaDuyet`;
  - `nhanDuAn: Map<string, string>` — post_id → id nút dự án **đã khớp** từ nhãn bạc có `cc='chu_bai'` và
    `trich_ok`; bài có nhãn mà không khớp nút nào **không có mặt trong Map**;
  - `baiDong` = `subject_key` của đúng những bài sinh ít nhất một dòng — Task 4 dùng nó làm phạm vi rút DV6.
  - `Dong` = `{ subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence }`.

- [ ] **Step 1: Viết test đỏ** `pipeline/scripts/dia-chi-the-nhom.test.mjs`:
  - ma trận chín ô «chữ bài × thẻ» (AC-3) — mỗi bài **đúng một hoặc không** dòng `project_node_id`; chữ bài
    thắng; thẻ thắng chỉ khi chữ im **và** `duAn !== null`; thẻ 2–3 dự án (`duAn === null`) → 0 dòng dự án;
  - bốn ô (AC-4) trên thẻ đủ: ba dòng `project_node_id` · `area_id` · `subzone_node_id`, mỗi dòng
    `evidence_tier === "inferred"`, `method === "e1_rule"`, `rule_id === "dia-chi-the-nhom"`,
    `method_version === "dong-dau-dia-chi@1"`, `evidence` đủ ba khoá `the`, `ban`, `nguon_o`;
  - **Review Focus 3** `the_rong` → `dong.length === 0`, `baiDong` rỗng, không ném;
  - **Review Focus 4** `chu_bai_ngoai_danh_ba`: bài có nhãn mà vắng trong `nhanDuAn`, nhóm có thẻ một dự án →
    nhận dự án **của thẻ**, `evidence.nguon_o === "the"`;
  - **Review Focus 5** `bai_khong_khoa_nhom`: `conversation_id === null` → 0 dòng, không ném;
  - `bai_dong_dung_tap`: `baiDong` chứa đúng bài có dòng, không chứa bài của thẻ hai dự án.
- [ ] **Step 2: Chạy, xác nhận đỏ** — `cd pipeline && node --test scripts/dia-chi-the-nhom.test.mjs`
- [ ] **Step 3: Viết `phatBieuDiaChiNhom`.** Thứ tự với **mỗi bài**: `nhanDuAn.get(post_id)` → thẻ khi
      `duAn !== null` → bỏ. Phường và phân khu theo cùng luật. Một bài tối đa ba dòng, mỗi trường một dòng.
- [ ] **Step 4: Xếp tệp vào `pipeline/test-nua.json`**, rồi `node --test scripts/chia-nua.test.mjs`.
- [ ] **Step 5: Chạy, xác nhận xanh** — lệnh Step 2.
- [ ] **Step 6: Commit** — `git add pipeline/lib/dia-chi-the-nhom.mjs pipeline/scripts/dia-chi-the-nhom.test.mjs pipeline/test-nua.json`

**Verify:** `cd pipeline && node --test scripts/dia-chi-the-nhom.test.mjs`
**Phục vụ:** E2 (AC-2), E3 (AC-3), E5 (AC-4) · **independent: false** (cần Interfaces của Task 1)

---

### Task 3: `kind` — ô bán/thuê của thẻ chen TRƯỚC nhánh `boi-canh-nhom`

**Files:**
- Modify: `pipeline/transform-zalo.mjs:481` (`NGUON_LOAI`), `:559-585` (`suyLoai`)
- Test: `pipeline/parse.test.mjs` (bộ đang có, glob đã bắt)

**Interfaces:**
- Produces: `suyLoai(pr, text, mucDich, mucDichThe = null)` — tham số thứ tư, giá trị `"sale"` / `"rent_lt"` /
  `null` (**đã ánh xạ** ở Task 1). `NGUON_LOAI` thêm `"the-nhom"` **giữa** `"don-vi-gia"` và `"boi-canh-nhom"`.

**Hai ràng buộc không được vi phạm:**
- nhánh thẻ **không sửa `pr`** (không gán `pr.priceVnd` từ `giaKhongDonVi`) khi nó còn có thể **rơi xuống** khối
  cũ — khối cũ sửa `pr.priceVnd` ở `:580-581` trước khi kiểm sàn, chép phép sửa ấy lên đường rơi-xuống là đổi
  giá tin mà không eval nào đo. Chỉ sửa `pr` ngay trước `return` của nhánh thẻ;
- trượt cửa thì **rơi xuống** khối `boi-canh-nhom`, không `return` sớm — đây là điều giữ `kind` không tụt.

- [ ] **Step 1: Viết test đỏ** trong `pipeline/parse.test.mjs`:
  - `the_thang_boi_canh`: `mucDichThe = "rent_lt"`, `mucDich = "sale"`, bài 12tr/tháng → `nguon === "the-nhom"`;
  - `chu_bai_thang_the`: bài có chữ «bán» rõ → `nguon === "chu-bai"`;
  - `the_truot_cua_roi_xuong`: `mucDichThe = "rent_lt"`, giá 5 tỷ, `mucDich = "sale"` → `{ kind: "sale",
    nguon: "boi-canh-nhom" }`, **không** `bo`;
  - `the_khong_sua_gia`: bài giá không đơn vị, `mucDichThe = "rent_lt"` (trượt cửa) → sau lời gọi
    `pr.priceVnd` **y như trước**, và kết quả khớp bản không có thẻ;
  - `khong_the`: `mucDichThe = null` → kết quả y hệt hôm nay (hồi quy nhánh cũ).
- [ ] **Step 2: Chạy, xác nhận đỏ** — `cd pipeline && node --test parse.test.mjs`
- [ ] **Step 3: Sửa `suyLoai`** theo hai ràng buộc trên.
- [ ] **Step 4: Chạy, xác nhận xanh** — lệnh Step 2.
- [ ] **Step 5: Commit** — `git add pipeline/transform-zalo.mjs pipeline/parse.test.mjs`

**Verify:** `cd pipeline && node --test parse.test.mjs`
**Phục vụ:** E13 (AC-11) · **independent: true**

---

### Task 4: Cắm vào `runTransformZalo` — hai điểm cắm, rút trước, ghi sau

**Files:**
- Modify: `pipeline/transform-zalo.mjs:837-1010` (`runTransformZalo`), `pipeline/lib/dia-chi-the-nhom.mjs`
- Create: `pipeline/tests/dong-dau-dia-chi.itest.mjs`
- Modify: `pipeline/package.json:11`, `pipeline/test-nua.json`

**Interfaces:**
- Consumes: Task 1, Task 2, Task 3; `pipeline/lib/assert.mjs` → `retractRule(client, subjectKeys, field, ruleId, reason)`
  (**bốn đối số, có `field`** — một lời gọi cho mỗi trường).
- Produces:
  - `export async function rutTheCu(client, conCapBan, moiChuThe)` trong `dia-chi-the-nhom.mjs` — rút mọi dòng
    sống `rule_id='dia-chi-the-nhom'` mà **cặp `(evidence->>'the', evidence->>'ban')` khác** cặp hiện tại của
    nhóm, **và** mọi dòng của chủ thể không còn nhóm nào cấp thẻ; lý do `LY_DO_RUT.doiBan`; trả số dòng rút.
    `conCapBan: {the: string, ban: number}[]` = cặp hiện tại của mọi thẻ sống; `moiChuThe: string[]` = chủ thể
    các bài lượt này đọc. Không hàm nào trong `assert.mjs` làm được việc này (`retractRule` không có vị từ
    `evidence`), nên nó nằm ở đây.
  - `runTransformZalo` trả thêm `the_nhom: { nhom, dong, o_bo, rut_ban, rut_dv6, kind_tu_the }`.

**Thứ tự bắt buộc** — `writeAssertions({replaceOwn:true})` khoá theo `(subject_key, field, method)` mà **không**
theo `rule_id` (`pipeline/lib/assert.mjs:40-49`), và DV6 ghi cùng `(project_node_id, e1_rule)` với **48.128 dòng
sống** trên máy thu, nên phải rút tường minh trước, đúng phạm vi:

1. **trước vòng parse**: `coBangThe` → false thì bỏ trọn bước, `console.warn` **đúng một dòng**, lượt chạy tiếp,
   thoát 0; true thì `docTheDaDuyet`;
2. trong vòng parse: truyền `the.get(p.conversation_id)?.mucDich` làm đối số thứ tư của `suyLoai`;
3. **sau dedup, trước `writeOffers`**: dựng bản đồ `post_id → conversation_id` từ mảng `posts` đã `veKhoaNhom`
   (`o.posts` **không mang** `conversation_id` — dựng ở `:916`/`:925`), rồi đọc nhãn bạc `chu_bai` →
   `nhanDuAn` (cùng câu `silver_labels` mà `pipeline/lib/du-an-tren-tin-s03.mjs:171-191` dùng, **nhưng bài lấy
   từ `loadStgPosts`**), rồi gọi `phatBieuDiaChiNhom` để có `dong` và `baiDong`;
4. `retractRule(client, baiDong, field, rule, LY_DO_RUT.thayDV6)` — **sáu lời gọi**: ba trường × hai luật DV6
   (`du-an-nhom-mot-du-an`, `du-an-ten-bai`). Phạm vi là `baiDong`, **không** phải mọi bài của lượt;
5. `rutTheCu(...)`;
6. nối `dong` vào mảng `assertions` của `writeOffers` đang có.

- [ ] **Step 1: Viết test đỏ** `pipeline/tests/dong-dau-dia-chi.itest.mjs`, lược đồ của lượt đã áp 108 + 109:
  - `cross_layer` (E4): chạy transform thật trên ma trận AC-3 rồi đọc `field_assertions` — số dòng sống và giá
    trị khớp từng ô với `phatBieuDiaChiNhom` gọi thuần;
  - `sua_the_doi_du_an` (AC-5): bản n → n+1 đổi ô dự án, không bài mới → dòng `ban = n` rút lý do `the-doi-ban`,
    dòng bản n+1 chèn; bài **có** căn cứ chữ bài giữ 0 dòng từ thẻ, trước sau như nhau;
  - `chay_lai_the_khong_doi` → `0 chèn, 0 rút`;
  - `chi_doi_o_phuong`: n+1 chỉ đổi `area_id` → dòng `area_id` đổi; dòng `project_node_id` rút rồi chèn lại
    **đúng một lần**, và `evidence->>'ban'` của nó **bằng n+1** (không chỉ đếm dòng: chỉ mục sống không gồm
    `evidence` và `writeAssertions` chèn bằng `ON CONFLICT DO NOTHING`, nên quên bước rút thì dòng mới bị nuốt
    lặng với `inserted = 0` và không ai đỏ); nhóm **không** mang hai dòng `area_id` sống;
  - **Review Focus 6** `the_moi_sau_khi_bac`: `card_code` đổi mà `version` về 1 → dòng của thẻ cũ bị rút;
  - **Review Focus 2** `thoi_da_duyet`: nhóm từng có thẻ duyệt, nay `bac` → **mọi** dòng của luật trên bài nhóm
    ấy bị rút, không dòng nào sống sót;
  - `bai_thu` (AC-6): bốn bài mang bốn dấu của `pipeline/lib/test-posts.mjs` cấy vào nhóm có thẻ → 0 dòng;
  - `rut_dv6` (AC-9): dòng DV6 trên bài **đóng dấu** bị rút lý do `thay-bang-the-nhom`; dòng DV6 trên bài của
    nhóm thẻ-hai-dự-án (không đóng dấu) **giữ nguyên**;
  - `chua_ap_luoc_do` (AC-7): bảng thẻ vắng → thoát 0, in đúng một dòng, và **năm khoá** `offers`, `rejected`,
    `reconcile`, `loaiGiaPhiLy`, `nguonLoai` của giá trị trả về khớp từng khoá với lượt chạy không có bước này.
- [ ] **Step 2: Chạy, xác nhận đỏ** — `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tg2 --chay node --test tests/dong-dau-dia-chi.itest.mjs`
- [ ] **Step 3: Viết `rutTheCu`** trong `pipeline/lib/dia-chi-the-nhom.mjs`.
- [ ] **Step 4: Cắm sáu bước trên vào `runTransformZalo`.** Băm cây `collector/snapshots/` trước và sau không đổi
      vì bước này không viết tệp nào.
- [ ] **Step 5: Đăng ký tệp test** (`package.json` glob + `test-nua.json`), chạy `node --test scripts/chia-nua.test.mjs`.
- [ ] **Step 6: Chạy, xác nhận xanh** — lệnh Step 2, rồi `cd pipeline && npm test` (bộ S03 đang có không vỡ).
- [ ] **Step 7: Commit** — `git add pipeline/transform-zalo.mjs pipeline/lib/dia-chi-the-nhom.mjs pipeline/tests/dong-dau-dia-chi.itest.mjs pipeline/package.json pipeline/test-nua.json`

**Verify:** `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tg2 --chay node --test tests/dong-dau-dia-chi.itest.mjs && npm test`
**Phục vụ:** E4 (AC-3), E5 (AC-4), E6 (AC-5), E7 (AC-6), E9 (AC-7), E11 (AC-9) · **independent: false**

---

### Task 5: Lệnh đo trên bản chép + khoá executor

**Files:**
- Create: `pipeline/scripts/dong-dau-dia-chi-that.mjs` — **năm** chế độ
  `--thuoc <phu-the|nguong-moc|khong-tut|phu-kind|chu-bai-that>`
- Create: `pipeline/scripts/quet-doc-stg.mjs`
- Modify: `_acceptance/config.yaml` — tám khoá `executors.script.tg2_*` / `executors.test.tg2_*`

**Interfaces:**
- Consumes: Task 1–4. Chỉ `SELECT`. Bài lấy qua `loadStgPosts` + `khoaNhomThat` (nên tệp này **nằm trong** tập
  mà `quet-doc-stg.mjs` quét, và nó hợp lệ vì đi qua `loadStgPosts`).
- Produces: tám khoá đúng tên `evals.yaml` đang trỏ: `script.tg2_phu_the`, `script.tg2_nguong_moc`,
  `script.tg2_khong_tut`, `script.tg2_chu_bai_that`, `script.tg2_phu_kind`, `script.tg2_quet_doc`,
  `test.tg2_pipeline` (trỏ `scripts/dia-chi-the-nhom.test.mjs` + `parse.test.mjs`),
  `test.tg2_itest` (trỏ hai tệp `tests/*.itest.mjs`, **bọc `db/db-thu.sh`**).
  **Mỗi thước một mã thoát riêng** — không gộp hai AC vào một lệnh.

- [ ] **Step 1: Thêm tám khoá vào `_acceptance/config.yaml`** (việc đầu của S3, hợp đồng «Notes» đã ghi).
      Khoá `test.*` bọc `bash db/db-thu.sh oneinvest_suite_tg2 --chay …` như `pipeline/package.json:11`.
- [ ] **Step 2: Viết `quet-doc-stg.mjs`** — đếm câu `FROM stg_zalo_posts` ngoài `loadStgPosts` trong tệp của
      hàng; thoát 1 kèm `tệp:dòng`. Chiều đỏ để lại bằng chứng: chạy trên một bản sao trong thư mục tạm của
      lượt có cấy thêm một câu, dán kết xuất vào `evidence/`.
- [ ] **Step 3: Viết bốn chế độ đo**, mỗi chế độ in tử số, mẫu số, mốc đo **đo lại tại chỗ** (không chép số cũ),
      và **số đếm theo bài đầu** (`post_ids[1]`) tách khỏi số đếm theo tin:
  - `phu-the` → 100% tin thuộc nhóm có thẻ `da_duyet` sống được đóng dấu (AC-1a, ngưỡng cứng 100%);
  - `nguong-moc` → tỉ lệ `offer_project.status='mot_du_an'` trên `sale_offers WHERE source='S03'`, in **cả ba
    cửa sổ** `7d · 30d · all` đúng như `pipeline/sql/600_data_flow.sql` gộp, nói rõ **ngưỡng 90% áp cho `all`**
    còn `/ops/data-flow` mặc định hiện `7d` (`app/src/lib/data-flow-queries.ts:371`);
  - `khong-tut` → số tin `mot_du_an` và `xung_dot` trước/sau, **so theo tập bài** vì `kind` đổi làm đổi
    `offer_id` (`transform-zalo.mjs:764`); ngưỡng 0 bài rơi (AC-8);
  - `phu-kind` → số tin `kind` rỗng trước/sau; số tin lấy `kind` từ chữ bài · từ thẻ · từ nhánh cũ; **và số bài
    lật `sale↔rent_lt`**, in riêng hai chiều (AC-11).
- [ ] **Step 4: Viết chế độ `chu-bai-that`** — liệt trọn tập bài có căn cứ `chu_bai` kèm trích đã kiểm và tập
      tin nêu dự án khác nhóm, assert 100% nhận dự án của **chữ bài**, in `post_id`/`offer_id` từng ca lệch và
      cỡ hai tập. **Không fixture** (E3b).
- [ ] **Step 5: Chạy cả năm chế độ trên bản chép đã áp 108 + 109**, ghi số vào `_acceptance/.../evidence/`.
- [ ] **Step 6: Commit** — `git add pipeline/scripts/dong-dau-dia-chi-that.mjs pipeline/scripts/quet-doc-stg.mjs _acceptance/config.yaml`

**Verify:** `node pipeline/scripts/quet-doc-stg.mjs` và năm chế độ của `dong-dau-dia-chi-that.mjs`, mỗi lệnh thoát 0
**Phục vụ:** E1, E1b, E3b, E8, E10, E13 · **independent: false**

---

### Task 6: Mẫu nhãn người cho tỉ lệ bài lạc dự án (AC-10)

**Files:**
- Create: `_acceptance/dong-dau-dia-chi-luc-nap/evidence/mau-bai-lac-du-an.md`
- Create: `pipeline/scripts/mau-bai-lac-du-an.mjs`

**Cần người.** Máy rút mẫu và tính; **người gắn nhãn**. Cỡ mẫu khai **trước** khi gắn nhãn.

- [ ] **Step 1: Viết `mau-bai-lac-du-an.mjs`** — `--rut --n 100 --seed <s>` rút ngẫu nhiên có hạt giống từ bài
      của nhóm chuyên một dự án (qua `loadStgPosts`) và in bảng trống; `--tinh <tệp>` đọc bảng đã điền, in tỉ lệ,
      **cả hai cận Wilson 95%**, cỡ mẫu thật.
- [ ] **Step 2: Chạy `--rut`, ghi cỡ mẫu và hạt giống vào đầu tệp mẫu** — trước khi ai nhìn bài nào.
- [ ] **Step 3: Người gắn nhãn 100 bài.**
- [ ] **Step 4: Chạy `--tinh`**, dán số vào tệp mẫu kèm **một câu kết luận**. Cận trên > 10% là **chưa đạt** —
      và kết luận đúng khi ấy là hàng đổi hướng, không phải một ghi chú.
- [ ] **Step 5: Commit** — `git add _acceptance/dong-dau-dia-chi-luc-nap/evidence/ pipeline/scripts/mau-bai-lac-du-an.mjs`

**Verify:** hội đồng E12 đọc được mỗi số lấy từ đâu mà không mở DB
**Phục vụ:** E12 (AC-10) · **independent: true**

---

## Thứ tự, chỗ chặn, hệ quả đã biết

- Task 1 → 2 → 4 → 5 là một chuỗi. Task 3 và Task 6 chạy song song được từ đầu.
- **Chặn ngoài tay hàng:** Task 4 Step 1 và trọn Task 5 cần **bản chép DB máy thu đã áp 108 + 109**. TG1 chưa
  gộp, hai migration chưa áp ở đâu. Tới đó mà TG1 chưa xong thì dừng và báo — **không** tự áp 108/109.
- **Hệ quả đã biết, khai vào hồ sơ:** TG2 sinh phát biểu `project_node_id`, mà `pipeline/lib/phuong-tu-du-an.mjs:57`
  (DA9) suy `area_id · registry_inherit` **từ chính các phát biểu dự án**. Lượt DA9 chạy sau sẽ dời **cột**
  `area_id` của hàng nghìn tin. Trong lượt của TG2 thì cột không đổi (AC-4 đúng), nhưng ở lượt sau thì đổi —
  đây là giới hạn đã biết, không phải lỗi, và phải nằm trong «Known limits» của bằng chứng.
