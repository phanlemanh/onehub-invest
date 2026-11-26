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
cd ~/dev/onehub-invest && docker compose -f db/docker-compose.yml up -d --force-recreate --wait --wait-timeout 240 db
```

`--force-recreate` bắt buộc: `docker restart` KHÔNG sinh lại cấu hình (tệp khoá cấu hình của ảnh kartoza ở lớp container — đo ở
`check-db-noi-bo.sh tham-so`, ca «docker restart giữ»). `--wait` bắt lệnh đứng chờ tới khi healthcheck (`pg_isready`) của compose xanh —
thiếu cờ này `up -d` trả về ngay, và lệnh kiểm sau chạy liền dễ đỏ giả lúc Postgres còn khởi động.

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

Đo 25/11 01:11–01:15Z, giữ khoá s4, cây gộp `main` 8aae9497c (sau khi PL20/117 đã áp lên máy thu). Ba chế độ chạy
SONG SONG như lượt chấm (cùng lúc, mỗi chế độ chỉ dọn container của mình).

**`tham-so` — ĐẠT (7/7).** Container tạm cùng ảnh:

| compose | shared_buffers | work_mem | maintenance_work_mem | effective_cache_size | /dev/shm |
|---|---|---|---|---|---|
| cây (HT8) | 8GB | 64MB | 1GB | 20GB | 1.0G |
| base 5a418983c | 256MB | 16MB | 128MB | 4GB | 64M |

Đường áp bốn bước trên CÙNG volume xanh: base→cây giữ dòng mốc, `docker restart` giữ 8GB, lùi cây→base về 256MB, dòng
mốc còn 1; không sót container `ht8-ts-*`.

**`live-ba` — ĐẠT (5/5).** `one-invest-db` hiện tại đỏ đúng hai thông điệp ghim (5433 nghe `*`, shared_buffers=256MB)
— đây là trạng thái TRƯỚC áp; container tạm compose cây xanh trọn (chỉ 127.0.0.1, LAN từ chối, client `pg` nối được, bốn
tham số, /dev/shm 1.0G); container tạm compose base đỏ đúng hai thông điệp.

**`do` — ĐẠT.** Máy: Mac mini (máy thu), Docker qua colima, ngày 25/11/2026 ~01:13Z, chạy cùng lúc với hai chế độ kia.
Bản chép trọn hai bảng (field_assertions 2.321.327/2.321.327, sale_offer_records 146.957/146.957), mỗi truy vấn ba lần,
trung vị:

| truy vấn | trước (ms, base) | sau (ms, cây) | Workers Launched (sau) |
|---|---|---|---|
| Q1 group by field trên field_assertions | 3306 | 3632 | 0 |
| Q2 join field_assertions × sale_offer_records | 975 | 898 | 2 |
| Q3 tạo + xoá index (subject_key, field, observed_at) | 1728 | 1325 | 0 |

Đối chứng dương của câu ghi: một câu tạo chỉ mục hỏng cấy vào cùng đường đo ra `LOI` (thước Q3 đỏ được khi câu ghi lỗi).

Đọc số: trên hai bảng lớn nhất, đọc không nhanh hơn rõ (Q1 +10%, Q2 −8% — trong dao động; lượt 24/11 23:30Z lúc máy
rảnh ra Q1 +9%, Q2 +4%). **Xử lý truy vấn chậm hơn (Q1): GIỮ SỐ tham số và GHI GIỚI HẠN** — mức chênh nằm trong dao động
giữa các lượt và đổi dấu ở Q2; không hạ `work_mem`/`shared_buffers` vì việc ấy không làm đọc nhanh lên mà mất phần lợi của
Q3 và `/dev/shm`. Sau áp thật, `node scripts/check-freshness.mjs` và log lượt job kế là chỗ phát hiện nếu chậm hơn lan ra
job thật. Việc ghi nặng bộ nhớ nhanh hơn (Q3 −23%, nhờ `maintenance_work_mem` 1GB). Lợi ích chính của HT8 là cổng chỉ
127.0.0.1 và `/dev/shm` 1 GB, không phải tốc độ đọc. Đối chứng shm 64 MB KHÔNG tái hiện được lỗi vùng nhớ chung trên bộ
truy vấn này (dòng «ĐỐI CHỨNG SHM CHẾT») — `shm_size` 1 GB là phòng ngừa theo khuyến nghị ảnh, chưa có ca đo đỏ.

Sửa thước trong hồ sơ này (sổ quyết định): `do` chép thêm các hàm mà cột sinh/CHECK của hai bảng gọi (117 thêm cột sinh gọi
`assertion_value_key`); container tạm chờ ba lần `select 1` liên tiếp vì compose base không có healthcheck; mỗi chế độ chỉ
dọn container của mình (vòng 1 lượt chấm đỏ vì ba chế độ chạy song song dọn nhầm nhau); câu ghi Q3 báo lỗi kèm đối chứng.

## 5. Cách lùi

Tạo lại container bằng compose của `main` trước HT8 — đã diễn tập trên cùng volume ở `tham-so` (ca «đường lùi cây→base»):

```bash
cd ~/dev/onehub-invest
git show 5a418983c:db/docker-compose.yml > /tmp/compose-truoc-ht8.yml
docker compose -f /tmp/compose-truoc-ht8.yml up -d --force-recreate db
for i in $(seq 1 120); do docker exec one-invest-db pg_isready -h localhost -U oneinvest -q && break; sleep 2; done   # compose cũ không có healthcheck
docker exec one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc 'show shared_buffers'   # 256MB
```

Compose tạm phải đứng cùng tên project (`name: onehub-db` có sẵn trong tệp) nên container và volume giữ đúng tên. Lùi xong thì
revert PR HT8 trên GitHub và kéo `main`, để lần `compose up` kế tiếp không áp lại. Lùi riêng phần cổng (giữ tham số): sửa một
dòng `ports` về `"5433:5432"` rồi cùng lệnh tạo lại. Volume hỏng (không bao giờ xảy ra ở diễn tập): khôi phục bằng
`bash scripts/db-khoi-phuc.sh <thư mục sao lưu bước 1>`.
