# Áp DA42 lên DB máy thu — năm thứ cho lời áp (ROADMAP §3 mục 50)

Chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp những gì dưới đây lên **DB máy thu** (`oneinvest` :5433, Mac mini): migration
**115** (bảng `stg_s09_danh_ba` + bốn view) và **125** (view dự án đọc `province_code`), lượt nạp ba bản thu S09 danh bạ, và **lượt
dựng đầu** đúc nút ứng viên, toà S09 gói 1 vào danh bạ. Cloud không đổi: `stg_s09_danh_ba` và bảng vật thể danh bạ không nằm trong
danh sách đẩy của `pipeline/sync-cloud.mjs` (E9). Áp sau khi PR DA42 gộp, từ `main`, ở checkout chính `~/dev/onehub-invest`; GS chạy
lệnh, báo số thật cạnh số diễn tập (mục 5). Lệch thì DỪNG và báo, không tự sửa cho khớp.

**Điều kiện trước.** NK1 (migration 122) đã áp và E9 đã chạy lại trên nhánh sau đó (bộ soát tầng A biết tên S09). Lượt kiểm chuyển
máy xanh. Mã của DA42 có rào «chưa áp 115 hoặc 125 thì bỏ bước S09 gói 1» (`daAp115Va125`, T3b), nên gộp trước áp không đổi lượt
dựng đêm nào.

**Ghi dữ liệu hằng đêm.** Từ lúc 115 + 125 đã áp VÀ `stg_s09_danh_ba` có danh mục, mọi job có bước `refresh-bait-gap` (00:00 S03 hai kênh;
05:30, 14:00 S06; 06:00, 12:00, 18:00 S03) gọi `buocVatTheDem` → `dung()` → `buocS09DanhBa` trong giao dịch của nó: tự đúc
nút ứng viên, toà S09 — không mốc, không tệp khoá. Vì thế **mục 2 → 3 chạy liền một mạch trong khung 22:05–23:55 giờ VN**, ngoài các
lượt ấy và lượt nạp S03 15 phút (07:00–22:00). Cách tắt bước này mà không xoá gì: mục 4a.

Tệp của hồ sơ ở `_acceptance/nap-s09-toa-tang-vao-danh-ba/ap-may-thu/`: `dien-tap.sh` (chạy trọn chuỗi này trên bản chép rồi lùi),
`dau-van-tay.sh`, `lui-dung.sh`, `lui-nap.sql`, `lui-luoc-do.sql`. Tệp khoá dùng lại `_acceptance/nap-s16-vao-danh-ba/lui/ghi-khoa.sh`
(DA33, đã trên `main`). Đặt `H=~/onehub-backups/db` và `A=_acceptance/nap-s09-toa-tang-vao-danh-ba/ap-may-thu`, chạy từ
`~/dev/onehub-invest`:

```bash
cd ~/dev/onehub-invest; H=~/onehub-backups/db; A=_acceptance/nap-s09-toa-tang-vao-danh-ba/ap-may-thu; mkdir -p $H
P(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q; }
Q(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "$1"; }
URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest; G=$(date -u +%Y%m%dT%H%M%SZ)
```

## 0. Sao lưu trước (bắt buộc, trước mọi ghi)

```bash
Q "SELECT concat_ws('|', to_regclass('public.stg_s09_danh_ba'), to_regclass('public.v_s09_db_item_moi'),
   to_regclass('public.v_s09_db_du_an'), to_regclass('public.v_s09_db_toa'), to_regclass('public.v_s09_db_tang'))"   # phải in dòng rỗng
pg_dump -U oneinvest -h localhost -p 5433 -Fc oneinvest > $H/truoc-da42-$G.dump && ls -la $H/truoc-da42-$G.dump   # khác 0 byte
bash $A/dau-van-tay.sh oneinvest > $H/van-tay-truoc-da42-$G.txt
Q "COPY (SELECT * FROM project_links WHERE source = 'S09' ORDER BY source_project_id) TO STDOUT" > $H/project-links-s09-truoc-da42-$G.tsv
```

