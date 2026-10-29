---
schema_version: 1
feature: Dữ liệu DB local nằm trong volume có tên — sao lưu, khôi phục kiểm được, chuyển và lùi
slug: db-vao-volume
owner: phanlemanh@gmail.com
risk_tier: T3      # ý định P2 khai T3: đổi chỗ ở của toàn bộ DB local dùng chung (khó đảo); Mạnh ký ba cổng
surfaces: [config, ops, docs]
status: draft
design_doc: docs/superpowers/specs/2026-10-29-db-vao-volume-design.md
approved_by:
approved_at:
---

# Acceptance Contract: db-vao-volume

## Context

Hàng P2 `db-vao-volume` của đợt `dot0-cam-mau`. Đo 29/10: DB local `:5433` (`one-invest-db`, ảnh
`kartoza/postgis:17-3.5`) giữ 3,7 GB ở `/var/lib/postgresql/17/main` — trong lớp ghi của container. Volume
`db_oneinvest_pgdata` gắn ở `/var/lib/postgresql/data` (đường của ảnh `postgres` chính thức, không phải của kartoza)
và rỗng. Một lệnh compose tạo lại container là mất toàn bộ DB local. Vòng này sửa compose cho dữ liệu nằm trong
volume có tên, thêm lệnh sao lưu / khôi phục kiểm được, chuyển dữ liệu thật sang volume, giữ container cũ làm bản lùi.

Căn cứ: ý định `.acceptance-runs/dieu-phoi-dot0-cam-mau/y-dinh-8-de-xuat-2910.md` mục P2 (Mạnh «Duyệt cả 8»,
29/10); LUAT đợt mục «27/10 ~07:20Z — CẢNH BÁO: dữ liệu DB local :5433 KHÔNG nằm trong volume»; luật bất biến 6
(AGENTS.md — tầng A không rời máy local).

## Criteria

- AC-1: Given `db/docker-compose.yml` của cây, When đọc cấu hình gộp (`docker compose config --format json`) và
  đọc `DEFAULT_DATADIR` từ `/scripts/env-data.sh` của chính ảnh khai trong compose (major lấy từ tag ảnh), Then
  service `db` gắn đúng một volume có tên tường minh (`onehub_pgdata`, khoá `name:`) tại một thư mục là cha (hoặc
  chính) của `DEFAULT_DATADIR`, không bind mount, không volume vô danh; tên project ≠ `db`; `restart` vẫn
  `unless-stopped|always`; danh sách bảng loại khỏi phép so «bảng chính» không chứa bảng canonical (`sale_offers`,
  `sale_offer_records`, `listings`, `properties`); và các bộ kiểm của `db-tu-khoi-dong` (`check-db-autostart.sh
  static`, `mutation` trên cây mới; `live` trước và sau lượt chuyển thật) vẫn xanh.
- AC-2: Given năm bản compose hỏng và một bản script có danh sách loại trừ chứa `sale_offers` chép từ bản lành vào thư mục tạm — volume gắn `/var/lib/postgresql/data`;
  volume vô danh; bind mount thư mục máy; project `db`; volume mất khoá `name:` — When chạy bộ kiểm AC-1 trên từng
  bản, Then mỗi bản đỏ với thông điệp ghim riêng nêu đúng chỗ hỏng, và bản lành chép cùng thư mục xanh.
- AC-3: Given một cụm PostgreSQL đang chạy, When chạy `scripts/db-sao-luu.sh <thư mục>`, Then thư mục có một
  `<db>.dump` (`pg_dump -Fc`) cho mỗi DB không phải template, `globals.sql`, `so-dong.tsv` (số dòng mọi bảng của
  `oneinvest` đếm TRONG CÙNG snapshot với dump — một dòng chen vào ở phiên khác ngay sau lúc export snapshot thì cả
  `so-dong.tsv` lẫn bản khôi phục đều không có nó) và `manifest.sha256` khớp từng tệp; còn thư mục nằm trong cây kho
  thì lệnh thoát 2 với thông điệp ghim trước khi ghi byte nào.
- AC-4: Given một bản sao lưu của AC-3, When chạy `scripts/db-khoi-phuc.sh <bản> <db đích>`, Then đích khớp
  `^oneinvest_[a-z0-9_]+$` thì DB đích được dựng, số dòng mọi bảng khớp `so-dong.tsv` và lệnh in «khớp N/N bảng»,
  thoát 0, ghi dấu `khoi-phuc-ok`; một bảng lệch thì thoát 1 gọi tên bảng và hai con số; `manifest.sha256` sai thì
  thoát 1 gọi tên tệp; đích `oneinvest` hay sai khuôn thì thoát 2 trước khi chạm DB nào.
