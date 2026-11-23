---
schema_version: 1
feature: DB máy thu chỉ nghe nội bộ (127.0.0.1) và chỉnh tham số Postgres
slug: db-chi-nghe-noi-bo-va-chinh-postgres
owner: phanlemanh@gmail.com
risk_tier: T2      # db/docker-compose.yml + scripts/ + docs — không chạm t3_paths
surfaces: [config, docs]
status: draft
design_doc: docs/superpowers/specs/2026-11-24-db-chi-nghe-noi-bo-va-chinh-postgres-design.md
---

# Acceptance Contract: db-chi-nghe-noi-bo-va-chinh-postgres

## Context

Hàng nền HT8 (dãy P1, GS cắt 24/11) từ audit máy thu Mac mini 24/11 mục A1, A8 (§12 N1 + H2). A1: compose khai
`"5433:5432"`, bộ chuyển cổng ssh của colima nghe `*:5433` trên Mac — DB có tầng A nối được qua IP LAN bằng mật khẩu mặc
định. A8: tham số Postgres gần mặc định của ảnh (`shared_buffers` 256 MB, `work_mem` 16 MB) trên VM 32 GB. Đo khi thiết kế:
colima tôn trọng IP khai trong `ports:`; ảnh kartoza không nhận `command: -c …` mà nhận biến môi trường; `/dev/shm` của
container 64 MB. Chi tiết và bảng bên nối: design doc §1–§3.

Source input: lời giao GS 24/11 (HT8, `hang-viec.json` của đợt dot0-cam-mau, ranh giới `db/docker-compose.yml`,
`docs/ops/runtime-map.md`, `scripts/check-db-autostart.sh`, `_acceptance/db-chi-nghe-noi-bo-va-chinh-postgres/**`).

## Criteria

- AC-1: Given `db/docker-compose.yml` của cây, When đọc cấu hình gộp bằng `docker compose -f db/docker-compose.yml config
  --format json`, Then mọi cổng xuất bản của service `db` có `host_ip` = `127.0.0.1` và `published` = 5433; môi trường có
  `SHARED_BUFFERS=8GB`, `WORK_MEM=64MB`, `MAINTENANCE_WORK_MEM=1GB`, `EXTRA_CONF` chứa `effective_cache_size = 20GB`;
  `shm_size` ≥ 1 GiB; và ngoài `host_ip` của cổng, bốn biến ấy và `shm_size`, cấu hình gộp bằng đúng của `main` trước vòng
  (`5a418983c`) — ảnh, tên container, số cổng, volume, biến cũ, `restart`, healthcheck không đổi.
- AC-2: Given sáu bản compose hỏng trong thư mục tạm — cổng trần `"5433:5432"`, cổng `"0.0.0.0:5433:5432"`, thêm một cổng
  thứ hai trần, bỏ `SHARED_BUFFERS`, thay biến tham số bằng `command: ["-c", "shared_buffers=8GB"]`, bỏ `shm_size` — When chạy
  bộ kiểm AC-1 trên từng bản, Then mỗi bản đỏ với thông điệp ghim nêu đúng chỗ hỏng, và bản lành chép cùng thư mục thì xanh.
- AC-3: Given hai container tạm cùng ảnh (không chạm `one-invest-db`), một khai cổng `127.0.0.1:<p>:5432`, một khai trần
  `<q>:5432`, When nối từ Mac tới `127.0.0.1` và tới IP LAN của máy, Then bản 127.0.0.1: Mac chỉ nghe `127.0.0.1:<p>`, nối
  127.0.0.1 được, nối bằng tên `localhost` được bằng cả `psql` và client `pg` của `pipeline/` chạy bằng đúng bản Node của
  launchd, nối IP LAN bị từ chối; bản trần (đối chứng): Mac nghe `*:<q>`, nối IP LAN được và nối `localhost` được. Dòng `::1:<p>`
  được ghi lại (hành vi hiện có, cả hai bản). Không container tạm nào còn sót sau lệnh, kể cả khi lượt đo thoát lỗi giữa chừng.
