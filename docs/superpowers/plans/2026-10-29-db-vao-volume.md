# db-vao-volume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dữ liệu DB local `:5433` nằm trong volume có tên `onehub_pgdata`; có lệnh sao lưu / khôi phục / chuyển / lùi kiểm được; chuyển thật một lần, giữ container cũ làm bản lùi.

**Architecture:** Bốn script bash trong `scripts/db-*.sh` theo khuôn `scripts/check-db-autostart.sh` (chế độ con, `pass`/`fail`, thông điệp ghim). Mọi tên container/cổng/volume/compose đọc từ biến môi trường có mặc định thật, để `tap-duot` chạy đúng các script ấy trên một cụm giả `onehub-tapduot-*` cùng daemon. Lượt chuyển thật là task cuối, chạy sau Gate 1.5.

**Tech Stack:** bash, docker CLI + compose v2, jq, psql/pg_dump/pg_restore/pg_controldata/tar TRONG ảnh `kartoza/postgis:17-3.5` (máy chủ không cần cài postgres client).

**Spec:** `docs/superpowers/specs/2026-10-29-db-vao-volume-design.md` · hợp đồng `_acceptance/db-vao-volume/contract.md` (đã duyệt 29/10) · evals `_acceptance/db-vao-volume/evals.yaml`.

## Global Constraints

- Không `docker rm`/`compose down -v`/`volume rm` trên `one-invest-db`, `one-invest-db-cu-*`, `db_oneinvest_pgdata`, `onehub_pgdata` — ở bất kỳ task nào. Chỉ tài nguyên tên `onehub-tapduot-*` được xoá (và chỉ bởi `tap-duot`).
- Trước Task 7: KHÔNG lệnh nào đổi trạng thái `one-invest-db` (stop, restart, rename, update, compose up). Chỉ `docker exec … psql`/`pg_dump` đọc.
- Task 7 chỉ chạy khi: Gate 1.5 đã ký · `khoi-phuc-ok` của bản thật có · đã báo phiên liên làn `local_ca693f2d` và có trả lời · giờ ngoài ±20′ job launchd theo giờ.
- Tên chuẩn: project `onehub-db`, volume `onehub_pgdata`, container `one-invest-db`, bản lùi `one-invest-db-cu-<YYYYMMDD>`, tar lạnh `datadir-17.tar`, thư mục bản sao lưu mặc định `$HOME/onehub-backups/db/<YYYYMMDDTHHMMSSZ>/`, DB thử `oneinvest_p2_khoi_phuc`.
- Bản sao lưu và tar lạnh không bao giờ nằm trong cây kho (tầng A). Bản chép vào `_acceptance/db-vao-volume/evidence/` chỉ chứa số dòng, giờ, mã thoát, tên bảng.
- Đường gốc suy từ vị trí script: `ROOT="$(cd "$(dirname "$0")/.." && pwd)"` — không gõ cứng.
- Mọi lệnh psql/pg_* chạy qua `docker exec -i -e PGPASSWORD=oneinvest <container> …` với `-U oneinvest -h localhost`.
- Không `set -e` trần ở phần đã dừng DB cũ: lỗi sau bước dừng phải in lệnh lùi rồi thoát 1, không tự xoá gì.

## Review Focus

