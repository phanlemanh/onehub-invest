# DO1 — Đo hiệu quả hằng ngày: kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mẫu soát cuốn chiếu 20 bài S03/ngày có nháp máy chụp sẵn, bốn nhóm số đo (giữ nháp, bỏ sót, tín hiệu, chuyển bậc) ghi vào `dq_check_results`, xem trên `/ops/quality`.

**Architecture:** Migration 083 thêm `eval_label_items.draft`, `data_level_unit`, `data_level_change` (chỉ máy thu). Pipeline có một thư viện thuần `pipeline/lib/do-hang-ngay.mjs` (tính toán, Wilson, lát) và hai lệnh mỏng: `mau-soat-cuon-chieu.mjs` (rút + gọi đọc gộp + chụp nháp) và `do-hang-ngay.mjs` (chuyển bậc + bốn nhóm số → `dq_check_results`). App đọc dòng `do1-*` cho khối mới ở `/ops/quality` và điền sẵn nháp ở `/ops/labels` lát `s03-cuon-chieu`.

**Tech Stack:** Node ESM `.mjs` + `pg` (pipeline), PostgreSQL/PostGIS :5433, Next.js 16 + ReUI (app), `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-07-do-hieu-qua-hang-ngay-design.md` · hợp đồng `_acceptance/do-hieu-qua-hang-ngay/contract.md` · `evals.yaml`.

## Global Constraints

- Migration số **083** (giám sát cấp, sổ SO-MIGRATION), idempotent, header chuẩn; không áp lên DB máy thu trong vòng này (Hỏi-3: giám sát áp sau gộp).
- Lát mẫu soát: `s03-cuon-chieu`; `stratum` = ngày `YYYY-MM-DD` (giờ VN); `split` = `dev`; `seed` = `cc-<ngày>`; n mặc định 20.
- Trần đọc gộp mẫu soát: **0,05 USD/ngày** (cờ `--tran-usd`), chi đếm từ `ai_calls` việc `doc-gop-s03` trong ngày VN.
- Khoá cách đọc: `bo-doc-luat` · `doc-gop:<model>:<prompt_version>` · `doc-chu:<model>:<prompt_version>` (model nguyên văn cột `silver_labels.model`).
- `draft` = `{hien, cach_doc: {<khoá>: {trang_thai: "co"|"khong-tin"|"vang", o: {<ô>: <chuỗi chuẩn hoá>|null}}}, chup_luc}`; giá trị chuẩn hoá bằng đúng quy tắc của `app/src/lib/labels-normalize.ts` (bản chép `.mjs` ở pipeline có test đối chiếu).
- `check_name`: `do1-giu-nhap`, `do1-bo-sot`, `do1-tin-hieu`, `do1-chuyen-bac`; `entity`: `S03` (ba nhóm đầu) / `tat-ca` (chuyển bậc); `status`: `pass` | `skip`.
- Lát: chiều `thi_truong`, `phuong`, `du_an`, `toa` (+ `du_an_theo_chu` cho số trên mẫu soát); tối đa 30 ô + `khac` + hai ô chưa gắn `khong-tin-hieu`, `chua-co-danh-ba`; tổng ô = tổng chung.
- Nguyên tắc đo (design doc «Bổ sung sau rà soát»): dung sai giá ±1%, diện tích ±1 m²; nhóm ô A/B/C theo F3; `phien_ban_thuoc`; cơ cấu bán/thuê × loại nhà; `co_y_nghia` = hai khoảng Wilson 95% không chồng; `nguong_phat_hien`; `ty_le_soat` cảnh báo < 0,7.
- Trần so cặp trước/sau: 0,30 USD/lần, cửa sổ 4 tuần.
- `detail` chỉ số, tỉ lệ, mã S0x, khoá cách đọc, mã khu vực, khoá vật thể. Không chữ bài, trích, người đăng, `labeler_id`, tên nguồn thật.
- Không sửa `scripts/cloud-sync.sh`, `pipeline/sync-cloud.mjs`, `pipeline/push-ops-facts.mjs`, `_acceptance/config.yaml`, `docs/plan/lo-trinh.json`, `collector/**`.
- Test DB: ca DB dựng lược đồ tạm `do1_<pid>` trên DB của lượt (npm test tự trỏ DB thử), nạp 056 + 083 vào lược đồ ấy, xoá khi xong; không chạm `oneinvest` chung.
- UI: luật ReUI (AGENTS.md khối «ReUI design rules») + skill `onehub-ui`; chữ tiếng Việt, `text-sm`/`text-xs`.