- AC-4: Given container tạm dựng từ compose của cây (tên, volume tạm, cổng `127.0.0.1:55434`), When đọc `SHOW` và cỡ
  `/dev/shm` trong container, Then `shared_buffers` 8GB, `work_mem` 64MB, `maintenance_work_mem` 1GB, `effective_cache_size`
  20GB, `/dev/shm` ≥ 1G; cùng việc với compose của `main` trước vòng (đối chứng) ra 256MB, 16MB, 128MB, 64M — tức tham số
  đến từ compose chứ không từ mặc định khác của ảnh. Và trên ĐƯỜNG ÁP: container tạm dựng bằng compose của `main` trên một
  volume tạm, ghi dòng mốc; tạo lại bằng compose của cây trên CÙNG volume → `SHOW` ra bộ số mới và dòng mốc còn nguyên;
  `docker restart` container ấy không đổi cấu hình (đo, không chỉ ghi tài liệu); tạo lại bằng compose của `main` (cách lùi) →
  về 256MB, 16MB, 128MB, 64M và dòng mốc còn nguyên.
- AC-5: Given container tạm với dữ liệu đại diện chép chỉ đọc từ `one-invest-db` — hai bảng lớn của transform
  (`field_assertions`, `sale_offer_records`), số dòng in cạnh số dòng nguồn và ít nhất 90% — When chạy cùng bộ truy vấn đại
  diện (gộp nhóm lớn, hash join song song, dựng chỉ mục) với tham số của `main` rồi tham số của cây, mỗi bộ ba lần, Then
  bảng trước/sau in thời gian trung vị từng truy vấn, mọi truy vấn chạy xong không lỗi ở cả hai bộ, ít nhất một truy vấn có
  `Workers Launched` > 0 (in từ `EXPLAIN ANALYZE`), và `ap-may-thu.md` ghi bảng ấy làm số chạy thử. Đối chứng cho `shm_size`:
  tham số của cây với `/dev/shm` 64 MB chạy truy vấn hash join song song → lỗi «could not resize shared memory segment», hoặc
  lệnh in «đối chứng shm chết» (không tái hiện được) — không bao giờ im lặng xanh. Không có ngưỡng cải thiện viết trước (đo trước khi build — luật 11): số chậm hơn thì ghi và báo, không
  giấu. (judgment)
- AC-6: Given kho và máy thu, When soát các bên nối DB, Then lệnh soát in 0 chỗ trong kho (và trong plist launchd của máy)
  gọi DB cổng 5433 qua `host.docker.internal`, `0.0.0.0`, IP LAN (192.168.x, 10.x) hay IP bridge (172.16–31.x), 0 lệnh
  `docker run --network host`, và in danh sách mọi tệp có `docker run`/`docker exec` chạm DB thật kèm cách nối; design doc §3
  có một hàng cho mỗi tệp/nhóm trong danh sách ấy (judgment). Bên chỉ người biết (máy khác trong LAN) là câu hỏi ở Cổng Phạm vi.
- AC-7: Given hai bộ kiểm compose có sẵn, When chạy `check-db-autostart.sh static|mutation|diff` và `db-volume-check.sh
  static|mutation` trên compose của cây, Then tất cả xanh với đúng các thông điệp cũ (đột biến `cong-5434` vẫn đỏ
  «compose lệch commit trước vòng»), và compose tập dượt mà `db-volume-check.sh` sinh từ compose của cây không còn cổng 5433
  (đọc tệp sinh ra, không đọc khuôn sed).