1. **Lượt tập dượt trước chết dở để sót `onehub-tapduot-*`** (cổng 55433 bận, volume có dữ liệu cũ) → `tap-duot` dọn tài nguyên tên `onehub-tapduot-*` ở ĐẦU lượt rồi mới dựng; ca: tạo trước một container `onehub-tapduot-sot` → lượt vẫn xanh và nó biến mất (Task 4).
2. **Lỗi giữa chừng sau khi DB cũ đã dừng** (đĩa đầy, `docker cp` đứt) → không bật DB mới, không xoá gì, in nguyên dòng lệnh lùi, thoát 1; ca: `DB_CHUYEN_LOI_GIA=sau-chep` → exit 1, bản lùi còn, stdout có `--lui` (Task 4).
3. **Bản chép còn `postmaster.pid`** (cụm không tắt sạch) → `pg_controldata` khác `shut down` thì dừng trước `compose up`; ca: bản chép có `postmaster.pid` giả → FAIL cụm không tắt sạch (Task 4).
4. **Chạy compose từ một đường dẫn khác sau merge** (checkout chính thay vì worktree) → cùng cấu hình thì `up -d` không tạo lại container; ca: chép compose tập dượt sang thư mục khác, `up -d` → Id container không đổi (Task 4).
5. **Phiên khách nối lại ngay khi DB mới lên rồi ghi trước lúc đếm** → bảng bị ghi bởi job 5/15′ nằm trong danh sách loại trừ có lý do; bảng canonical không bao giờ bị loại (Task 1 static + Task 4 ca chuyen ghi một dòng vào bảng loại trừ giữa hai lần đếm → vẫn PASS, ghi vào bảng chính → FAIL lệch).

---

### Task 1: Compose mới + `db-volume-check.sh static|mutation`

phục vụ E1, E2, E15 (phần danh sách loại trừ — đọc biến từ `db-chuyen-volume.sh` của Task 4; trước Task 4 ca ấy in `SKIP chưa có db-chuyen-volume.sh` và Task 4 bật nó) · `independent: false` (mọi task chung `db-volume-check.sh`)

**Files:**
- Modify: `db/docker-compose.yml`
- Create: `scripts/db-volume-check.sh`

**Interfaces:**
- Produces: `db-volume-check.sh <static|mutation|tap-duot|live|live-selftest>`; hàm `check_static <compose>`; biến `IMG_DATADIR` = `docker run --rm --entrypoint sh <ảnh> -c '. /scripts/env-data.sh >/dev/null 2>&1; echo $DEFAULT_DATADIR'` (major từ tag nếu biến rỗng); thông điệp ghim:
  `PASS compose volume onehub_pgdata gắn <đích> chứa DEFAULT_DATADIR=<dir>` · `FAIL volume không chứa thư mục dữ liệu` · `FAIL volume vô danh` · `FAIL bind mount` · `FAIL project=db` · `FAIL volume thiếu name` · `PASS compose project=onehub-db` · `PASS compose db.restart=<v>` · `FAIL danh sách loại trừ chứa bảng canonical <bảng>`.

- [ ] **Step 1:** Viết `mutation` trước: năm bản compose hỏng sinh bằng `sed`/`yq`-tự-viết từ bản lành vào `mktemp -d` (gan-data, vo-danh, bind, project-db, mat-name) + bản lành cùng thư mục; mỗi bản đòi đúng thông điệp ghim; thiếu một → exit 1.
- [ ] **Step 2:** Chạy `bash scripts/db-volume-check.sh mutation` trên compose CŨ → bản «lành» (compose cũ) đỏ `FAIL volume không chứa thư mục dữ liệu` — xác nhận thước bắt đúng hiện trạng.
- [ ] **Step 3:** Sửa `db/docker-compose.yml` theo design §3.1 (thêm `name: onehub-db`, mount `pgdata:/var/lib/postgresql`, `volumes.pgdata.name: onehub_pgdata`; giữ nguyên ảnh, tên container, cổng, biến, healthcheck, restart + chú thích gốc lỗi một dòng).
- [ ] **Step 4:** Viết `static` (đọc `docker compose -p dvcheck -f <compose> config --format json`; đích mount là cha hoặc chính `IMG_DATADIR`; `type == "volume"`; `.volumes.<key>.name` có; `.name != "db"`; restart).
- [ ] **Step 5:** `bash scripts/db-volume-check.sh static` → exit 0; `… mutation` → exit 0, đủ năm dòng FAIL ghim + PASS bản lành.
- [ ] **Step 6:** Commit `feat(db): dữ liệu DB local vào volume onehub_pgdata — compose + thước static/mutation`.

### Task 2: `check-db-autostart.sh diff` bỏ qua khoá volume/tên project (Hỏi-2 đã duyệt)

