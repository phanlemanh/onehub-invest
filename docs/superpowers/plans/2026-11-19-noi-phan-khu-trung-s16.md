# Nối phân khu S16 trùng nơi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nối bảy phân khu do luật S16 số 2 đúc trùng về nút đã có, và bước khớp không đúc nút trùng nữa.

**Architecture:** Hàm thuần ở `pipeline/lib/s16-phan-khu.mjs` dựng kế hoạch; `pipeline/phan-khu-s16.mjs` đọc DB, áp và đảo theo băm. Toà vào phân khu qua view `v_toa_nut_vung`, không đổi dòng `buildings`. Không có migration.

**Tech Stack:** Node ESM, `pg`, `node:test`, PostgreSQL; TypeScript ở `app/`.

**Spec:** `docs/superpowers/specs/2026-11-19-noi-phan-khu-trung-s16-design.md`, hợp đồng `_acceptance/noi-phan-khu-trung-s16/contract.md`.

## Global Constraints

- Không đổi `buildings.region_node_id`: rào chỉ-thêm 082.
- `asset_nodes.meta` chỉ mang băm khoá khu (`khoaKhu`), không mang `khu_id`, `toa_id` S16 thô; thẻ và log không in mã thô.
- Nguồn chỉ gọi bằng mã `S0x` trong mã, test, thông điệp commit.
- Sàn bằng chứng: `co_s09 * 2 >= tong_toa` và mọi toà có S09 về đúng một nút; cụm (`s09_cum` + `s09_sector_id`) thắng phân khu (`s09_sector_ids`).
- Không chạy ghi lên DB `oneinvest`; mọi phép đo ghi chạy trên DB thử.

## Review Focus

- Khu có toà mang S09 nhưng dưới sàn một nửa: giữ luật so tên, không nhận nút theo bằng chứng (NPS-2).
- Thẻ dựng lại sau khi dữ liệu khu đổi: băm khác, `--noi` từ chối và không ghi dòng nào (NPS-4).
- Áp hai lần cùng băm: lần hai không thêm dòng luật, không đổi nút (NPS-4).
- Nút giữ lại đã có khoá khu khác trong meta: khoá cũ còn nguyên sau áp và sau đảo (NPS-5).
- Một nút mới có từ hai khoá khu: chuyển đủ mọi khoá, đảo trả đủ (NPS-5).

---

### Task 1: Bước khớp tìm khoá trên cả cây và dùng bằng chứng S09

Phục vụ E1, E2. `independent: false`.

**Files:**
- Modify: `pipeline/lib/s16-phan-khu.mjs`, `pipeline/phan-khu-s16.mjs`
- Create: `pipeline/scripts/phan-khu-s16-noi.itest.mjs`
- Modify: `pipeline/test-nua.json` (khai itest vào nửa nhẹ hơn nếu kho đếm tệp này)

**Interfaces:**
- Produces: `chonNutTheoBangChung(bc: {tong_toa:number, co_s09:number, nut:number[]}) => {nut:'san', node_id:number} | {nut:'mo-ho', node_id:null} | null`
- Produces: `keHoachPhanKhu(khuS16, nutSan, bangChung = new Map())`; `nutSan` có thêm `du_an_node_id`, `node_type`; `bangChung` khoá theo `khoaKhu(du_an, khu_id)`.
- Produces: `docBangChung(client, noi) => Map<string, {tong_toa, co_s09, nut:number[]}>` trong `phan-khu-s16.mjs`.

- [ ] **Step 1: Viết NPS-1, NPS-2 đỏ.** Fixture theo khuôn `danh-ba-s16-cau-truc.itest.mjs` (`taoDbThu`, `apTep` 111 + 114). NPS-1: khoá trên nút cháu và nút `building` ra `da-co`; khoá trên nút `meta.nghi` không tính. NPS-2: bốn nhánh trên cùng fixture: về một nút khác tên → `san`; cụm thắng phân khu cha; rẽ hai nút → `mo-ho`; 1/4 toà có S09 → không nhận theo bằng chứng; không có S09, tên không trùng → `moi`.
- [ ] **Step 2: Chạy, xác nhận đỏ.** `bash db/db-thu.sh oneinvest_suite_nps_cay --chay node --test --test-concurrency=1 --test-name-pattern='^NPS-(1|2):' pipeline/scripts/phan-khu-s16-noi.itest.mjs`
- [ ] **Step 3: Sửa `keHoachPhanKhu`.** Thứ tự xét: `da-co` trên cả cây của dự án → thiếu tên thì `mo-ho` → bằng chứng S09 → so tên với `subzone` con trực tiếp → `moi`. `dungTheLuat` đọc mọi nút chưa nghỉ dưới dự án bằng CTE đệ quy.
- [ ] **Step 4: Chạy lại, xanh; phá thử.** Bỏ nhánh bằng chứng → NPS-2 đỏ; bỏ sàn → nhánh dưới sàn đỏ; chỉ xét con trực tiếp → NPS-1 đỏ.
- [ ] **Step 5: Commit** `feat(danh-ba): bước khớp phân khu S16 nhận nút đã có theo cây và bằng chứng S09`.

