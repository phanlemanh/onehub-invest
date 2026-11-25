# DA3 bang-noi-ma-du-an — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi dự án của S07, S08, S09, S10, S16 thành một bản ghi chuẩn; bộ khớp xếp ngả; ngả K3, T nối nút có sẵn qua thẻ luật
có băm, đảo được; ô «Mã nguồn chưa nối» đếm đủ nguồn.

**Architecture:** Ba lib thuần + một lệnh, theo khuôn DA32 (`pipeline/noi-du-an-s06.mjs`). Bộ chuyển đọc `stg_*` chỉ đọc và trả bản
ghi chuẩn. Bộ khớp là hàm thuần trên bản ghi chuẩn, danh sách nút và bảng nối sẵn. Lệnh dựng thẻ, áp theo băm và đảo luật. Ô trên
màn sửa ở hai tệp của nhánh DA55.

**Tech Stack:** Node ESM (`pipeline/`), `pg`, PostGIS `ST_Covers`, `node:test`; app Next.js 16, TypeScript strict, jsdom test.

**Spec:** `docs/superpowers/specs/2026-11-25-bang-noi-ma-du-an-design.md` · hợp đồng `_acceptance/bang-noi-ma-du-an/contract.md` (đã
duyệt 25/11) · evals `_acceptance/bang-noi-ma-du-an/evals.yaml`.

## Global Constraints

- Không migration. Bảng dùng: `project_links`, `project_link_rules` (100), `registry_aliases` (082, 100, 103), `asset_nodes`.
- Bí danh nút dự án: `object_key = 'node:<id>'`, `kind = 'ma_nguon'`, `value = 'du_an/<mã>'`, `source = '<S0x>'`.
- Tên luật (`project_link_rules.can_cu`): `<nguồn>-K3`, `<nguồn>-T`, `<nguồn>-noi-san`, `<nguồn>-trang-thai`.
- Lý do `chua_noi`: `khong-ten`, `khong-tinh`, `khong-vi-tri`, `nhieu-nut`, `khong-khop`, `dao-luat`.
- `RONG_GIA` (Hỏi-1, Mạnh duyệt 25/11): "", «Đang cập nhật», «--», «-», «0», «N/A» → null; so qua `chuanTen`. Giữ «Khác», «Liên hệ».
- S08 không bao giờ được áp. Lệnh từ chối với thông điệp `S08 do thẻ luật DA55 nối`.
- Mọi test ghi DB chạy trên `oneinvest_suite_*` (`bash db/db-thu.sh <tên> --chay …`); test tự từ chối khi `DATABASE_URL` không khớp
  `/oneinvest_suite_[a-z0-9_]+$/`. Không ghi `oneinvest`.
- Chỉ mã nguồn `S0x` trong mã, test, thẻ. Thẻ không in mã dự án nguồn.
- Tệp test mới phải xếp vào `pipeline/test-nua.json`, nửa nhẹ hơn (`scripts/chia-nua.test.mjs` canh); `pipeline/package.json` `test`
  liệt kê tệp `scripts/*.test.mjs`.
- Comment domain tiếng Việt; tên hàm theo lệ kho (tiếng Việt không dấu, như DA32).

## Review Focus

1. Tên tỉnh cũ có tiền tố («Tỉnh Bình Dương», «TP. Hồ Chí Minh (cũ)») và tên viết thiếu («Tỉnh Bình Dươn»). Kỳ vọng: tên đủ ra mã;
   tên cụt ra null `khong-tinh`, không ra tỉnh khác. Test ở Task 1.
2. Nút có `area_ids[1]` là submarket hay market (5 nút xac_minh chỉ có tỉnh). Kỳ vọng: K3 chỉ bắn khi nút có xã; T vẫn chạy với tỉnh
   suy từ submarket. Test ở Task 3.
3. Bí danh nút chứa chuỗi rỗng hoặc dưới 8 ký tự (khuôn `DO_DAI_BI_DANH` của DA32). Kỳ vọng: không tính là trùng tên. Test ở Task 3.
4. Hai bản ghi cùng nguồn trùng tên chuẩn nối cùng một nút. Kỳ vọng: cả hai nối; mỗi mã một bí danh; chỉ mục `(source, kind, value)`
   không vỡ. Test ở Task 4.