phục vụ E3, E4 · `independent: false`

**Files:**
- Modify: `scripts/check-db-autostart.sh` (`check_diff`: hai `jq -S` thêm `| del(.name, .volumes, .services.db.volumes)`; chú thích một dòng trỏ hồ sơ `db-vao-volume` Hỏi-2)

- [ ] **Step 1:** Chạy `bash scripts/check-db-autostart.sh mutation` trên cây sau Task 1 → đỏ ở bản lành (`FAIL compose lệch commit trước vòng`) — chứng nhu cầu.
- [ ] **Step 2:** Sửa `check_diff`.
- [ ] **Step 3:** `bash scripts/check-db-autostart.sh static` · `mutation` · `diff` → exit 0; đột biến `cong-5434` vẫn `FAIL compose lệch commit trước vòng`.
- [ ] **Step 4:** Commit `fix(db): check-db-autostart diff bỏ qua volume/tên project — đổi có chủ đích ở db-vao-volume`.

### Task 3: `db-sao-luu.sh` + `db-khoi-phuc.sh` + khung `tap-duot` (ca sao-luu, khoi-phuc)

phục vụ E5, E6, E11 (khung dọn) · `independent: false`

**Files:**
- Create: `scripts/db-sao-luu.sh`, `scripts/db-khoi-phuc.sh`
- Modify: `scripts/db-volume-check.sh` (chế độ `tap-duot`: dựng cụm, trap dọn, ca sao-luu, khoi-phuc)

**Interfaces:**
- `db-sao-luu.sh [thư mục]` — env `DB_CONTAINER` (mặc định `one-invest-db`), `DB_SAO_LUU_SAU_SNAPSHOT_HOOK` (lệnh bash chạy ngay sau `pg_export_snapshot()`), `DB_SAO_LUU_DEM_NGOAI_SNAPSHOT=1` (chỉ ca thử đối chứng). In dòng cuối `db-sao-luu: <thư mục>`. Thoát 2 + `FAIL đích nằm trong kho <đường>` khi `realpath` của đích nằm dưới `git rev-parse --show-toplevel` của ROOT.
- Snapshot: một `psql` chạy nền qua `coproc`, `BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT pg_export_snapshot();`, đếm `count(*)` mọi bảng thường của `oneinvest` (trừ schema `cron`, `pg_catalog`, `information_schema`) trong CÙNG giao dịch → `so-dong.tsv` (`schema.bảng<TAB>số`), rồi `pg_dump -Fc --snapshot=<id>`, rồi `COMMIT`.
- `db-khoi-phuc.sh <bản> <db đích>` — env `DB_CONTAINER`. Thông điệp: `khớp N/N bảng` · `FAIL lệch bảng <bảng> <a>≠<b>` · `FAIL sha256 <tệp>` · `FAIL đích phải dạng oneinvest_<…>` (exit 2, trước mọi lệnh docker). Khôi phục: `globals.sql` bỏ qua lỗi «already exists»; `pg_restore --no-owner --exclude-extension=pg_cron --exclude-schema=cron -j 4`. Khớp → ghi `<bản>/khoi-phuc-ok` (`<UTC> <db đích> <N>`).
- `tap-duot` dựng: `git show <commit trước vòng — mặc định merge-base với origin/main>:db/docker-compose.yml` → sed đổi `container_name`, cổng `55433`, project `onehub-tapduot-cu`, volume `onehub_tapduot_cu` → `compose up -d` → mồi: bảng `public.mau_a` (1000 dòng), `public.mau_geo` (geometry, 10 dòng), DB phụ `onehub_tapduot_phu`, `ALTER SYSTEM SET max_connections=200` + restart. Trap EXIT/INT/TERM dọn `onehub-tapduot-*` (container + volume) và thư mục tạm; ghi Id + `StartedAt` của `one-invest-db` lúc đầu và so lúc cuối.

