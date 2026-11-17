# Áp DA37 lên DB máy thu — năm thứ cho lời áp (ROADMAP §3 mục 50)

Chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp những gì dưới đây lên **DB máy thu** (`oneinvest` :5433): migration **111**, một
lượt dựng năm khu theo luật «S16 thắng cấu trúc» (Q-B). **Áp thẻ luật phân khu S16 (bước 1c) KHÔNG nằm trong chữ ký**: đó là lời
riêng của Mạnh, gõ sau khi đã xem thẻ — «Áp thẻ luật S16 <băm>» (khuôn thẻ luật DA32). Cloud không đổi: `v_toa_nut_vung`,
`v_lech_cau_truc_s16` và bảng vật thể danh bạ không lên cloud.

**Điều kiện lúc áp.** Sau khi PR DA37 gộp và checkout chính `~/dev/onehub-invest` đã kéo `main`; GS chạy lệnh và báo số thật cạnh
số chạy thử. Chạy bước 3 → 1d liền một mạch trong khung **22:05–23:55 giờ VN** (Chủ nhật 20:30–23:55): ngoài lượt nạp S03 15 phút
(07:00–22:00), S06 (05:30, 14:00), Zalo 00:00, các lượt `refresh-bait-gap` (00:00, 05:30, 06:00, 12:00, 14:00, 18:00). Lượt đêm
dựng S16 cho cả năm khu (sau DA33, `khuDaDung` trả năm khu) — nó chạy luật mới ngay khi mã đã ở `main`, kể cả khi bước 1d chưa
chạy tay. Vì thế **gộp PR trong khung áp**, hoặc chấp nhận rằng lượt đêm đầu tiên sau gộp làm phần 1d (khi đó lấy mốc từ dòng log
`S16: khoá mới n, mốc t` của job — xem 1d).

## 1. Lệnh áp

Mọi lệnh chạy ở `~/dev/onehub-invest`. `Q` đọc, `P` ghi:

```bash
cd ~/dev/onehub-invest
Q(){ docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "$1"; }
P(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q; }
L=_acceptance/danh-ba-s16-thang-cau-truc/lui
```

### 1a. Áp 111 (hai lần — lần hai phải sạch)

```bash
P < db/migrations/111_v_toa_nut_vung_s16.sql
P < db/migrations/111_v_toa_nut_vung_s16.sql
Q "SELECT to_regclass('v_lech_cau_truc_s16') IS NOT NULL,
          (SELECT count(*) FROM v_toa_nut_vung WHERE nguon = 's16_phan_khu')"          # phải in t|0 (chưa có luật nào)
```

111 chỉ có `CREATE OR REPLACE VIEW` cho `v_toa_nut_vung` (thêm cột nguồn `s16_phan_khu` đứng đầu, cùng tên, kiểu, thứ tự cột với
bản 097) và `CREATE OR REPLACE VIEW v_lech_cau_truc_s16`. Không bảng, không chỉ mục, không đổi dòng nào. Trước bước 1c, view cho
đúng kết quả của bản 097 (không nút nào mang khoá khu S16).

### 1b. Dựng thẻ luật phân khu S16 — chỉ đọc

```bash
DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest \
  node pipeline/phan-khu-s16.mjs --the ~/onehub-backups/db/the-phan-khu-s16-$(date -u +%Y%m%dT%H%M%SZ).md
```

Lệnh in `thẻ: <n> khu, băm <hex>`. Thẻ liệt mỗi khu S16 một dòng: dự án, tên khu, số toà, và nút nhận — «nút sẵn» (phân khu đã có
cùng tên chuẩn hoá), «nút mới» (đúc khi áp), «mơ hồ» (trùng hai nút trở lên — không gán, cần người). Không in mã khu của nguồn.
Gửi thẻ cho Mạnh. Số chạy thử ở phần 2: 61 khu, 0 mơ hồ.

### 1c. Áp thẻ luật — CHỈ sau lời Mạnh «Áp thẻ luật S16 <băm>»

```bash
DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest \
  node pipeline/phan-khu-s16.mjs --ap --bam <băm Mạnh gõ> --nguoi Mạnh
```

Băm lệch thẻ hiện tại (dữ liệu đổi giữa lúc dựng thẻ và lúc áp) → không ghi gì, dựng thẻ lại. Áp ghi một dòng `project_link_rules`,
thêm khoá khu vào `meta.s16_khu_ids` của nút sẵn và đúc nút phân khu mới (`catalog_tier xac_minh`). In `đã áp luật <rule_id>: <n>
khu` — **ghi lại `rule_id`**: đường lùi cần nó. Không đổi dòng toà nào: toà vào phân khu qua view (`region_node_id` của `buildings`
giữ nguyên, rào chỉ-thêm 082 không bị chạm).

### 1d. Dựng năm khu theo luật S16 thắng cấu trúc

```bash
T0=$(Q "SELECT now()")
node pipeline/danh-ba-vat-the.mjs --db postgres://oneinvest:oneinvest@localhost:5433/oneinvest --db-that --sao-luu <tệp ở bước 3> \
  --khu vinhomes-ocean-park-1,vinhomes-ocean-park-2,vinhomes-ocean-park-3,vinhomes-smart-city,vinhomes-grand-park
T1=$(Q "SELECT now()")
```

