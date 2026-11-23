# Áp HT8 lên máy thu — năm thứ cho lời áp (ROADMAP §3 mục 50)

Chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp ĐÚNG một việc: **tạo lại container `one-invest-db`** từ `db/docker-compose.yml`
mới (cổng chỉ 127.0.0.1, bốn tham số Postgres, `shm_size` 1 GB). Đây là khởi động lại dịch vụ nền — **cần lời riêng của Mạnh
ngay lúc áp**, ngoài chữ ký. Không DDL, không ghi dữ liệu, không chạm cloud. Volume `onehub_pgdata` giữ nguyên. Agent KHÔNG tự
chạy lệnh áp; GS chạy sau khi PR gộp, từ checkout chính `~/dev/onehub-invest` đã kéo `main`.

**Khung giờ:** 22:05–23:55 giờ VN (Chủ nhật 20:30–23:55) — ngoài lượt nạp S03 15 phút (07:00–22:00), S06 (05:30, 14:00),
lượt nhập Zalo 00:00, sync-cloud. DB dừng ~10 giây; job nào đang mở kết nối lúc đó nhận lỗi một lần. Kiểm trước:
`docker exec one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "select count(*) from pg_stat_activity where state='active' and backend_type='client backend'"` — khác 1 (chính lệnh ấy) thì đợi.

## 1. Sao lưu trước

```bash
cd ~/dev/onehub-invest
bash scripts/db-sao-luu.sh                                   # → ~/onehub-backups/db/<UTC>/ (dump mọi DB + so-dong.tsv + manifest)
G=$(date -u +%Y%m%dT%H%M%SZ)
docker inspect one-invest-db > ~/onehub-backups/db/inspect-truoc-ht8-$G.json
docker exec one-invest-db sh -c 'cat /etc/postgresql/17/main/postgis.conf; cat /etc/postgresql/17/main/extra.conf 2>/dev/null' \
  > ~/onehub-backups/db/conf-truoc-ht8-$G.txt
```

Việc áp không đụng dữ liệu (volume giữ nguyên); bản dump là lối cuối nếu volume hỏng khi tạo lại. Hai tệp sau ghi cấu hình cũ
để đối chiếu khi lùi.

## 2. Lệnh áp

```bash
cd ~/dev/onehub-invest && docker compose -f db/docker-compose.yml up -d --force-recreate db
```

`--force-recreate` bắt buộc: `docker restart` KHÔNG sinh lại cấu hình (tệp khoá cấu hình của ảnh kartoza ở lớp container — đo ở
`check-db-noi-bo.sh tham-so`, ca «docker restart giữ»). Lệnh chờ healthcheck tự có (`pg_isready`).

## 3. Lệnh kiểm sau

```bash
bash scripts/check-db-noi-bo.sh live                          # phải: check-db-noi-bo live: ĐẠT
bash scripts/check-db-autostart.sh live                       # policy unless-stopped vẫn còn sau khi tạo lại
docker exec one-invest-db df -h /dev/shm                      # 1.0G
lsof -nP -iTCP:5433 -sTCP:LISTEN                              # chỉ 127.0.0.1:5433
```

`live` kiểm: Mac chỉ nghe `127.0.0.1:5433`; nối IP LAN:5433 bị từ chối; client `pg` của pipeline nối `localhost:5433` được;
`SHOW shared_buffers|work_mem|maintenance_work_mem|effective_cache_size` = 8GB|64MB|1GB|20GB; `/dev/shm` 1.0G. Rồi chạy
`node scripts/check-freshness.mjs` và soi lượt job kế (log không có ECONNREFUSED). Lệch → DỪNG và báo, không tự sửa cho khớp.
`check-db-autostart.sh live` có thể đỏ ở nhãn LaunchAgent colima (đỏ giả đã biết, hàng HT7) — phần policy của container phải xanh.

## 4. Số chạy thử

Trên container tạm cùng ảnh, cùng compose (không chạm `one-invest-db`), `bash scripts/check-db-noi-bo.sh tham-so | live-ba | do`:

_(điền sau lượt chạy — đang chờ khoá s4 / tải máy)_

## 5. Cách lùi

Tạo lại container bằng compose của `main` trước HT8 — đã diễn tập trên cùng volume ở `tham-so` (ca «đường lùi cây→base»):

```bash
cd ~/dev/onehub-invest
git show 5a418983c:db/docker-compose.yml > /tmp/compose-truoc-ht8.yml
docker compose -f /tmp/compose-truoc-ht8.yml up -d --force-recreate db
docker exec one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc 'show shared_buffers'   # 256MB
```

Compose tạm phải đứng cùng tên project (`name: onehub-db` có sẵn trong tệp) nên container và volume giữ đúng tên. Lùi xong thì
revert PR HT8 trên GitHub và kéo `main`, để lần `compose up` kế tiếp không áp lại. Lùi riêng phần cổng (giữ tham số): sửa một
dòng `ports` về `"5433:5432"` rồi cùng lệnh tạo lại. Volume hỏng (không bao giờ xảy ra ở diễn tập): khôi phục bằng
`bash scripts/db-khoi-phuc.sh <thư mục sao lưu bước 1>`.