- [ ] **Step 1:** Viết ca `sao-luu` + `khoi-phuc` trong `tap-duot` theo `expected` của E5, E6 (kể cả đối chứng đỏ chen-snapshot và đích `oneinvest` → danh sách DB không đổi).
- [ ] **Step 2:** Chạy → đỏ vì chưa có hai script.
- [ ] **Step 3:** Viết `db-sao-luu.sh`, `db-khoi-phuc.sh`.
- [ ] **Step 4:** `bash scripts/db-volume-check.sh tap-duot` → các ca sao-luu/khoi-phuc PASS; `docker ps -a | grep onehub-tapduot` rỗng sau lượt.
- [ ] **Step 5:** Commit `feat(db): lệnh sao lưu + khôi phục kiểm số dòng (db-sao-luu, db-khoi-phuc)`.

### Task 4: `db-chuyen-volume.sh` + ca tập dượt chuyển/tạo lại/lùi

phục vụ E7, E8, E9, E10, E11, E15 · `independent: false`

**Files:**
- Create: `scripts/db-chuyen-volume.sh`
- Modify: `scripts/db-volume-check.sh` (ca chi-kiem, tien-dieu-kien, chuyen, tao-lai, lui, lui-tu-tar, khong-cham, don-khi-loi + năm ca Review Focus; bật ca E15 của `static`)

**Interfaces:**
- `db-chuyen-volume.sh [--lam | --lui [--tu-tar <bản>]] [--sao-luu <bản>]`. Env (mặc định thật): `DB_CONTAINER=one-invest-db`, `DB_PORT=5433`, `DB_VOLUME=onehub_pgdata`, `DB_COMPOSE=$ROOT/db/docker-compose.yml`, `DB_BACKUP_ROOT=$HOME/onehub-backups/db`, `DB_LAUNCH_DIR=$HOME/Library/LaunchAgents`; giả cho ca thử: `DB_CHUYEN_GIO_GIA` (HH:MM), `DB_CHUYEN_DIA_GIA` (KB còn trống), `DB_CHUYEN_LOI_GIA=sau-chep`.
- Biến mảng ở đầu tệp: `BANG_LOAI_TRU=( "<schema.bảng>|<lý do>" … )` — `static` đọc mảng này bằng `bash -c 'source <(sed -n "/^BANG_LOAI_TRU=(/,/^)/p" …); …'`; danh sách thật lấy ở Task 7 Step 1 từ các bảng mà job 5/15′ ghi.
- Thông điệp tiền điều kiện (exit 2): `FAIL đã chuyển` · `FAIL chưa có bản sao lưu đã khôi phục thử` · `FAIL bản sao lưu quá 24 giờ` · `FAIL volume đích không rỗng` · `FAIL đã có one-invest-db-cu` · `FAIL trùng cửa sổ <job> <HH:MM>` · `FAIL đang chạy <tiến trình>` · `FAIL đĩa không đủ <vm|máy chủ>` · `PASS cửa sổ`.
- Thông điệp `--lam`: `PASS pg_controldata shut down` · `FAIL cụm không tắt sạch` · `PASS bản lùi <tên> exited restart=no` · `PASS tar --diff 0 tệp lệch` / `FAIL tar --diff lệch <tệp>` · `PASS data_directory dưới mount volume <vol>` · `PASS số dòng bảng chính trước=sau (<n> bảng)` / `FAIL lệch bảng <bảng> <a>≠<b>` · dòng cuối `lùi: bash scripts/db-chuyen-volume.sh --lui` + `sớm nhất hỏi xoá bản lùi: <giờ + 7 ngày>`. Nhật ký `<bản>/chuyen.log`; bảng `truoc.tsv`, `sau.tsv`, `sau-tao-lai.tsv`, `cua-so.tsv` (job, giờ, phút tới giờ chuyển).
- `--lui --tu-tar <bản>`: `FAIL sha256 datadir-17.tar` (exit 1, không dựng gì) · `PASS lùi từ tar lạnh`.

