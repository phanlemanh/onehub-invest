# HT8 — DB máy thu chỉ nghe nội bộ, chỉnh tham số Postgres

Hàng HT8 `db-chi-nghe-noi-bo-va-chinh-postgres` (T2, hàng nền, dãy P1). Nguồn: audit máy thu Mac mini 24/11
(`research-local/audit-may-thu-20261124.md` mục A1, A8, §12 N1 + H2). Lời giao của GS 24/11.

## 1. Vấn đề, đo ngày 24/11

- **A1 — cổng mở ra LAN.** `db/docker-compose.yml` khai `"5433:5432"`. Trên máy này colima chuyển cổng bằng ssh:
  `lsof` thấy `ssh … TCP *:5433 (LISTEN)`. Nối được bằng IP LAN của máy (192.168.1.x) với mật khẩu mặc định; trong DB
  có hồ sơ user app (tầng A). `pg_hba.conf` của ảnh kartoza nhận `0.0.0.0/0` bằng mật khẩu.
- **A8 — tham số gần mặc định của ảnh.** `shared_buffers` 256 MB, `work_mem` 16 MB, `maintenance_work_mem` 128 MB,
  `effective_cache_size` 5 GB theo audit (đo thẳng trên compose `5a418983c` ra 4GB — §4 hồ sơ áp) trên VM colima 12 nhân, 32 GB. Audit §8: điểm tranh thật là một cụm Postgres chung cho DB
  thật và DB suite; lượt nạp S06 05:30 chậm ở phần DB.
- **Phát hiện khi thiết kế:** container có `/dev/shm` 64 MB (mặc định Docker). Postgres để `dynamic_shared_memory_type
  = posix`, nên truy vấn song song (hash join, sort song song) cấp vùng nhớ chung trong `/dev/shm`; nâng `work_mem` mà giữ
  64 MB thì truy vấn lớn có thể gãy «could not resize shared memory segment».

## 2. Đo cơ chế trước khi chọn (24/11, container tạm, không chạm `one-invest-db`)

Hai container tạm cùng ảnh, chỉ chạy `nc -l` trong container:

| Cách khai cổng | Mac nghe | Nối 127.0.0.1 | Nối IP LAN |
|---|---|---|---|
| `127.0.0.1:5498:5432` | `127.0.0.1:5498` | được | từ chối |
| `5499:5432` | `*:5499` | được | được |

Bộ chuyển cổng ssh của colima (`hostAddresses: false`) tôn trọng IP khai trong `ports:`. Vậy đổi cổng thành
`"127.0.0.1:5433:5432"` là đủ chặn LAN, không cần đổi cấu hình colima.

**Ảnh kartoza không nhận tham số qua `command:`.** Entrypoint (`/scripts/docker-entrypoint.sh`) gặp đối số mở đầu bằng `-`
thì dựng `gosu postgres <đối số>` rồi `exec gosu postgres - gosu postgres …` — lệnh `postgres` không bao giờ được gọi với
`-c`. Đường đúng của ảnh là biến môi trường đọc trong `env-data.sh`, ghi ra `postgis.conf` lúc khởi động:
`SHARED_BUFFERS`, `WORK_MEM`, `MAINTENANCE_WORK_MEM`; tham số khác qua `EXTRA_CONF` (ghi `extra.conf`, include sau
`postgis.conf`). Tệp khoá cấu hình `/settings/.postgresql.conf.lock` nằm ở lớp ghi của container, không ở volume — tạo lại
container thì cấu hình sinh lại từ biến môi trường; chỉ `docker restart` thì không.

## 3. Bên nối DB — soát 24/11

