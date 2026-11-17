# DA33 nap-s16-vao-danh-ba — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native, đã chọn) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa toà và mã căn S16 của năm khu đã nối vào danh bạ không trùng, để S08 thành bí danh của cùng căn, và giữ mã lấy bằng đăng nhập ở lại máy.

**Architecture:** Gồm bốn phần:

- Migration 103: bốn bảng stg S16 và view khoá căn, đồng thời nới mã nguồn của bí danh.
- Lõi thuần `pipeline/lib/s16-danh-muc.mjs`, dùng cho cả bộ nạp làn thu lẫn bước dựng: tách item thành dòng stg, luật chọn toà, bảng nối.
- Bước `buocS16` trong `pipeline/lib/s16-dung.mjs`, gọi trong `dung()` sau bước S09. Bước S08 sửa để tra bí danh S16 trước khi đúc.
- Bộ soát token S16 trong `sync-cloud.mjs`.

**Tech Stack:** Node ESM `.mjs`, `pg`, `node:test`, PostgreSQL 16 + PostGIS (:5433).

**Spec:** `docs/superpowers/specs/2026-11-14-nap-s16-vao-danh-ba-design.md` · hợp đồng `_acceptance/nap-s16-vao-danh-ba/contract.md` · evals `_acceptance/nap-s16-vao-danh-ba/evals.yaml`

## Global Constraints

- Tên thật của nguồn S16 (tên miền, nhãn trong trường `source` và thư mục bản thu) không vào mã, test, commit, tên biến. Dùng `S16`.
- Fixture viết tay dùng mã có tiền tố `Q` (khuôn DA31). Không chép payload thật vào kho.
- Test có `DROP` chỉ chạm DB tên `oneinvest_suite_*`; itest kiểm tiền tố này trước lệnh phá đầu tiên. Không đọc hay ghi DB `oneinvest`.
- Luật bất biến 2: 103 idempotent, không sửa migration đã commit.
- Thẻ S16 chỉ mang khoá vật thể, `nguon: "S16"`, loại thẻ và `s16_ref`. `s16_ref` là sha256 hex 16 ký tự đầu của `S16|<du_an>|<ma hay toa_id>`.
- Bí danh S16:
  - toà: `ma_nguon` có giá trị `<du_an>/<toa_id>`;
  - trục: `<du_an>/<TOA>/<truc>`;
  - căn: `<du_an>/<MA>` (MA viết hoa, đã trim).
- `NOI_DU_AN_S16`: đúng năm cặp ở thiết kế §5.1, khoá là tên dự án S16, giá trị là slug nút.
- Toà mới: chỉ đúc khi có ≥1 căn theo luật tiền tố; `catalog_tier = 'xac_minh'` (Hỏi-2).

## Review Focus

1. Dòng csv có dấu phẩy trong tên dự án hay tên khu (csv không có nháy) phải bỏ dòng và đếm lý do `csv-loi`, không lệch cột. Ca này ở Task 1.
2. BOM đầu csv (`﻿du_an_alias`) phải đọc đúng tên cột. Ca này ở Task 1.
3. Tầng có hậu tố chữ (ví dụ «15A») và mã có khoảng trắng hai đầu phải giữ một căn, tầng hợp lệ với `units_floor_check`. Ca này ở Task 3.
4. Khu chưa áp 103 (không có `stg_s16_item`) phải bỏ qua có in lý do, không ném. Ca này ở Task 3.
5. Mã căn đứng trong chuỗi dài hơn (chuỗi con) không được làm bộ soát đỏ nhầm. Ca âm có tên ở Task 5.

---

### Task 0: Lệnh chấm trỏ đúng DB thử

**Files:**
- Modify: `_acceptance/config.yaml`, khoá `executors.script.s16_db`

- [ ] Đổi `s16_db` thành `node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs`. Itest tự dựng DB từ `db/migrations` bằng `taoDbThu`. DB chép từ `oneinvest` thiếu 088–102, nên không dùng `db-thu.sh` cho itest này.
- [ ] Commit `chore(acceptance): s16_db dựng DB thử từ migrations`.

Evals: E1, E4–E8 · independent: false.

### Task 1: Migration 103 và lõi stg

**Files:**
- Create: `db/migrations/103_stg_s16.sql`
- Create: `pipeline/lib/s16-danh-muc.mjs`
- Test: `pipeline/lib/s16-danh-muc.test.mjs`