5. Áp lại sau khi stg nhận snapshot mới làm kết cục một mã đổi. Kỳ vọng: băm đổi; băm cũ bị từ chối. Test ở Task 4.

---

### Task 1: Bảng tỉnh cũ — `independent: true` · phục vụ E1

**Files:**
- Create: `pipeline/lib/tinh-cu.mjs`
- Test: `pipeline/scripts/tinh-cu.test.mjs`

**Interfaces:**
- Produces:
  - `TINH_CU: ReadonlyMap<string, string>`: tên tỉnh trước 01/07/2025 đã qua `chuanTen` → mã thống kê 2 chữ số. Đủ 63 dòng, gồm cả
    tỉnh không sáp nhập.
  - `maTinhCu(ten: string|null): string|null`: bỏ tiền tố «tỉnh», «thành phố», «tp.», hậu tố «(cũ)», rồi tra; không khớp trọn thì null.

- [ ] **Step 1: Viết test.**
  - `TINH_CU.size === 63`, mã duy nhất.
  - `maTinhCu("Tỉnh Bình Dương") === "74"`, `maTinhCu("TP. Hồ Chí Minh (cũ)") === "79"`, `maTinhCu("Hà Tây") === null` (không
    thuộc 63 tỉnh 2008–2025), `maTinhCu("Tỉnh Bình Dươn") === null`.
- [ ] **Step 2:** Chạy `cd pipeline && node --test scripts/tinh-cu.test.mjs`; FAIL vì chưa có module.
- [ ] **Step 3:** Viết bảng 63 dòng theo danh mục mã đơn vị hành chính của Tổng cục Thống kê (dẫn nguồn trong comment đầu tệp).
- [ ] **Step 4:** Chạy test, PASS. Thêm tệp vào `pipeline/test-nua.json`.
- [ ] **Step 5:** Commit `feat(pipeline): DA3 bảng 63 tỉnh cũ`.

### Task 2: Khuôn chung và bộ chuyển — `independent: false` (cần Task 1) · phục vụ E1

**Files:**
- Create: `pipeline/lib/ban-ghi-nguon.mjs`
- Test: `pipeline/scripts/ban-ghi-nguon.test.mjs` (hàm thuần), `pipeline/tests/ban-ghi-nguon.itest.mjs` (DB thử)

**Interfaces:**
- Consumes: `maTinhCu` (Task 1); `chuanTen`, `chuanKhop` của `pipeline/lib/noi-du-an-s06-lop.mjs`.
- Produces:
  - `RONG_GIA: ReadonlySet<string>` và `trongGia(v): string|null` (giá trị rỗng giả → null, còn lại `trim`).
  - Bản ghi chuẩn `BanGhi = { nguon, cap: 'du_an', ma, ma_cha, ten_goc, ten_chuan, dia_chi, tinh, tinh_tu, xa, diem, cdt, mst,
    loai_hinh, ly_do_trong }`. Trong đó `tinh` và `xa` là `areas.id`; `tinh_tu` là `'diem'|'chu'|null`; `diem` là `{lat, lng}|null`.
  - `docBanGhi(client, nguon: 'S07'|'S08'|'S09'|'S10'|'S16'): Promise<BanGhi[]>`.
  - `chuyenS07(row, ctx)`, `chuyenS08`, `chuyenS09`, `chuyenS10`, `chuyenS16`: hàm thuần. `ctx` là bảng tra vùng do `docVung(client)`
    dựng một lần: market theo tên và mã, submarket theo tỉnh + tên, `area_aliases` mã cũ → mới.

Câu SQL từng nguồn lấy theo bộ đo S1 (`_acceptance/bang-noi-ma-du-an/probes/s1/do.mjs` dòng 74–107):

| Nguồn | Bảng đọc |
|---|---|
| S07 | `stg_s07_project_card` ∪ `stg_s07_project`, bản mới nhất mỗi `pj_id` |
| S08 | `stg_s08_project` mới nhất |
| S09 | `v_s09_du_an_moi` |
| S10 | `stg_s10_project` |
| S16 | `stg_s16_item` kind `du-an` có `html.project` |

