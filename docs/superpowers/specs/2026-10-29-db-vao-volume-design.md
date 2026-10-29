# db-vao-volume — dữ liệu DB local nằm trong volume có tên

Hàng P2 `db-vao-volume` của đợt `dot0-cam-mau` (T3, ưu tiên 110). Ý định: `.acceptance-runs/dieu-phoi-dot0-cam-mau/y-dinh-8-de-xuat-2910.md`
mục P2 (Mạnh «Duyệt cả 8», 29/10 ~08:15Z). Cảnh báo gốc: LUAT đợt mục «27/10 ~07:20Z — dữ liệu DB local :5433 KHÔNG nằm trong volume».

## 1. Hiện trạng (đo 29/10, chỉ đọc)

| Đo | Giá trị |
|---|---|
| Ảnh | `kartoza/postgis:17-3.5`, PostgreSQL 17.7 |
| `show data_directory` | `/var/lib/postgresql/17/main` (3,7 GB) |
| Mount của `one-invest-db` | một volume `db_oneinvest_pgdata` → `/var/lib/postgresql/data` (rỗng, 4 KB) |
| Thư mục dữ liệu mặc định của ảnh | `/scripts/env-data.sh`: `DEFAULT_DATADIR="/var/lib/postgresql/${POSTGRES_MAJOR_VERSION}/main"` |
| Cấu hình | `/etc/postgresql/17/main/*.conf` do entrypoint sinh lại mỗi lần khởi động; `postgresql.auto.conf` (ALTER SYSTEM: `max_connections=200`, `shared_preload_libraries='pg_cron,pg_stat_statements'`) nằm TRONG thư mục dữ liệu |
| Cụm | DB `oneinvest` 3,0 GB · `zcode_verify` 132 MB · `zcode_tv2b` 8 MB (của ZCode) · extension pg_cron (0 job), postgis, pgrouting, hstore, pgcrypto, pg_stat_statements |
| PID 1 | `su - postgres -c postgres …` — `docker stop` gửi SIGTERM = *smart shutdown* (chờ mọi phiên tự ngắt), quá 10 s thì SIGKILL |
| Nhãn compose | project `db`, service `db`, `config_files=/Users/manhphan/dev/one-invest/db/docker-compose.yml` |
| Đĩa | máy VM colima 59 GB, còn 23 GB · máy chủ còn 1,3 TB |

**Gốc lỗi:** compose gắn volume vào `/var/lib/postgresql/data` — đường của ảnh `postgres` chính thức — trong khi
ảnh kartoza đặt dữ liệu ở `/var/lib/postgresql/<major>/main`. Volume trỏ sai chỗ từ đầu; dữ liệu nằm trong lớp ghi
của container. `docker compose up -d` sau khi đổi cấu hình, `down`, `rm` đều tạo container mới với thư mục dữ liệu
trống.

**Người dùng DB đồng thời:** launchd chạy từ checkout chính — job 15 phút (`cloud-sync`, `zalo-heartbeat`), 5 phút
(`zalo-watchdog`), theo giờ (`chotot` 05:30, `apify-facebook` 00/06/12/18:00, `airdna-daily` 19:05, `smoke` 20:00,
`zalo-import` 00:00, `collector` CN 19:30); ZCode ghi `stg_*`; app dev; phiên Claude khác. Chỉ đường
`finalize-hanoi.sh` / `pipeline/import.sh` / `scripts/setup.sh` gọi `docker compose` (job tuần CN 19:30); các job
khác nối bằng `DATABASE_URL` cổng 5433.

## 2. Đích

Dữ liệu nằm trong volume có tên; tạo lại container (`up -d --force-recreate`, `down` rồi `up`) không mất gì; có lệnh
sao lưu và khôi phục kiểm được; container cũ giữ nguyên làm bản lùi ít nhất 7 ngày.

## 3. Thiết kế

### 3.1 Compose (`db/docker-compose.yml`)

```yaml
name: onehub-db                     # project mới — xem 3.4 vì sao không giữ «db»
services:
  db:
    image: kartoza/postgis:17-3.5
    container_name: one-invest-db   # giữ tên: mọi script `docker exec one-invest-db` chạy như cũ
    restart: unless-stopped         # giữ nguyên (db-tu-khoi-dong)
    environment: { … như cũ … }
    ports: ["5433:5432"]
    volumes:
      - pgdata:/var/lib/postgresql  # thư mục cha của <major>/main — đúng đường kartoza đọc
    healthcheck: { … như cũ … }
volumes:
  pgdata:
    name: onehub_pgdata             # tên tường minh, không phụ thuộc tên project
```

