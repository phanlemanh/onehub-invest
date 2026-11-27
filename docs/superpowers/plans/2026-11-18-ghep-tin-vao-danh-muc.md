# PL20 ghep-tin-vao-danh-muc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gắn tin căn hộ S03 của Ocean Park 1 và Grand Park vào toà hoặc vùng của Danh bạ, đạt từ 50% tin căn hộ S03, mỗi nhóm nguồn có độ đúng đo bằng nhãn người.

**Architecture:** Một hàm thuần xét từng bài ra nguồn, nút và căn cứ. Một lớp đọc dữ liệu dùng chung cho chạy khô, rút mẫu và ghi thật. Phát biểu ghi vào `field_assertions` theo `rule_id` từng nguồn; view `offer_building` gộp lên tin. Bước gắn chạy sau COMMIT của lượt nạp S03, trong giao dịch riêng.

**Tech Stack:** Node 24 `.mjs`, `pg`, `node:test`, PostgreSQL 16 (migration đánh số), `db/db-thu.sh` cho DB thử.

**Spec:** `docs/superpowers/specs/2026-11-18-ghep-tin-vao-danh-muc-design.md` · hợp đồng `_acceptance/ghep-tin-vao-danh-muc/contract.md`.

## Global Constraints

- Nguồn chỉ gọi bằng mã `S0x` trong commit, tệp, thông điệp (kho công khai).
- Raw snapshot bất biến; không ghi DB máy thu ngoài các lượt giám sát chạy theo gói lệnh.
- Đo trên bản chép: `bash db/db-thu.sh oneinvest_suite_<bộ> --chay <lệnh>`. Không chạy test ghi trên `oneinvest`.
- `node_modules` là symlink (`test -L`) thì không `npm ci`, `npm install`, `rm -rf`.
- Không sửa `_acceptance/config.yaml`, `docs/plan/lo-trinh.json`, `collector/**`, `scripts/zalo-*.sh`.
- `pipeline/mappings.yaml`, ba tệp vocab và `CONTEXT.md` chỉ chạm sau khi DA40 vào main và nhánh này đã nhận main.
- Migration số **117**, viết chồng lên danh sách trường của 113; thứ tự áp trên DB máy thu: 113 → 118 → 117.
- Phạm vi dự án: `KHU_SLUG` của `pipeline/lib/mau-hai-khu.mjs` (node 1 và 16).
- Bản đọc model: `probabilities->>'nguon' = 'doc-gop'`, `prompt_version = 'dg3-s03-v3'`, `json_ok`, lấy bản mới nhất mỗi bài.
- Ngưỡng: độ phủ từ 50%; xung đột không vượt 1% số đã gắn; Wilson từ 0,95 mỗi nhóm, 110 bài mỗi nhóm; bước gắn xong trong 60 giây; đọc bù trần 5 USD.

## Review Focus

1. Bài chỉ có ảnh, `text` rỗng hoặc NULL: không gắn từ chữ, không ném lỗi; ô tên toà vẫn xét.
2. Ô model có `v` không phải chuỗi (số, mảng) hoặc `trich` rỗng: coi như model chưa đọc.
3. Tên trong danh bạ ngắn dưới 2 ký tự sau chuẩn hoá: bị loại khỏi bảng tên, không khớp nhầm chữ thường trong bài.
4. Bí danh toà bị nghỉ (`retired_at`) hoặc toà ngừng hoạt động sau lượt trước: lượt kế rút dòng cũ.
5. Tin có `post_ids` trỏ bài không còn trong `stg_zalo_posts`: bỏ qua bài đó, các bài khác của tin vẫn xét.

---

### Task 1: Hàm gắn thuần

Phục vụ E1, E2, E3 · `independent: false`

**Files:**
- Create: `pipeline/lib/ghep-tin-danh-muc.mjs`
- Test: `pipeline/scripts/ghep-tin-danh-muc.test.mjs`
- Create: `_acceptance/ghep-tin-vao-danh-muc/probes/ham-gan.sh`

