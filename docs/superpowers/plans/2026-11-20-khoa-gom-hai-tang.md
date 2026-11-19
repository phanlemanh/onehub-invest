# GT5 khoa-gom-hai-tang — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bộ đọc S03 gom bài thành tin theo hai tầng (bản chữ → tin) sau công tắc `ops_audit` `gom-tin:hai-tang` mặc định tắt; tắt
thì thành phần tin giống hệt `main`.

**Architecture:** Toàn bộ luật gom là hàm thuần trong `pipeline/lib/gom-tin*.mjs` (không DB, không model). `transform-zalo.mjs` bước 4
đọc công tắc một lần: tắt → `repostKey` cũ nguyên văn; bật → `gomHaiTang`. `offer_id` vẫn qua `assignStickyIds` (PL14) và đối soát
`sale_offer_records` của 044 (`superseded_by` do SQL 044 ghi) — GT5 không thêm migration.

**Tech Stack:** Node 22 ESM `.mjs`, `node --test`, pg, bash probe trên bản chép DB máy thu (`db/db-thu.sh`).

**Spec:** `docs/superpowers/specs/2026-11-19-khoa-gom-hai-tang-design.md` · hợp đồng `_acceptance/khoa-gom-hai-tang/contract.md`
(đã duyệt 20/11) · `evals.yaml` E1–E10.

## Global Constraints

- Không migration (công tắc là dòng `ops_audit`; `superseded_by` có từ 044). Không sửa migration đã commit.
- Không ghi DB máy thu `oneinvest`; mọi probe chạy trên bản chép `oneinvest_gt5_*` do probe tự tạo, tự DROP.
- Model không vào khoá (AGENTS luật 7). Mẫu giữ riêng: Mạnh duyệt Hỏi-2 — Opus, Sonnet, tối đa **3 USD**, mọi payload qua
  `pipeline/lib/mask-source-names.mjs`, quét 0 tên nguồn trước khi gửi.
- Hỏi-1: bảng viết tắt phân khu sống trong danh bạ (dãy danh bạ thêm); GT5 chỉ ĐỌC danh bạ, không có bảng viết tắt trong mã.
- Hỏi-3: khác nội thất không tách. Hỏi-4: cửa sổ **7 ngày**, **đúng một** ứng viên, chữ giống **≥ 0,9**; hai số chỉnh trên thước nền,
  KHÔNG chỉnh sau khi chấm mẫu giữ riêng.
- Ngưỡng: gộp nhầm < **5%** (tin nhiều bản chữ, n ≥ 60, ước lượng điểm), tách nhầm trên 40 cặp không tăng, ca loại vì nhãn bất
  đồng ≤ **20%**.
- Tên nguồn chỉ bằng mã `S0x` trong mã, test, đầu ra probe (kho công khai). `_acceptance/config.yaml`, `docs/plan/lo-trinh.json` không sửa.
- Tệp test mới phải vào đúng một nửa của `pipeline/test-nua.json` (`scripts/chia-nua.test.mjs` canh).

## Review Focus

1. Bài có `sender_id` rỗng chuỗi `""` (không phải null) — phải coi như vắng, rơi sang SĐT. → Task 4 ô «sender rỗng chuỗi».
2. Hai bài cùng người, cùng chữ nhưng một bài thiếu giá (low confidence bị bỏ ở bước 4) — bản chữ dựng chỉ từ bài có giá. → Task 4.
3. Bản chữ thiếu trường có ứng viên đúng 7 ngày 0 giây (biên cửa sổ) — trong cửa sổ (≤ 7 ngày). → Task 4.
4. Mã cùng căn viết `s1006` và `S1006` ở hai bài — chung tin; `S10` và `S10.06` — khác mã. → Task 2.
5. Công tắc có hai dòng cùng giây — dòng `id` lớn nhất thắng (dùng lại `docCongTac`). → Task 1.

---

### Task 0: Đóng băng danh sách 172 tin khác phân khu (TRƯỚC khi viết mã gom)

`independent: true` · phục vụ E5 (AC-5)

**Files:**
- Create: `_acceptance/khoa-gom-hai-tang/probes/dong-bang-phan-khu.mjs`
- Create: `_acceptance/khoa-gom-hai-tang/dong-bang/phan-khu-172.json` (+ `.sha256`)

