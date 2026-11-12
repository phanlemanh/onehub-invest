# Sao lưu ngoài máy mã hoá (`sao-luu-ma-hoa-b2`) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native, đã chọn) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng `scripts/sao-luu-ngoai-may.sh` (chay · kiem · kiem-db · khoi-tao · soat-khoa) trên restic. Chứng minh nó trên cây giả và kho restic cục bộ. Nối dòng «Sao lưu ngoài máy» vào `check-freshness`.

**Architecture:**
- Mọi logic nằm ở một module Node: `scripts/lib/sao-luu-ngoai-may.mjs`. Bash chỉ là lối vào cho launchd.
- Đường dẫn và lệnh ngoài đều đổi được qua biến môi trường. Nhờ đó test chạy trọn trên thư mục tạm, keychain tạm và restic giả hay restic thật.
- `check-freshness` đọc tệp trạng thái qua một hàm của module.

**Tech Stack:**
- Node ESM, `node:test`.
- restic, cài bằng Homebrew (Mạnh duyệt ở Cổng Phạm vi).
- macOS `security` cho Keychain.
- Postgres :5433 qua `docker exec` (như `db-sao-luu.sh`).

**Spec:** `docs/superpowers/specs/2026-11-11-sao-luu-ma-hoa-b2-design.md` · hợp đồng `_acceptance/sao-luu-ma-hoa-b2/contract.md` · `evals.yaml`.

## Global Constraints

- Không lệnh nào trong test hay mã chạm `b2:`/`s3:`. Không nạp launchd, không tạo plist. Không đụng Keychain đăng nhập: test dùng keychain tạm qua `SAO_LUU_KEYCHAIN_TEP`.
- Khoá và mật khẩu không vào stdout, stderr, log, tệp trạng thái hay kho. Lỗi chỉ nêu TÊN biến hoặc tên tệp.
- Không in tên tệp thật của `collector/state` hay `collector/snapshots`, vì tên có thể mang tên nguồn thật (tầng A). Kiểm kê chỉ in số đếm.
- Không dump DB `oneinvest` trong test. E6 tự dựng và xoá DB nguồn `oneinvest_u1_saoluu_*`.
- Mã thoát:
  - 0 ok;
  - 1 lỗi bước (dump, backup, kiem lệch);
  - 3 thiếu tệp xác nhận;
  - 4 cấu hình sai quyền hay nằm trong kho;
  - 5 thiếu restic;
  - 6 Keychain thiếu mục.
- SLO 36 giờ. Giữ `--keep-daily 7 --keep-weekly 4 --keep-monthly 6`.
- Luật loại trừ chỉ dưới `collector/state/`: `session|cookie|profile|qr|token|auth|credential|\.key$|\.pem$` (không phân biệt hoa thường). Toàn cây chỉ loại `node_modules`, `dist`, `.cache`.
- Chạy nặng tuân luật máy yên của đợt: chỉ test riêng tệp của hàng; bộ đầy đủ đợi giám sát báo máy trống.

## Review Focus

1. Đường có dấu cách hay ký tự lạ (ví dụ thư mục tạm macOS `/var/folders/...`). Mọi lời gọi restic dùng `spawn` với mảng đối số, không ghép chuỗi shell. Test T2 dựng cây giả có tệp tên chứa dấu cách.
2. restic in tiến độ hay cảnh báo ra stderr khi chạy `--json`. Việc đọc `summary` chỉ lấy dòng JSON có `message_type == "summary"`. Test T2 dùng restic thật.
3. Hai lượt `chay` chồng nhau (launchd chạy lại khi lượt cũ còn chạy). Lượt sau thấy khoá kho của restic thì ghi `loi` với `buoc_loi: backup`, không xoá dump của lượt trước. Thư mục dump do mỗi lượt tự `mkdtemp`. Test T2 C16.
4. Tệp trạng thái hỏng (JSON dở do mất điện). `docTrangThaiSaoLuu` coi đó là `loi` và trả xấu, không ném lỗi. Test T5 C12e.
5. Đồng hồ máy lùi, khiến `lan_ok_cuoi` nằm ở tương lai. Coi tuổi âm là tuổi 0, không xấu. Test T5 C12f.

---

### Task 0: Cài restic và kiểm kê `collector/state` bằng số đếm