**Interfaces:**
- Produces:
  - `RULE = { cot: 'ghep-toa-cot', cotChuan: 'ghep-toa-cot-chuan', chuModel: 'ghep-toa-chu-model', model: 'ghep-toa-model' }`
  - `NGUON_BAT: string[]` (mặc định cả bốn `rule_id`)
  - `dungDanhBa({ toa: {key, upi, vung_id, ten: string[]}[], vung: {id, cha_id, ten: string[]}[] }) → DanhBa`
  - `xetBai({ cot: string[], chu: string|null, banDoc: {building?, subzone?, multi_unit?, label_id, model}|null }, danhBa) → { muc: 'toa'|'vung', nguon: 'A'|'B'|'C'|'D'|'F'|'G', rule_id, k, can_cu } | { ly_do }`
  - `gopTin(ketQua[], danhBa) → { status: 'gan'|'xung_dot'|'chua_gan', muc?, k? }`

- [ ] **Step 1: Viết test đỏ** theo ma trận AC-1, AC-2, AC-3, một `test()` mỗi ô, tên ô là tên test. Lý do không gắn dùng đúng chuỗi: `mo-ho`, `ngoai-danh-ba`, `chu-nhieu-toa`, `bai-nhieu-can`, `chu-model-khac`, `chi-luat`, `trich-khong-co-ten`, `chu-nhieu-vung`, `khong-neu`. Thêm năm ca của Review Focus (1, 2, 3) và ca `gopTin` của AC-5.
- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `cd pipeline && node --test scripts/ghep-tin-danh-muc.test.mjs`
Expected: FAIL vì chưa có mô-đun.

- [ ] **Step 3: Viết `pipeline/lib/ghep-tin-danh-muc.mjs`** theo đúng thứ tự bảy bước của design §3. Khớp ô tên toà dùng `chuanHoaTenToa`; chuẩn hoá cách viết (nguồn B) là bỏ dấu chấm, rồi lấy phần trước dấu chấm đầu tiên. Đọc chữ dùng mẫu có biên của nguyên mẫu `do-theo-bai-2.mjs` (`(?<![A-Z0-9.])…(?![A-Z0-9]|\.[A-Z0-9])`). Phép kiểm tên trong đoạn trích so hai chuỗi đã bỏ dấu, chỉ giữ `A-Z0-9`, tên từ 2 ký tự.
- [ ] **Step 4: Chạy, xác nhận xanh** bằng lệnh Step 2. Expected: mọi ca PASS.
- [ ] **Step 5: Viết `probes/ham-gan.sh`**: chạy test, rồi chạy hai bản đột biến trên bản sao tạm của lib (chọn toà đầu ở ô `mo-ho`; nhận căn cứ `kien_thuc_nghe`; bỏ phép kiểm tên trong đoạn trích; bỏ lọc dự án). Mỗi đột biến phải làm đỏ đúng ca, thông điệp ghim tên ô hoặc mã bài.
- [ ] **Step 6: Commit** `feat(pipeline): PL20 hàm gắn tin vào toà, vùng của danh bạ`

### Task 2: Đọc dữ liệu và chạy khô

Phục vụ E8 (phần đếm), đầu vào của Task 3, 4, 7 · `independent: false`

**Files:**
- Create: `pipeline/lib/ghep-tin-danh-muc-doc.mjs`
- Create: `pipeline/scripts/ghep-tin-danh-muc-do.mjs`
- Test: `pipeline/tests/ghep-tin-danh-muc-doc.itest.mjs`

**Interfaces:**
- Consumes: `dungDanhBa`, `xetBai`, `gopTin` (Task 1).
- Produces:
  - `docDauVao(client) → { tin: {offer_id, kind, du_an, post_ids}[], bai: Map<post_id, {cot, chu, banDoc}>, danhBa: Map<du_an, DanhBa> }`
  - `tinhGan(dauVao, { nguonBat = NGUON_BAT } = {}) → { ketQuaBai: Map<post_id, KetQua>, theoTin: Map<offer_id, {status, muc, k, nguon}>, dem }`