**Interfaces:** Produces tệp JSON `{ sinh_luc, sha_main, tin: [{ offer_id, nhom: "ten"|"viet-tat", bai: [{post_id, chu_phan_khu}] }] }`,
12 tin `ten` + 160 tin `viet-tat`, đúng như bảng phủ ca (`discovery/bang-phu-ca.md` dòng 21–22).

- [ ] Step 1: Viết lệnh chỉ đọc trên bản chép DB máy thu: lấy tin S03 sống ≥ 2 bản chữ mà hai bản chữ nêu phân khu khác nhau, theo tên
  danh bạ (12) và theo viết tắt `ori|rb|bs|gh|…` dùng ở bảng phủ ca (160). Ghi `chu_phan_khu` = cụm chữ trích từ bài.
- [ ] Step 2: Chạy, kiểm 12 + 160 = 172; lệch số → DỪNG, báo (không chỉnh cho khớp).
- [ ] Step 3: Ghi `.sha256`; commit riêng `test(gt5): đóng băng 172 tin khác phân khu` TRƯỚC commit mã nào của Task 1–5.

### Task 1: Công tắc `gom-tin:hai-tang`

`independent: true` · phục vụ E1 (AC-1)

**Files:**
- Create: `pipeline/lib/gom-tin.mjs` · Test: `pipeline/scripts/gom-tin-cong-tac.test.mjs`
- Modify: `pipeline/test-nua.json` (thêm tệp test vào một nửa)

**Interfaces:**
- Consumes: `docCongTac(rows): "bat"|"tat"` từ `pipeline/lib/danh-ba-nguoi.mjs`.
- Produces: `export const CONG_TAC_GOM = "gom-tin:hai-tang"`; `export async function congTacGom(client): Promise<"bat"|"tat">`
  (không có bảng `ops_audit` → `"tat"`; dò bằng `to_regclass`, không bắt lỗi SELECT).

- [ ] Step 1: Test: không dòng → tat; dòng mới nhất `bat:false` sau dòng `bat:true` → tat; dòng mới nhất `bat:true` → bat; hai dòng cùng
  giây, id lớn thắng; `bat:"true"` (chuỗi) → tat. Chạy → đỏ (module chưa có).
- [ ] Step 2: Viết `congTacGom` (SQL `ORDER BY id DESC LIMIT 1`, như `SQL.congTac` của danh-ba-nguoi). Chạy → xanh.
- [ ] Step 3: Commit.

### Task 2: Bộ tìm mã mới

`independent: true` · phục vụ E6 (AC-6)

**Files:**
- Create: `pipeline/lib/gom-tin-ma.mjs` · Test: `pipeline/scripts/gom-tin-ma.test.mjs`

**Interfaces:** Produces `export function maMoi(text: string): string[]` — mã viết HOA, không trùng, sắp xếp; đọc trên `gatSo(text)`
(import từ `transform-zalo.mjs`). `export const NHIEU: RegExp[]` (danh sách nhiễu khai).

- [ ] Step 1: Test ma trận viết trước, một assert mỗi ô, chữ rút từ bài thật của bản chép: chữ hoa `S10` · chữ thường `s1006` → `S1006` ·
  1/2/3/4 chữ số · đuôi `.03`, `-1203`, `xx13` · mã tin môi giới 2–4 chữ + 4–6 số (`VH12345`) · nhiễu `t4`, `m2`, `pn`, `wc`, `coc`,
  `ocp`, `gd`, `x2` → `[]`. Ô hai cách viết: `maMoi("s1006")` deepEqual `maMoi("S1006")`. Ô `S10` ≠ `S10.06`.
- [ ] Step 2: Chiều đỏ trong cùng tệp: bản `maMoi` gọi với `NHIEU=[]` (tham số `{ nhieu }` tuỳ chọn, mặc định `NHIEU`) → ô nhiễu đỏ,
  thông điệp ghim chuỗi. Chạy → đỏ.
- [ ] Step 3: Viết `maMoi(text, { nhieu = NHIEU } = {})`: mã toà 1–3 chữ + 1–4 số + đuôi tuỳ chọn, mã tin 2–4 chữ + 4–6 số, không phân
  biệt hoa thường, ranh giới `(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])`, rồi lọc nhiễu. Chạy → xanh. Commit.

### Task 3: Tập phân khu từ danh bạ

`independent: true` · phục vụ E5 (AC-5)

**Files:**
- Create: `pipeline/lib/gom-tin-phan-khu.mjs` · Test: `pipeline/scripts/gom-tin-phan-khu.test.mjs`