### Task 2: Thẻ nối

Phục vụ E3. `independent: false`.

**Files:** Modify `pipeline/lib/s16-phan-khu.mjs`, `pipeline/phan-khu-s16.mjs`; Test `pipeline/scripts/phan-khu-s16-noi.itest.mjs`.

**Interfaces:**
- Produces: `keHoachNoi(nutLuat, bangChung, nutCu) => {cap:[{moi_id, cu_id, khoa:string[], co_s09, tong_toa}], khong_noi:[{moi_id, ly_do:'re-hai-nut'|'khong-toa'|'gan-ten', voi_id:number|null}], bam:string}`
- Produces: `dungTheNoi(keHoach, tenNut) => string`, `dungKeHoachNoi(client) => keHoach & {markdown}`; CLI `--the-noi <tệp>`.

- [ ] **Step 1: Viết NPS-3 đỏ.** Assert đúng cặp cấy, `co_s09/tong_toa`, mục `khong_noi` có đủ ba lý do, băm đổi khi một cặp đổi, đếm dòng `asset_nodes` và `project_link_rules` không đổi sau khi dựng thẻ.
- [ ] **Step 2: Cài đặt.** `gan-ten` so tên bỏ tiền tố «the» và ký tự ngoài chữ số, giữa các nút cùng dự án. Băm sha256 trên JSON các trường quyết định.
- [ ] **Step 3: Chạy NPS-3 xanh, phá thử bỏ lọc `re-hai-nut` → đỏ.**
- [ ] **Step 4: Commit** `feat(danh-ba): thẻ nối phân khu S16 trùng nơi`.

### Task 3: Áp, đảo, kiểm sau

Phục vụ E4, E5, E10. `independent: false`.

**Files:** Modify `pipeline/phan-khu-s16.mjs`; Test `pipeline/scripts/phan-khu-s16-noi.itest.mjs`.

**Interfaces:**
- Produces: `apNoi(client, {bam, nguoi}) => {rule_id:number|null, khongDoi:boolean, so:number}`; lỗi `bam-lech: …`.
- Produces: `daoNoi(client, {ruleId, nguoi}) => {soNut:number}`; lỗi `da-dao: …`.
- Produces: `kiemNoi(client, {ruleId}) => {ok:boolean, loi:{loai:'giu-rong'|'toa-o-nut-nghi'|'toa-treo'|'nut-khac-mang-khoa', node_id:number|null}[]}`
- CLI: `--noi --bam <hex> --nguoi <tên>`, `--dao-noi <rule_id> --nguoi <tên>`, `--kiem-noi <rule_id>` (thoát 1 khi `ok` sai).
- Lưu vết đảo: nút mới mang `meta.noi = {rule_id, ve_nut, cha_cu, khu_ids, khu_rule}`; nút giữ lại mang `meta.noi_bi_danh = {"<rule_id>": string[]}` và `s16_khu_rule[khoa] = rule_id`.

- [ ] **Step 1: Viết NPS-4, NPS-5, NPS-10 đỏ.** NPS-5 so `parent_id`, `meta`, `aliases` của mọi nút trong cặp và toàn bộ view trước/sau; có ca nút giữ lại đã mang khoá khác và ca nút mới có hai khoá. NPS-10: một ca xanh, bốn ca đỏ, mỗi ca ghim `loai` và `node_id`.
- [ ] **Step 2: Cài đặt trong một giao dịch**, khoá `project_link_rules` như `apTheLuat`, dựng lại kế hoạch trong giao dịch rồi so băm.
- [ ] **Step 3: Chạy xanh; phá thử** không đổi `parent_id` → NPS-4 đỏ; đảo không trả `parent_id` → NPS-5 đỏ; bỏ từng nhánh kiểm → ca NPS-10 tương ứng đỏ.
- [ ] **Step 4: Commit** `feat(danh-ba): áp, đảo và kiểm việc nối phân khu S16`.

