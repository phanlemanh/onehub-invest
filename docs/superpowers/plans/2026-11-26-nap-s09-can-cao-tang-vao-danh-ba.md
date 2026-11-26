# DA43 — căn cao tầng S09 vào danh bạ: kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps dùng `- [ ]`.

**Goal:** Đưa căn cao tầng S09 (view `v_s09_db_can_cao_tang` của DA56) vào `units` của danh bạ dưới toà DA42 đã ghi bí danh,
căn trùng S16/S08 thành bí danh, không sinh căn hai khoá; ô căn S09 trên `/ops/registry` đi từ 0 vào dải 250.000–349.493.

**Architecture:** Một hàm thuần tách mã (toà từ cấu trúc, số căn và tầng từ đuôi mã), một bước dựng `buocS09Can` chạy SAU bước S16
trong `dung()` của `pipeline/danh-ba-vat-the.mjs` (S16 thắng cấu trúc), và một chỗ sửa nhỏ ở bước S16 để căn S16 đến sau khớp căn
chỉ có S09 thành bí danh (AC-8). Không bảng stg mới; đầu vào là view của DA56 + danh sách tầng gói 1 (view 115/125 của DA42).

**Tech Stack:** Node `.mjs`, `pg`, `node --test`; DB thử `taoDbThu` (`pipeline/scripts/db-thu-dbv.mjs`); bản chép DB máy thu cho E2, E10.

**Spec:** `docs/superpowers/specs/2026-11-18-nap-s09-can-cao-tang-vao-danh-ba-design.md` (§0 sửa 26/11) ·
`_acceptance/nap-s09-can-cao-tang-vao-danh-ba/{contract.md,evals.yaml,decisions.jsonl}` (Cổng Phạm vi Mạnh duyệt 26/11).

## Global Constraints

- Phụ thuộc: nhánh dựng trên `main` SAU khi DA42 (`feat/nap-s09-toa-tang-vao-danh-ba`) và DA56 (`feat/nap-s09-quy-can-va-can-cao-tang`)
  đã gộp. Trước khi chúng gộp: làm Task 1 (hàm thuần, không phụ thuộc) và viết test các task sau trên nhánh gộp tạm cả hai.
- Không migration mới, trừ khi lượt đo E10 cho thấy cần chỉ mục; khi ấy xin số GS (sổ migration), không tự lấy.
- Toà: khoá bí danh `danh-ba-toa/<meta.toaId>` (`MA_TOA` của DA42). Không đúc toà, không xoá, không gộp căn có sẵn.
- Bậc căn đúc mới: `mot_loi_khai` (Hỏi-3). Trục đúc mới cũng `mot_loi_khai`.
- Thẻ: `review_queue` `entity_match`, mã thẻ `s09-can-lech:<uuid toà>`, evidence chỉ khoá vật thể + số đếm theo loại (AC-6, AC-9).
- Câu đọc `review_queue` mới phải mang vị từ hàng chờ hoặc vào danh sách miễn DBS-AC-6 có lý do (bài học soát M5 26/11).
- Nhãn UI không đổi (hàng không có mã giao diện); số trên trang tự đổi theo `units`.
- Tầng A: tên nguồn thật không vào mã, test, log, thẻ, hồ sơ. Không viết nguyên URL DB có `user:pass@` (luật đẩy 26/11).
- Ngưỡng và dải của AC-10 lấy NGUYÊN VĂN hợp đồng: dải 250.000–349.493; mã hỏng ≤1,5%; trùng khoá ≤1,5%; tầng mã ≠ tầng item ≤8%;
  toà chưa nối + chưa trọn ≤5%; ≥90% vào ở toà đã nối và trọn; ≥90% khớp ở toà có S16/S08; sai khớp ≤1% mỗi khuôn có ≥20 cặp.

## Review Focus

1. Toà S16 có trục viết khác số căn S09 (vd S16 «A1-05», S09 `05`) — khớp theo số căn đã bỏ 0 đầu, không theo chuỗi mã.
2. Tầng chữ «12A» ở S09 trong khi S16 ghi tầng thay thế «13» — không khớp thì lên thẻ, không đúc (Hỏi-2); E10 đếm.
3. Bản thu đêm sau thêm tầng cho toà đang «chưa trọn» — lượt dựng sau đưa toà vào, không nhân căn đã có (AC-1 + AC-8).
4. Cùng một uuid căn S09 xuất hiện ở hai tầng item (nguồn liệt kê nhầm) — giữ một, đếm «trùng khoá» (AC-5).
5. Toà có cả căn S08 không trục — so mã đã chuẩn hoá trước khi coi là lệch (thiết kế §4 dòng 9).

---

### Task 1: Hàm tách mã căn S09 (AC-3, E3)

**Files:** Create `pipeline/lib/s09-can-cao-tang.mjs`, `pipeline/lib/s09-can-cao-tang.test.mjs`.