## Review Focus

- Ngày VN lệch UTC: bài 00:30 giờ VN thuộc ngày D, không D-1 — ca E1 có một bài ở 17:30Z ngày D-1 (= 00:30 VN ngày D).
- Chạy hai lần trong ngày: `do-hang-ngay --write` lần hai cùng ngày không sinh dòng chuyển trùng (khoá `(snap_date, unit_key)`), không ghi trùng dq — ca E6 «chạy lại».
- Bài có `silver_labels` của nhiều prompt: mỗi prompt một khoá cách đọc, `hien` lấy prompt mới nhất theo `labeled_at` — ca E1.
- Ô `n < 5`: màn hiện «ít mẫu», không phần trăm — ca E8.
- `dq_check_results.detail` lớn: lát phường S06 hàng trăm ô — cắt 30 + `khac`, ca E7 kiểm tổng.

---

### Task 1: Migration 083

**Files:**
- Create: `db/migrations/083_do_hang_ngay.sql`

**Interfaces:**
- Produces: `eval_label_items.draft jsonb NULL`; `data_level_unit(unit_key text PK, unit text CHECK IN ('can','tin_le'), data_level text CHECK B0–B5, ke_thieu text, core jsonb NOT NULL, ward_id text, project_key text, building_key text, seen_on date NOT NULL)`; `data_level_change(snap_date date, unit_key text, unit text, from_level text NULL, to_level text NULL, huong text CHECK IN ('len','tut','moi','mat'), ly_do text[] NOT NULL, ward_id text, project_key text, building_key text, PRIMARY KEY (snap_date, unit_key))`; `ref_field_lookup` cho `data_level_unit.data_level`, `data_level_change.from_level/to_level` → `data_level`.

- [ ] **Step 1:** Viết migration theo khuôn 056/082 (header: hồ sơ, số do giám sát cấp, «KHÔNG sync cloud», «áp lên DB máy thu chỉ sau gộp theo lời Mạnh»). `core` = `{kind,property_type,price_vnd,area_m2,area_id: bool, measured: bool}` để suy lý do.
- [ ] **Step 2:** Chạy hai lần trên DB thử: `bash db/db-thu.sh oneinvest_do1 && docker exec -i one-invest-db psql -U oneinvest -d oneinvest_do1 -v ON_ERROR_STOP=1 < db/migrations/083_do_hang_ngay.sql` (×2). Expected: cả hai exit 0.
- [ ] **Step 3:** Commit `feat(db): 083 đo hằng ngày — draft nhãn, bậc từng đơn vị, dòng chuyển bậc (DO1)`.

### Task 2: Thư viện thuần `pipeline/lib/do-hang-ngay.mjs`

**Files:**
- Create: `pipeline/lib/do-hang-ngay.mjs`, `pipeline/lib/chuan-hoa-nhan.mjs` (bản chép quy tắc chuẩn hoá của `app/src/lib/labels-normalize.ts`)
- Test: `pipeline/scripts/do-hang-ngay.test.mjs` (ca thuần)

