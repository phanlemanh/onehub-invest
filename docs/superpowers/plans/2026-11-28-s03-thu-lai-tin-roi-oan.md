# PL43 s03-thu-lai-tin-roi-oan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bài S03 có chữ mà luật regex bỏ sót được nhận thành tin rao; câu tìm viết cùng kiểu vẫn là Yêu cầu; tin rò không vượt rào PL42.

**Architecture:** Sáu chỗ sửa trong `pipeline/transform-zalo.mjs` (A dấu hiệu BĐS, B diện tích làm dấu hiệu, C giá từ 1 tỷ là bán, D «1t920», F Yêu cầu đi cặp, G khẩu hiệu), gom sau một cờ luật `LUAT_PL43` để test và thước tiêm được luật cũ. Thước mới `pipeline/scripts/do-tin-roi-oan.mjs` chạy hai lượt transform trên cùng bản chép (luật cũ, luật mới) và dùng lại bộ đếm tin rò của `do-yeu-cau-lot-tin.mjs`.

**Tech Stack:** Node ESM `.mjs`, `node:test`, `pg`, `db/db-thu.sh` (DB thử / bản chép).

**Spec:** `docs/superpowers/specs/2026-11-28-s03-thu-lai-tin-roi-oan-design.md` · hợp đồng `_acceptance/s03-thu-lai-tin-roi-oan/contract.md`.

## Global Constraints

- Luật 7: luật xác định quyết; nhãn Haiku chỉ dùng làm đối chứng đo, không đọc trong transform.
- Không DDL, không migration, không sửa tay DB; không lượt áp riêng (lượt `zalo-import-daily.sh` kế tiếp sau gộp).
- Không đổi kỳ vọng của `transform-zalo-loai-tin.test.mjs`, `transform-zalo-loai-tin-doi-chieu.test.mjs`, `yeu-cau-khong-thanh-tin-thue.test.mjs` (chỉ thêm ca).
- Sàn giá bán 300 triệu (`GIA_BAN_SAN`), chặn thuê từ 1 tỷ (`chinhLoaiThueTy`, `lyDoGiaPhiLy`) giữ nguyên.
- `\b` không dùng sau chữ có dấu: kết bằng lookahead `(?![a-zà-ỹđ])` hay `(?![\p{L}])`.
- Tệp mẫu che chuỗi từ 8 chữ số thành «#», tên nguồn thành mã; kho công khai.
- Ngưỡng AC-5: sau − trước ≥ 150; tin rò ≤ 90; giá tốt thuê rò ≤ 17; mẫu 20 ngẫu nhiên + 10 phần C.

## Review Focus

- «1t9 tầng», «2t3 lầu» (số tầng viết tắt) không được đọc thành giá tỷ — ca đỏ ở Task 2.
- «KH 1 nữ», «vay 1 năm», «tuyển 3 nữ» không thành dấu hiệu BĐS sau khi bỏ `\b` — ca đỏ ở Task 2.
- «Stuff», «studious», «stunning» không phải «stu» — ca đỏ ở Task 2.
- Bài giá ≥ 1 tỷ kèm «/tháng» vẫn không thành thuê, giá trên 100 tỷ vẫn bị loại — ca đối chứng ở Task 2.
- Câu tìm «Em cần gấp chốt onl 7tr quay xe Stu» (viết tự do) có thể lọt — không chặn bằng luật; thước AC-5 đếm, mẫu AC-6 ghi phán.

---

### Task 1: Gộp main mới nhất

**Files:** không sửa tay; `pipeline/test-nua.json` nếu xung đột (giữ mọi dòng cả hai phía).
**Phục vụ:** tiền đề mọi eval · independent: false

- [ ] `git fetch origin main && git merge --no-edit origin/main` (main ≥ 3d2520347, có PL36 chạm `transform-zalo.mjs`).
- [ ] `cd pipeline && node --test scripts/chia-nua.test.mjs scripts/transform-zalo-loai-tin*.test.mjs scripts/yeu-cau-khong-thanh-tin-thue.test.mjs` → `fail 0`.
- [ ] `node scripts/product-map.mjs --root .` rồi commit bản đồ nếu đổi.

### Task 2: Luật mới trong transform-zalo + test đơn vị (E1, E2, E3)

**Files:**
- Modify: `pipeline/transform-zalo.mjs` (`DAU_HIEU_BDS` dòng ~514, `PN_YC`/`TIM`/`YEU_CAU_PL42` ~493–509, `parsePost` ~415–424, `suyLoai` ~589–607)
- Create: `pipeline/scripts/s03-thu-lai-tin-roi-oan.test.mjs`