### Task 4: Dựng đêm và đường cloud

Phục vụ E7, E8. `independent: false`.

**Files:** Test `pipeline/scripts/phan-khu-s16-noi.itest.mjs`; sửa mã chỉ khi ca đỏ chỉ ra chỗ hỏng.

**Interfaces:** Consumes `apNoi`, `dung` (`pipeline/danh-ba-vat-the.mjs`), `soatDuLieu`, `tokenS16` (`pipeline/lib/s16-soat.mjs`).

- [ ] **Step 1: Viết NPS-7** với ba loại nút giữ lại (phân khu con trực tiếp, cụm cháu, nút `building`): chạy `dung` hai lần, `khoa_moi` 0, đếm nút không đổi, toà vẫn ở nút giữ lại.
- [ ] **Step 2: Viết NPS-8:** `soatDuLieu` sạch trên `asset_nodes` sau khi nối; cấy một `khu_id` thô vào meta thì dừng ở `asset_nodes.meta`.
- [ ] **Step 3: Chạy xanh; phá thử** giữ nút nghỉ là con trực tiếp của dự án → NPS-7 đỏ.
- [ ] **Step 4: Commit** `test(danh-ba): lượt dựng đêm và bộ soát cloud sau khi nối phân khu`.

### Task 5: Bên đọc bỏ qua nút nghỉ

Phục vụ E6. `independent: true`.

**Files:** Modify `app/src/lib/ops/registry/doc.ts`, `app/src/lib/ops/registry/du-an.ts`, `app/src/lib/the-dia-chi-nhom.ts`; Create `app/tests/nut-nghi-tren-ops.test.tsx`.

**Interfaces:** Consumes `docDanhBa(q)`, `docDuAn(id, q)`, `docDanhMucThe(db)`.

- [ ] **Step 1: Viết test đỏ** trên DB thử: mỗi hàm đọc không trả nút có `meta.nghi`, `so_phan_khu` không đếm nó, nút thường cùng cha vẫn có; `deals.ts` và `data-api/src/routes/deals.ts` chỉ đọc `asset_nodes` với `node_type = 'project'` hoặc qua id nút dự án.
- [ ] **Step 2: Thêm điều kiện** `COALESCE((n.meta ->> 'nghi')::boolean, false) = false` vào từng truy vấn.
- [ ] **Step 3: Chạy xanh; phá thử** bỏ điều kiện ở từng hàm → ca của hàm đó đỏ. `cd app && npx tsc --noEmit`.
- [ ] **Step 4: Commit** `fix(ops): danh bạ và thẻ địa chỉ bỏ qua phân khu đã nghỉ`.

### Task 6: Phép đo trên bản chép và hồ sơ áp

Phục vụ E9. `independent: false`.

**Files:** Create `pipeline/scripts/phan-khu-s16-noi-that.mjs`, `_acceptance/noi-phan-khu-trung-s16/ap-may-thu.md`.

**Interfaces:** Consumes `dungKeHoachNoi`, `apNoi`, `kiemNoi`, `daoNoi`, `dung`.

- [ ] **Step 1: Viết script** theo khuôn `danh-ba-s16-cau-truc-that.mjs` (tự chạy lại trong `db/db-thu.sh oneinvest_suite_npsthat --chay`, từ chối DB khác khuôn tên). Bản mẫu chưa có luật số 2 thì script áp 111, 114 và thẻ luật hiện tại trước khi đo. Ghim: 7 cặp với 11/11, 15/15, 4/4, 3/3, 5/5, 6/7, 5/5; 50 toà đổi; 0 toà khác đổi; 41=11, 42=16, 40=4, 23=7, 43=5, 33=3, 27=5; bảy nút nghỉ 0 toà; thẻ luật dựng lại 61 đã gán, 0 mới; dựng lại năm dự án không thêm nút; đảo về đúng dấu vân tay.
- [ ] **Step 2: Chạy** `node pipeline/scripts/phan-khu-s16-noi-that.mjs`, thoát 0, chỉ in số.
- [ ] **Step 3: Viết `ap-may-thu.md`** đủ năm thứ: lệnh áp kèm băm, số chạy thử, sao lưu trước, cách lùi, lệnh kiểm sau (gồm lần chạy lại sau lượt đêm đầu tiên).
- [ ] **Step 4: Commit** `test(danh-ba): đo trọn đường nối phân khu trên bản chép DB máy thu`.