**Interfaces:**
- Produces:
  - `wilson(k: number, n: number, z = 1.96): {thap: number, cao: number} | null` (n = 0 → null)
  - `tuanIso(ngay: string): string` (`2026-W45`, giờ VN)
  - `NHOM_O: Record<string, 'A'|'B'|'C'>`, `DUNG_SAI = {price_min_vnd: {tuong_doi: 0.01}, price_max_vnd: {tuong_doi: 0.01}, area_m2: {tuyet_doi: 1}}`, `PHIEN_BAN_THUOC: string` (sha256 rút gọn của ô + quy tắc + dung sai)
  - `giuO(o, nhap, nhan): boolean` (dung sai ô số, chuẩn hoá ô chữ)
  - `soTuan(a: {k,n}, b: {k,n}): {chenh, co_y_nghia, nguong_phat_hien}`
  - `giuNhap(the: {draft, nhan: Record<string, {value: string|null, not_stated: boolean}>, ngay: string, da_soat: boolean, kind, property_type}[]): {o: Row[], co_cau, ty_le_soat, canh_bao_soat, phien_ban_thuoc}` với Row `{cach_doc, o, nhom, tuan, n, giu, ty_le, wilson, chenh, co_y_nghia, nguong_phat_hien}`; chỉ nháp `co`; thêm dòng `o: "__nguoi_sua__"` cho cách đọc `hien` = 1 − giữ.
  - `boSot(the[]): {cach_doc, tuan, n, bo, thieu_nhap, ty_le, wilson}[]` — mẫu số = thẻ người gắn `listing_intent = offer` có nháp `co`|`khong-tin`.
  - `tinHieu(dong: SilverRow[], boDocLuat: Map<post_id, o>, ngay): {cach_doc, status, json_hong, trich_lac, phu: Record<o,{co,giao,sai_khuon}>, bat_dong: Record<"<a>|<b>", Record<o,{khac,ca_hai}>>}[]`
  - `chuyenBac(truoc: Map<unit_key, UnitRow>, nay: Map<unit_key, UnitRow>, diTin: Map<offer_id, {tu: unit_key, den: unit_key}>): ChangeRow[]` — UnitRow có `source`; cặp mất/mới do tin đi từ căn này sang căn khác nhận `doi-khoa`; `ly_do` theo thứ tự `kind, property_type, price_vnd, area_m2, area_id` (`thieu-<ô>`/`du-<ô>` với tên ô ngắn `gia`, `dien-tich`, `loai`, `loai-hinh`, `phuong`), rồi `gan-can`, `tin-nghi`, `do-luong`.
  - `phanRa(rows, chieu: 'thi_truong'|'phuong'|'du_an'|'toa'|'du_an_theo_chu', khoa: (r)=>string|{chua: 'khong-tin-hieu'|'chua-co-danh-ba'}, dem: (r)=>number, tran = 30): {o: Record<string, number>, tong: number}` — ô thứ 31+ gộp `khac`.
  - `soCap(cap: {cu: boolean, moi: boolean}[]): {n_cap, giu_cu, giu_moi, chenh_cap, khoang, co_y_nghia}` (khoảng 95% của hiệu hai tỉ lệ cặp, Newcombe/Wald cặp — ghi rõ công thức trong test).
  - `chanLo(detail: object, cam: string[]): void` — ném `LO <chuỗi>` khi JSON chứa chuỗi cấm.
- [ ] **Step 1:** Viết ca thuần trước (tên ca đúng evals): `DO1-AC-3` (ma trận 2 cách đọc × 3 ô × 2 tuần, số đặt trước, Wilson so hàm tham chiếu viết trong test tới 4 chữ số), `DO1-AC-4`, `DO1-AC-5`, `DO1-AC-7` (40 phường giảm dần + 5 không phường), mỗi ca kèm chiều đỏ trên cùng fixture với thông điệp ghim của evals (`GIU NHAP SO SAI NHAP`, `GOP CACH DOC`, `BO SOT SAI MAU SO`, `THIEU NHAP THANH BO SOT`, `KHONG LUOT GHI SO 0`, `SAI KHUON THANH TRONG`, `THIEU CHUA GAN`, `TONG LAT LECH`, `DUNG SAI O SO`, `CHENH NHIEU THANH Y NGHIA`, `THIEU CANH BAO SOAT`, `GOP HAI O CHUA GAN`, `THIEU THI TRUONG`) — chiều đỏ = gọi bản đột biến (tham số `__dotBien`) và assert thông điệp.
- [ ] **Step 2:** `cd pipeline && node --test scripts/do-hang-ngay.test.mjs` → FAIL (module chưa có).
- [ ] **Step 3:** Hiện thực các hàm; `chuan-hoa-nhan.mjs` thêm ca `DO1-CHUAN-HOA` so bảng vào/ra viết trước với bản TS (đọc tệp TS không được → bảng chép tay ghi rõ nguồn dòng).
- [ ] **Step 4:** Chạy lại → PASS. Commit `feat(pipeline): thư viện đo hằng ngày DO1`.

