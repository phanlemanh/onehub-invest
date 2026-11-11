# S03 lên nhanh nấc 1 (phần Claude) — kế hoạch thi công

> For agentic workers: thực thi tuần tự trong phiên (Native). Steps dùng checkbox.

**Goal:** lượt nạp nhanh 15′ đặt `lock_timeout` cho ba bước transform và bỏ lượt khi đụng khoá; bảy bước đo dời sang job
mỗi giờ với cờ tự nhận trong `cloud-sync.sh`.

**Spec:** `docs/superpowers/specs/2026-11-10-s03-len-nhanh-nac-1-design.md` · hợp đồng `_acceptance/s03-len-nhanh-nac-1/`.

## Global Constraints

- Phần (b) viết trên main SAU khi PR #404 (`s03-nap-nhanh`) gộp: `git merge origin/main` trước task 3. Phần nạp (trên dòng
  «Từ đây trở xuống là làn Claude») không đổi một byte.
- Biến: `S03_LUOT_NHANH` (có sẵn từ #404), `S03_NHANH_LOCK_TIMEOUT` (mặc định `10s`). Sổ đếm
  `pipeline/logs/zalo-import-bo-luot.state`. Mã thoát khi bỏ 8 lượt liền: `75`.
- Job giờ: `scripts/cloud-sync-do.sh`; dấu `pipeline/logs/cloud-sync-do.last` (giây epoch, ghi cuối lượt khi `JOB_RC=0`);
  khoá `pipeline/logs/cloud-sync-do.lock` (thư mục, tệp `pid`); ngưỡng tươi `CLOUD_SYNC_DO_TUOI_GIAY` mặc định `7200`.
- Không sửa `scripts/lib/job-step.sh` (dùng chung); không sửa plist (làn ZCode).
- Thứ tự gộp: `bait-gap-mot-giao-dich` gộp trước hàng này.

## Review Focus

1. `PGOPTIONS` lọt sang bước nạp hay lượt 00:00 — task 3, ô E1 (1)(3).
2. Lỗi thật bị nuốt thành bỏ lượt — task 3, ô nhanh+boom của E2.
3. Job giờ chết sớm mà cloud-sync vẫn bỏ bước đo — task 1, ô FAIL_STEPS của E4 (không dấu).
4. Hai bên chạy bảy bước chồng nhau — task 2, ô khoá sống của E5.
5. `PGOPTIONS` đặt sẵn bị ghi đè — task 3, ô (4) của E1.

### Task 1: job đo mỗi giờ `scripts/cloud-sync-do.sh` — independent: true — phục vụ E4, E6

**Files:** Create `scripts/cloud-sync-do.sh`, `scripts/cloud-sync-do.test.mjs`; Modify `scripts/job-exit.test.mjs`.

- [ ] Test trước (node giả, cây tạm — khuôn `job-exit.test.mjs`): ca thứ tự bảy nhãn, ca dấu (vắng lúc gọi, sau lượt trong
  [đầu, cuối]), ca FAIL_STEPS (không dấu, mã bước hỏng đầu), ca khoá sống / khoá chết; chiều đỏ hai bản chép (dấu đầu lượt,
  dấu khi lỗi). Chạy: đỏ (tệp chưa có).
- [ ] Viết `cloud-sync-do.sh`: khuôn đầu như `cloud-sync.sh` (`ROOT`, `PATH`, `job-step.sh`), khoá `mkdir` + `pid` (PID chết
  thì gỡ; sống thì in `bỏ lượt: lượt đo trước còn chạy`, thoát 0), trap gỡ khoá, bảy `job_run cloud-sync-do <nhãn> …` đúng
  thứ tự và cờ hiện có, cuối: `[ "$JOB_RC" -eq 0 ] && date +%s > dấu`, `exit "$JOB_RC"`.
- [ ] Thêm ca `cloud-sync-do.sh` vào `job-exit.test.mjs` (bước hỏng đầu quyết mã, mỗi bước hỏng một dòng JOB FAIL).
- [ ] Chạy `node --test scripts/cloud-sync-do.test.mjs scripts/job-exit.test.mjs` → xanh. Commit.

### Task 2: cờ tự nhận trong `scripts/cloud-sync.sh` — independent: false (sau task 1) — phục vụ E5, E6

- [ ] Test trước trong `cloud-sync-do.test.mjs`: ma trận năm ô dấu (vắng · tươi · cũ 7200 · rác · khoá sống), danh sách
  nhãn đủ rút từ `git show <merge-base>:scripts/cloud-sync.sh` chạy trên cùng node giả; chiều đỏ `-le`, bỏ khoá.
- [ ] Sửa `cloud-sync.sh`: sau `push-ops-facts`, đọc dấu (số? tuổi < ngưỡng?) → tươi: in `bước đo: job giờ chạy lúc <giờ>`,
  bỏ bảy bước; không tươi: lấy khoá chung (khoá sống → `bước đo: lượt đo khác đang chạy`, bỏ), chạy bảy bước như cũ, gỡ
  khoá. Giữ nguyên chú thích từng bước.
- [ ] Chạy test + `job-exit.test.mjs` → xanh. Commit.

### Task 3: lượt nhanh — `lock_timeout` + bỏ lượt (`scripts/zalo-import-daily.sh`, nửa dưới) — independent: false (sau #404) — phục vụ E1, E2, E6

**Files:** Modify `scripts/zalo-import-daily.sh` (dưới dòng «Từ đây trở xuống là làn Claude»); Create
`scripts/zalo-import-job-nhe.test.mjs`.

- [ ] `git merge origin/main` (có #404).
- [ ] Test trước (khuôn `enrich-buoc-job.test.mjs`, node giả ghi nhãn + `PGOPTIONS`; node giả nhận `OUT_<nhãn>` để in chuỗi
  lỗi): E1 bốn ô, E2 sáu ô + hai ô thêm + ma trận đếm liền; chiều đỏ ba bản chép. Chạy: đỏ.
- [ ] Sửa nửa dưới: khi `S03_LUOT_NHANH=1` — `export PGOPTIONS="${PGOPTIONS:+$PGOPTIONS }-c lock_timeout=${S03_NHANH_LOCK_TIMEOUT:-10s}"`
  trước transform-zalo; hàm `job_run_nhanh <job> <nhãn> <lệnh…>` chép stdout+stderr của bước vào tệp tạm (vẫn in ra),
  mã ≠ 0 và tệp chứa `lock timeout`/`55P03` → in `BỎ LƯỢT [zalo-import-daily] bước <nhãn>: đụng khoá — lượt sau làm`
  lên stderr, đánh dấu bỏ lượt, trả 0; còn lại như `job_run`. Cuối phần nhanh: có bỏ lượt → đếm +1 vào sổ, đạt 8 → in
  `JOB FAIL [zalo-import-daily] đụng khoá 8 lượt liền`, `exit 75`; không bỏ lượt → sổ = 0. Lượt 00:00 đặt sổ = 0 sau
  refresh-bait-gap. Lượt 00:00 giữ `job_run` như cũ.
- [ ] Chạy test mới + `zalo-import-job`, `enrich-buoc-job`, `zalo-import-job-lan`, `s03-nap-nhanh` → xanh. Commit.

### Task 4: thước DB thật `scripts/zalo-import-job-khoa.itest.mjs` — independent: false (sau task 3) — phục vụ E3

- [ ] Cây tạm: tệp bọc thật + `job-step.sh`, `pipeline/` liên kết từng mục trừ `logs/`, `collector/snapshots` rỗng; ca khoá
  (ACCESS EXCLUSIVE trên `stg_zalo_posts`, `S03_NHANH_LOCK_TIMEOUT=2s`), đối chứng nhả khoá, chiều đỏ `=0` trần 20 s.
- [ ] Chạy `config:executors.test.zalo_import_khoa` → xanh. Commit.

### Task 5: tài liệu + bàn giao

- [ ] `docs/ops/runtime-map.md`: job đo mỗi giờ (chờ plist), cờ tự nhận, sổ đếm bỏ lượt. ROADMAP §2 as-built.
- [ ] Hợp đồng `status: implemented`; sau gộp gửi giám sát lời giao plist job giờ cho ZCode (OOS-1).