- [ ] **Step 1:** Viết các ca tập dượt theo `expected` của E7–E11 và năm dòng Review Focus.
- [ ] **Step 2:** Chạy → đỏ vì chưa có script.
- [ ] **Step 3:** Viết chế độ chỉ-kiểm + tiền điều kiện (đọc `StartCalendarInterval` bằng `plutil -extract … json`; giờ `date +%H:%M` hoặc `DB_CHUYEN_GIO_GIA`; ±20′ quanh mỗi mốc, kể cả qua nửa đêm; `pgrep -f 'daily\.sh|weekly-collect\.sh|finalize-hanoi\.sh'`; `docker system df`/`df` trong VM qua container tạm + `df -k "$DB_BACKUP_ROOT"` máy chủ).
- [ ] **Step 4:** Viết `--lam` đúng chín bước design §3.3 (dừng: `docker exec -u postgres <c> pg_ctl -D <datadir> stop -m fast -w -t 120`, rồi `docker stop -t 60`; chép: `docker cp <cu>:/var/lib/postgresql/17 - | tee >(cat > <bản>/datadir-17.tar) | docker run --rm -i -v <vol>:/var/lib/postgresql --entrypoint tar <ảnh> -x -C /var/lib/postgresql`; sha256 tar; so: luồng `docker cp` lần hai `| docker run … tar --diff -C /var/lib/postgresql`; `pg_controldata` trong container tạm gắn volume).
- [ ] **Step 5:** Viết `--lui` và `--lui --tu-tar` (design §3.5).
- [ ] **Step 6:** `bash scripts/db-volume-check.sh tap-duot` → mọi ca PASS, exit 0; `static` → ca E15 PASS; `mutation` thêm bản `loai-canonical` → đỏ ghim.
- [ ] **Step 7:** Commit `feat(db): db-chuyen-volume — chuyển, tạo lại, lùi (kể cả từ tar lạnh) + tập dượt`.

### Task 5: `db-volume-check.sh live|live-selftest`

phục vụ E12 · `independent: false`

**Files:**
- Modify: `scripts/db-volume-check.sh`

**Interfaces:**
- `live` (chỉ đọc): `show data_directory` của `DB_CONTAINER`; `docker inspect` Mounts → có mount `Type=volume`, `Name=onehub_pgdata`, Destination là tiền tố của data_directory → `PASS data_directory <dir> dưới mount volume onehub_pgdata`, ngược lại `FAIL data_directory nằm trong lớp ghi container`; bản lùi `one-invest-db-cu-*`: `PASS bản lùi <tên> exited restart=no` hoặc FAIL tương ứng. Bộ đọc là hàm nhận JSON inspect + chuỗi data_directory.
- `live-selftest`: chạy bộ đọc trên JSON `docker inspect one-invest-db` thật đã làm hỏng (mount đổi về `/var/lib/postgresql/data`) → phải FAIL; trên JSON tự-sửa thành đúng → PASS.

- [ ] **Step 1:** Viết `live-selftest`; chạy → đỏ (chưa có bộ đọc).
- [ ] **Step 2:** Viết bộ đọc + `live`.
- [ ] **Step 3:** `live-selftest` → exit 0; `live` trên máy hiện tại → exit 1 với `FAIL data_directory nằm trong lớp ghi container` (chiều đỏ thật — giữ đầu ra cho Task 7 làm `live-truoc.log`).
- [ ] **Step 4:** Commit `feat(db): thước live — dữ liệu one-invest-db có nằm trong volume không`.

### Task 6: Sổ tay vận hành

phục vụ E13 (phần runbook) · `independent: false` (trỏ tên lệnh của Task 3–5)

**Files:**
- Create: `docs/ops/db-volume.md`
- Modify: `docs/ops/runtime-map.md` (mục DB local: chỗ ở dữ liệu, lệnh kiểm `live`, trỏ `db-volume.md`), `db/README.md` (tạo nếu chưa có: compose, volume, bốn lệnh)