**Interfaces:**
- Produces:
  - `NGUON_S16 = "S16"`.
  - `KIND_S16`: Set 11 kind theo thiết kế §2.
  - `dongS16(items, snapshotId) → { item:Row[], khu:Row[], toa:Row[], can:Row[], bo:Record<'thieu-source-id'|'kind-la'|'csv-loi', number> }`.
  - Bốn câu chèn `CAU_CHEN_S16_ITEM`, `CAU_CHEN_S16_KHU`, `CAU_CHEN_S16_TOA`, `CAU_CHEN_S16_CAN`, đều `ON CONFLICT DO NOTHING`, tham số theo thứ tự cột của 103.
  - `boHost(url) → string`.
  - `chonToa(maCan, tenToas: string[]) → { toa: string } | { mo_ho: string[] }`.
  - `NOI_DU_AN_S16`.
  - `s16Ref(...parts) → string`.

- [ ] **Bước 1, test trước.** Ma trận AC-3, năm ô, mỗi ô một assert, ghi trong `s16-danh-muc.test.mjs`:
  - «khác khu» → một căn;
  - «khác hoa thường» → một căn;
  - `chonToa("QS2.051101", ["QS2.05","QRAINBOW"])` → `{toa:"QS2.05"}`;
  - `chonToa("QS2.051101", ["QS2.05","QS2.0"])` → `mo_ho` gồm hai tên;
  - `chonToa("QX1", ["QA","QB"])` → `mo_ho`.

  Thêm các ca: `dongS16` trên fixture 11 kind tổng hợp (một item thiếu sourceId, một kind lạ, một dòng csv trùng y hệt, một dòng csv thừa cột, BOM đầu csv) ra đúng số dòng và số `bo`; `boHost("https://x.y/a/b?c")` → `"/a/b?c"`.
- [ ] **Bước 2.** `node --test pipeline/lib/s16-danh-muc.test.mjs` → FAIL (module chưa có).
- [ ] **Bước 3, viết lõi.**
  - `chonToa` so `chuanHoaTenToa(ten)` là tiền tố của `chuanHoaTenToa(ma)`; đúng một thì chọn.
  - Csv đọc bằng `split(",")`; số cột khác tiêu đề → `csv-loi`.
  - `mngt-can-moi`, `mngt-can-pha3` đọc từng dòng jsonl.
  - Pha 3 có `khu` là id; pha 2 có `khu` là nhãn hoặc null, khi null thì lấy phần giữa của `toa` (`<dự án>|<khu_id>|<toa_id>`).
- [ ] **Bước 4, viết migration 103.** Viết theo thiết kế §4, phần đầu theo khuôn 097, có dòng «KHÔNG sync cloud».
  - `v_s16_can`: dùng `DISTINCT ON (du_an, upper(btrim(ma_can)))` để lấy dòng đại diện; luật tiền tố viết bằng SQL, cùng nghĩa với `chonToa`, trả `toa_ten` hay `mo_ho`, kèm `so_dong`.
  - Nới `registry_aliases_source_check`: `DROP CONSTRAINT IF EXISTS` rồi `ADD … CHECK (source ~ '^S(0[1-9]|1[0-9])$')`.
- [ ] **Bước 5.** `node --test pipeline/lib/s16-danh-muc.test.mjs` → PASS. Áp 103 hai lần trên DB thử (Task 2 làm việc này).
- [ ] **Bước 6.** Commit `feat(db): 103 stg S16 và lõi tách item (DA33)`.

Evals: E1, E3 · independent: false.

### Task 2: Itest nạp và dựng, khung chung

**Files:**
- Create: `pipeline/scripts/danh-ba-s16.itest.mjs`

**Interfaces:**
- Consumes: Task 1, các hàm `taoDbThu`, `apTep`, `xoaDbThu` của `db-thu-dbv.mjs`, và `dung` của `danh-ba-vat-the.mjs`.
- Produces: các helper `napFixture(c)`, `dem(c)`, `bam(c)` dùng chung cho ca AC-4…AC-8.

- [ ] Viết khung:
  - DB `oneinvest_suite_s16_<pid>` và `oneinvest_suite_s16b_<pid>`; assert tiền tố `oneinvest_suite_` trước `taoDbThu`;
  - khu thử `q-khu-a`, `q-khu-b`; `NOI` thử `{ "Q Du An A":"q-khu-a", "Q Du An B":"q-khu-b" }`, dự án `Q Du An C` không nối;
  - toà S08 «QS2.08» có căn «QS2.081101».