Gắn ở `/var/lib/postgresql` (không đặt `DATADIR`): đây là đường kartoza mặc định, và lần nâng major sau
(`18/main`) nằm cạnh `17/main` trong cùng volume — không ghi đè. Volume rỗng cũ `db_oneinvest_pgdata` để nguyên
(container cũ còn gắn nó; xoá là việc sau, xem §6).

### 3.2 Bốn lệnh (`scripts/db-*.sh`)

| Lệnh | Việc | Rào |
|---|---|---|
| `db-sao-luu.sh [thư mục]` | Mỗi DB không phải template → `<db>.dump` (`pg_dump -Fc`); `globals.sql` (`pg_dumpall --globals-only`); `so-dong.tsv` = `count(*)` mọi bảng của `oneinvest` đếm TRONG CÙNG snapshot với dump (`pg_export_snapshot()` + `pg_dump --snapshot`); `manifest.sha256`. Mặc định `~/onehub-backups/db/<UTC>/` | Từ chối thư mục nằm trong cây kho (SPL tầng A: `user_events/user_profile` nằm trong dump — bản sao lưu chỉ ở đĩa máy này, không vào git, không lên cloud). pg_dump chỉ lấy khoá AccessShare. |
| `db-khoi-phuc.sh <bản> <db đích>` | Kiểm `manifest.sha256` → tạo `<db đích>` → `pg_restore` (bỏ extension `pg_cron`, schema `cron` — pg_cron chỉ sống ở DB chính, như `db/db-thu.sh`) → đếm mọi bảng, so `so-dong.tsv`. Khớp → ghi `khoi-phuc-ok` vào thư mục bản | Đích phải khớp `^oneinvest_[a-z0-9_]+$` (khuôn của `db-thu.sh`) — không bao giờ `oneinvest`. Cờ `--container/--port` để khôi phục vào cụm khác (tập dượt). |
| `db-chuyen-volume.sh` | Mặc định CHỈ KIỂM: in hiện trạng, tiền điều kiện, kế hoạch; không đổi gì. `--lam`: chuyển (3.3). `--lui`: lùi (3.5) | Tiền điều kiện thiếu → thoát 2 gọi tên. |
| `db-volume-check.sh static\|mutation\|tap-duot\|live` | Thước của hàng (khuôn `check-db-autostart.sh`) | `tap-duot` không chạm `one-invest-db`. |

### 3.3 Chuyển (`db-chuyen-volume.sh --lam`)

Tiền điều kiện (mọi điều kiện gọi tên khi thiếu, thoát 2 trước khi chạm gì):
1. `one-invest-db` đang chạy và thư mục dữ liệu KHÔNG nằm dưới mount kiểu volume (chưa chuyển) — đã chuyển thì thoát 2.
2. Volume `onehub_pgdata` chưa có hoặc rỗng; chưa có container `one-invest-db-cu-*`.
3. Có bản sao lưu ≤ 24 giờ mang `khoi-phuc-ok` (đã khôi phục thử khớp số dòng).
4. Không job launchd theo giờ nào trong ±20 phút (đọc `StartCalendarInterval` của `~/Library/LaunchAgents/com.oneinvest.*.plist`, không gõ cứng), không tiến trình `*-daily.sh`/`weekly-collect.sh` đang chạy.
5. Đĩa VM còn ≥ 2 × cỡ thư mục dữ liệu; đĩa máy chủ ở thư mục bản sao lưu còn ≥ 2 × cỡ ấy (tar lạnh).
6. Không có tiến trình `*-daily.sh`, `weekly-collect.sh`, `finalize-hanoi.sh` nào đang chạy (`pgrep -f`).

Các bước:
1. Đếm số dòng mọi bảng `oneinvest` → `truoc.tsv`.
2. Dừng nhanh-sạch: `pg_ctl stop -m fast -w` trong container (ngắt phiên đang nối, checkpoint) rồi `docker stop`.
   Không dùng SIGTERM trần (smart shutdown treo khi job còn nối → SIGKILL → cụm không sạch).
3. Giữ bản lùi: `docker update --restart=no`, `docker rename one-invest-db one-invest-db-cu-<YYYYMMDD>`. Không `rm`.
4. Chép vật lý: `docker cp one-invest-db-cu-…:/var/lib/postgresql/17 -` → giải nén vào volume bằng chính ảnh kartoza
   (`--entrypoint tar`, giữ chủ sở hữu `postgres` uid 101). Cùng luồng ấy ghi một **tar lạnh** `datadir-17.tar` +
   sha256 vào thư mục bản sao lưu trên đĩa máy chủ — lưới thứ hai khi container bản lùi bị mất (§3.4).