- AC-5: Given `scripts/db-chuyen-volume.sh`, When chạy không cờ, Then lệnh chỉ in hiện trạng + tiền điều kiện +
  kế hoạch và không đổi gì (Id, `StartedAt`, danh sách container và volume giữ nguyên); When chạy `--lam` mà thiếu
  một tiền điều kiện — cụm đã nằm trên volume; chưa có bản sao lưu mang `khoi-phuc-ok`, hoặc có nhưng cũ hơn 24 giờ;
  volume đích không rỗng; đã có bản lùi; một job launchd theo giờ trong ±20 phút; một tiến trình `*-daily.sh` /
  `weekly-collect.sh` / `finalize-hanoi.sh` đang chạy; đĩa VM hay đĩa máy chủ không đủ — Then mỗi ca thoát 2 gọi tên
  điều kiện, không đổi gì; còn giờ ngoài mọi cửa sổ (plist thật) thì điều kiện cửa sổ qua.
- AC-6: Given một cụm «kiểu cũ» (dữ liệu trong lớp ghi, volume gắn `/var/lib/postgresql/data`), When chạy
  `db-chuyen-volume.sh --lam` đủ tiền điều kiện, Then cụm cũ dừng sạch (`pg_controldata`: `shut down`), container
  cũ còn nguyên dưới tên `one-invest-db-cu-<YYYYMMDD>` (dừng, restart `no`, không bị xoá), thư mục dữ liệu chép vào
  volume khớp từng byte (`tar --diff` không lệch tệp nào), tar lạnh `datadir-17.tar` + sha256 nằm trong thư mục bản
  sao lưu, container mới (cùng tên, cùng cổng) chạy trên volume với
  `data_directory` nằm dưới mount kiểu volume, và số dòng bảng chính trước = sau.
- AC-7: Given cụm đã chuyển ở AC-6, When `docker compose up -d --force-recreate`, và When `docker compose down`
  (không `-v`) rồi `up -d`, Then sau mỗi lần số dòng bảng chính bằng đúng số sau chuyển và ALTER SYSTEM, DB phụ,
  extension còn nguyên.
- AC-8: Given cụm đã chuyển ở AC-6, When chạy `db-chuyen-volume.sh --lui`, Then container cũ chạy lại trên cổng
  cũ với số dòng như trước chuyển, container mới dừng và volume `onehub_pgdata` còn nguyên (không `down -v`); và
  Given bản lùi đã bị xoá bởi `docker compose down` từ compose cũ (container kiểu cũ dựng bằng compose thật nên mang
  nhãn project thật), When chạy `--lui --tu-tar <bản>`, Then sha256 của tar lạnh được kiểm và cụm cũ chạy lại từ
  tar trên cổng cũ với số dòng như trước chuyển.
- AC-9: Given máy này với `one-invest-db` thật, When chạy tập dượt AC-3…AC-8 (`db-volume-check.sh tap-duot`, cùng
  daemon, tên/cổng/volume riêng `onehub-tapduot-*`) — kể cả khi lượt thoát lỗi giữa chừng hay bị SIGTERM — Then Id
  và `StartedAt` của `one-invest-db` không đổi và không container/volume `onehub-tapduot-*` nào còn sót; và sau
  bước chuyển thật, `db-volume-check.sh live` xanh: `data_directory` của `one-invest-db` nằm dưới mount kiểu volume
  tên `onehub_pgdata`, bản lùi `one-invest-db-cu-*` tồn tại, đang dừng, restart `no` (trước chuyển `live` đỏ).
- AC-10: Given nhật ký lượt chuyển thật (bản chép `_acceptance/db-vao-volume/evidence/chuyen-that.log` — chỉ số
  dòng, giờ, mã thoát; không dữ liệu dòng) và `docs/ops/db-volume.md`, `docs/ops/runtime-map.md`,
  `db/README.md` sau vòng, When Mạnh hoặc agent đọc, Then thấy: bản sao lưu thật khôi phục khớp số dòng trên DB thử
  TRƯỚC giờ chuyển; bảng cửa sổ đọc từ plist (job, giờ, khoảng cách tới giờ chuyển) cho thấy giờ chuyển ngoài
  ±20 phút; danh sách bảng loại khỏi phép so kèm lý do và số dòng trước/sau chuyển/sau tạo lại của các bảng còn lại;
  `ops-check-sau.log` không xấu hơn `ops-check-truoc.log`; và runbook nêu lệnh sao lưu, khôi phục, chuyển, lùi, nơi để bản sao lưu (chỉ
  đĩa máy này — tầng A), hạn giữ bản lùi (sớm nhất được hỏi xoá: giờ chuyển + 7 ngày), cảnh báo không chạy
  `docker compose` từ checkout chưa pull main trong 7 ngày giữ (nó có thể xoá bản lùi), và cách lùi từ tar lạnh. (judgment)