**independent: false** · phục vụ: điều kiện của E3–E6, E10; số liệu cho giới hạn `[CE chưa kiểm chứng]`.

- [ ] Chạy `brew install restic`. Kiểm `restic version` in số phiên bản.
- [ ] Chạy lệnh đếm một lần, chỉ in số, không lưu tệp. Lệnh đếm số tệp dưới `collector/state` của checkout chính:
  - theo đuôi;
  - theo từng từ của luật loại trừ;
  - số tệp không khớp luật mà đuôi là `.json`, `.sqlite` hay không đuôi.

  Ghi số vào dòng sổ `fix` stage S3, không ghi tên tệp.

### Task 1: Cấu hình, bước chặn, lối vào

**Files:**
- Create: `scripts/lib/sao-luu-ngoai-may.mjs`
- Create: `scripts/sao-luu-ngoai-may.sh`
- Create: `scripts/sao-luu-ngoai-may.test.mjs`

**independent: false** · phục vụ E1, E2.

**Interfaces — Produces:**
- `docCauHinh({ env = process.env, home = os.homedir(), goc = <gốc kho suy từ vị trí tệp> }) -> CauHinh`:
  - `CauHinh = { tepCauHinh, thuMuc, tepXacNhan, tepTrangThai, keychainMuc, keychainTep|null, khoAnh, gocNguon, lenhDump: string[], restic }`;
  - biến môi trường và mặc định:
    - `SAO_LUU_CAU_HINH` (`~/.oneinvest/b2.env`);
    - `SAO_LUU_THU_MUC` (`~/.oneinvest/sao-luu`), chứa `da-cat-khoa` và `trang-thai.json`;
    - `SAO_LUU_KEYCHAIN_MUC` (`onehub-restic`);
    - `SAO_LUU_KEYCHAIN_TEP`;
    - `SAO_LUU_KHO_ANH`;
    - `SAO_LUU_GOC_NGUON` (gốc chứa `collector/`, mặc định gốc kho);
    - `SAO_LUU_LENH_DUMP` (mặc định `bash <gốc>/scripts/db-sao-luu.sh`), nhận thư mục đích làm đối số cuối;
    - `SAO_LUU_RESTIC` (mặc định `restic` trên PATH).
- `kiemTruoc(cfg, { lenh: "chay"|"khoi-tao" }) -> { ma: 0|3|4|5|6, lyDo: string }`, theo đúng thứ tự:
  - xác nhận;
  - cấu hình tồn tại, ngoài kho, `mode & 0o777 === 0o600`;
  - restic chạy được (`restic version`);
  - `security find-generic-password -s <mục> [tệp]` thoát 0.

  `khoi-tao` bỏ bước Keychain, vì nó tạo mục đó.
- `docBienCauHinh(tep) -> Record<string,string>` đọc `KEY=VALUE`. Chỉ nhận `RESTIC_REPOSITORY`, `B2_ACCOUNT_ID`, `B2_ACCOUNT_KEY`.
- `moiTruongRestic(cfg) -> { env, args }`:
  - `env` = biến của tệp cấu hình;
  - `args` = `["--password-command", "security find-generic-password -s <mục> -w [tệp]"]`.
- CLI: `node scripts/lib/sao-luu-ngoai-may.mjs <lệnh> [cờ]`. Bash `scripts/sao-luu-ngoai-may.sh` chỉ `exec node … "$@"`.

**Test fixture chung (đầu tệp test):**
- `dungMoiTruong()` tạo thư mục tạm chứa:
  - `home/.oneinvest/b2.env` (quyền 600, `RESTIC_REPOSITORY=<tạm>/kho`, khoá giả `B2KEY-CANARY-…`);
  - keychain tạm, tạo bằng `security create-keychain -p <mật khẩu tạm> <tệp>`, có mục `onehub-restic` mang mật khẩu giả `RPW-CANARY-…`;
  - cây giả `goc/collector/{snapshots,state}`.
- `resticGia(thuMuc)` sinh một tệp chạy được ghi mỗi lời gọi (argv) vào `goi.log`, trả về đường. Ca thật dùng `restic` của máy.

