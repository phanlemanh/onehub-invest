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
# 4c. Lối cuối (xoá dữ liệu — cần lời riêng của Mạnh như 4b): khôi phục DỮ LIỆU phạm vi S09 của hai bảng về đúng bản dump mục 1.
#     Dump vào DB phụ, rồi lui-4c.sh xử trong MỘT giao dịch: dòng 'vn__s09-danh-ba__%' của airbnb_snapshots + trọn stg_s09_danh_ba,
#     so dấu (số dòng + md5) với dump trước COMMIT; lệch → lùi trọn, thoát ≠ 0. Không DROP, không TRUNCATE bảng nào.
X=oneinvest_lui_da56_$G
docker exec -e PGPASSWORD=oneinvest one-invest-db createdb -U oneinvest -h localhost $X
docker exec -i -e PGPASSWORD=oneinvest one-invest-db pg_restore -U oneinvest -h localhost -d $X --exit-on-error --no-owner < $H/truoc-da56-$G.dump
bash _acceptance/nap-s09-quy-can-va-can-cao-tang/lui-4c.sh oneinvest $X    # in dấu dump · đích trước · đích sau; đích sau = dấu dump
docker exec -e PGPASSWORD=oneinvest one-invest-db dropdb -U oneinvest -h localhost $X
```

**Vì sao không `pg_restore --clean`** (S4 vòng 2, finding AC-10): `airbnb_snapshots` có 14 bảng stg của mọi nguồn trỏ khoá ngoại
`ON DELETE CASCADE` tới nó. `--clean` phát `DROP TABLE` không kèm CASCADE, nên DROP bị chặn; sau đó COPY chèn trùng khoá và hỏng, tức
bảng không về trạng thái trước. Nếu ai thêm CASCADE hay đổi sang TRUNCATE bảng này cho «chạy được», mọi stg của mọi nguồn sẽ bị xoá
dây chuyền. Bản sửa chỉ chạm dòng S09.

**Đã chạy thử** trên DB của lượt (bản chép DB máy thu): `bash db/db-thu.sh oneinvest_suite_lui_da56 --chay bash
_acceptance/nap-s09-quy-can-va-can-cao-tang/probes/lui-4c-thu.sh`. Kịch bản: dấu trước → mục 1 → mục 2 (130 hai lần + nạp mọi bản v16)
→ 4a → đối chứng lệnh 4c cũ (trên bản sao `createdb -T`) → 4c mới → dấu sau. Đầu ra: `evidence/lui-4c-thu.txt`.

Số chạy thử 27/11 10:3xZ (khoá s4 P1, bản chép DB máy thu): dấu phạm vi S09 trước `24 bản thu · 40 dòng stg`; sau áp 7 bản v16
`31 · 27.325`; sau 4c mới về đúng `24 · 40`, md5 trùng từng dòng. 14 bảng stg trỏ `airbnb_snapshots` và `airbnb_snapshots` (34.904)
giữ nguyên số dòng. Đối chứng: lệnh 4c cũ thoát 1 «cannot drop table public.airbnb_snapshots because other objects depend on it» —
và trước đó đã DROP được `stg_s09_danh_ba` (4a đã bỏ view nên không gì chặn): bảng stg MẤT trắng. Lệnh cũ không chỉ hỏng mà phá dữ liệu.

## 5. Lệnh kiểm sau

```bash
DATABASE_URL=$URL node pipeline/scripts/s09-v16-that.mjs --dem    # chỉ đọc: ô cố định, chia nối nút, quét http; thoát 0 = khớp
```

Rồi mở `/ops/registry` trên máy thu: ô «Quỹ căn S09» hiện cùng số lệnh trên in; mở một dự án đã nối có quỹ căn: khối «Quỹ căn đang bán».
Báo GS số thật cạnh số diễn tập của mục 2.