- [ ] **Step 1: Viết itest đỏ** trên DB của riêng lượt, cấy trong `BEGIN … ROLLBACK`: Review Focus 4 (bí danh nghỉ không vào bảng tên), Review Focus 5 (bài mất dòng stg), bài thử bị gạt bằng `testMarker`, chỉ nhận bản đọc đúng `prompt_version`.
- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `bash db/db-thu.sh oneinvest_suite_pl20 --chay node --test pipeline/tests/ghep-tin-danh-muc-doc.itest.mjs`
Expected: FAIL vì chưa có mô-đun.

- [ ] **Step 3: Viết lib và script**. Script `ghep-tin-danh-muc-do.mjs --chi-doc` mở phiên `default_transaction_read_only = on`, in tử số, mẫu số, tách theo khu, mức, nguồn, lý do chưa gắn.
- [ ] **Step 4: Chạy itest, xác nhận xanh**, rồi đo trên DB máy thu chỉ đọc.

Run: `cd pipeline && node scripts/ghep-tin-danh-muc-do.mjs --chi-doc`
Expected: tỉ lệ lệch không quá 0,5 điểm so với 46,4% của design §2 (dữ liệu tăng theo ngày).

- [ ] **Step 5: Commit** `feat(pipeline): PL20 đọc dữ liệu và chạy khô bước gắn`

### Task 3: Danh sách và gói lệnh đọc bù

Phục vụ E11 · `independent: false`

**Files:**
- Create: `pipeline/scripts/ghep-tin-danh-muc-doc-bu.mjs`
- Test: `pipeline/scripts/ghep-tin-danh-muc-doc-bu.test.mjs`
- Create: `_acceptance/ghep-tin-vao-danh-muc/probes/doc-bu.sh`
- Create: `_acceptance/ghep-tin-vao-danh-muc/goi-lenh-doc-bu.md`

**Interfaces:**
- Consumes: `docDauVao`, `tinhGan` (Task 2).
- Produces: `chonBaiDocBu(dauVao, ketQua) → post_id[]`; tệp `pipeline/eval-sets/pl20-doc-bu-<sha12>.json` dạng `{ sha256, so_bai, post_ids }`, băm bằng `bamDong` của `pipeline/label-dong-bang.mjs`.

- [ ] **Step 1: Viết test đỏ** cho `chonBaiDocBu`: tin đã gắn, tin đã có bản đọc, tin ngoài hai khu, bài thử đều bị loại; mỗi tin đúng một bài, bài chữ dài nhất; hai lượt cùng dữ liệu ra cùng băm.
- [ ] **Step 2: Chạy, xác nhận đỏ.** Run: `cd pipeline && node --test scripts/ghep-tin-danh-muc-doc-bu.test.mjs`
- [ ] **Step 3: Viết script** với hai lệnh: `--lap` (chỉ đọc, ghi tệp đóng băng) và `--kiem <tệp> [--run-id <id>]` (đối chiếu danh sách với phép đếm SQL độc lập; khi có `run_id` thì cộng tiền và kiểm mọi dòng thuộc danh sách).
- [ ] **Step 4: Chạy test xanh**, viết `probes/doc-bu.sh` kèm hai chiều đỏ (cấy bài thử, cấy tin đã gắn vào bản sao danh sách, lệnh thoát 1 và ghim mã bài).
- [ ] **Step 5: Viết `goi-lenh-doc-bu.md`** gồm: chạy thử số đếm, sao lưu, lệnh ghi, cách lùi, lệnh kiểm sau, ước chi phí, lời Mạnh và dòng sổ quyết định phủ lượt này. Lượt chia hai nấc:
  - Nấc 1, thử 20 bài: `doc-gop-s03.ts chay --post <20 id> --tran-usd 0.10 --run-id pl20-doc-bu-thu`. Dừng cả lô khi quá 2 bài hỏng JSON hoặc tiền trung bình quá 0,004 USD mỗi bài.
  - Nấc 2, cả lô: `--tran-usd 5 --run-id pl20-doc-bu-1`.