- [ ] **Bước 1: viết test hỏng.** Ca `C1 chay thiếu xác nhận`:

  ```js
  r.code === 3
  goi(restic).length === 0
  !existsSync(<thư mục dump>)
  ```

  - `C1+` cùng fixture: có xác nhận → `goi(restic).some(a => a.includes("backup"))`.
  - `C13 khoi-tao thiếu xác nhận`: `r.code === 3`, 0 lời gọi, `security find-generic-password` trên keychain tạm thoát ≠0.
  - `C13+`: có xác nhận → có lời gọi `init`.
  - `C2 quyền 644` → 4, stderr chứa `600`.
  - `C3 cấu hình trong gốc kho` → 4, stderr chứa `ngoài kho`.
  - `C4 SAO_LUU_RESTIC=/khong/co` → 5.
  - `C5 keychain không có mục` → 6.
  - Mọi ca: `stdout + stderr` không chứa `B2KEY-CANARY` hay `RPW-CANARY`.
  - Mỗi assert mang thông điệp ghim mã ca.
- [ ] **Bước 2:** `node --test scripts/sao-luu-ngoai-may.test.mjs` → FAIL (module chưa có).
- [ ] **Bước 3:** viết `docCauHinh`, `kiemTruoc`, `docBienCauHinh`, `moiTruongRestic`, CLI `chay`/`khoi-tao` gọi `kiemTruoc` trước mọi việc.
  - `khoi-tao`:
    - sinh 32 byte ngẫu nhiên base64;
    - `security add-generic-password -s <mục> -a onehub -w <mk> [tệp]`; mật khẩu đi qua đối số của `security`, nên test đọc lại bằng keychain tạm, không in;
    - `restic init`;
    - in lời dặn chép bản cất riêng (không kèm mật khẩu).
- [ ] **Bước 4:** lệnh ở bước 2 → PASS các ca C1–C5, C13.
- [ ] **Bước 5:** phá thử. Tạm đảo thứ tự cho `kiemTruoc` gọi restic trước xác nhận → C1 đỏ với thông điệp «C1». Hoàn lại.
- [ ] **Bước 6:** commit `feat(sao-luu-ma-hoa-b2): cấu hình, bước chặn, lối vào`.

### Task 2: `chay` — nguồn, loại trừ, dump, backup, giữ, trạng thái

**Files:** Modify `scripts/lib/sao-luu-ngoai-may.mjs`, `scripts/sao-luu-ngoai-may.test.mjs`

**independent: false** · phục vụ E3, E4, E7, E9 (phần trạng thái), E10.

**Interfaces — Produces:**
- `LUAT_LOAI_TRU_STATE = /(session|cookie|profile|qr|token|auth|credential|\.key$|\.pem$)/i` và `LOAI_TRU_TOAN_CAY = ["node_modules", "dist", ".cache"]`.
- `nguonSaoLuu(cfg) -> { duong: string[], khoAnh: "co"|"chua_co" }` gồm:
  - `collector/snapshots`;
  - `collector/state`;
  - `khoAnh` nếu tồn tại.
- `taoTepLoaiTru(cfg, thuMucTam) -> string`:
  - duyệt `collector/state`, ghi đường tuyệt đối của từng tệp hay thư mục khớp luật;
  - cộng các mẫu `**/<tên>` của `LOAI_TRU_TOAN_CAY`.
- `chay(cfg, { luc = new Date() } = {}) -> Promise<{ ma, trangThai }>`. Các bước theo design §5:
  - `mkdtemp` ngoài kho;
  - dump bằng `cfg.lenhDump`;
  - `dump_sha256` = `{ <tên tệp>: <sha256> }` của mọi tệp trong thư mục dump;
  - `restic backup --json --tag onehub-may-thu --exclude-file … <nguồn…> <thư mục dump>`;
  - đọc dòng `message_type == "summary"`;
  - `restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune`;
  - ghi trạng thái;
  - xoá thư mục dump.
- `ghiTrangThai(cfg, obj)` ghi nguyên tử (tệp tạm rồi `rename`). Trường:
  - `lan_chay`, `ket_qua`, `buoc_loi`;
  - `snapshot_id`, `luc_snapshot`;
  - `so_tep`, `so_byte`, `byte_moi`;
  - `kho_anh`, `dump_sha256`, `lan_ok_cuoi`;
  - `kiem_cuoi` (giữ từ lần trước).