Bảng và bốn view đều mới, không có dữ liệu cũ của chúng để sao lưu. Bản dump trọn là lối cuối của mục 4. Đo 24/11 trên máy thu (chỉ
đọc): năm đối tượng vắng, 0 bản thu `vn__s09-danh-ba__*` trong `airbnb_snapshots`, 0 dòng `project_links` nguồn S09, 307 toà.

## 1. Lệnh áp — 115 rồi 125, mỗi tệp hai lần

```bash
P < db/migrations/115_stg_s09_danh_ba.sql; P < db/migrations/125_v_s09_db_du_an_ma_tinh.sql
P < db/migrations/115_stg_s09_danh_ba.sql; P < db/migrations/125_v_s09_db_du_an_ma_tinh.sql
Q "SELECT pg_get_viewdef('v_s09_db_du_an'::regclass) LIKE '%province_code%'"            # t
DATABASE_URL=$URL node pipeline/scripts/danh-ba-s09-toa-that.mjs --dem --ghi-truoc $H/moc-truoc-da42-$G.json
```

Lần hai không đổi lược đồ (diễn tập so băm lược đồ `public` giữa hai lần). Áp 125 sau 115 là bắt buộc: 115 dựng view dự án đọc
`province.code` (bản thu thật ghi `province_code`), 125 thay đúng view ấy. Dòng cuối ghi mốc trước lượt dựng (khoá toà có sẵn, số
toà mỗi nút dự án) — chỉ đọc; mốc ấy là mẫu số để tách toà «bí danh» với «tạo mới» ở mục 3. Từ đây tới mục 2 không có gì để dựng:
bước S09 gói 1 in «chưa có danh mục» và bỏ qua.

## 2. Nạp ba bản thu (ZCode qua LL, `--may-thu`) — trong khung 22:05–23:55

ZCode chạy, gọi ĐÍCH DANH ba bản; KHÔNG nạp `vn__s09-danh-ba__2026-11-19T211829028` (lượt hỏng ZCode khai «không nạp»; manifest không
ghi `error` nên bộ nạp không tự từ chối):

```bash
for b in 2026-11-19T004959637 2026-11-20T015947402 2026-11-20T052953464; do
  DATABASE_URL=$URL node pipeline/import-s09-danh-ba.mjs collector/snapshots/vn/vn__s09-danh-ba__$b --may-thu
done
Q "SELECT snapshot_id, kind, count(*) FROM stg_s09_danh_ba GROUP BY 1, 2 ORDER BY 1, 2"
Q "SELECT count(*) FROM stg_s09_danh_ba WHERE snapshot_id = 'vn__s09-danh-ba__2026-11-19T211829028'"   # 0; khác 0 → DỪNG, báo GS
```

| Bản thu | danh-muc | toa | khu-thap-tang | tang | can-thap-tang | Tổng = `counts.items` |
|---|---|---|---|---|---|---|
| 2026-11-19T004959637 | 1 | 221 | 221 | 928 | 91 | 1.462 |
| 2026-11-20T015947402 | 0 | 0 | 0 | 0 | 2.868 | 2.868 |
| 2026-11-20T052953464 | 0 | 0 | 0 | 0 | 2.621 | 2.621 |

Tổng 6.951 dòng. Chạy bộ nạp lần hai trên một bản: 0 dòng mới. Lỡ nạp bản hỏng: số căn không sai (transform hợp theo `data[].id`,
DA42 không đọc kind `can-thap-tang`) nhưng bảng lệch 4 dòng — dừng và báo, không sửa cho khớp.

## 3. Lượt dựng đầu — NGAY sau mục 2

```bash
Q "SELECT count(*) FROM registry_aliases WHERE source = 'S09' AND value LIKE 'danh-ba-toa/%'"   # 0; khác 0 = job đêm đã dựng → xem dưới
T0=$(Q "SELECT now()")
node pipeline/danh-ba-vat-the.mjs --db $URL --db-that | grep '^tong_ket'     # chép nguyên dòng vào báo cáo áp
T1=$(Q "SELECT now()")
bash _acceptance/nap-s16-vao-danh-ba/lui/ghi-khoa.sh "$T0" "$T1" > $H/khoa-da42-$G.tsv
grep -v '^#' $H/khoa-da42-$G.tsv | cut -f1 | sort | uniq -c
```