Lệnh in một dòng `tong_ket {…}`: chép nguyên vào báo cáo áp; `s16.moc` trong dòng ấy là mốc giao dịch của lượt dựng. Ghi tệp khoá
do chính lượt này tạo hay đổi — đầu vào của đường lùi:

```bash
bash $L/ghi-khoa.sh '<s16.moc>' "$T0" "$T1" > ~/onehub-backups/db/khoa-da37-$(date -u +%Y%m%dT%H%M%SZ).tsv
grep -v '^#' ~/onehub-backups/db/khoa-da37-*.tsv | cut -f1 | sort | uniq -c     # phải: 2 gop · 2 the · 2 units · 2 registry_aliases
```

Lượt đêm làm phần này trước (gộp PR ngoài khung) → lấy mốc từ dòng `S16: khoá mới n, mốc t` trong log của job, `T0`/`T1` là giờ
đầu và cuối của job; `ghi-khoa.sh` vẫn tách đúng vì mọi dòng của một giao dịch mang cùng `now()`.

### 1e. Kiểm sau

```bash
Q "SELECT count(*) FROM v_toa_nut_vung v JOIN asset_nodes n ON n.id = v.region_node_id
    WHERE n.node_type = 'project' AND v.building_key IN (SELECT object_key FROM registry_aliases
          WHERE source = 'S16' AND kind = 'ma_nguon' AND retired_at IS NULL AND object_key LIKE 'bld\_%')"   # phải 0 (trước: 109)
Q "SELECT evidence ->> 'loai', status, count(*) FROM review_queue WHERE item_id LIKE 's16:%' GROUP BY 1, 2 ORDER BY 1, 2"
      # phải: can-lech-toa|rejected|2 · can-mo-ho|pending|38 · toa-trung-ten|pending|20
Q "SELECT count(*) FROM units WHERE status = 'merged' AND merged_into IN (SELECT object_key FROM registry_aliases WHERE source = 'S16')"  # 2
Q "SELECT * FROM v_lech_cau_truc_s16 ORDER BY 1, 2, 3"                         # bảng lệch theo cặp nguồn — chép vào báo cáo
```

Chạy lại bước 1d một lần nữa: `tong_ket` phải có `khoa_moi` 0 và `s16.khoa_moi` 0.

## 2. Số chạy thử

Lượt đo `node pipeline/scripts/danh-ba-s16-cau-truc-that.mjs` (E2b, E9, E10) trên bản chép DB máy thu (`db/db-thu.sh`, xoá khi
xong): đúng chuỗi 111 → thẻ → áp băm → dựng năm khu → dựng lần hai → đường lùi có đích; DB máy thu chỉ bị đọc (pg_dump).

Lượt 18/11 (bản chép từ DB máy thu sáng 18/11, sau khi DA33 đã áp), thoát 0, mọi ô khớp bảng kỳ vọng AC-10:

| Ô | Trước | Sau |
|---|---|---|
| Toà S16 có đúng một khu trong bản thu có danh sách khu (E2b) | 218 / 218 | — |
| Khu S16 trên thẻ luật | — | **61** (GP 12, OP1 16, OP2 13, OP3 9, Smart City 11) |
| Nút nhận | — | **61** = 51 nút mới + 10 nút sẵn; 0 mơ hồ |
| Toà S16 mà nút vùng là dự án | **109** | **0** |
| Toà đổi `region_node_id` trong bảng `buildings` | — | 0 (toà vào phân khu qua view) |
| Căn S08 gộp vào căn S16 (`merged`) | 0 | **2** (Grand Park) — lượt dựng đúc 2 căn S16, 2 bí danh |
| Thẻ «căn S08 cùng mã nằm ở toà khác» | 2 pending | 2 `rejected`, ghi chú «S16 thắng cấu trúc (DA37)» |
| Thẻ «căn có mã nằm dưới nhiều toà» / «toà S16 trùng tên» | 38 / 20 pending | 38 / 20 pending (không đổi) |
| Dựng lần hai | — | 0 khoá mới |

Lệch cấu trúc theo cặp nguồn (`v_lech_cau_truc_s16`, sau áp): Grand Park — S08↔S16 căn lệch toà 2, tên toà 34; S09↔S16 phân khu
19, tên toà 26. Ocean Park — S08↔S16 tên toà 11; S09↔S16 phân khu 38, tên toà 38. Đây là số đếm cho người xem, không sinh thẻ.

**Đường lùi trên cùng bản chép:** `ghi-khoa.sh` theo mốc của lượt một: 2 gop · 2 the · 2 units · 2 registry_aliases · 0 khẳng định
· 0 toà, trục, thẻ mới. `go-khoa.sh` với tệp của DB khác: thoát 4. `go-khoa.sh` → `--dao <rule_id>` → `lui-111.sql`: dấu vân tay
**trùng** trước áp; phần dư có chủ đích: 51 nút luật mang `meta.nghi`, 1 dòng luật có `dao_at`. Đối chứng: sửa một thẻ lệch không
về pending thì dấu vân tay bắt được (dòng `review_queue` lệch).

