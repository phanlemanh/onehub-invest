# Áp DA56 lên DB máy thu — năm thứ cho lời áp (ROADMAP §3 mục 50)

Chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp những gì dưới đây lên **DB máy thu** (`oneinvest` :5433, Mac mini): migration
**130** (ba view `v_s09_db_quy_can_doi_soat`, `v_s09_db_quy_can`, `v_s09_db_can_cao_tang`) và lượt nạp các bản thu S09 danh bạ
DATA-CONTRACT v16 (kind `quy-can`, `can-cao-tang`) vào `stg_s09_danh_ba`. Không bảng mới, không lượt dựng danh bạ (căn vào danh bạ là
DA43). Cloud không đổi: `stg_s09_danh_ba` và ba view không nằm trong danh sách đẩy của `pipeline/sync-cloud.mjs` (E9). Áp sau khi PR
DA56 gộp, từ `main`, ở checkout chính `~/dev/onehub-invest`; GS chạy lệnh, báo số thật cạnh số diễn tập (mục 2). Lệch thì DỪNG và
báo, không tự sửa cho khớp.

**Thứ tự và điều kiện trước.** Áp SAU DA42: 115 (bảng `stg_s09_danh_ba`) và 125 đã áp, lượt dựng đầu của DA42 đã chạy (bảng nối
`project_links` nguồn S09 có dòng — ô chia «nối nút · còn thẻ · ngoài danh mục» đọc bảng này). ZK đã chép các bản thu v16 từ thư mục
chờ vào `collector/snapshots/vn` (việc làn thu, sau khi DA56 gộp) và băm từng tệp khớp manifest.

**Không chạm job đêm.** Bộ nạp S09 chỉ chạy tay (không job launchd nào gọi `import-s09-danh-ba.mjs`); ba view chỉ được `/ops/registry`
đọc. Vẫn chọn khung 22:05–23:55 giờ VN như DA42, ngoài lượt nạp S03 15 phút và các lượt S03/S06 đầy.

Đặt biến, chạy từ `~/dev/onehub-invest`:

```bash
cd ~/dev/onehub-invest; H=~/onehub-backups/db; mkdir -p $H
P(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q; }
Q(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "$1"; }
URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest; G=$(date -u +%Y%m%dT%H%M%SZ)
V16=$(for d in collector/snapshots/vn/vn__s09-danh-ba__*; do node -e 'const m=require(process.argv[1]+"/manifest.json");process.exit(m.schemaVersion===16?0:1)' "$PWD/$d" && basename $d; done)
echo "$V16"   # danh sách bản thu v16 sẽ nạp — phải trùng danh sách của mục 2
```

## 1. Sao lưu trước (bắt buộc, trước mọi ghi)

```bash
Q "SELECT concat_ws('|', to_regclass('public.stg_s09_danh_ba'), to_regclass('public.v_s09_db_quy_can'))"   # «stg_s09_danh_ba|» — có 115, chưa có 130
Q "SELECT kind, count(*) FROM stg_s09_danh_ba WHERE kind IN ('quy-can', 'can-cao-tang') GROUP BY 1"         # 0 dòng
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -Fc -t stg_s09_danh_ba -t airbnb_snapshots oneinvest > $H/truoc-da56-$G.dump && ls -la $H/truoc-da56-$G.dump
```

Bản dump hai bảng là lối cuối của mục 4. Ba view mới, không có dữ liệu cũ của chúng để sao lưu.

## 2. Lệnh áp — 130 hai lần, rồi nạp từng bản thu v16

```bash
P < db/migrations/130_v_s09_db_quy_can.sql; P < db/migrations/130_v_s09_db_quy_can.sql
for b in $V16; do DATABASE_URL=$URL node pipeline/import-s09-danh-ba.mjs collector/snapshots/vn/$b --may-thu; done
Q "SELECT snapshot_id, kind, count(*) FROM stg_s09_danh_ba WHERE kind IN ('quy-can', 'can-cao-tang') GROUP BY 1, 2 ORDER BY 1, 2"
```

Bộ nạp kiểm băm từng tệp trước khi ghi (sai băm → lượt dừng, 0 dòng), bỏ `galleries`, `geolocation` của từng căn quỹ căn và in «bỏ khoá
tầng A ở n căn». Nguồn thêm một khoá chưa có trong bảng kiểm kê (`pipeline/lib/s09-danh-ba-v16-khoa.json`) → lượt dừng nêu tên khoá: DỪNG,
báo GS; thêm khoá vào bảng là một PR, không sửa tay trên máy.

**Số diễn tập** (bản chép DB máy thu, `pipeline/scripts/s09-v16-that.mjs`, xem `evidence/E5` của hồ sơ): số dòng mỗi bản thu × kind bằng
bộ đếm độc lập và `manifest.counts.items`; quỹ căn **1.294 căn · 40 dự án · 1.268 có giá**; đối soát bản hỏng
`…T024022939`: 0 dòng `du` rỗng; 40 dự án chia **24 nối nút · 6 còn thẻ · 10 chưa có trong danh mục**; 0 dòng stg hai kind có `http`.
Bản thu đêm 25–26/11 trở đi thêm tầng căn cao tầng: số căn cao tầng của lượt áp lấy theo bảng của bộ đo chạy NGAY trước lượt áp (mục 5).

## 3. Không có lượt dựng

DA56 chỉ nạp stg và thêm view. Căn quỹ căn hay căn cao tầng KHÔNG vào bảng `units` ở lượt này (DA43).

## 4. Cách lùi

Mỗi nấc lùi được, không đụng dữ liệu nào ngoài lớp stg của hai kind v16 (stg nạp lại được từ raw snapshot bất biến):

```bash
# 4a. Ẩn khỏi màn mà không xoá gì: bỏ view quỹ căn → lớp đọc thấy to_regclass rỗng, trang không hiện ô và khối quỹ căn.
Q "DROP VIEW IF EXISTS v_s09_db_quy_can; DROP VIEW IF EXISTS v_s09_db_quy_can_doi_soat; DROP VIEW IF EXISTS v_s09_db_can_cao_tang"
# 4b. Bỏ dòng stg của các bản thu v16 (xoá dữ liệu — cần lời riêng của Mạnh): xoá dòng airbnb_snapshots kéo theo stg (ON DELETE CASCADE).
Q "DELETE FROM airbnb_snapshots WHERE snapshot_id = ANY(string_to_array('$(echo $V16 | tr ' ' ',')', ','))"
# 4c. Lối cuối: khôi phục hai bảng từ bản dump của mục 1.
docker exec -i -e PGPASSWORD=oneinvest one-invest-db pg_restore -U oneinvest -h localhost -d oneinvest --clean -t stg_s09_danh_ba -t airbnb_snapshots < $H/truoc-da56-$G.dump
```

## 5. Lệnh kiểm sau

```bash
DATABASE_URL=$URL node pipeline/scripts/s09-v16-that.mjs --dem    # chỉ đọc: ô cố định, chia nối nút, quét http; thoát 0 = khớp
```

Rồi mở `/ops/registry` trên máy thu: ô «Quỹ căn S09» hiện cùng số lệnh trên in; mở một dự án đã nối có quỹ căn: khối «Quỹ căn đang bán».
Báo GS số thật cạnh số diễn tập của mục 2.