Tỉnh, xã từ điểm làm trong SQL bằng `ST_Covers(a.geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))`, như `SQL_DU_AN` của DA55; không
có điểm thì lấy từ chữ.

S08 bỏ «_TT»/« TT» cuối và «TMDV » đầu khỏi `ten_goc` trước khi tính `ten_chuan`. Đây là luật `tenGoc` của DA55, viết lại; không
import nhánh DA55.

- [ ] **Step 1: Test hàm thuần** `ban-ghi-nguon.test.mjs`.
  - Ma trận rỗng giả 10 ô, `assert.equal(...)` mỗi ô: "", «Đang cập nhật», «--», «-», «0», «N/A» → null; «Khác», «Liên hệ»,
    «Vinhomes», «0 m2» giữ.
  - `chuyenS10({project_id:'X', project_label:'A'})`: `tinh === null`, `ly_do_trong === 'khong-vi-tri'`.
  - Dòng S07 có địa chỉ «…, Tỉnh Bình Dương» và `ctx` có alias `74 → 79`: `tinh === <id market 79>`, `tinh_tu === 'chu'`. Cùng dòng,
    `ctx` thiếu alias của `74`: `tinh === null`, `ly_do_trong === 'tinh-cu-khong-anh-xa'`.
  - Chiều đỏ (E1): bản chép tệp ra thư mục tạm bỏ `"N/A"` khỏi `RONG_GIA`, thì ô «N/A» ném lỗi gọi tên giá trị.
- [ ] **Step 2:** Chạy; FAIL.
- [ ] **Step 3:** Viết `ban-ghi-nguon.mjs`.
- [ ] **Step 4:** Viết `ban-ghi-nguon.itest.mjs` trên DB thử chép lược đồ cộng dữ liệu bản chép (khuôn `noi-du-an-s06.itest.mjs`):
  `docBanGhi` của mỗi nguồn trả số bản ghi bằng `SELECT count(DISTINCT …)` viết trong test, và số có tỉnh, xã, điểm bằng phép đếm SQL
  độc lập.
- [ ] **Step 5:** `cd pipeline && node --test scripts/ban-ghi-nguon.test.mjs` PASS. Rồi
  `bash ../db/db-thu.sh oneinvest_suite_bgn --chay node --test tests/ban-ghi-nguon.itest.mjs` PASS. Xếp hai tệp vào `test-nua.json`.
- [ ] **Step 6:** Commit `feat(pipeline): DA3 khuôn chung bản ghi nguồn năm nguồn`.

### Task 3: Bộ khớp — `independent: true` (chỉ dùng kiểu `BanGhi`) · phục vụ E2, E6

**Files:**
- Create: `pipeline/lib/khop-du-an.mjs`
- Test: `pipeline/scripts/khop-du-an.test.mjs`

**Interfaces:**
- Consumes: kiểu `BanGhi` (Task 2); `chuanKhop`, `DO_DAI_BI_DANH` của `noi-du-an-s06-lop.mjs`.
- Produces:
  - `Nut = { id, ten, bi_danh: string[], tinh, xa, diem, mst, tier }`.
  - `NoiSan = Map<string /*ma*/, number /*node id*/>`.
  - `xepNga(b: BanGhi, nut: Nut[], noiSan: NoiSan): KetCuc`, với `KetCuc` là một trong:
    - `{nga:'giu', node_id, khac_noi_san?: number}`;
    - `{nga:'noi', can_cu:'K1'|'K2'|'K3'|'T', node_id}`;
    - `{nga:'chua_noi', ly_do}`.
  - `docNut(client): Promise<Nut[]>`: tỉnh từ `area_ids[1]` (market, hoặc parent của submarket), xã khi `area_ids[1]` là submarket.
  - `docNoiSan(client, nguon): Promise<NoiSan>`: S09 từ `NOI_KHU_S09`, S16 từ `NOI_DU_AN_S16` (theo slug nút), S08 từ
    `s08_project_links` noi ∪ `project_links` S08 noi; `project_links` noi của chính nguồn không có `rule_id` của DA3.
  - `bamKetCuc(ds: {ma, kq}[]): string`: sha256 trên danh sách sắp theo mã.