**Interfaces — Produces:**
- `export const LUAT_PL43 = Object.freeze({ dauHieu: true, dienTich: true, tuMotTy: true, giaTLe: true, yeuCauCap: true, khauHieu: true })`
- `export const LUAT_TRUOC_PL43 = Object.freeze({ dauHieu: false, dienTich: false, tuMotTy: false, giaTLe: false, yeuCauCap: false, khauHieu: false })`
- `parsePost(text, { giaKhongDonVi = true, luat = LUAT_PL43 } = {})` — `luat.giaTLe` bật dạng «1t920».
- `suyLoai(pr, text, mucDich, mucDichThe = null, luat = {})` — đọc `luat.pl43 ?? LUAT_PL43`; `luat.yeuCau` (PL42) giữ nguyên nghĩa.
- `coDauHieuBds(text, luat = LUAT_PL43)`.
- `laYeuCau(text, luat = LUAT_PL43)`.

- [ ] **Bước 1: test đỏ.** Bốn khối `test()` có tên ghim: `PL43-AC-1 dấu hiệu BĐS viết tắt` (ma trận 9 dạng × giá thuê «8tr» / giá bán «2.6 tỷ», `suyLoai(..., "ca-hai")` ra `rent_lt`/`sale`; cùng ma trận với `{ pl43: LUAT_TRUOC_PL43 }` ra `bo`, thông điệp gọi tên dạng; sáu câu đỏ `coDauHieuBds === false`), `PL43-AC-1 diện tích trần` («S205 · 55m · 9,5tr» → `rent_lt`), `PL43-AC-2 giá không đơn vị` (bốn câu → `sale` với `priceVnd` 1_920_000_000 · 2_450_000_000 · 3_700_000_000 · 1_650_000_000; «1t9 tầng cao» `priceVnd` null; ba đối chứng bằng kết quả `LUAT_TRUOC_PL43`), `PL43-AC-3 câu tìm đi cặp và khẩu hiệu` (năm câu → `nguon: "yeu-cau"`; hai khẩu hiệu → `rent_lt`; với `{ pl43: { ...LUAT_PL43, yeuCauCap: false } }` năm câu ra `rent_lt`, gọi tên câu).
- [ ] **Bước 2:** `cd pipeline && node --test scripts/s03-thu-lai-tin-roi-oan.test.mjs` → FAIL (`LUAT_PL43` chưa có).
- [ ] **Bước 3: mã.** A: `DAU_HIEU_BDS_PL43` = bản cũ với `(?:pn|phòng\s*ngủ|ngủ|wc|vs)(?![a-zà-ỹđ])` thay `\b`, thêm `(?<![\p{L}])stu(?:dio)?s?(?![\p{L}])`. B: cửa vào `DAU_HIEU || (luat.dienTich && pr.areaM2 != null)`. C: `tuMotTy = pr.priceVnd >= 1e9 && pr.pricePerm2Vnd == null` cạnh `coTy || TIN_HIEU_BAN`. D: `GIA_T_LE = /(?<![\p{L}\d.,])(\d{1,2})t(\d{1,3})(?![\p{L}\d.,])(?!\s*(?:tầng|lầu|t\b))/giu`, chỉ khi chưa có giá tỷ. F: `PN_YC` thêm `ngủ`, `TIM` nhận `kiếm`, nhánh «cần» nhận `stu`, thêm mẫu `(?:ai|ac|ace)\s+(?:nào\s+)?có\s+(?:căn\s+)?(?:stu(?:dio)?|${PN_YC})`; bản cũ giữ trong `YEU_CAU_TRUOC_PL43`. G: gạt `/t[iì]m\s*(?:nhà|căn)\s*(?:không\s*khó|khó)/giu` khỏi chữ trước khi xét Yêu cầu.
- [ ] **Bước 4:** chạy lại test → PASS; `node --test scripts/transform-zalo-loai-tin*.test.mjs scripts/yeu-cau-khong-thanh-tin-thue.test.mjs` → `fail 0`.
- [ ] **Bước 5: đột biến.** Bản sao tạm bỏ lookahead của A → ca «KH 1 nữ» đỏ; bỏ `(?!\s*(?:tầng|lầu…))` → ca «1t9 tầng cao» đỏ. Trả lại, commit `feat(pipeline): PL43 nhận tin S03 viết tắt …`.

### Task 3: Transform thật trên DB thử (E4)

**Files:**
- Modify: `pipeline/transform-zalo.mjs` (`runTransformZalo(client, { …, luatPl43 = LUAT_PL43 })` truyền tới `parse` và `suyLoai`)
- Create: `pipeline/scripts/s03-thu-lai-tin-roi-oan.itest.mjs` (khuôn theo `yeu-cau-khong-thanh-tin-thue.itest.mjs`)