5. Chứng bằng byte: `tar --diff` luồng `docker cp` lần hai với volume → không lệch tệp nào; `pg_controldata` trên bản
   chép: `Database cluster state: shut down`.
6. `docker compose -f db/docker-compose.yml up -d` (project `onehub-db`) → chờ healthy.
7. Kiểm: `show data_directory` = `/var/lib/postgresql/17/main`, mount kiểu volume `onehub_pgdata` phủ nó; đếm lại →
   `sau.tsv`; so với `truoc.tsv` trên **bảng chính** (mọi bảng `public` trừ danh sách bảng mà job 5/15 phút ghi —
   khai trong script, mỗi bảng một lý do); bảng ngoài danh sách lệch thì in, không chặn.
8. Tạo lại thật: `docker compose up -d --force-recreate` → đếm → `sau-tao-lai.tsv` khớp `sau.tsv` trên bảng chính.
9. In lệnh lùi và ngày sớm nhất được hỏi xoá bản lùi (+7 ngày). Ghi trọn nhật ký vào thư mục bản sao lưu.

Ngừng dịch vụ ước 3–6 phút (dừng + chép 3,7 GB + khởi động). Job 5/15 phút lỡ một nhịp rồi tự chạy lại; không
`launchctl` gỡ job nào (plist và job thu là làn ZCode).

### 3.4 Vì sao đổi tên project compose

Container cũ giữ nhãn `com.docker.compose.project=db`, `service=db` (Docker không cho sửa nhãn container đã có).
Nếu compose mới vẫn là project `db`, lệnh `up -d` sẽ thấy container cũ là «của mình», cấu hình lệch → **xoá nó rồi
tạo mới** — mất bản lùi. Project `onehub-db` không thấy container cũ. Hệ quả có biết trước: một checkout/worktree còn
compose cũ (project `db`) chạy `docker compose up -d` sẽ cố bật container cũ → trùng cổng 5433 → lỗi, không mất dữ liệu;
`docker compose exec db` từ compose cũ báo «không chạy». Cửa sổ ấy kéo từ lúc chuyển tới lúc PR vào main và checkout
chính `pull`; job duy nhất đi đường compose là job tuần CN 19:30 → **PR phải vào main trước CN 01/11 19:30**, nếu
không thì lùi (3.5) hoặc báo liên làn hoãn job tuần.

**Rủi ro còn lại với bản lùi:** nó vẫn mang nhãn project `db`. Một checkout có compose project `db` mà cấu hình khác
(bản cũ hơn, thiếu `restart`…) chạy `docker compose up -d` thì compose **tạo lại** container ấy — tức xoá bản lùi;
`docker compose down` từ checkout cũ cũng xoá nó. Docker không cho sửa nhãn nên không chặn được tận gốc. Vì vậy:
(a) tar lạnh `datadir-17.tar` + sha256 trên đĩa máy chủ là lưới thứ hai, `--lui --tu-tar` dựng lại cụm cũ từ đó;
(b) tập dượt đo đúng kịch bản này (container kiểu cũ dựng bằng compose thật nên mang nhãn thật, rồi `down` bằng compose
cũ); (c) runbook và tin báo liên làn nêu: trong 7 ngày giữ, không chạy `docker compose` từ checkout chưa pull main.
Lối «giữ project `db`, đổi tên service» cũng không thoát: container cũ thành *orphan*, `up --remove-orphans` xoá nó.

### 3.5 Lùi (`db-chuyen-volume.sh --lui [--tu-tar <bản>]`)

`docker compose stop` (không `down -v`, volume giữ) → đổi tên container mới thành `one-invest-db-moi-<ngày>` →
đổi tên bản lùi về `one-invest-db`, `docker update --restart=unless-stopped`, `docker start` → healthy → đếm. Bản lùi
đã mất → `--tu-tar <bản>`: kiểm sha256, giải tar lạnh vào volume `onehub_pgdata_lui_<ngày>`, `docker run` cùng ảnh,
cổng 5433, restart `unless-stopped`, tên `one-invest-db` → healthy → đếm. Dữ liệu ghi vào cụm mới sau giờ chuyển
KHÔNG theo về (ghi trong nhật ký và runbook).

### 3.6 Thước