Thứ tự xếp đúng như thiết kế §3.2. K2 so điểm ≤ 300 m (haversine); K4 không có.

- [ ] **Step 1: Test ma trận viết trước** (12 ô, mỗi ô một `assert.deepEqual`, mảng 12 phần tử đếm `assert.equal(ca.length, 12)`).
  Ô và kết cục y như E2 trong `evals.yaml`.
  - Thêm Review Focus 2: nút chỉ có tỉnh. Cùng tên, cùng xã với bản ghi thì ra `noi:T`, không ra `noi:K3`.
  - Thêm Review Focus 3: bí danh «abc» không tính trùng.
  - Thêm ca `khac_noi_san`: nối sẵn trỏ nút A, K3 trỏ nút B, thì ra `{nga:'giu', node_id:A, khac_noi_san:B}`.
  - Chiều đỏ: bản chép bỏ điều kiện cùng tỉnh thì ô khác tỉnh ném lỗi chứa «cung-tinh».
- [ ] **Step 2:** FAIL. **Step 3:** Viết. **Step 4:** `cd pipeline && node --test scripts/khop-du-an.test.mjs` PASS, xếp vào
  `test-nua.json`.
- [ ] **Step 5:** Commit `feat(pipeline): DA3 bộ khớp dự án chạy bóng`.

### Task 4: Lệnh thẻ, áp, đảo — `independent: false` (cần Task 2, 3) · phục vụ E3, E4, E5, E6

**Files:**
- Create: `pipeline/noi-du-an-nguon.mjs`
- Test: `pipeline/tests/noi-du-an-nguon.itest.mjs`

**Interfaces:**
- Consumes: `docBanGhi` (Task 2), `xepNga`, `docNut`, `docNoiSan`, `bamKetCuc` (Task 3).
- Produces (lệnh và hàm xuất cho probe):
  - `dungThe(client, nguon): Promise<{ds, tong, mau, khacNoiSan, bam}>` và `vietThe(the): string` (markdown; không mã nguồn).
  - `apThe(client, {nguon, bam, nguoi, giaoDich='rieng'}): Promise<{rules: {can_cu, id}[], khongDoi: boolean}>`.
  - `daoLuat(client, {ruleId, nguoi}): Promise<{soBiDanh}>`. Luật đã đảo thì ném `da-dao`.
  - Dòng lệnh, theo khuôn đầu tệp `noi-du-an-s06.mjs`:
    - `--nguon <S0x> --the <tệp>`
    - `--ap --nguon <S0x> --bam <hex> --nguoi <tên>`
    - `--dao <rule_id> --nguoi <tên>`

`apThe` mở một giao dịch, khoá tư vấn `hashtext('noi-du-an-nguon')`, tính lại thẻ, so băm (lệch thì ném `bam-lech`), rồi ghi:
- Một dòng `project_link_rules` cho mỗi `can_cu` có ít nhất một bản ghi. `so_ma` là số bản ghi của luật; `mau_bam` là băm thẻ.
- Mỗi bản ghi một dòng `project_links`:
  - `giu` thành `noi` với `can_cu` `<nguồn>-noi-san`;
  - `noi` mang căn cứ của nó;
  - `chua_noi` mang `ly_do`;

  dòng nào cũng có `rule_id`. Upsert như DA32.
- Mỗi dòng `noi`, `giu` một bí danh `du_an/<mã>`. Bí danh còn hiệu lực trỏ nút khác thì nghỉ rồi ghi mới.
- Chạy lại mà trạng thái đã đúng (khuôn `dungRoi` của DA32) thì trả `khongDoi: true`, không ghi luật.

`daoLuat` giống `daoTheLuat` của DA32 nhưng đọc `source` từ dòng luật.