- [ ] **Step 6: Commit** `feat(pipeline): PL20 danh sách đọc bù đóng băng và gói lệnh`, rồi gửi gói cho giám sát bằng `yeu-cau khac --chan`; chờ `tra-loi` bằng lệnh nền.

### Task 4: Lát nhãn và đóng băng đầu ra máy

Phục vụ E9 · `independent: false` · chạy sau khi lượt đọc bù xong

**Files:**
- Create: `pipeline/scripts/ghep-tin-danh-muc-lat-nhan.mjs`
- Test: `pipeline/scripts/ghep-tin-danh-muc-lat-nhan.test.mjs`
- Create: `_acceptance/ghep-tin-vao-danh-muc/goi-lenh-lat-nhan.md`

**Interfaces:**
- Consumes: `docDauVao`, `tinhGan` (Task 2).
- Produces: `rutMau(ketQua, { seed, co = 110 }) → { ref_id, stratum: 'n1'|'n2'|'n3', k, muc, nguon, offer_id }[]`; tệp `pipeline/eval-sets/hai-khu-ghep-b-dau-ra-<sha12>.json`.

- [ ] **Step 1: Viết test đỏ** cho `rutMau`: mỗi tin một bài, không trùng `text_hash` (ràng buộc `UNIQUE (lat, text_hash)`), không lấy bài của lát `hai-khu-ghep`, đúng 110 bài mỗi nhóm, cùng hạt giống ra cùng mẫu, nhóm thiếu bài thì báo số thiếu.
- [ ] **Step 2: Chạy, xác nhận đỏ.** Run: `cd pipeline && node --test scripts/ghep-tin-danh-muc-lat-nhan.test.mjs`
- [ ] **Step 3: Viết script** `--rut --seed pl20-b-1` (chỉ đọc, ghi tệp đóng băng) và `--nap <tệp>` (chèn `eval_label_items`: `lat = 'hai-khu-ghep-b'`, `split = 'test'`, `stratum` theo nhóm, `draft` NULL, `double_label = false`; chạy lại không nhân dòng).
- [ ] **Step 4: Chạy test xanh**, nạp thử trên DB thử, mở `/ops/labels?lat=hai-khu-ghep-b` ở preview :3456 trỏ DB thử, xác nhận biểu mẫu có ô Phân khu và không có nháp.
- [ ] **Step 5: Viết `goi-lenh-lat-nhan.md`** theo khuôn năm thứ của Task 3, commit `feat(pipeline): PL20 lát nhãn ba nhóm nguồn`, gửi giám sát.

### Task 5: Lệnh chấm chất lượng

Phục vụ E9, E10 · `independent: false`

**Files:**
- Create: `pipeline/scripts/ghep-tin-danh-muc-cham.mjs`
- Test: `pipeline/scripts/ghep-tin-danh-muc-cham.test.mjs`
- Create: `_acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh`

**Interfaces:**
- Consumes: `wilsonDuoi(dung, n)` của `pipeline/lib/eval-classify.mjs`; `bamDong` của `pipeline/label-dong-bang.mjs`; `dungDanhBa`, `xetBai`.
- Produces: `quyNhan({ building, subzone }, danhBa) → { toa?, vung? }`; `chamBai(mayGan, nhan, danhBa) → boolean`; `chamNhom(dong[]) → { n, dung, wilson, dat, theo_nguon, theo_muc, theo_khu }`.