- [ ] **Step 1:** Viết `db-volume.md`: gốc lỗi một đoạn; lệnh sao lưu, khôi phục, chuyển, lùi, lùi từ tar lạnh (dòng lệnh đầy đủ); nơi để bản sao lưu (chỉ đĩa máy này — tầng A); hạn giữ bản lùi (giờ chuyển + 7 ngày, điền sau Task 7) và ai hỏi xoá; cảnh báo không chạy `docker compose` từ checkout/worktree chưa pull main trong 7 ngày giữ; giới hạn: dữ liệu ghi sau giờ chuyển không theo về khi lùi.
- [ ] **Step 2:** Sửa `runtime-map.md`, `db/README.md`.
- [ ] **Step 3:** Commit `docs(ops): sổ tay DB local trong volume — sao lưu, khôi phục, chuyển, lùi`.

### Task 7: Lượt chuyển thật (khó đảo — chỉ sau Gate 1.5)

phục vụ E12, E13, E14 · `independent: false`

**Files:**
- Modify: `scripts/db-chuyen-volume.sh` (chỉ mảng `BANG_LOAI_TRU` thật, Step 1)
- Create: `_acceptance/db-vao-volume/evidence/{khoi-phuc-that,live-truoc,autostart-live-truoc,ops-check-truoc,chuyen-that,ops-check-sau,live-sau,autostart-live-sau}.log`
- Modify: `docs/ops/db-volume.md` (giờ chuyển thật + hạn hỏi xoá)

- [ ] **Step 1:** Lập `BANG_LOAI_TRU`: đọc `scripts/cloud-sync.sh`, `collector/scripts/zalo-heartbeat.sh`, `scripts/zalo-watchdog.sh` (chỉ đọc) + `pg_stat_user_tables` hai lần cách 16′ → bảng có `n_tup_ins+upd+del` đổi; mỗi bảng một lý do; `static` phải PASS (không bảng canonical). Commit.
- [ ] **Step 2:** `bash scripts/db-sao-luu.sh` → `bash scripts/db-khoi-phuc.sh <bản> oneinvest_p2_khoi_phuc` → `khớp N/N bảng`; chép dòng tóm (giờ, N, mã thoát) vào `evidence/khoi-phuc-that.log`; `docker exec … dropdb oneinvest_p2_khoi_phuc`.
- [ ] **Step 3:** Mốc trước: `node scripts/check-freshness.mjs; bash scripts/audit-all.sh` → `ops-check-truoc.log`; `db-volume-check.sh live` → `live-truoc.log` (đỏ); `check-db-autostart.sh live` → `autostart-live-truoc.log`.
- [ ] **Step 4:** Báo phiên liên làn `local_ca693f2d` (SendMessage): giờ dự kiến, ngừng 3–6′, ZCode không ghi `stg_*`/không chạy compose trong cửa sổ và 7 ngày sau không chạy `docker compose` từ worktree chưa pull main. Chờ trả lời (`yeu-cau can-nguoi --chan` nếu cần Mạnh).
- [ ] **Step 5:** `bash scripts/db-chuyen-volume.sh` (chỉ kiểm) → mọi tiền điều kiện PASS → `bash scripts/db-chuyen-volume.sh --lam --sao-luu <bản>`. Chép `chuyen.log` (đã lọc: không dữ liệu dòng) → `evidence/chuyen-that.log`.
- [ ] **Step 6:** Mốc sau: cùng ba lệnh Step 3 → `ops-check-sau.log`, `live-sau.log` (xanh), `autostart-live-sau.log` (xanh); nhịp đầu của job 5/15′ sau chuyển ghi vào `chuyen-that.log` (đóng giả định Coverage).
- [ ] **Step 7:** Điền giờ thật + hạn hỏi xoá vào `docs/ops/db-volume.md`; commit `ops(db): chuyển DB local vào volume onehub_pgdata — bằng chứng lượt thật`.
- [ ] **Step 8:** Lỗi ở bất kỳ bước nào sau `--lam` bắt đầu → `bash scripts/db-chuyen-volume.sh --lui`, ghi nhật ký, `yeu-cau can-nguoi --chan`, DỪNG (không thử lại tự động).