### Task 3: Lệnh `mau-soat-cuon-chieu.mjs`

**Files:**
- Create: `pipeline/mau-soat-cuon-chieu.mjs`
- Modify: `pipeline/lib/eval-labels.mjs` (thêm `LAT_CUON_CHIEU = "s03-cuon-chieu"` nếu cần cho bộ chọn)
- Test: `pipeline/scripts/do-hang-ngay.test.mjs` (ca DB `DO1-AC-1`, `DO1-AC-1-GOI`)

**Interfaces:**
- Consumes: `loadStgPosts`, `khuTrung`, `chonMau` (`pipeline/lib/eval-labels.mjs`, `lib/test-posts.mjs`), `docTinCua` (`label-ghep.mjs`), `chuanHoa` (Task 2).
- Produces: `export async function rutMau(client, {ngay, n = 20, tranUsd = 0.05, goiDocGop}): {them: number, goi: number, cham_tran: boolean, the: {item_id, post_id, draft}[]}` — `goiDocGop(postIds: string[], tranConLai: number) => Promise<{goi: number, usd: number, cham_tran: boolean}>`; mặc định gọi `cd agent && node --import tsx scripts/doc-gop-s03.ts chay --bai <ids> --tran-usd <còn lại>` qua `execFile`. CLI: `--ngay`, `--n`, `--tran-usd`, `--thu`.
- [ ] **Step 1:** Ca `DO1-AC-1` (fixture: 26 bài ngày D gồm 3 bài thử, 2 cặp trùng chữ, 6 bài không thành tin, 1 bài 17:30Z D-1; 4 bài D-1) và `DO1-AC-1-GOI` (`goiDocGop` giả đếm lời gọi, 12/20 bài có silver_labels sẵn; giá giả để lời thứ 4 chạm trần) theo đúng `expected` của E1, gồm bảy chiều đỏ ghim.
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Hiện thực: lọc bài theo khoảng giờ VN của ngày; chọn tất định hạt giống `cc-<ngày>`; insert `ON CONFLICT DO NOTHING`; nếu lát ngày đó đã đủ thì không gọi model; gọi đọc gộp cho bài thiếu TRƯỚC khi chụp; chụp `draft`; `hien` = khoá đọc gộp mới nhất có `co`, ngược lại `bo-doc-luat`; chạm trần → log `CHAM TRAN DOC GOP`.
- [ ] **Step 4:** PASS. Commit `feat(pipeline): rút mẫu soát cuốn chiếu S03 kèm nháp (DO1 AC-1)`.

### Task 4: Lệnh `do-hang-ngay.mjs`

**Files:**
- Create: `pipeline/do-hang-ngay.mjs`
- Test: `pipeline/scripts/do-hang-ngay.test.mjs` (ca DB `DO1-AC-3`..`DO1-AC-7` đi qua writer, `DO1-AC-6`, `DO1-AC-9`, `DO1-AC-9-FILL`)