- `static`: `docker compose config --format json` của cây → volume có tên tường minh gắn ở thư mục chứa
  `DEFAULT_DATADIR` của ảnh (major đọc từ tag ảnh), không bind, không volume vô danh; project ≠ `db`; `restart`
  giữ `unless-stopped|always`.
- `mutation`: các bản compose hỏng (gắn `/var/lib/postgresql/data`; volume vô danh; bind mount; project `db`; bỏ
  `name:` của volume) → mỗi bản đỏ với thông điệp ghim; bản lành cùng thư mục xanh.
- `tap-duot`: dựng trên CÙNG daemon một container kiểu cũ bằng **compose cũ thật** (`git show <commit trước
  vòng>:db/docker-compose.yml`, chỉ thay tên container/cổng/volume/project sang `onehub-tapduot-*`, cổng 55433 — nên
  container mang nhãn compose thật), nạp dữ liệu mồi (vài bảng, có PostGIS, một DB phụ, một ALTER SYSTEM) → sao lưu
  (móc `DB_SAO_LUU_SAU_SNAPSHOT_HOOK` chen một INSERT ở phiên khác ngay sau lúc export snapshot; `so-dong.tsv` và bản
  khôi phục đều không thấy dòng ấy) → khôi phục (khớp; phá một dòng → lệch gọi tên bảng) → chuyển bằng đúng
  `db-chuyen-volume.sh --lam` (biến môi trường trỏ tên/cổng/volume/compose tập dượt) → tạo lại, `down` rồi `up` →
  lùi → **compose cũ `down` xoá bản lùi** (đo rủi ro §3.4) → `--lui --tu-tar` dựng lại từ tar lạnh → số dòng khớp ở
  mọi mốc. Tiền điều kiện: mỗi điều kiện của §3.3 có một ca đỏ (giờ giả, plist chép, tiến trình giả, đĩa giả, mtime
  giả) và ca cửa sổ có đối chứng dương. `StartedAt` + Id của `one-invest-db` không đổi; trap dọn mọi
  `onehub-tapduot-*` kể cả khi lỗi/SIGTERM.
- Danh sách bảng loại khỏi phép so «bảng chính» (bảng job 5/15 phút ghi) khai trong script; `static` đỏ khi danh
  sách chứa bảng canonical (`sale_offers`, `listings`, `properties`, `sale_offer_records`).
- `live`: chỉ đọc — `one-invest-db` có `data_directory` nằm dưới mount kiểu volume tên `onehub_pgdata`; bản lùi
  `one-invest-db-cu-*` tồn tại, đang dừng, restart `no`. Trước chuyển thước này ĐỎ (đó là chiều đỏ thật).

## 4. Thứ tự vòng (T3)

Cổng Phạm vi → S2 plan → **Gate 1.5** → S3: code + `static/mutation/tap-duot` xanh → sao lưu thật + khôi phục thật
trên DB thử `oneinvest_p2_khoi_phuc` (đối chiếu số dòng; xong thì xoá DB thử) → mốc trước: `/ops-check`
(`check-freshness.mjs` + `audit-all.sh`), `db-volume-check.sh live` (đỏ), `check-db-autostart.sh live` → lưu vào
`_acceptance/db-vao-volume/evidence/*-truoc.log` → **báo phiên liên làn** (`local_ca693f2d`, ZCode ghi `stg_*`) →
chuyển thật trong cửa sổ sạch (nhật ký ghi bảng cửa sổ đọc từ plist + danh sách bảng loại trừ kèm lý do) → cùng ba
phép kiểm sau chuyển → `*-sau.log` → S4 → Cổng Bằng
chứng → PR → giám sát merge trước CN 01/11 19:30 → `git -C ~/dev/onehub-invest pull --ff-only`.

## 5. Ngoài phạm vi (ghi để khỏi bàn lại)

- Lịch sao lưu tự động (plist launchd) — Later: plist/`install-*` là làn ZCode; hàng sau xin qua liên làn.
- Xoá container cũ / volume rỗng `db_oneinvest_pgdata` — Never trong hàng này; sau ≥7 ngày hỏi Mạnh.
- Sửa script làn ZCode (`pipeline/import.sh`, `finalize-hanoi.sh`) — không cần: sau merge chúng gọi compose mới.
- Nâng major PostgreSQL, đổi ảnh, đổi cổng.
- Gỡ luật cấm compose trong `LUAT.md` — việc của giám sát khi hàng xong.

## Đặc tả UX

Bỏ — hàng không chạm giao diện (entry `descope` «bỏ đặc-tả-UX» trong sổ).