- [ ] Ca **DA33-AC-1**: theo E1, gồm nạp hai lần, áp 103 lần hai so bản chụp `information_schema`, chèn bí danh `S16` được và `S1A` ra 23514. Ca đỏ ghim chữ «nạp lại».
- [ ] Ca **DA33-AC-3 qua view**: cùng ma trận Task 1 chạy qua `v_s16_can` ra cùng kết quả.
- [ ] `node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs` → ca AC-1 và AC-3 PASS.
- [ ] Commit.

Evals: E1, E3 · independent: false.

### Task 3: Bước S16 của lệnh dựng

**Files:**
- Create: `pipeline/lib/s16-dung.mjs`
- Modify: `pipeline/danh-ba-vat-the.mjs` (gọi `buocS16` sau `buocS09`; thêm tham số `noiS16 = NOI_DU_AN_S16`; trả `s16` trong tổng kết)
- Test: thêm ca vào `pipeline/scripts/danh-ba-s16.itest.mjs`

**Interfaces:**
- Produces: `buocS16(c, { khu, isoKhu, noi, log, taoKhoa }) → { bo_qua?: string, khu: Record<slug, {toa_noi, toa_moi, toa_0_can, can_moi, can_s08_bi_danh, the_moi, mo_ho}>, bo_du_an: Record<ten, so_can> }`.

- [ ] **Test trước**, theo E4, E5, E6, E8:
  - DA33-AC-4: dự án C 0 dòng, `bo_du_an` có C; assert `NOI_DU_AN_S16` bằng năm cặp.
  - DA33-AC-5: bốn ca toà khớp một, «QSA5» mới, «QRAINBOW» 0 căn, khớp hai; evidence thẻ không chứa token fixture.
  - DA33-AC-6: cùng toà → bí danh; lệch toà → thẻ; mã tách được → `stack_key` và `floor`; mã lô → `sub_id = unit_key`; hai SELECT trùng bằng 0.
  - DA33-AC-8: dựng ba lần, băm bằng nhau.
  - Review Focus 3: tầng «15A», mã có khoảng trắng → một căn.
  - Review Focus 4: DB chưa có `stg_s16_item` → `bo_qua: "chua-ap-103"`.
- [ ] Chạy → FAIL.
- [ ] **Viết `buocS16`** theo thiết kế §5.2–§5.4:
  - toà tra bí danh `ma_nguon` S16 trước, rồi tra bí danh `ten` của khu;
  - căn tra bí danh S16, rồi tra bí danh S08 qua `s08_project_links` có `status = 'noi'` của khu;
  - đúc căn qua `tachMa`; toà tách ra khác toà S16 thì thành căn không trục;
  - thẻ dùng `review_queue` `entity_match` theo khuôn `theDuyet` của `s09-dung.mjs`, `item_id = 's16:' + s16Ref(...)`;
  - in số căn theo từng toà mới bằng nhãn che `toa#<n>`.
- [ ] Chạy → PASS các ca trên. Chạy lại `node --test --test-concurrency=1 pipeline/scripts/danh-ba-s09.itest.mjs` → vẫn PASS.
- [ ] Commit `feat(pipeline): bước S16 dựng toà, căn vào danh bạ (DA33)`.

Evals: E4, E5, E6, E8 · independent: false.

### Task 4: Bước S08 tra bí danh S16 (thứ tự)

**Files:**
- Modify: `pipeline/lib/danh-ba-vat-the.mjs`, hàm `keHoachDung`: thêm tham số `biDanhS16: Map<maUpper, {unit_key, toa_ten}>` theo khu
- Modify: `pipeline/danh-ba-vat-the.mjs`: nạp `biDanhS16` cho khu có cặp trong `noiS16`; ghi thẻ cho ca lệch
- Test: thêm ca DA33-AC-7 vào itest

- [ ] **Test trước**, theo E7. Hai DB dựng theo hai thứ tự, fixture có mã chung cùng toà và khác toà; so tập `(mã → số căn, có bí danh S16, số thẻ)`. Hai chiều đỏ ghim chữ «thứ tự» và «lệch toà».
- [ ] Chạy → FAIL.
- [ ] **Sửa `keHoachDung`.** Khi mã đã có trong `biDanhS16`:
  - cùng toà (`chuanHoaTenToa`) → dùng `unit_key` S16, chỉ thêm bí danh S08;
  - khác toà → bỏ, trả vào mảng mới `lechS16`; lệnh ghi thẻ.

  Khu không có S16 thì `keHoachDung` chạy y như cũ.
- [ ] Chạy itest S16 + `node --test pipeline/lib/danh-ba-vat-the.test.mjs` + itest dbv → PASS.
- [ ] Commit.

Evals: E7 · independent: false.