**Interfaces — Consumes:** `LUAT_PL43`, `LUAT_TRUOC_PL43` (Task 2). **Produces:** tham số `luatPl43` của `runTransformZalo`.

- [ ] Test `PL43-AC-4 transform thật`: nạp năm bài (Contract AC-4) vào `stg_zalo_posts` của DB thử; `runTransformZalo(c, { luatPl43: LUAT_TRUOC_PL43 })` → ba bài oan không có trong `sale_offers` (thông điệp gọi `post_id`); chạy với luật mới → ba tin đúng `kind` và `price_vnd`, câu tìm `nhanhCuaBai` = `yeu-cau`, tin có từ trước cùng `offer_id`; lần hai: `sale_offer_records` không đổi dòng nào.
- [ ] `bash ../db/db-thu.sh --chay node --test scripts/s03-thu-lai-tin-roi-oan.itest.mjs` → `pass ≥ 1, fail 0, skipped 0`. Commit.

### Task 4: Thước trên bản chép (E5)

**Files:**
- Create: `pipeline/scripts/do-tin-roi-oan.mjs`, `pipeline/scripts/do-tin-roi-oan.test.mjs`
- Modify: `pipeline/scripts/do-yeu-cau-lot-tin.mjs` chỉ để export `khoi`, `docNhan` nếu chưa export

**Interfaces — Consumes:** `runTransformZalo({ luatPl43 })`, `khoi(c, nhan)`, `docNhan(c)` của thước PL42, `docSourceNameEntries` (che tên nguồn).
**Produces:** `export const NGUONG = Object.freeze({ themToiThieu: 150, roTran: 90, giaTotThueRoTran: 17, mauNgauNhien: 20, mauPhanC: 10, mauConRoi: 20 })`, `export function xet({ truoc, sau, mau }) → string[]` (rỗng = đạt), `export function vietMau(muc, { sha, hatGiong, che }) → string`, `export const TRUONG_MAU = ["ma_tin","phan_luat","kind","price_vnd","nhan","chu_bai"]`.

- [ ] Test đỏ trước: `xet` với số đạt → `[]`; từng ngưỡng vượt (sau − trước 149, rò 91, giá tốt thuê rò 18, mẫu ngẫu nhiên 19, phần C 9) → thông điệp gọi tên ngưỡng; `vietMau` thiếu một trường → ném «mẫu thiếu trường»; chuỗi 8 chữ số thành «#».
- [ ] `main --kiem`: từ chối DB không phải `oneinvest_<…>` (exit 2); BEGIN; lượt «trước» `runTransformZalo(c, { luatPl43: LUAT_TRUOC_PL43 })` + `xep-hang-gia`; đếm; SAVEPOINT bỏ, lượt «sau» luật mới + `xep-hang-gia`; đếm; in hai khối, tin mới theo phần luật, tin bán mới dưới 1 tỷ; ghi `.acceptance-runs/s03-thu-lai-tin-roi-oan/mau-tin-moi.md` (đầu tệp `sha:` và `hat_giong: pl43-mau-tin-moi`), `--ghi-evidence` chép thêm vào `_acceptance/s03-thu-lai-tin-roi-oan/evidence/`; ROLLBACK. Không cờ: chỉ đọc, in số hiện tại.
- [ ] `node --test scripts/do-tin-roi-oan.test.mjs` → PASS; `bash ../db/db-thu.sh oneinvest_suite_pl43_that --chay node scripts/do-tin-roi-oan.mjs --kiem` → thoát 0 (cần khoá DB lượt — xin GS). Commit.

### Task 5: Nối vào kho (config, suite, tài liệu)

**Files:** `_acceptance/config.yaml` (executors `test.pl43_unit`, `test.pl43_ac4`, `script.pl43_do_that`, `test.pl43_loai_tin` qua `config-patch.mjs`), `pipeline/test-nua.json` (đăng ký hai tệp test mới vào một nửa), `scripts/suite-neu-doi.test.mjs` (NGOAI_LE cho `evidence/mau-tin-moi.md` hai nửa pipeline, như PL42), `pipeline/CLAUDE.md` (một dòng cho `do-tin-roi-oan.mjs`).
**Phục vụ:** E1–E9 chạy được bằng ref · independent: false

- [ ] `node --test scripts/suite-neu-doi.test.mjs` và `cd pipeline && node --test scripts/chia-nua.test.mjs` → `fail 0`. E7: `git diff a94013aaf -- pipeline/scripts/transform-zalo-loai-tin*.test.mjs pipeline/scripts/yeu-cau-khong-thanh-tin-thue.test.mjs` chỉ có dòng `+`.
- [ ] Xoá `pipeline/transform-zalo.pl43-thu.mjs` (bản thử của S1, chưa từng commit). Commit.