| Bên | Cách nối | Sau khi chỉ nghe 127.0.0.1 |
|---|---|---|
| Job launchd (collector, pipeline, sync-cloud, s03-nap…) | `localhost:5433` trên Mac | giữ nguyên |
| App dev (`.claude/launch.json`), data-api, agent, test | `localhost:5433` | giữ nguyên |
| `scripts/db-sao-luu.sh`, `scripts/db-khoi-phuc.sh` | `docker run --network container:one-invest-db` | không qua cổng Mac — giữ nguyên |
| `db/db-thu.sh`, `db/check-idempotent*.sh`, `pipeline/scripts/backup.sh`, `pipeline/scripts/resolve-so-stage-a.sh`, `scripts/audit-all.sh`, `scripts/check-ruler-views.sh`, `scripts/db-chuyen-volume.sh`, `scripts/check-db-noi-bo.sh` (bộ kiểm của HT8: `live`, `live-ba`, `do` đọc `one-invest-db` bằng `docker exec` trong phiên read-only/`pg_dump` chỉ đọc; các chế độ khác dựng container tạm `ht8-*`) | `docker exec` vào `one-invest-db` (psql/pg_dump bên trong container) | không qua cổng Mac — giữ nguyên |
| `scripts/check-db-autostart.sh`, `scripts/db-volume-check.sh`, `scripts/check-supabase-lock.sh`, `scripts/sao-luu-ngoai-may.itest.mjs` | `docker run` container riêng (dind, cụm tập dượt cổng 55433, PostGIS/PostgREST tạm) | không chạm DB thật; `db-volume-check.sh` đổi khuôn `sed` cổng (§5) |
| `pipeline/finalize-hanoi.sh`, `pipeline/import.sh`, `scripts/setup.sh`, `scripts/migrate-export.sh` | `docker compose exec db …`; ba tệp sau còn `docker compose up -d` | `exec` không qua cổng Mac. **`up -d` sau khi gộp sẽ tạo lại container theo compose mới = áp** — chỉ chạy tay; không job launchd nào gọi chúng (soát 24/11). Hồ sơ áp và runtime-map ghi điều này |
| `pipeline/scripts/cong-tac-that.test.mjs`, `pipeline/scripts/truong-du-an-tren-tin.test.mjs` | `pg` tới `localhost` (chỉ nhắc docker trong chú thích) | giữ nguyên |
| `scripts/ci-test-local.mjs` | container PostGIS riêng, mạng `container:` | không chạm DB thật |
| CI GitHub (`ci-test.yml`) | service riêng trên runner | không liên quan |
| Container khác gọi `host.docker.internal:5433` / IP LAN | `git grep` 0 chỗ; 17 container dự án khác đã dừng | không có bên nào |
| `pg_stat_activity` lúc đo | `::1` và `172.21.0.1` (cổng chuyển của colima, tức Mac) | giữ nguyên |
| Máy khác trong LAN (công cụ DB trên máy của Mạnh?) | máy không biết | **Hỏi-1** — sẽ gãy; lối giữ là đường hầm ssh |

## 4. Thiết kế

`db/docker-compose.yml`, service `db`:

```yaml
    environment:
      POSTGRES_DB: oneinvest
      POSTGRES_USER: oneinvest
      POSTGRES_PASS: oneinvest
      SHARED_BUFFERS: 8GB
      WORK_MEM: 64MB
      MAINTENANCE_WORK_MEM: 1GB
      EXTRA_CONF: "effective_cache_size = 20GB"
    shm_size: 1gb
    ports:
      - "127.0.0.1:5433:5432"
```

Số chọn theo đề xuất audit (§12 H2: `shared_buffers` 4–8 GB, `work_mem` 64 MB, `effective_cache_size` 20 GB) trên VM
32 GB: `shared_buffers` 8 GB = 25% RAM của VM (mức khởi điểm sách Postgres), `effective_cache_size` 20 GB (chỉ là gợi ý cho
bộ lập kế hoạch, không cấp phát), `maintenance_work_mem` 1 GB (dựng chỉ mục, VACUUM của transform). `shm_size: 1gb` để vùng
nhớ song song không chạm trần 64 MB. Lượt đo trước/sau (AC-5) có thể đổi số trước Cổng Bằng chứng; số đổi thì ghi dòng sổ.