**Interfaces — Produces:**
- `tachMaCanS09(code: string, { tangItem: string }) → { ok: true, tang: string, so: string, tangTuMa: boolean, ngoaiKhuon: boolean }
  | { ok: false, lyDo: "khong-dau-tach" | "so-rong" }` — số căn: đoạn sau dấu tách cuối (`.` hoặc `_`), bỏ số 0 đầu, viết hoa; tầng:
  đoạn `[0-9]+[A-Z]?` liền trước số căn (bỏ 0 đầu), không có thì `tangItem`; `ngoaiKhuon` khi tầng không khớp `^\d+[A-Z]?$`.
- `khoaCan(building_key, tang, so) → string` = `${building_key}|${tang}|${so}`.

- [ ] Test 14 ô viết trước (danh sách ở AC-3 của hợp đồng), mỗi ô một assert; hai đột biến chiều đỏ (tách ở dấu chấm đầu; lấy toà từ mã)
  chạy bằng bản sao tệp như mẫu `banChep` của `import-s09-danh-ba.test.mjs`, đỏ nêu tên ô.
- [ ] `node --test pipeline/lib/s09-can-cao-tang.test.mjs` → đỏ; viết hàm; xanh. Commit.

### Task 2: Đầu vào bước căn — toà trọn và bộ đếm (AC-1, AC-2, E1)

**Files:** Modify `pipeline/lib/s09-can-cao-tang.mjs`; Create `pipeline/scripts/danh-ba-s09-can.itest.mjs`;
fixture `pipeline/tests/fixtures/s09-can-cao-tang/` (sinh bằng `pipeline/scripts/s09-v16-sinh-fixture.mjs` của DA56, thêm cờ chọn
mẫu khuôn mã; chuỗi thay thế như DA56, không chuỗi gốc).

**Interfaces — Produces:** `docDauVaoCan(c) → { toa: Map<toaId, { tron: boolean, lyDo?: "tang-chua-goi"|"tang-loi", can: Array<{ canId,
code, name, tangItem }> }>, dem: { du_an, toa, tang_tot, tang_rong, tang_chua_goi, can, tach_duoc, ma_hong, khoa_duy_nhat, trung_khoa } }` —
một câu đọc view `v_s09_db_can_cao_tang` (DA56) + danh sách tầng gói 1 (view DA42), nối theo uuid tầng.

- [ ] itest: DB thử `taoDbThu` áp đủ migration; nạp fixture qua `napDanhBaThuMuc` (bộ nạp DA56); ma trận năm ô AC-1, mỗi ô assert
  `tron`, `lyDo`, số căn; đột biến «coi tầng chưa gọi là trọn» đỏ ô ấy.
- [ ] Viết `docDauVaoCan`; xanh. Commit.

### Task 3: Bước dựng căn S09 (AC-4, AC-5, AC-6, AC-7)

**Files:** Create `pipeline/lib/s09-can-dung.mjs`; Modify `pipeline/danh-ba-vat-the.mjs` (gọi sau `buocS16`, cùng giao dịch);
`scripts/ops-local-dong-bang.test.mjs` (miễn DBS-AC-6 nếu có câu đọc thẻ theo mã).

**Interfaces — Produces:** `buocS09Can(c, { log, taoKhoa }) → { bi_danh, duc_moi, cho_the, toa_chua_noi, toa_chua_tron, ma_hong,
trung_khoa, the_moi, truc_moi }` (bảy phần + phụ). Thứ tự xếp phần đúng AC-10: mã hỏng → toà chưa nối → toà chưa trọn → trùng khoá
→ bí danh · đúc · thẻ.

Luật (một hàm thuần `xepCan(toa, canCo)` + phần ghi DB):
- toà không có bí danh `danh-ba-toa/<uuid>` → «toà chưa nối»; toà chưa trọn → «toà chưa trọn»; cả hai không ghi gì.
- căn đã có bí danh S09 (chạy lại) → bỏ qua, không đếm vào phần mới.
- khoá `(toà, tầng, số)` trùng trong toà → căn uuid nhỏ nhất đi tiếp, còn lại «trùng khoá».
- tìm căn có sẵn: (a) trục S16/S08 của toà có số căn = `so` và `units.floor = tang`; (b) căn không trục: mã chuẩn hoá `khoaMa` khớp.
  Khớp đúng một → thêm bí danh S09 (`ma_nguon`, giá trị `danh-ba-can/<canId>`); khớp hai → «chờ thẻ».
- không khớp: toà có căn S16/S08 → «chờ thẻ», mỗi toà MỘT thẻ `s09-can-lech:<uuid toà>` (evidence `{loai, so_lech_tang, so_khong_co}`);
  toà chỉ có S09 → đúc trục (theo `so`) + căn `mot_loi_khai`; tầng ngoài khuôn → căn không trục (`stack_key` NULL, `sub_id` = unit_key).