**Interfaces:** Produces
- `export async function docTuDienPhanKhu(client): Promise<Array<{ khoa: string, du_an: string, ten: string[] }>>` — nút con của nút
  `project` trong `asset_nodes` (khoá = `slug`), `ten` = `name` + `aliases` + `registry_aliases` kind `ten` còn sống của nút; theo nếp
  `docDanhBaKhu` (`pipeline/lib/mau-hai-khu.mjs`).
- `export function tapPhanKhu(text: string, tuDien): string[]` — khoá phân khu nêu trong chữ (so sau `fold` của mask-source-names, ranh
  giới từ), sắp xếp, không trùng.

- [ ] Step 1: Test hàm thuần với từ điển rút từ bản chép (lưu fixture JSON sinh bằng lệnh, ghi lệnh sinh trong đầu tệp): tên đầy đủ ·
  bí danh · hai phân khu trong một bài → hai khoá · chữ không nêu → `[]` · tên trùng giữa từ (không ranh giới) → không nhận.
- [ ] Step 2: Viết hai hàm. Chạy → xanh. Commit.

### Task 4: Hàm gom hai tầng

`independent: false` (cần Task 2, 3) · phục vụ E2, E3, E4, E8 (AC-2, 3, 4, 8)

**Files:**
- Create: `pipeline/lib/gom-tin-hai-tang.mjs` · Test: `pipeline/scripts/gom-tin-hai-tang.test.mjs`
- Create: `_acceptance/khoa-gom-hai-tang/probes/ham-gom.sh` (chạy tệp test của Task 2–4 + đột biến)

**Interfaces:**
- Consumes: `maMoi` (Task 2), `tapPhanKhu` (Task 3), `normText`, `gatSo`, `extractPhones` từ transform-zalo / norm-text.
- Produces: `export function gomHaiTang(baiDaDoc, { tuDien, cuaSoNgay = 7, nguongChu = 0.9 }): Array<{ posts: PostRef[], banChu: number }>`
  — `baiDaDoc` = mảng `{ ...pr, post }` đúng như phần tử `parsed` của bước 4 (đã lọc `confidence !== "low"`); đầu ra mỗi nhóm giữ `posts`
  theo khuôn `o.posts` hiện tại để bước 5 không đổi. Thứ tự đầu ra tất định, không phụ thuộc thứ tự đầu vào.
- `export function nguoiDang(pr, post): string|null` — `sender:<id>` (rỗng chuỗi coi như vắng) → `phone:<sđt đầu của chonSdtTin>` → null.

Luật (từ spec §2, chép số nguyên văn):
- Tầng 1: khoá bản chữ = `nguoiDang | normText(gatSo(text))`; `nguoiDang` null → mỗi bài một bản chữ.
- Tầng 2: khoá = `người · loại · giá · số phòng · diện tích · tập phân khu · tập mã` (tập mã = `maMoi` ∪ `pr.unit`). Bản chữ đủ năm trường
  số phòng/diện tích/phân khu/mã… nghĩa là không trường nào null/rỗng.
- Bản chữ thiếu trường: nhập vào tin đầy đủ cùng người khi trong ±`cuaSoNgay` ngày (≤, tính trên `posted_at`) có **đúng một** tin
  ứng viên khớp mọi trường nó có và độ giống chữ ≥ `nguongChu` (Jaccard trên tập 3-gram từ của `normText`); không bắc cầu: chỉ so với tin
  dựng từ bản chữ đủ trường, xử lý sau khi mọi tin đủ trường đã dựng.
- Hai tập phân khu khác nhau, cả hai không rỗng → không bao giờ chung tin (kể cả nhánh thiếu trường).
- `pr.dangBai` có mặt và ≠ `"mot_can"` → bài thành tin riêng (GT8 chưa gộp: thuộc tính vắng → gom bình thường).