- [ ] **Step 1: Viết test đỏ** theo luật quy nhãn của design §4: máy gắn toà đúng khi người ghi đúng toà đó; máy gắn vùng đúng khi người ghi đúng vùng đó hoặc một toà trong vùng đó; không quy được hoặc «không nêu» là sai. Thêm hai chiều trên cùng fixture: 110 bài đúng hết thì đạt, đổi hai nhãn của một nhóm thì đúng nhóm đó đỏ, đổi một nút trong tệp đóng băng thì đỏ vì băm.
- [ ] **Step 2: Chạy, xác nhận đỏ.** Run: `cd pipeline && node --test scripts/ghep-tin-danh-muc-cham.test.mjs`
- [ ] **Step 3: Viết script** đọc nhãn thô từ `eval_labels`, kiểm băm tệp đóng băng, chạy lại `xetBai` của mã cuối trên từng bài và đỏ khi khác đầu ra đóng băng, ghi `evidence/cham-tap-test.md`. N1, N2 phải đạt; N3 chưa chấm hoặc hụt thì in dòng «D, G phải tắt», không đỏ.
- [ ] **Step 4: Chạy test xanh**, viết `probes/cham-tap-test.sh`, commit `feat(pipeline): PL20 lệnh chấm ba nhóm nguồn`.

### Task 6: Migration 117 và view `offer_building`

Phục vụ E4, E5 · `independent: false` · **chờ DA40 vào main**

**Files:**
- Create: `db/migrations/117_ghep_toa_tren_tin.sql`
- Modify: `pipeline/mappings.yaml` (trục `assertion_field`), `pipeline/lib/vocab.generated.mjs`, `app/src/lib/vocab.generated.ts`, `agent/src/vocab.generated.ts`, `CONTEXT.md`
- Test: `pipeline/tests/ghep-tin-danh-muc-117.itest.mjs`
- Create: `_acceptance/ghep-tin-vao-danh-muc/probes/migration.sh`, `probes/xung-dot.sh`

**Interfaces:**
- Produces: trường `universal_property_id`; view `offer_building(offer_id, status, muc, building_key, upi, subzone_node_id, n_posts)` với `status ∈ {'gan', 'xung_dot'}`.

- [ ] **Step 1: Nhận main** (`git fetch origin && git merge origin/main`), xác nhận `db/migrations/113_*` có mặt.
- [ ] **Step 2: Viết itest đỏ** cho AC-4 (hai mức, bốn `rule_id`, bốn trường của 113 vẫn ghi được, DB từ chối UPI lạ, toà ngừng hoạt động, resource khác `Property`) và AC-5 (năm ô, dòng của `rule_id` khác không vào view).
- [ ] **Step 3: Viết migration bằng skill `/new-migration`**: chép nguyên danh sách trường của 113, thêm `universal_property_id`; thay thân `field_assertions_vat_the_082` giữ nguyên luật 113, thêm luật của trường mới; dựng view theo khuôn `offer_project`; quan hệ toà thuộc vùng đọc từ `v_toa_nut_vung` (nút hiệu lực của DA36), không đọc cột gốc `buildings.region_node_id`. Thêm mã vào `mappings.yaml` với `dd_lookup: UniversalPropertyId`, chạy `node pipeline/vocab.mjs --write`.
- [ ] **Step 4: Chạy itest xanh.**

Run: `bash db/db-thu.sh oneinvest_suite_pl20 --chay node --test pipeline/tests/ghep-tin-danh-muc-117.itest.mjs`
Expected: PASS; `node pipeline/vocab.mjs --check` thoát 0.

- [ ] **Step 5: Viết hai probe** kèm chiều đỏ, commit `feat(db): PL20 migration 117 trường toà trên tin và view offer_building`.

### Task 7: Ghi phát biểu và nối vào lượt nạp

Phục vụ E6, E7 · `independent: false`

**Files:**
- Create: `pipeline/lib/ghep-tin-danh-muc-ghi.mjs`
- Modify: `pipeline/transform-zalo.mjs:1114-1129` (`main`, sau COMMIT)
- Test: `pipeline/tests/ghep-tin-danh-muc-ghi.itest.mjs`
- Create: `_acceptance/ghep-tin-vao-danh-muc/probes/chay-lai.sh`, `probes/khong-pha.sh`