Không đổi: ảnh, tên container, số cổng 5433, volume, `restart`, healthcheck, mật khẩu. `listen_addresses` trong container giữ
`*` — mạng docker nội bộ (sao lưu qua `--network container:`) cần nó; chặn là ở phía Mac.

## 5. Thước

Bộ kiểm mới `scripts/check-db-noi-bo.sh` cùng khuôn `check-db-autostart.sh`:

- `static` — đọc cấu hình gộp (`docker compose config --format json`): mọi cổng xuất bản của `db` có `host_ip` 127.0.0.1;
  bốn tham số và `shm_size` đúng giá trị khai; ngoài cổng, bốn biến tham số và `shm_size`, cấu hình gộp bằng của `main` trước
  vòng (`5a418983c`).
- `mutation` — bản compose hỏng trong thư mục tạm, mỗi bản đỏ với thông điệp ghim; bản lành chép cùng chỗ xanh.
- `cong` — hai container tạm như mục 2: gắn 127.0.0.1 → LAN từ chối; đối chứng gắn trần → LAN nối được. Thước có chiều đỏ thật.
- `tham-so` — dựng container tạm từ compose của cây (đổi tên, cổng `127.0.0.1:55434`, volume tạm), đọc `SHOW` bốn tham số và
  cỡ `/dev/shm`; đối chứng: cùng việc với compose của `main` ra giá trị cũ.
- `do` — đo trước/sau: container tạm, cùng dữ liệu đại diện chép từ DB thử, chạy bộ truy vấn với tham số cũ rồi mới.
- `live` — CHỈ ĐỌC máy này, sau khi áp: Mac chỉ nghe 127.0.0.1:5433, nối IP LAN bị từ chối, `SHOW` trên `one-invest-db` bằng
  compose. Trước áp nó đỏ đúng tên — đó là bằng chứng thước đọc trạng thái thật.

Hai bộ kiểm compose cũ phải sửa theo, không thì đỏ oan hoặc gây hại:
- `check-db-autostart.sh diff` so cấu hình gộp với `f3cff1f` (AU7) — bỏ thêm `host_ip` của cổng và bốn biến tham số, `shm_size`
  khỏi phép so (cùng cách hồ sơ db-vao-volume đã bỏ volume); đột biến `cong-5434` đổi khuôn `sed` để vẫn khớp. Tệp này HT7
  (PR #528) cũng sửa ở đoạn khác — báo GS xếp nối tiếp.
- `db-volume-check.sh` thay `"5433:5432"` bằng cổng tập dượt bằng `sed` — compose mới không còn chuỗi ấy, cụm tập dượt sẽ
  giành cổng 5433 với DB thật. Đổi khuôn `sed` thành `5433:5432` (khớp cả hai dạng).

## 6. Áp (chỉ sau gộp, có lời riêng của Mạnh)

Áp = `docker compose -f db/docker-compose.yml up -d --force-recreate db` từ checkout chính → container tạo lại, DB dừng ~10 giây, cấu hình sinh lại.
Đây là khởi động lại dịch vụ nền: cần lời riêng của Mạnh; hồ sơ `_acceptance/<slug>/ap-may-thu.md` ghi đủ năm thứ và khung
giờ ngoài lượt job, và lệnh kiểm sau: `SHOW shared_buffers` (cùng ba tham số kia), `df -h /dev/shm` trong container, `lsof`
cổng 5433 chỉ nghe 127.0.0.1 — gói trong `bash scripts/check-db-noi-bo.sh live`. Máy không tự chạy `docker compose up`.

## Out of scope

- Đổi mật khẩu mặc định của DB và siết `pg_hba.conf` — hàng riêng (chạm mọi chuỗi nối).
- Tách DB thử khỏi cụm thật — HT9 `db-thu-tach-khoi-cum-that`.
- Cấu hình colima (`hostAddresses`, mạng) — không cần (mục 2).