- Cờ test `--luc <ISO>` truyền `--time` cho `restic backup`, chỉ để dựng lịch sử C9.

**Cây giả:**
- `collector/snapshots`: 80 tệp, trong đó có `chat_profile.json`, `author.json`, `qrcode_listing.json`, `session_log.jsonl`, `tệp có dấu cách.json` và một tệp chứa chuỗi canh `PLAINTEXT-CANARY-…`.
- `collector/state`: `ok-1.json`, `ok-2.sqlite`, `zalo-session.json`, `cookies.txt`, `browser-profile/x`, `login-qr.png`, `api-token.json`, `id.key`.
- Dump giả: `SAO_LUU_LENH_DUMP` = một script ghi `a.dump`, `so-dong.tsv` vào đối số cuối.

- [ ] **Bước 1: viết test hỏng.**
  - `C7`: tập `restic ls latest` (lọc tệp) = tập cây giả trừ ĐÚNG sáu tệp state gài khớp luật, viết tay trong mảng `KY_VONG_LOAI = [...]`, không suy từ regex. `trangThai.so_tep` = số tệp kỳ vọng. `so_byte` = tổng cỡ. `kho_anh === "chua_co"`. `r.ma === 0`. Thư mục dump đã xoá.
  - `C15`: năm tệp snapshot mang từ của luật có trong `restic ls`. Đột biến: cờ ẩn `_dotBien: "ap-toan-cay"` áp luật lên snapshots → ca đỏ «C15».
  - `C8`: chạy lại không đổi → `byte_moi < 0.01 * byte_moi lần đầu`.
  - `C6`: lệnh dump thoát 1 → `ma === 1`, `ket_qua === "loi"`, `buoc_loi === "dump"`, restic giả không có lời gọi `backup`.
  - `C9`: 12 lượt `--luc` (ngày 2026-05-01 … đã viết sẵn) rồi forget → tập ngày còn lại bằng mảng `NGAY_GIU` viết tay.
  - `C16`: giữ khoá kho bằng `restic lock` trong tiến trình con → `chay` trả `ma 1`, `buoc_loi "backup"`.
  - `AC-4`: không tệp nào dưới `<kho>/data/**` chứa chuỗi canh. Đối chứng: chuỗi canh có trong cây nguồn. `restic restore` với `RESTIC_PASSWORD=sai` thoát ≠0.
  - `AC-7`: nội dung tệp trạng thái không chứa `B2KEY-CANARY`, `RPW-CANARY`, đường kho, chuỗi `RESTIC_REPOSITORY`. Có đủ trường. Lượt lỗi có `buoc_loi`.
- [ ] **Bước 2:** chạy → FAIL.
- [ ] **Bước 3:** cài các hàm ở Interfaces. Mọi lời gọi qua `spawn(cfg.restic, mảng, { env: {...process.env, ...env} })`.
- [ ] **Bước 4:** chạy → PASS.
- [ ] **Bước 5:** phá thử. Bỏ `--exclude-file` → C7 đỏ «C7». Hoàn lại.
- [ ] **Bước 6:** commit.

### Task 3: `kiem` và `kiem-db`

**Files:**
- Modify: lib và test
- Create: `scripts/sao-luu-ngoai-may.itest.mjs`

**independent: false** · phục vụ E5, E6.

**Interfaces — Produces:**
- `kiem(cfg, { hatGiong = Date.now(), soTep = 50, tyLeDoc = "5%" }) -> Promise<{ ma, soTep, khop, lech: string[], thongDiep }>`. Các bước theo design §6:
  - `restic check --read-data-subset=<tyLe>`;
  - chọn tệp bằng PRNG có hạt giống trên `restic ls latest`, chỉ phần `collector/snapshots`;
  - lấy mọi tệp dưới thư mục dump của bản;
  - `restic restore latest --include …` vào `mkdtemp`;
  - so tệp snapshot với đĩa, tệp dump với `trangThai.dump_sha256`. Trạng thái phải cùng `snapshot_id` với `latest`; lệch hay thiếu → `ma 1` «không có mốc sha256 cho bản dump»;
  - ghi `kiem_cuoi`.