## Coverage

Quét bằng `morphological-scan` (preset risk-premortem + test-matrix) ở S1. Chân ngành: [NGÀNH: PostgreSQL 17 docs
ch.25 «Backup and Restore» — SQL dump (`pg_dump -Fc`/`pg_restore`, `pg_dumpall --globals-only`) và «File System
Level Backup» (chỉ hợp lệ khi server đã tắt)] · [NGÀNH: README ảnh kartoza/postgis — volume gắn `/var/lib/postgresql`;
xác nhận bằng `DEFAULT_DATADIR` trong `/scripts/env-data.sh` của ảnh đang dùng]. Chân sản phẩm: [SUY-TỪ-REPO:
db/docker-compose.yml] + đo `docker inspect one-invest-db` 29/10 (design doc §1).

- Trục pha: trước chuyển — sao lưu/khôi phục (AC-3, AC-4) · quyết chuyển — tiền điều kiện (AC-5) · lúc chuyển (AC-6)
  · sau chuyển — tạo lại (AC-7), vận hành (AC-9 live, AC-10) · lùi (AC-8). [thước CE: bốn bước «Thứ tự» của ý định P2]
- Trục vật: cấu hình compose (AC-1, AC-2) · dữ liệu cụm — DB chính, DB phụ, vai, ALTER SYSTEM, extension (AC-3,
  AC-6, AC-7) · container cũ/mới (AC-6, AC-8) · người dùng DB đồng thời — launchd, ZCode (AC-5 cửa sổ, design §3.4).
- Trục chiều đo: xanh khi đúng · đỏ khi hỏng có thông điệp ghim (AC-2, AC-4 ba chiều đỏ, AC-5, AC-9 live trước chuyển).
- Trục rủi ro bản lùi: container bản lùi mang nhãn project `db` — compose cũ có thể xoá nó (AC-8 tar lạnh, AC-10
  cảnh báo); tiến trình đang ghi lúc dừng (AC-5); đĩa (AC-5).
- Cross-cutting: không xoá dữ liệu nào trong hàng (container cũ, volume rỗng cũ giữ nguyên); tập dượt không chạm DB
  thật (AC-9); bản sao lưu chứa tầng A nên chỉ ở đĩa máy này (AC-3, AC-10).
- [GIẢ ĐỊNH] Job 5/15 phút (`cloud-sync`, `zalo-heartbeat`, `zalo-watchdog`) lỡ một nhịp khi DB ngừng 3–6 phút thì
  tự chạy lại ở nhịp sau, không để trạng thái hỏng — chưa đo; lượt chuyển thật ghi lại nhịp đầu sau chuyển của chúng.

## Đường đo

Hồ sơ không có `opportunity.md` (hàng mở từ ý định giám sát, Cổng Đáng gom ở giám sát) — không có ngưỡng nghiệm
thu để đo.

## Out of scope

- Lịch sao lưu tự động (plist launchd): plist và `install-*` là làn ZCode — hàng sau, xin qua phiên liên làn.
- Xoá container cũ `one-invest-db-cu-*` và volume rỗng `db_oneinvest_pgdata`: không trong hàng này; sau ≥ 7 ngày hỏi Mạnh.
- Sửa script làn ZCode gọi compose (`pipeline/import.sh`, `pipeline/finalize-hanoi.sh`): sau merge chúng tự dùng compose mới.
- Nâng major PostgreSQL, đổi ảnh, đổi cổng; tạm gỡ job launchd trong lúc chuyển.
- Gỡ luật cấm compose trong `LUAT.md` của đợt — việc của giám sát khi hàng xong.

## Notes

- Không có bề mặt UI → không design-pass, không đặc tả UX, không eval ui-check (sổ quyết định).
- Lượt chuyển thật (AC-6…AC-10 trên `one-invest-db`) chỉ chạy ở S3 sau khi Mạnh ký Gate 1.5, có bằng chứng khôi phục
  bản sao lưu thật trên DB thử, và đã báo phiên điều phối liên làn.
- Sau chuyển, PR phải vào main trước CN 01/11 19:30 (job tuần là job duy nhất đi đường compose — design doc §3.4).