- [ ] Step 1: Test, bài rút từ bản chép (fixture sinh bằng lệnh), một assert mỗi ô:
  AC-2 sáu ô (cùng người cùng chữ → 1 · khác SĐT/URL trong chữ → 1 · chữ khác → 2 · khác người cùng chữ → 2 · không sender có SĐT → theo SĐT ·
  không cả hai → mỗi bài riêng) + ô `sender_id = ""`.
  AC-3: bảy ô «khác đúng một trường» → 2 tin, ô khớp đủ → 1 tin, lặp cho nhánh đủ phường + diện tích.
  AC-4: thiếu số phòng/diện tích/phân khu/mã × (0, 1, 2 ứng viên) × (trong, ngoài 7 ngày, biên đúng 7 ngày) × chữ giống 0,89/0,9;
  ô bắc cầu (A đủ, B đủ khác giá, C thiếu giá-khớp-cả-hai) → A, B vẫn hai tin.
  AC-5: hai phân khu khác, cả hai không rỗng, mọi trường khác khớp → 2 tin; một bên rỗng → theo luật thiếu trường.
  AC-8: `dangBai: "ro_hang"` → riêng; `"mot_can"` và vắng → gom.
  Bất biến thứ tự: đảo ngẫu nhiên đầu vào (seed cố định, 20 lần) → cùng tập nhóm.
- [ ] Step 2: Chạy → đỏ. Viết `gomHaiTang`, `nguoiDang`. Chạy → xanh.
- [ ] Step 3: `ham-gom.sh` chạy ba tệp test rồi ba đột biến trên bản chép tạm của `gom-tin-hai-tang.mjs` (gộp khác người cùng chữ ·
  bỏ người khỏi khoá tầng hai · cho bắc cầu) — mỗi đột biến PHẢI làm đỏ đúng ô, lệnh in tên ô; đột biến lọt → thoát 1 «thước mù».
- [ ] Step 4: Commit.

### Task 5: Nối vào transform-zalo + bảng đổi theo bài

`independent: false` (cần Task 1, 4) · phục vụ E1, E7 (AC-1, AC-7)

**Files:**
- Modify: `pipeline/transform-zalo.mjs` bước 4 (quanh dòng 938–975) và bước 5 (quanh dòng 981–985)
- Create: `_acceptance/khoa-gom-hai-tang/probes/cong-tac.sh`, `_acceptance/khoa-gom-hai-tang/probes/duong-noi.sh`

**Interfaces:**
- `runTransformZalo(client, { …, gom })` — `gom` vắng → đọc `congTacGom(client)`; `"bat"|"tat"` chỉ cho test và probe.
- Lượt bật ghi bảng đổi theo bài vào `pipeline/logs/gom-tin-doi-<ISO>.tsv` (`post_id \t offer_id_cu \t offer_id_moi`), in số dòng.
  Đọc `offer_id_cu` từ `sale_offer_records.post_ids` trước khi ghi.

- [ ] Step 1: Tắt: bước 4 giữ nguyên văn đường `repostKey` (không gọi `maMoi`, `tapPhanKhu`, không đọc từ điển). Bật: `gomHaiTang(parsed
  lọc low, { tuDien: await docTuDienPhanKhu(client) })`, dựng `o` từ mỗi nhóm bằng đúng hàm gộp hiện tại (tách phần dựng `o` thành
  `dungTin(posts)` dùng chung cho hai đường, để bước 5 không đổi).
- [ ] Step 2: `cong-tac.sh` (E1): tạo bản chép DB, chạy transform từ worktree tạm ở sha `origin/main` (ghi sha) → băm tập `post_ids` mỗi
  `offer_id`; chạy nhánh với công tắc vắng, `bat:false` → băm bằng; `bat:true` → khác (in số tin trước/sau). Hai đột biến (đọc dòng cũ
  nhất · gọi `maMoi` khi tắt) → đỏ, thông điệp ghim mã dòng công tắc / `offer_id` lệch. DROP bản chép.
- [ ] Step 3: `duong-noi.sh` (E7): bản chép, bật, chạy → mọi `offer_id` cũ hoặc còn sống, hoặc nghỉ có `superseded_by` (in 0 treo);
  bảng đổi có dòng cho mọi bài đổi tin; tắt lại, chạy → vẫn 0 treo. Chiều đỏ: xoá `superseded_by` của một tin nghỉ ở bản chép → thoát 1,
  ghim `offer_id`.
- [ ] Step 4: Commit.

### Task 6: Phép đo phân khu và chạy thử

`independent: false` (cần Task 0, 5) · phục vụ E5, E10 (AC-5, AC-10)

**Files:** Create `_acceptance/khoa-gom-hai-tang/probes/phan-khu.sh`, `_acceptance/khoa-gom-hai-tang/probes/chay-thu.sh`