**Interfaces:**
- Consumes: Task 2 hàm thuần; hàm SQL `property_data_level`, `offer_data_level` (056).
- Produces: `export async function doHangNgay(client, {ngay, write}): {chuyen: number, lap_moc: boolean, dq: {check_name, entity, status, detail}[]}`. CLI `--write`, `--ngay`, `--lam-lai`. Khoá advisory `56083` trong giao dịch. Mỗi `(check_name, entity, ngày)` một dòng dq: xoá dòng `do1-*` cùng ngày VN rồi ghi lại.
- [ ] **Step 1:** Ca `DO1-AC-6` theo đúng `expected` E6 (A, B, C/K, D, E, F, G, H/P/Q đổi khoá; chạy lại 0 dòng; sáu chiều đỏ). Ca `DO1-AC-9` (sáu chuỗi cấm, `chanLo` được gọi trước khi ghi) và `DO1-AC-9-FILL` (import `FILL` từ `pipeline/sync-cloud.mjs`: có `dq_check_results`, không có `data_level_unit`, `data_level_change`, `eval_label_items`). Bổ sung ca DB cho AC-3..AC-5, AC-7 gọi qua `doHangNgay` để detail thật đi qua writer.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Hiện thực: đọc bậc hiện tại từ hai hàm SQL + `core` (cờ đủ, cờ measured) + `ward_id` (khu vực `region_type='ward'`), `market_id`, `project_key`/`building_key` (liên kết vật thể của 082 khi có; không có liên kết mà có chữ toà/dự án → `chua-co-danh-ba`, không có chữ → `khong-tin-hieu`), `source`; `diTin` từ `property_offers` lần trước (giữ trong `data_level_unit.core.tin`) so lần này; lần đầu (bảng rỗng) → lập mốc; đọc thẻ `s03-cuon-chieu` + `eval_labels` (mọi `labeler_id`, gộp theo thẻ — lấy nhãn mới nhất), `silver_labels` ngày VN; ghi dq qua `chanLo`; nhiều lần chạy trong ngày: upsert `data_level_change` giữ `from_level` đầu ngày, `to_level` mới nhất, xoá dòng khi hai bậc bằng nhau.
- [ ] **Step 4:** `cd pipeline && npm test` → PASS toàn suite. Commit `feat(pipeline): đo hằng ngày — giữ nháp, bỏ sót, tín hiệu, chuyển bậc vào dq_check_results (DO1)`.

### Task 5: Màn soát `/ops/labels` lát `s03-cuon-chieu`

**Files:**
- Modify: `app/src/components/ops/labels/labels-view.tsx` (`LAT_CUON_CHIEU`, dùng biểu mẫu nhóm không có bộ chọn nhóm), `app/src/components/ops/labels/label-form-nhom.tsx` (prop `nhap?: {cachDoc: string, o: Record<string, string|null>}` → giá trị ban đầu, huy hiệu `<Badge variant="info-light">Nháp máy · {cachDoc}</Badge>`), `app/src/lib/labels-queries.ts` (`TinGan.nhap`, đọc `draft` theo khoá `hien` đầy đủ, bỏ ô `nguoi` của `agent/config/doc-gop-s03.json`), `app/src/app/ops/labels/page.tsx` (trạng thái «Chưa rút mẫu soát hôm nay» + lệnh)
- Test: `app/tests/do-hang-ngay-labels.test.tsx`

**Interfaces:**
- Consumes: `draft` (Task 3 writer — test gọi `rutMau` từ `pipeline/mau-soat-cuon-chieu.mjs` trên lược đồ tạm), `ghiNhan` (route lưu hiện có), `giuNhap` (Task 2).
- [ ] **Step 1:** Ca `DO1-AC-2` và `DO1-RT` theo đúng `expected` E2 (năm chiều đỏ ghim).
- [ ] **Step 2:** FAIL → hiện thực → PASS (`cd app && node --import tsx --test tests/do-hang-ngay-labels.test.tsx`). Self-check ReUI trên tệp đổi.
- [ ] **Step 3:** Commit `feat(ops): màn soát cuốn chiếu điền sẵn nháp máy (DO1 AC-2)`.

### Task 6: Khối «Đo hằng ngày» trên `/ops/quality`

**Files:**
- Create: `app/src/lib/do-hang-ngay.ts` (`doHangNgaySql()`, kiểu detail, `latChon(param)`), `app/src/components/ops/quality/do-hang-ngay.tsx` (năm bảng `data-grid` — giữ nháp có cột Nhóm, dấu «có ý nghĩa», ngưỡng phát hiện; chuyển bậc có dòng «Đổi khoá»; so cặp — `Alert` khi tỉ lệ soát < 70%, `Tabs` lát Tổng · Thị trường · Phường/xã · Dự án · Toà theo `?lat-do=`, `Skeleton`, trống kèm lệnh, lập mốc, `Alert` lỗi + «Thử lại», «ít mẫu» khi n < 5)
- Modify: `app/src/app/ops/quality/page.tsx` (thêm khối), `app/src/lib/dq-checks.ts` (`dqLatestSql()` thêm `AND check_name NOT LIKE 'do1-%'`)
- Test: `app/tests/do-hang-ngay-quality.test.tsx`