- AC-8: Given máy thu, When chạy `check-db-noi-bo.sh live` (chỉ đọc, tham số hoá theo container và cổng), Then nó báo đúng
  trạng thái thật: trên `one-invest-db` trước khi áp đỏ ghim «FAIL 5433 nghe *» và «FAIL shared_buffers=256MB (compose 8GB)»;
  trên container tạm dựng từ compose của cây xanh — Mac chỉ nghe `127.0.0.1:<p>`, nối IP LAN bị từ chối, client `pg` nối
  `localhost` được, `SHOW` bằng compose; trên container tạm dựng từ compose của `main` đỏ đúng hai thông điệp ghim. Nhánh
  xanh vì thế đã chạy trước áp; sau áp, cùng lệnh trên `one-invest-db` là lệnh kiểm sau.
- AC-9: Given `docs/ops/runtime-map.md` và `_acceptance/db-chi-nghe-noi-bo-va-chinh-postgres/ap-may-thu.md` sau vòng, When Mạnh
  hoặc agent đọc, Then runtime-map nói DB chỉ nghe 127.0.0.1 và vì sao, bốn tham số + `shm_size` và vì sao đi biến môi trường
  chứ không `command:`, lệnh kiểm `live`, và cách đổi tham số (tạo lại container, `docker restart` không đủ); hồ sơ áp có đủ năm
  thứ (lệnh áp, số chạy thử, sao lưu trước, cách lùi, lệnh kiểm sau) cùng khung giờ ngoài lượt job, và không câu nào bảo agent
  tự `docker compose up`. (judgment)

## Coverage

Quét bằng `morphological-scan` (preset risk-premortem) ở S1. Chân ngành: [NGÀNH: Docker Compose spec — `ports` dạng
`HOST_IP:HOST:CONTAINER`, `shm_size`; Postgres docs «Resource Consumption» — `shared_buffers` khởi điểm 25% RAM,
`effective_cache_size` chỉ là gợi ý lập kế hoạch]. Chân sản phẩm: [SUY-TỪ-REPO: research-local/audit-may-thu-20261124.md
A1, A8, §12 N1, H2].

- Trục đường lộ: cổng Mac qua bộ chuyển colima (AC-1, AC-3, AC-8) · mạng docker nội bộ (giữ — AC-6) · cấu hình colima
  (Never — không cần, design §2) · `pg_hba` + mật khẩu (Later — hàng riêng).
- Trục đường vào tham số: biến môi trường của ảnh (AC-1, AC-4) · `command: -c` (đột biến AC-2, design §2) · `docker restart`
  không sinh lại cấu hình (AC-9 tài liệu).
- Trục bên nối: Mac localhost · container `--network container:` · container riêng · LAN máy khác (AC-6, Hỏi-1).
- Trục cách chứng: tĩnh (AC-1) · đột biến (AC-2) · container tạm hai chiều (AC-3, AC-4) · đo trước/sau (AC-5) · đọc máy thật
  chỉ đọc (AC-8) · bộ kiểm cũ không gãy (AC-7).
- Cross-cutting: phép đo không chạm `one-invest-db` và không chiếm cổng 5433 (AC-3, AC-4, AC-7).

## Đường đo

Hàng nền, không ô cơ hội — miễn bảng ngưỡng. Số trên màn của hàng: `lsof` cổng 5433 trên Mac đổi từ `*:5433` sang
`127.0.0.1:5433` và `SHOW shared_buffers` từ 256MB sang 8GB — đo bằng `bash scripts/check-db-noi-bo.sh live` sau áp (AC-8).

## Out of scope

- Đổi mật khẩu mặc định và siết `pg_hba.conf` (đang nhận `0.0.0.0/0`) — chạm mọi chuỗi nối của mọi bên; hàng riêng.
- Tách DB thử khỏi cụm thật — HT9 `db-thu-tach-khoi-cum-that` (U1).
- Đổi cấu hình colima (`hostAddresses`, mạng VM) — đo ở design §2 cho thấy không cần.
- Tự áp lên máy thu: tạo lại container là khởi động lại dịch vụ nền, chờ lời riêng của Mạnh theo `ap-may-thu.md`.

## Notes

- Không có bề mặt UI → không design-pass, không đặc tả UX, không eval ui-check (sổ quyết định).