- [ ] Step 1: `phan-khu.sh`: kiểm `.sha256` của tệp đóng băng (lệch → thoát 2); bản chép, bật, chạy; mỗi `offer_id` trong 172 tin: các
  bài của nó nằm ở ≥ 2 tin (một dòng đạt/ĐỎ mỗi tin); bài nào `tapPhanKhu` trả rỗng mà tệp ghi có `chu_phan_khu` → ĐỎ ghim chữ viết tắt.
  Chiều đỏ: cấy một tin hai phân khu vào bản chép (gộp post_ids hai tin) → thoát 1 ghim `offer_id`.
  Ghi chú cho người chấm: 160 tin `viet-tat` chỉ xanh khi dãy danh bạ đã thêm bí danh (Hỏi-1) — lệnh in số tin đỏ vì «danh bạ chưa có bí
  danh» tách khỏi đỏ khác.
- [ ] Step 2: `chay-thu.sh` (E10): bản chép, bật, chạy hai lượt → lượt hai 0 tin đổi; in số tin trước/sau theo khu, số tin chạm lát
  `hai-khu-ghep-b` và tệp đóng băng PL20, thời gian bước gom; băm thư mục snapshot trước/sau bằng nhau (số tệp > 0); bài thử bị loại.
  Phát lại theo lát ngày (lọc `stg_zalo_posts` theo `captured_at` tăng dần, mỗi ngày một lượt) → thành phần cuối bằng lượt toàn bộ; mọi
  `offer_id` đổi giữa lát có đường nối; in số lần lật. Chiều đỏ: đột biến khoá phụ thuộc thứ tự bài → lượt hai đổi tin, thoát 1.
- [ ] Step 3: Commit.

### Task 7: Thước chất lượng và mẫu giữ riêng

`independent: false` (mẫu dựng sau Task 0, TRƯỚC Task 4; chấm sau Task 5) · phục vụ E9 (AC-9)

**Files:**
- Create: `_acceptance/khoa-gom-hai-tang/probes/mau-giu-rieng.mjs` (rút mẫu + viết payload đã che), `_acceptance/khoa-gom-hai-tang/probes/thuoc.sh`
- Create (gitignored, máy local): `research-local/s03-gom-tin-giu-rieng-<ngày>/` (payload, nhãn thô)

- [ ] Step 1 (trước Task 4): rút 200 bản chữ từ tin S03 nhiều bản chữ có bài từ 12/11, seed cố định, loại mọi tin thuộc 120 nhãn audit.
  Payload qua `maskSourceNames` với danh sách tên từ `source_registry` local (rỗng → thoát 2, đóng chặt); quét lại toàn payload bằng
  `findSourceNames` → phải 0; ghi băm payload.
- [ ] Step 2: Hai tác tử con (model `opus`, `sonnet`) đọc payload đã che, gom mù thành nhóm cùng căn, ghi nhãn thô. Theo dõi chi phí
  ≤ 3 USD; vượt → dừng, báo. Nhãn = chỗ hai model đồng thuận; ca bất đồng bị loại và đếm. Commit băm mẫu + băm nhãn (không commit nội dung).
- [ ] Step 3 (sau Task 5): `thuoc.sh`: chạy khoá cũ và khoá mới trên bài của mẫu; đơn vị tin nhiều bản chữ có nhãn; in gộp nhầm, tách
  nhầm (40 cặp audit) trước/sau + cận Wilson 95%, n, số ca loại; đạt khi gộp nhầm < 5%, tách nhầm không tăng, n ≥ 60, loại ≤ 20%.
  Tính lại từ nhãn thô; chiều đỏ: sửa một số trong báo cáo hay bớt một nhãn → thoát 1; cấy tên nguồn vào bản sao payload → thoát 1 ghim
  mã bài. Chấm MỘT lần; hụt ngưỡng thì báo, không chỉnh luật rồi chấm lại.

### Task 8: Tài liệu as-built

`independent: false` (cuối) · không eval

- [ ] Ghi ROADMAP §2 as-built + §4 trạng thái GT5, `pipeline/CLAUDE.md` mục bước 4 (công tắc, hai đường). Commit.

## Thứ tự

Task 0 → (Task 1, 2, 3 song song được) → Task 7 Step 1–2 → Task 4 → Task 5 → Task 6 → Task 7 Step 3 → Task 8. Lượt chấm S4 chờ GT8 gộp
không bắt buộc (AC-8 đo bằng thuộc tính `dangBai` giả lập trong test); bật trên máy thu là việc riêng sau PL20, GT8 (OOS-5).