**Interfaces:**
- Consumes: dòng `do1-*` sinh bằng `doHangNgay` (Task 4) trên lược đồ tạm — test không dựng detail tay.
- [ ] **Step 1:** Ca `DO1-AC-8` theo đúng `expected` E8 (hai chiều đỏ ghim).
- [ ] **Step 2:** FAIL → hiện thực → PASS. Self-check ReUI. `cd app && npx tsc --noEmit && npm run lint`.
- [ ] **Step 3:** Commit `feat(ops): khối Đo hằng ngày trên /ops/quality (DO1 AC-8)`.

### Task 7: So cặp trước/sau `so-sanh-cach-doc.mjs` (AC-10)

**Files:**
- Create: `pipeline/so-sanh-cach-doc.mjs`
- Test: `pipeline/scripts/do-hang-ngay.test.mjs` (ca `DO1-AC-10`)

**Interfaces:**
- Consumes: `goiDocGop` (Task 3, cùng chữ ký, nhận thêm `--prompt`/model của khoá mới), `giuO`, `soCap` (Task 2).
- Produces: `export async function soSanh(client, {cu, moi, tuan = 4, tranUsd = 0.30, goiDocGop}): {goi, cham_tran, dong: Row[]}` ghi dq `do1-so-sanh` (entity = khoá mới); `doHangNgay` ghi `skip` «chưa so cặp» cho khoá đọc gộp mới chưa có dòng so sánh.
- [ ] **Step 1:** Ca `DO1-AC-10` đúng `expected` E12 (ba chiều đỏ ghim). FAIL → hiện thực → PASS. Commit `feat(pipeline): so cặp cách đọc trước/sau trên mẫu soát (DO1 AC-10)`.

### Task 8: Tài liệu + dựng sẵn cho ảnh S4

**Files:**
- Modify: `docs/product/FRAMING.md` §5 (dòng «Độ đúng — để thấy trôi» trỏ tám nguyên tắc đo; thêm khối «Nguyên tắc đo» + §9 nhật ký), `CONTEXT.md` (thuật ngữ «Đo hằng ngày», «so cặp trước/sau», «đổi khoá», hai ô chưa gắn), `docs/ROADMAP.md` §2 as-built + §4, `pipeline/CLAUDE.md` (ba lệnh mới)
- Create: `pipeline/scripts/do1-dung-thu.mjs` — dựng DB thử `oneinvest_do1` có 083 + dữ liệu bịa + chạy `rutMau` (đọc gộp giả) và `doHangNgay --write` hai ngày, để E9/E11 chụp trên `DATABASE_URL` trỏ DB thử.
- [ ] **Step 1:** Viết, chạy `node pipeline/scripts/do1-dung-thu.mjs` → in số thẻ và số dòng dq.
- [ ] **Step 2:** `/verify` cho pipeline + app. Commit `docs: DO1 as-built + dựng DB thử cho ảnh`.

Lệnh giao giám sát sau gộp (Hỏi-3, không làm trong vòng): áp 083 lên DB máy thu (sao lưu `eval_label_items` trước), thêm vào `scripts/cloud-sync.sh` sau dòng `bac-du-lieu`:
`job_run cloud-sync mau-soat node "$ROOT/pipeline/mau-soat-cuon-chieu.mjs" --ngay "$(TZ=Asia/Ho_Chi_Minh date -v-1d +%F)"` và `job_run cloud-sync do-hang-ngay node "$ROOT/pipeline/do-hang-ngay.mjs" --write` (rút mẫu tự bỏ qua khi ngày đã đủ thẻ; đo hằng ngày chạy lại an toàn — Task 4 gộp nhiều lần đổi trong ngày của một đơn vị thành một dòng: giữ `from_level` đầu ngày, `to_level` mới nhất, về lại bậc cũ thì xoá dòng).
