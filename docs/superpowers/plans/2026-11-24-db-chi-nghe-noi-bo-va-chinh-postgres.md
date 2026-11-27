# HT8 db-chi-nghe-noi-bo-va-chinh-postgres — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (tuần tự trong phiên P1). Steps dùng `- [ ]`.

**Goal:** DB máy thu chỉ nghe 127.0.0.1:5433 và chạy bộ tham số 8GB/64MB/1GB/20GB + shm 1GB; có bộ kiểm hai chiều và hồ sơ áp.

**Architecture:** Đổi `db/docker-compose.yml`; bộ kiểm bash mới `scripts/check-db-noi-bo.sh` (khuôn `check-db-autostart.sh`: hàm
`pass`/`fail`/`expect`, mỗi chế độ một hàm); container tạm tiền tố `ht8-`, volume tạm `onehub_ht8_*`, cổng 55434–55436 và
55498/55499, `trap` dọn. Hai bộ kiểm cũ sửa tối thiểu (khác hunk với HT7).

**Tech Stack:** bash, docker compose, jq, lsof, nc, psql trong container, Node `pg` của `pipeline/`.

**Spec:** `docs/superpowers/specs/2026-11-24-db-chi-nghe-noi-bo-va-chinh-postgres-design.md` + `_acceptance/db-chi-nghe-noi-bo-va-chinh-postgres/contract.md`.

## Global Constraints

- Không `docker compose up` / `restart` trên `one-invest-db`; không ghi DB `oneinvest`; đọc nó chỉ trong phiên read-only.
- Bước nặng (container tạm có Postgres, chép bảng, đo) chỉ khi giữ s4, hoặc tải 1′ < 12 và không dãy nào giữ s4 (luật GS 24/11).
- Giá trị: `127.0.0.1:5433:5432`, `SHARED_BUFFERS: 8GB`, `WORK_MEM: 64MB`, `MAINTENANCE_WORK_MEM: 1GB`,
  `EXTRA_CONF: "effective_cache_size = 20GB"`, `shm_size: 1gb`. Base so sánh: `5a418983c`.