**Interfaces:**
- Consumes: `docDauVao`, `tinhGan` (Task 2); `writeAssertions` của `pipeline/lib/assert.mjs`; migration 117 (Task 6).
- Produces: `dongPhatBieu(ketQuaBai) → row[]`; `ghiGan(client, dong) → { chen, rut }`; `buocGhepToa(client, { log = console.warn } = {}) → Promise<void>` (không bao giờ ném).

- [ ] **Step 1: Viết itest đỏ**: lượt hai 0 chèn 0 rút; sáu ca đổi dữ liệu của AC-6; tắt một nguồn chỉ rút dòng của nguồn đó; thiếu 117 và lỗi khi ghi đều in đúng một dòng `JOB WARN [ghep-toa]`.
- [ ] **Step 2: Chạy, xác nhận đỏ.** Run: `bash db/db-thu.sh oneinvest_suite_pl20 --chay node --test pipeline/tests/ghep-tin-danh-muc-ghi.itest.mjs`
- [ ] **Step 3: Viết lib**. `ghiGan` rút dòng sống của bốn `rule_id` không còn trong `dong`, rồi chèn dòng mới, trong một giao dịch có `pg_try_advisory_xact_lock(hashtext('ghep-toa'))`; không lấy được khoá thì bỏ lượt và in cảnh báo. `statement_timeout` của giao dịch là 60 giây.
- [ ] **Step 4: Nối `buocGhepToa(client)` vào `main`** ngay sau khối COMMIT, trước `client.end()`. `runTransformZalo` không đổi.
- [ ] **Step 5: Chạy itest xanh**, đo thời lượng trên bản chép; quá 60 giây thì giới hạn `docDauVao` vào tin có bài, ô tên toà hay bản đọc đổi từ lượt trước.
- [ ] **Step 6: Viết hai probe** kèm chiều đỏ, commit `feat(pipeline): PL20 ghi phát biểu toà cuối lượt nạp S03`.

### Task 8: Đo độ phủ và phép đếm độc lập

Phục vụ E8 · `independent: false`

**Files:**
- Create: `_acceptance/ghep-tin-vao-danh-muc/probes/dem-doc-lap.mjs`, `probes/do-phu.sh`

- [ ] **Step 1: Giao một tác tử mới viết `dem-doc-lap.mjs`** chỉ từ design §3, không được đọc `pipeline/lib/ghep-tin-danh-muc*.mjs`.
- [ ] **Step 2: Viết `do-phu.sh`**: chép DB máy thu, áp 113, 118, 117, chạy bước gắn, so tử số của `offer_building` với `dem-doc-lap.mjs`, đỏ khi lệch quá 0,5% tử số hoặc dưới 50%; kiểm `dem-doc-lap.mjs` không nhập lib của hàng; cấy dòng `rule_id` khác thì tử số không đổi; gỡ phát biểu một khu ở bản sao thì thoát 1 và nêu số tin lệch.
- [ ] **Step 3: Chạy probe trên bản chép**, ghi số vào `evidence/`, commit `test(acceptance): PL20 đo độ phủ bằng phép đếm độc lập`.

### Task 9: Hồ sơ áp và tài liệu

Phục vụ Cổng Bằng chứng · `independent: false`

**Files:**
- Create: `_acceptance/ghep-tin-vao-danh-muc/ho-so-ap.md`
- Modify (xin giám sát mở bằng `yeu-cau viec-phu`): `pipeline/CLAUDE.md`, `docs/ROADMAP.md`

- [ ] **Step 1: Viết `ho-so-ap.md`** đủ năm thứ: lệnh áp (113 → 118 → 117, rồi lượt gắn đầu), số chạy thử, sao lưu trước, cách lùi (rút dòng theo bốn `rule_id`, bỏ view và trường), lệnh kiểm sau.
- [ ] **Step 2: Cập nhật tài liệu**, chạy `/verify` cho `pipeline`, commit `docs: PL20 hồ sơ áp và as-built`.
- [ ] **Step 3: Đặt `status: implemented`** ở hợp đồng khi có đủ nhãn của N1, N2, rồi chuyển S4.