- [ ] **Step 1: Test** (DB thử, schema fixture rút từ bản chép bằng `pg_dump --data-only` của các dòng thật cần cho ca, không viết tay
  khuôn bên đọc).
  - `BN-AC-3`: thẻ hai lần cùng băm; đếm 4 bảng không đổi; tệp không chứa mã nào của `ds`; băm tính lại độc lập bằng `bamKetCuc`
    trên `ds` khớp. Chiều đỏ: đổi một kết cục thì băm khác.
  - `BN-AC-4`:
    - áp băm sai → ném `bam-lech`, 0 dòng mới;
    - áp đúng → luật S07-K3, S07-T, S07-trang-thai mỗi loại một dòng; mỗi bản ghi một dòng `project_links` có `rule_id`; mỗi dòng
      `noi` đúng một bí danh;
    - băm có sắp xếp của `asset_nodes`, `s08_project_links`, `s10_project_links` và bí danh có sẵn bằng trước áp;
    - áp lần hai → `khongDoi: true`;
    - Review Focus 4 (hai mã cùng nút);
    - Review Focus 5 (sửa stg sau khi dựng thẻ → `bam-lech`);
    - chiều đỏ: hook `_sauBiDanh(10)` ném thì 0 dòng của lượt còn lại.
  - `BN-AC-5`:
    - đảo luật T → bí danh của luật nghỉ, dòng về `chua_noi` `dao-luat`, luật K3 không đổi;
    - đảo lần hai ném `da-dao`;
    - đảo nốt mọi luật → 0 dòng `noi` S07, số dòng ba bảng không giảm, băm bí danh còn hiệu lực bằng trước áp.
  - `BN-AC-6`:
    - S09 thẻ có 2 `giu`, S16 có 5 `giu`, nút bằng chép cứng;
    - cấy nút trùng tên cùng xã với một dự án chép cứng thì bản ghi `giu` kèm `khac_noi_san`;
    - `--ap --nguon S08` ném `S08 do thẻ luật DA55 nối`;
    - thẻ S08 liệt 6 ca khác nối tay (dữ liệu bản chép).
- [ ] **Step 2:** FAIL. **Step 3:** Viết lệnh.
- [ ] **Step 4:** `bash ../db/db-thu.sh oneinvest_suite_ndn --chay node --test tests/noi-du-an-nguon.itest.mjs` PASS; xếp vào
  `test-nua.json`.
- [ ] **Step 5:** Commit `feat(pipeline): DA3 lệnh thẻ luật nối dự án theo nguồn`.

### Task 5: Ô «Mã nguồn chưa nối» — `independent: false` (cần nhánh DA55 và khuôn lý do của Task 4) · phục vụ E8

**Files:**
- Modify: `app/src/lib/ops/registry/doc.ts` (`SQL_DANH_MUC`, `SQL_CHUA_NOI`, kiểu `DanhMuc`)
- Modify: `app/src/components/ops/registry/registry-view.tsx` (`oSo`, dòng S10)
- Test: `app/tests/registry-nguon-chua-noi.test.tsx`

**Bước 0 — chồng nhánh:** `git merge --no-edit feat/soat-noi-s08-danh-ba` (nhánh cục bộ của P2, chưa đẩy). Xung đột thì dừng và báo
GS; không sửa tệp của DA55 ngoài hai tệp trên.

**Interfaces:**
- `DanhMuc` thêm `tinhVaoO: boolean` và `lyDoRieng: string|null`. S10: `tinhVaoO: false`, `lyDoRieng: 'không có vị trí'`.
- `oSo(tong)` chỉ cộng dòng `tinhVaoO`; dòng S10 hiện ở chân ô kèm lý do.
- `SQL_DANH_MUC` thêm ba nhánh:
  - S07: mẫu số là bản ghi của `docBanGhi`, viết bằng SQL cùng nguồn;
  - S16: tương tự;
  - S10: lấy từ `project_links`.

  S09 lấy phần đã nối từ `project_links` thay hằng 0. Mỗi dự án đếm một lần (đúng khuôn S08 của DA55).

Nhãn «không có vị trí» là chữ UI mới, nên thêm thuật ngữ vào `CONTEXT.md` cùng commit.