- [ ] itest (cùng tệp Task 2): ma trận AC-4 (3 toà), AC-5 (căn S16, S08, không trục + hai ô trùng khoá), AC-6 (lệch tầng, lệch toà;
  thẻ không mang mã căn hay tên toà — đối chứng cấy), AC-7 (căn chuẩn, tầng ngoài khuôn). Mỗi ô assert trạng thái trọn; mỗi AC một
  đột biến chiều đỏ như evals.yaml (bỏ tìm căn có sẵn; đúc khi không khớp; ép tầng ngoài khuôn; chọn theo thứ tự đọc).
- [ ] Viết `buocS09Can`, nối vào `dung()`; xanh. Commit.

### Task 4: Thứ tự nguồn và bước đêm (AC-8, E8)

**Files:** Modify `pipeline/lib/s16-dung.mjs` (trước khi đúc căn S16: tra căn chỉ-S09 cùng toà, tầng, số → bí danh, không đúc);
`pipeline/danh-ba-vat-the.mjs` (`buocVatTheDem`: chỉ gọi `buocS09Can` khi `max(fetched_at)` của kind `can-cao-tang` mới hơn mốc
lượt trước, mốc ghi ở bảng mốc dựng có sẵn — nếu không có thì xin số migration cho một dòng mốc, GS).

- [ ] itest: hai DB thử, hai thứ tự (S09 trước / S16 sau và ngược lại) → cùng tập (mã nguồn, số căn, bí danh, số thẻ); dựng thêm hai lần
  0 khoá/bí danh/thẻ mới; bước đêm không bản thu mới không gửi câu đọc view căn (đếm câu bằng bọc `c.query`). Đột biến bỏ tra S09 trong
  bước S16 → đỏ «thứ tự».
- [ ] Sửa, xanh. Commit.

### Task 5: Ranh giới không lộ nguồn (AC-9, E9)

**Files:** Test trong `danh-ba-s09-can.itest.mjs`.
- [ ] Assert danh sách đẩy `pipeline/sync-cloud.mjs` không có `stg_s09_danh_ba`, `buildings`, `stacks`, `units`; soát thẻ, log, tệp của
  hàng bằng bộ soát tầng A có sẵn (như E9 của DA42) ra 0; cấy một tên giả lập vào thẻ → bộ soát thoát khác 0, nêu bảng và cột, không in
  giá trị. Commit.

### Task 6: Lệnh đo trên bản chép DB máy thu (AC-2, AC-10, E2, E10)

**Files:** Create `pipeline/scripts/danh-ba-s09-can-that.mjs` (mẫu: `danh-ba-s09-toa-that.mjs` của DA42 và `s09-v16-that.mjs` của DA56).

- Chép DB máy thu sang DB thử (một luồng, chỉ đọc nguồn), áp 115/125/130, nạp mọi bản thu v16 qua bộ nạp DA56, dựng `dung()` đủ (DA42 +
  DA43), rồi in bảng: bước căn · bộ đếm độc lập (không import `pipeline/lib/s09*`, đọc thẳng snapshot, cùng luật tách viết lại) cho mười
  ô AC-2; bảy phần (mỗi phần một SELECT) và tổng = số căn bản thu; số căn S09 trong danh bạ, nằm trong dải; năm ngưỡng; mẫu năm khuôn
  ≤40 cặp hạt giống cố định, đối chiếu mã gốc S16 chuẩn hoá và tầng item S09 với tầng gốc S16. Chỉ in số. `--dem` chỉ đọc (lệnh kiểm
  sau áp). `--xoa-mot-can` (bớt một căn trong bản chép snapshot) → thoát 1 nêu ô «căn».
- Ba đột biến chiều đỏ E10 (bỏ một phần khỏi phép cộng; bộ tách loại mọi mã; lệch tầng +1 khi khớp) qua biến môi trường đột biến.
- [ ] Chạy khi giữ s4 (lượt nặng), trần `--tran-phut 40`. Commit kèm số.

### Task 7: Hồ sơ — config, bằng chứng màn, hồ sơ áp

**Files:** `_acceptance/config.yaml` (khoá `s09_can_ham`, `s09_can_db`, `s09_can_that`; trỏ đúng lệnh trên), sửa `cmd` của evals.yaml
cho khớp khoá; `_acceptance/nap-s09-can-cao-tang-vao-danh-ba/ap-may-thu.md` đủ năm thứ (sao lưu `units`, `stacks`, `registry_aliases`,
`review_queue`; lệnh dựng; số diễn tập từ Task 6; cách lùi theo `created_at` + khoá lượt; lệnh kiểm `--dem`); E11, E12 chụp ở S4.
Eval suite theo khuôn HT9 + paths hẹp R4.
- [ ] Soát M5 (`soat-m5`) xanh trước khi xin s4. Commit.

## Ước

Task 1–5 viết và test nhẹ trên M5: ~5–6 giờ làm. Task 6 + S4 giữ s4: ~60–90′ (lượt đo trên bản chép ≤40′ + suite theo HT9 + chấm).