- `check-db-autostart.sh`: chỉ sửa dòng `local bo=…` và dòng `sed` đột biến `cong-5434`; không định dạng lại vùng khác (HT7 #528).
- `_acceptance/config.yaml`: chỉ THÊM dòng `executors.script.db_noi_bo_*`.

## Review Focus

- `localhost` phân giải `::1` trước → client không thử IPv4 gãy: E3 có ca client `pg` của pipeline nối `localhost` (Task 2).
- Volume có sẵn dữ liệu: cấu hình phải sinh lại khi tạo lại container — ca đường áp bốn bước (Task 3).
- Lượt đo thoát giữa chừng để sót container/volume `ht8-*`: `trap` + dòng PASS không sót (Task 2, 3, 4).
- Máy không có IP LAN (Wi-Fi tắt) → không được xanh giả: exit 2 nêu lý do (Task 2).
- Cụm tập dượt `db-volume-check.sh` giành cổng 5433: đọc compose sinh ra (Task 5).

---

### Task 1: compose + static + mutation (AC-1, AC-2)

**Files:** Modify `db/docker-compose.yml`; Create `scripts/check-db-noi-bo.sh`; Modify `_acceptance/config.yaml` (thêm
`db_noi_bo_static|mutation|cong|tham_so|do|soat|cu_khong_gay|live` → `bash scripts/check-db-noi-bo.sh <chế độ>`).

**Interfaces — Produces:** `check_static <compose>` in các dòng PASS/FAIL ghim ở E1/E2; `cau_hinh <compose>` = JSON gộp;
`BASE=${HT8_BASE:-5a418983c}`.

- [ ] Viết `mutation` trước (sáu bản hỏng bằng `sed`/`jq`→yaml trong `mktemp -d`, `expect "<tên>" do "<thông điệp>" check_static`), chạy trên compose cũ → bản lành ĐỎ (chưa đổi compose).
- [ ] Viết `check_static`: đọc `docker compose config --format json`; mỗi `.services.db.ports[]` phải `host_ip=="127.0.0.1"` (in `FAIL cổng db <published> host_ip=<giá trị|(trống)>`); bốn biến; `shm_size`; có `.services.db.command` → `FAIL compose có command: — ảnh kartoza không nhận -c`; so `del(ports[].host_ip, environment.{4 biến}, shm_size)` với base.
- [ ] Đổi compose theo design §4.
- [ ] Chạy `static` (E1) và `mutation` (E2) → exit 0, đủ thông điệp.
- [ ] Commit.

### Task 2: cong + soat (AC-3, AC-6)

**Files:** `scripts/check-db-noi-bo.sh`; design doc §3 (thêm hàng còn thiếu theo danh sách soát).

- [ ] `cong`: IP LAN = `ipconfig getifaddr en0 || en1` (trống → exit 2). Hai container `ht8-cong-a` (`127.0.0.1:55498`) và `ht8-cong-b` (`55499`) chạy `nc -l` lặp; `lsof -nP -iTCP:<p> -sTCP:LISTEN`; `nc -w2`; ca `localhost` bằng `psql`? — container chỉ có `nc`, nên ca localhost dùng `node -e` với `net.connect({host:"localhost"})` từ `pipeline/` và một lượt `pg.Client` tới container Postgres tạm ở Task 3 (ghi chú: ca `pg` thật nằm ở `tham-so` + `live`). Ghi `::1` bằng `nc -6`. `trap` xoá container.
- [ ] `soat`: `git grep -n -E` khuôn (host.docker.internal|0\.0\.0\.0|192\.168\.|10\.[0-9]+\.|172\.(1[6-9]|2[0-9]|3[01])\.)[^ ]*:?5433 loại `_acceptance/**/*.md`, `docs/research/**`, test giả IP (`app/src/lib/ops/lay-anh-goc.ts`, `*.test.*` có `pgUrl("192.168`); thêm `grep` plist `~/Library/LaunchAgents/*.plist`; `--network host`; liệt tệp có `docker (run|exec)` + `one-invest-db|container:` ra `evidence/soat-ben-noi.txt`. Đối chứng: cây tạm `git worktree`-free (chép `scripts/` sang `mktemp -d` + `git init`), cấy ba dạng → `FAIL bên nối ngoài loopback: <tệp>`.
- [ ] Chạy `cong`, `soat` → exit 0. Commit.

### Task 3: tham-so + đường áp + live (AC-4, AC-8)

**Interfaces — Produces:** `dung_tam <compose> <ten> <cong> <volume>` sinh compose tạm (đổi `container_name`, `name:` project,
cổng, volume `external`/tên tạm) rồi `docker compose -p <ten> up -d --wait`; `show_ts <container>` in bốn `SHOW` + `df -h /dev/shm`;
`live_doc <container> <cong>` (bộ đọc của `live`).

- [ ] `tham-so`: cây trên volume tạm rỗng → bốn giá trị mới; main (`git show $BASE:db/docker-compose.yml`) → 256MB/16MB/128MB/64M. Đường áp: main trên volume V, `CREATE TABLE ht8_moc` + 1 dòng; cây trên V (`--force-recreate`) → 8GB, dòng mốc 1; `docker restart` → 8GB; main trên V → 256MB, dòng mốc 1.
- [ ] `live`: `live_doc one-invest-db 5433` (trước áp: đỏ hai dòng ghim) + container tạm cây `127.0.0.1:55435` (xanh, gồm `node` + `pg` từ `pipeline/` nối `localhost:55435`) + container main ở `55436` (đỏ). Chế độ `live` trần (lệnh kiểm sau áp) chỉ chạy `live_doc one-invest-db 5433`; chế độ `live-ba` chạy cả ba (E8). → config `db_noi_bo_live: "bash scripts/check-db-noi-bo.sh live-ba"`, hồ sơ áp dùng `live`.
- [ ] Chạy (cần khoá/tải) → exit 0. Commit.

### Task 4: do (AC-5)

- [ ] Container tạm cây + main trên cùng volume tạm (đổi compose như Task 3); chép `field_assertions`, `sale_offer_records` bằng `docker exec one-invest-db pg_dump -t … | docker exec -i ht8-do psql` (phiên dump tự read-only); in số dòng so nguồn (≥ 90%).
- [ ] Bộ truy vấn: Q1 gộp nhóm lớn trên `field_assertions`; Q2 hash join hai bảng có song song (`EXPLAIN (ANALYZE, FORMAT JSON)` lấy `Workers Launched`); Q3 `CREATE INDEX` rồi `DROP`. Ba lần mỗi bộ, in trung vị.
- [ ] Đối chứng shm: tham số cây + `shm_size` 64MB chạy Q2 → bắt chuỗi «could not resize shared memory segment» hoặc in `ĐỐI CHỨNG SHM CHẾT`.
- [ ] Ghi bảng vào `ap-may-thu.md` (Task 6). Commit.

### Task 5: hai bộ kiểm cũ (AC-7)

**Files:** `scripts/check-db-autostart.sh` (dòng `local bo=` thêm `.services.db.ports[]?.host_ip`, bốn biến, `shm_size`; dòng sed
`s/5433:5432/5434:5432/`), `scripts/db-volume-check.sh` (hai dòng sed `s/5433:5432/$TD_PORT:5432/`).

- [ ] `cu-khong-gay`: chạy `check-db-autostart.sh static|mutation|diff`, `db-volume-check.sh static|mutation`; sinh compose tập dượt bằng đúng khuôn sed mới từ compose cây → `jq` published = 55433, không 5433; chiều đỏ: khuôn sed cũ → `FAIL tập dượt còn 5433`.
- [ ] Chạy → exit 0. Commit.

### Task 6: runtime-map + hồ sơ áp (AC-9)

- [ ] `docs/ops/runtime-map.md` mục DB: nghe 127.0.0.1 + vì sao; bốn tham số + shm, vì sao biến môi trường; `bash scripts/check-db-noi-bo.sh live`; đổi tham số = `docker compose -f db/docker-compose.yml up -d --force-recreate db`, `restart` không đủ.
- [ ] `_acceptance/<slug>/ap-may-thu.md`: lệnh áp (`--force-recreate db`), số chạy thử (bảng Task 3 + Task 4), sao lưu trước (`bash scripts/db-sao-luu.sh` + `docker inspect` lưu cấu hình cũ), cách lùi (compose của main + `--force-recreate`, đã diễn tập ở Task 3), lệnh kiểm sau (`live`), khung giờ ngoài job (22:05–23:55 VN), lời riêng của Mạnh.
- [ ] Commit; chuyển contract `status: implemented`.