Không cần `--sao-luu` (máy thu đã có toà; cờ ấy chỉ đòi ở lần dựng đầu của danh bạ). `--khu` để mặc định: bước S09 gói 1 không đọc
khu — nó đi qua mọi dự án trong danh mục gói 1. Bộ dựng chạy một giao dịch nên mọi dòng nó chèn mang cùng mốc `now()`; `ghi-khoa.sh`
chỉ lấy dòng đúng mốc ấy. Câu kiểm đầu khác 0 (job đêm chen vào giữa mục 2 và 3): bỏ lệnh dựng, lấy `T0` là lúc nạp xong, `T1` là
bây giờ, chạy `ghi-khoa.sh` như trên — nó vẫn tách đúng một lượt (dừng nếu toà mới mang hơn một mốc).

## 4. Cách tắt và cách lùi

**4a. Tắt bước S09 gói 1, không xoá gì** (khi cần dừng lượt đêm đúc thêm): áp lại riêng tệp 115. Nó `CREATE OR REPLACE` view dự án về
bản đọc `province.code`; rào `daAp115Va125` thấy thiếu 125 và in «S09 gói 1 bỏ qua — DB chưa áp 125», các bước khác của lượt dựng
chạy như cũ. Bật lại: áp lại tệp 125. Dữ liệu đã đúc giữ nguyên.

```bash
P < db/migrations/115_stg_s09_danh_ba.sql      # tắt;   bật lại: P < db/migrations/125_v_s09_db_du_an_ma_tinh.sql
```

**4b. Lùi trọn — CẦN lời Mạnh lúc đó** (tắt rào chỉ-thêm là sửa luật an toàn danh bạ; xoá `stg` là xoá dữ liệu). Chữ ký phủ việc
ÁP; CHẠY đường lùi chỉ khi Mạnh gõ lời lùi. Một giao dịch `lui-dung.sh`: đưa `project_links` nguồn S09 về bản chụp mục 0, tắt rào
hàng của `buildings`, `stacks`, `units`, `registry_aliases`, gỡ đúng các khoá trong tệp khoá (mỗi bảng số xoá phải bằng số khoá, lệch
thì lùi trọn), bật rào lại rồi mới COMMIT. Từ chối (thoát 4, không mở giao dịch) khi tệp khoá của DB khác; có khẳng định
(`field_assertions`) thì thoát 5 — dùng lối cuối.

```bash
bash $A/lui-dung.sh $H/khoa-da42-<G>.tsv $H/project-links-s09-truoc-da42-<G>.tsv oneinvest   # gỡ lượt dựng
P < $A/lui-nap.sql                                                                             # gỡ ba bản thu (cascade sang stg)
P < $A/lui-luoc-do.sql                                                                         # bỏ bốn view + bảng
bash $A/dau-van-tay.sh oneinvest | diff $H/van-tay-truoc-da42-<G>.txt -                         # phải không in gì
```

Đường lùi trùng dấu vân tay chỉ khi không lượt nào khác ghi vào mười bảng ấy giữa lúc áp và lúc lùi; trên máy thu thật thường
có (thẻ duyệt, lượt nạp) — khi đó `diff` lệch đúng ở các bảng ấy, đối chiếu tay với GS. Thẻ S09 đã có người duyệt giữa áp và lùi
thì quyết định mất cùng thẻ. Chỉ lùi nạp (chưa dựng): `lui-nap.sql` rồi `lui-luoc-do.sql`. Chưa nạp: chỉ `lui-luoc-do.sql`.