- `kiemDb(cfg, { dbUrlMau }) -> Promise<{ ma, bangLech: string[] }>`:
  - khôi phục thư mục dump của `latest`;
  - `CREATE DATABASE oneinvest_u1_saoluu_<ngẫu nhiên>`;
  - `pg_restore` qua container phụ cùng cách `db-sao-luu.sh` (`docker run --rm --network container:<C>`);
  - đếm số dòng bằng `DEM_SQL` RÚT từ văn bản `scripts/db-sao-luu.sh` (hàm `rutDemSql()` đọc khối `DEM_SQL="…"`, không chép tay);
  - so `so-dong.tsv`;
  - `DROP DATABASE` trong `finally`.

- [ ] **Bước 1: viết test hỏng.**
  - `C10` (kho dựng bằng chính `chay`): `ma 0`, `soTep >= 50 + số tệp dump`, `lech.length === 0`.
  - `C11`: ghi đè 16 byte giữa một tệp dưới `<kho>/data/` → `ma 1`, `thongDiep` khớp `/check/`.
  - `C14`: thay `dump_sha256["a.dump"]` trong trạng thái bằng băm sai → `ma 1`, thông điệp chứa `a.dump`.
  - `C14b`: xoá `dump_sha256` → `ma 1` «không có mốc».
  - `itest E6`:
    - dựng DB nguồn `oneinvest_u1_saoluu_src_<rnd>` (2 bảng, 3 và 5 dòng);
    - `SAO_LUU_LENH_DUMP` = script `pg_dump -Fc` DB đó, cộng `so-dong.tsv` bằng `rutDemSql()`;
    - `chay` → `kiemDb` → `ma 0`, `bangLech = []`, DB đích không còn (`pg_database`);
    - sửa `so-dong.tsv` lệch một dòng trước `chay` → `ma 1`, `bangLech` chứa tên bảng;
    - `after()` xoá DB nguồn.
- [ ] **Bước 2:** FAIL.
- [ ] **Bước 3:** cài.
- [ ] **Bước 4:** `node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs scripts/sao-luu-ngoai-may.itest.mjs` → PASS.
- [ ] **Bước 5:** phá thử. Cho `kiem` so dump với chính tệp khôi phục (kho với kho) → C14 đỏ «C14». Hoàn lại.
- [ ] **Bước 6:** commit.

### Task 4: `soat-khoa` và quét ranh giới

**Files:** Modify lib và test.

**independent: false** · phục vụ E4 (phần quét lệnh tải), E9, E11.

**Interfaces — Produces:**
- `soatKhoa(cfg, { duong: string[] }) -> { ma: 0|1, tep: string[] }`:
  - giá trị lấy từ tệp cấu hình (`B2_ACCOUNT_ID`, `B2_ACCOUNT_KEY`) và Keychain (`-w`);
  - bỏ giá trị ngắn dưới 8 ký tự;
  - quét tệp văn bản dưới các đường;
  - mặc định quét:
    - `git ls-files` cộng `git ls-files -o --exclude-standard` của gốc kho;
    - `_acceptance/`;
    - `cfg.thuMuc`;
    - thư mục log `~/Library/Logs/onehub` nếu có.
  - Chỉ trả đường.
- `quetRanhGioi({ base, thuTenNguon = false }) -> { sync_cloud_doi, collector_doi, plist, launchctl, kho_tu_xa_trong_test, lenh_tai_khac, ten_nguon }`:
  - đọc `git diff --name-only <base>...HEAD` cùng tệp chưa theo dõi của hàng;
  - `lenh_tai_khac` đếm `curl|rclone|aws |scp |rsync|b2 ` ngoài dòng comment trong `scripts/sao-luu-ngoai-may.sh` và lib;
  - `ten_nguon` đọc tên thật từ `source_registry` local qua psql (chỉ trong bộ nhớ), đếm dòng thêm chứa tên đứng riêng như một từ, in đường tệp;
  - `--thu-ten-nguon` gài một tệp giả tạm để tự đỏ.
  - CLI `--ranh-gioi` in `k=v` một dòng, mã 1 khi có số nào khác 0.

- [ ] **Bước 1: viết test hỏng.**
  - `E9`:
    - sau `chay` với khoá giả, `soatKhoa` trên `{thuMuc, log tạm}` → `ma 0`;
    - gài tệp chứa `B2KEY-CANARY` → `ma 1`, `tep` có đường đó, stdout CLI không chứa giá trị.
  - `E4-quet`: bản sao tạm của tệp `.sh` thêm `curl x` → `lenh_tai_khac === 1`. Tệp thật → 0.