- [ ] **Step 1: Test.**
  - Ca SQL trên DB thử fixture rút từ bản chép: `docDanhBa` trả S07, S16 đúng `chuaNoi/daNap`; S09 `daNoi` bằng số `noi`; S10
    `tinhVaoO false`; S06, S08 bằng trước.
  - Ca màn: dựng `RegistryView` thật trên jsdom với đầu ra ấy. Con số ô bằng tổng năm nguồn, không cộng S10; dòng S10 có «không có vị
    trí».
  - Chiều đỏ: bản chép `registry-view.tsx` cộng mọi dòng thì ca ném lỗi chứa «S10».
- [ ] **Step 2:** FAIL. **Step 3:** Sửa hai tệp, thêm thuật ngữ `CONTEXT.md`.
- [ ] **Step 4:** `cd app && npx tsc --noEmit && node --import tsx --test tests/registry-nguon-chua-noi.test.tsx` PASS; chạy lại
  `tests/registry-chi-doc.test.tsx` của DA55, vẫn PASS.
- [ ] **Step 5:** Commit `feat(ops): DA3 ô mã nguồn chưa nối đếm S07, S16, tách S10`.

### Task 6: Probe, bên đọc, đầu–cuối, hồ sơ áp — `independent: false` (cần Task 1–5) · phục vụ E1–E10

**Files:**
- Create: `_acceptance/bang-noi-ma-du-an/probes/{_chung,bo-chuyen,xep-nga,the,ap,noi-san,ben-doc,o-man,dau-cuoi}.sh`
- Create: `pipeline/scripts/noi-du-an-nguon-that.mjs` (chuỗi đầu–cuối trên bản chép, khuôn `noi-du-an-s06-that.mjs`)
- Create: `_acceptance/bang-noi-ma-du-an/ho-so-ap.md`

**Interfaces:**
- `_chung.sh` dựng bản chép DB máy thu vào `oneinvest_suite_da3_<pid>` bằng `db/db-thu.sh`, export `DATABASE_URL`, dọn khi thoát (khuôn
  `probes/_chung.sh` của PL36).
- `ben-doc.sh` (AC-7) băm có sắp xếp ở ba mốc: trước áp, sau áp bốn nguồn, sau đảo. Băm của:
  - `napS16TheoKhu(c, mọi khu)`;
  - bản đồ `value → object_key` mà `s09-dung` đọc;
  - `danh-ba-vat-the.mjs` chạy khô;
  - `SELECT * … ORDER BY` của năm view.

  In số giây. Chiều đỏ: cấy bí danh S09 dạng `<pid>/<id>` trỏ `node:<id>` thì phép so `s09-dung` đỏ.
- `dau-cuoi.sh` (AC-9): chạy `probes/s1/do.mjs` (đóng băng) và `noi-du-an-nguon-that.mjs` trên cùng bản chép. In hai cột kèm hiệu
  số; ô ba cột (trước, đổi phạm vi, sau nối); đảo đủ luật rồi đọc lại ô. Ghi `evidence/dau-cuoi.md` và `evidence/the-S07.md` (đầu
  vào của E10). Hiệu số khác 0 thì thoát 1.
- `ho-so-ap.md` đủ năm thứ: lệnh áp, số chạy thử, `pg_dump` bốn bảng, cách lùi `--dao` đủ luật (đã chạy thử trên bản chép, ghi số),
  lệnh kiểm sau.

- [ ] **Step 1:** Viết probe E1–E8 gọi đúng test của Task 1–5 cộng phần trên bản chép.
- [ ] **Step 2:** Chạy từng probe, mỗi probe xanh. Probe chạy trên bản chép DB máy thu thì bọc `giu-nhip`, và không chạy khi dãy khác
  giữ s4.
- [ ] **Step 3:** Viết `noi-du-an-nguon-that.mjs`, `dau-cuoi.sh`, `ho-so-ap.md`, chạy thử lùi.
- [ ] **Step 4:** Commit `test(acceptance): DA3 probe, đầu–cuối, hồ sơ áp`.

## Thứ tự

Task 1 → 2 → 4. Task 3 song song với 1–2. Task 5 sau Task 4, khi đã gộp nhánh DA55 cục bộ. Task 6 cuối. Task 1 và 3 là hai task
`independent: true` duy nhất. Kế hoạch nhỏ, nên làm tuần tự trong phiên.