Thời gian: cả lượt 16 phút, gần hết là bước chép DB; áp 111, thẻ, áp, dựng hai lần và lùi chạy trong vài chục giây.

## 3. Sao lưu trước áp

Ngay trước bước 1a, sau một lượt thu đã xong. `pg_dump` chạy trong container (máy chủ không có `pg_dump` đúng bản):

```bash
mkdir -p ~/onehub-backups/db
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -Fc oneinvest \
  > ~/onehub-backups/db/truoc-111-s16-$(date -u +%Y%m%dT%H%M%SZ).dump
ls -la ~/onehub-backups/db/truoc-111-s16-*.dump        # phải khác 0 byte; bộ dựng ở 1d cũng tự kiểm
bash $L/dau-van-tay.sh oneinvest > ~/onehub-backups/db/van-tay-truoc-da37.txt
```

## 4. Cách lùi

**Đường lùi có đích — CẦN lời Mạnh lúc lùi.** Chữ ký phủ việc ÁP; chạy đường lùi chỉ khi Mạnh gõ lời lùi lúc đó, không ai tự chạy.
`go-khoa.sh` tắt rào chỉ-thêm của `buildings`, `stacks`, `units`, `registry_aliases` **trong một giao dịch** (sửa luật an toàn danh
bạ), mọi bước đếm số dòng đổi bằng số khoá trong tệp, lệch thì lùi trọn. Thứ tự:

```bash
bash $L/go-khoa.sh ~/onehub-backups/db/khoa-da37-<thời điểm>.tsv oneinvest
        # 1) căn S08 đã gộp → active, merged_into NULL (rào 082 cho đổi hai cột này)
        # 2) thẻ lệch đã cho nghỉ → pending, xoá ghi chú, người, giờ quyết
        # 3) khẳng định field_assertions của lượt → RÚT (retracted_at + 'lui-da37'; rào 045 cấm xoá — DA33 Ngoài-5)
        # 4) gỡ thẻ, bí danh, căn, trục, toà mới của lượt (rào tắt rồi bật lại trước COMMIT)
DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node pipeline/phan-khu-s16.mjs --dao <rule_id> --nguoi Mạnh
P < $L/lui-111.sql                                         # view về bản 097, bỏ v_lech_cau_truc_s16
bash $L/dau-van-tay.sh oneinvest | grep -v '^# du' | diff <(grep -v '^# du' ~/onehub-backups/db/van-tay-truoc-da37.txt) -
        # phải không in gì; dòng «# du» là phần dư có chủ đích (nút luật mang meta.nghi, dòng luật có dao_at)
```

Tệp khoá ghi tên DB và mốc; `go-khoa.sh` từ chối (thoát 4, không mở giao dịch) khi DB đích khác DB trong tệp hoặc tệp thiếu dòng
ấy. Dấu vân tay so lược đồ `public`, băm `buildings`, `stacks`, `units`, `registry_aliases`, `review_queue`, `field_assertions` (trừ
hai cột rút) và `v_toa_nut_vung`. **Phần dư có chủ đích:** đảo thẻ luật không xoá nút phân khu đã đúc (danh bạ chỉ thêm) mà đánh
`meta.nghi = true` — view bỏ qua nút nghỉ; dòng `project_link_rules` giữ, mang `dao_at`/`dao_by`. Khẳng định đã rút vẫn nằm trong
bảng (rào 045). Giới hạn: thẻ S16 có người duyệt giữa lúc áp và lúc lùi thì `go-khoa.sh` lệch đếm và lùi trọn — khi ấy dùng lối cuối.

**Chỉ lùi thẻ luật (giữ 111 và lượt dựng).** Chỉ chạy `--dao <rule_id>`: toà S16 trở về nút cũ (luật 097) ngay trên view.

**Lối cuối — khôi phục bản sao lưu** (khi không có lời tắt rào, hoặc dấu vân tay sau lùi lệch):

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db pg_restore -U oneinvest -h localhost -d oneinvest --clean --if-exists \
  < ~/onehub-backups/db/truoc-111-s16-<thời điểm>.dump
```

**Giá:** mất mọi dòng ghi vào DB máy thu sau lúc sao lưu (lượt nạp S03, S06, Zalo, thẻ đã duyệt); nạp lại được từ bản thu gốc
nhưng tốn một lượt nạp và các bước sau nó.

## 5. Lệnh kiểm sau

Bước 1e. Số thật phải bằng số chạy thử ở phần 2; lệch thì DỪNG và báo, không tự sửa cho khớp. Báo số thật cạnh số chạy thử vào
kênh của đợt.

**Bài học sổ nguồn (GS, DA33):** mọi lệnh kiểm có tên ràng buộc dùng `conrelid = 'public.<bảng>'::regclass`; tên nguồn thật
(`source_registry.real_name`, `source_ids`) là tầng A — không chép vào báo cáo, kênh hay PR.