### Task 5: Bộ soát sync-cloud

**Files:**
- Create: `pipeline/lib/s16-soat.mjs`
- Modify: `pipeline/sync-cloud.mjs`: gọi soát trong `syncOnce` trước khi gửi; danh sách cấm bảng
- Test: `pipeline/lib/s16-soat.test.mjs`

**Interfaces:**
- Produces:
  - `BANG_CAM_S16 = [/^stg_s16/, "registry_aliases", "units", "stacks", "buildings"]`.
  - `kiemBangDay(fill) → string|null`.
  - `tokenS16(c) → Promise<Set<string>|null>`, null khi chưa có `stg_s16_toa`.
  - `soatS16(giaTri, token) → {duong:string}|null`: khớp theo token tách bởi `/[^A-Za-z0-9._-]+/`, đi sâu đối tượng như `guardValues`.

- [ ] **Test trước**, theo E9. Năm ca đỏ (a)–(e), mỗi ca assert thông điệp nêu bảng hay đường và không chứa giá trị cấy. Thêm: payload sạch → null; ca âm «QS2.081101X» không khớp «QS2.081101».
- [ ] Chạy → FAIL.
- [ ] Viết `s16-soat.mjs`. Trong `syncOnce`:
  - `kiemBangDay(FILL)` ném `PhaseError("scan", …)`;
  - có token thì quét JSON từng dòng của mọi bảng sẽ gửi;
  - trúng thì ném lỗi nêu bảng và cột, không giá trị.
- [ ] Thêm vào test: quét `git diff origin/main --name-only` không có token tên nguồn thật. Token lấy từ `source_registry` local bằng `DATABASE_URL` mặc định, chỉ đọc. Không có thì in một dòng lý do rồi bỏ qua.
- [ ] Chạy `node --test pipeline/lib/s16-soat.test.mjs pipeline/sync-cloud.test.mjs pipeline/sync-pii.test.mjs` → PASS.
- [ ] Commit `feat(pipeline): sync-cloud chặn mã đăng nhập S16 (DA33)`.

Evals: E9 · independent: true (chỉ dùng tên bảng 103 dạng hằng).

### Task 6: Script dữ liệu thật

**Files:**
- Create: `pipeline/scripts/danh-ba-s16-that.mjs`

- [ ] Viết script.
  - DB thử `oneinvest_suite_s16that_<pid>` dựng bằng `taoDbThu` cộng chép chỉ đọc các bảng cần từ máy thu: `asset_nodes`, `stg_s08_inventory`, `s08_project_links`, `registry_aliases`, `buildings`, `stacks`, `units`. Xoá DB thử khi xong.
  - Đọc ba bản thu S16 trong `collector/snapshots/vn/` theo khuôn thư mục `vn__s16-*`, không in tên thư mục.
  - **Bộ đếm độc lập** viết lại trong script, không import `pipeline/lib/s16*`, theo E2. In số tệp kê 147.268 cạnh số đếm, kèm lý do lệch.
  - Nạp qua `dongS16`, dựng năm khu; in các bảng theo E10.
  - Phép cộng ba phần ở GP và OP1.
  - Thẻ không mang token.
  - Chạy sync-cloud ở chế độ không gửi, bằng cách gọi hàm soát trên dữ liệu đọc từ các bảng trong `FILL`.
  - Dựng lần hai ra 0 khoá mới.
  - Một ô lệch thì thoát 1 nêu ô.
- [ ] Chạy `node pipeline/scripts/danh-ba-s16-that.mjs` → thoát 0. Ghi số vào mô tả commit, chỉ số đếm.
- [ ] Commit.

Evals: E2, E10 · independent: false.

### Task 7: Kiểm cuối module

- [ ] Chạy:
  - `cd pipeline && npm test`;
  - `node --check` các `.mjs` vừa đổi;
  - `node --test scripts/*.test.mjs` (ở gốc kho);
  - `node pipeline/scripts/check-*` nếu có lưới vùng của kho.
- [ ] Nếu `pipeline/test-nua.json` cần ghi tệp test mới (`s16-danh-muc.test.mjs`, `s16-soat.test.mjs` nằm trong glob `npm test`) thì thêm vào một nửa; chạy `node --test scripts/chia-nua.test.mjs` → PASS.
- [ ] Commit.

Evals: suite · independent: false.

## Thứ tự

0 → 1 → 2 → 3 → 4 → 6 → 7. Task 5 chạy được ngay sau Task 1. Làm tuần tự Native: các task chung tệp itest và `danh-ba-vat-the.mjs`.