- [ ] **Bước 2–4:** FAIL → cài → PASS.
- [ ] **Bước 5:** chạy `node scripts/lib/sao-luu-ngoai-may.mjs --ranh-gioi --base origin/main` → mọi số 0, mã 0. Chạy `--thu-ten-nguon` → mã 1.
- [ ] **Bước 6:** commit.

### Task 5: Dòng «Sao lưu ngoài máy» trong `check-freshness`

**Files:** Modify `scripts/check-freshness.mjs`, `scripts/check-freshness.test.mjs`, lib.

**independent: false** · phục vụ E8.

**Interfaces — Produces:**
- `docTrangThaiSaoLuu({ tepTrangThai, tepXacNhan, now }) -> { trangThai: "ok"|"qua-han"|"loi"|"chua-bat"|"chua-co-luot", tuoiGio: number|null, xau: boolean, dong: string }`.
  - `dong` bắt đầu `Sao lưu ngoài máy:`.
  - SLO là 36 giờ (hằng `SAO_LUU_SLO_GIO = 36`).
  - Tuổi âm tính là 0.
  - JSON hỏng → `loi`.
- `runCheck(client, { now, json, saoLuu = docTrangThaiSaoLuu(<mặc định từ docCauHinh()>) })`:
  - dòng sao lưu thêm vào stdout (ok, chưa bật) hoặc stderr (xấu);
  - `xau` làm `exitCode 1` dù nguồn đều tốt;
  - `--json` thêm khoá `sao_luu`.
  - CLI đọc `SAO_LUU_THU_MUC` như lib.

- [ ] **Bước 1: viết test hỏng** trong `check-freshness.test.mjs`, nhóm `describe("C12 sao lưu ngoài máy")`, ca thuần không cần DB:
  - a 35h → `xau false`;
  - b 37h → `xau true`;
  - c `ket_qua loi` → `true`;
  - d không tệp, không xác nhận → `chua-bat`, `false`;
  - e không tệp, có xác nhận → `chua-co-luot`, `true`;
  - e2 JSON hỏng → `loi`, `true`;
  - f tuổi âm → `ok`.

  Thêm một ca CLI với `SAO_LUU_THU_MUC` tạm và nguồn trong SLO: 37h → mã 1, stderr chứa `Sao lưu ngoài máy`. Các ca cũ của tệp giữ xanh.
- [ ] **Bước 2–4:** FAIL → cài → `node --test scripts/check-freshness.test.mjs` PASS. Tệp test dùng DB :5433 theo schema tạm riêng như cũ — chạy riêng một tệp được phép theo luật máy yên.
- [ ] **Bước 5:** phá thử. Đổi SLO thành 40 → ca b đỏ «C12b». Hoàn lại.
- [ ] **Bước 6:** commit.

### Task 6: Khép S3

**independent: false**

- [ ] Ghi `docs/ROADMAP.md`:
  - §2 as-built: một dòng về công cụ sao lưu (chưa chạy thật);
  - §4: trạng thái hàng.
- [ ] Chạy lại riêng tệp: `sl_test`, `sl_db`, `sl_freshness`, `sl_ranh_gioi` → xanh.
- [ ] Đặt contract `status: implemented`. Commit.

## Self-review

- **Độ phủ thiết kế:**

  | Phần thiết kế | Task |
  |---|---|
  | §3 | T1 |
  | §4, §5 | T2 |
  | §6 | T3 |
  | §7 | T5 |
  | §8 | T2 (AC-4), T4 |
  | §9 | T4 |
  | C1–C16 | T1–T5 |
  | Kiểm kê state | T0 |

- **Tên khớp giữa các task:**
  - `docCauHinh` và `CauHinh` dùng ở T2–T5;
  - `dump_sha256` ghi ở T2, đọc ở T3;
  - `docTrangThaiSaoLuu` ở T5 đọc `lan_ok_cuoi` và `ket_qua` của T2.
- **Không task nào độc lập:** mọi task chung một lib, nên S3 đi tuần tự trong vòng chính.