**Lối cuối — ĐÃ GẠCH** (GS 27/11, sau finding AC-10 của DA56). Trước đây ghi `pg_restore --clean --if-exists` bản dump toàn DB lên
`oneinvest` đang sống. Nay: «4b hỏng thì giao dịch tự lùi; DỪNG, báo GS; KHÔNG pg_restore lên DB sống. Khôi phục toàn DB từ dump là
việc không lùi được, chỉ làm khi có lời riêng của Mạnh cho đúng lần đó.» Lý do: 14 bảng stg của mọi nguồn trỏ khoá ngoại `ON DELETE
CASCADE` vào `airbnb_snapshots`, lệnh không `--exit-on-error` nên có thể để DB nửa chừng, và lối này chưa từng chạy thử.

## 5. Lệnh kiểm sau và số chạy thử

```bash
DATABASE_URL=$URL node pipeline/scripts/danh-ba-s09-toa-that.mjs --dem --truoc $H/moc-truoc-da42-$G.json   # dòng cuối «--dem: ĐẠT»
DATABASE_URL=$URL node pipeline/scripts/danh-ba-s09-chuong-ten-lech.mjs                                    # in 0
```

`--dem` là lệnh đếm chỉ đọc của hợp đồng (§Đường đo): giao dịch read-only, không áp, không nạp, không dựng; in E2 (stg · đọc
thẳng bản thu · số nguồn khai), E10 (phép cộng dự án và toà từng phần, bốn ngưỡng, mẫu số 110 mã cũ, 65 toà gom, 0 bí danh lệch tầng,
0 toà hai UPI, S09 tạo 0 căn) và E12 (0 nút trùng nơi, 0 nút đã có bị giảm toà). Chuông DA57 chạy lại sau mỗi lượt nạp S16 mới tới
khi DA57 gộp; khác 0 thì báo GS.

**Số chạy thử** — `dien-tap.sh` chạy trọn mục 0 → 5 trên bản chép rồi đi trọn đường lùi 4b, so dấu vân tay. Dựng lại NGAY TRƯỚC khi
áp (`BAN=chep bash $A/dien-tap.sh`, bản chép mới của máy thu qua `db/db-thu.sh`) vì danh bạ đổi giữa chừng; số thật sau áp phải
bằng số của lượt ấy.

| | Diễn tập 24/11 (bản mẫu) | Thật sau áp |
|---|---|---|
| Nạp | _(điền sau lượt diễn tập)_ | |
| Dự án 221 = phần | | |
| Toà 928 = phần | | |
| Tầng | | |
| Ngưỡng: tỉ lệ vào · chờ thẻ · mã hỏng · mã cũ | | |
| E12 · chuông | | |
| Tệp khoá (bảng · số) | | |
| Dựng lần hai | | |
| Lùi: dấu vân tay · rào | | |

Số T5 trên bản chép (22/11, `danh-ba-s09-toa-that.mjs --tran-phut 40`, ĐẠT, sau nhánh mã cũ trước tên): nạp 6.951 · E2 dự án 221,
toà 928, tầng 23.708 ba cột khớp · dự án 221 = nối tay 2 + ứng viên 170 + chờ thẻ luật 13 + chờ thẻ cặp 36 · toà 928 = bí danh 112 +
tạo mới 547 + chờ thẻ 6 + chưa nối 247 + khong_iso 16 · tỉ lệ vào 0,9763 · chờ thẻ 0,0088 · mã hỏng 0 · nối mã cũ 110/110 · gom 65 ·
0 bí danh lệch tầng · 0 toà hai UPI · S09 tạo 0 căn · E12 0 nút trùng nơi · chạy lại cùng số · chuông 0.

**Giới hạn đã biết.** 11 dự án gói 1 mang mã tỉnh cũ 74, 77 (trước sáp nhập) không có trong `iso_regions`: 16 toà của dự án đã nối
không đúc được (`khong_iso`) — hàng DA54. Khu và căn thấp tầng ngoài phạm vi (Mạnh 19/11 «Chỉ làm cao tầng»). Toà S09 đúc trước khi
S16 về mà sau đó lệch tầng với toà S16 cùng tên vẫn giữ bí danh tên — chuông đo nó, DA57 sửa.
