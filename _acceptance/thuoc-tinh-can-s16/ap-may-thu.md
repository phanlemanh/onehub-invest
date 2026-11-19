# Áp lên DB máy thu — thuoc-tinh-can-s16 (DA40)

Áp SAU khi PR gộp, từ checkout chính ở `main`. Chữ ký Cổng Bằng chứng phủ đúng những bước dưới đây (AGENTS «Ai quyết gì»).
Điều kiện trước: bộ nạp của làn thu đã nạp snapshot `mngt-can-chi-tiet` vào `stg_s16_can_chi_tiet` (DATA-CONTRACT v14) —
bộ nạp cần bảng của 113, nên thứ tự là: (1) áp 113 → (2) làn thu nạp → (3) chạy thử → (4) `--ghi` → (5) kiểm sau.

## 0. Khung giờ, người chạy, việc sau khi áp

- **Khung giờ áp:** 22:30–23:30 giờ máy thu (giờ Việt Nam). Lượt nạp S03 15 phút dừng lúc 22:00 và job `zalo-import` chạy lúc 00:00, nên khung này
  không trùng job ghi lớn; `cloud-sync` (15 phút) và `ops-apply` (60 giây) vẫn chạy, 113 chờ khoá ngắn trên `field_assertions`. Quá 23:30 mà chưa xong
  bước 2 thì dừng ở bước đang làm, báo giám sát, không chạy `--ghi` chồng lên job 00:00.
- **Job đêm không làm thay bước nào:** không job launchd nào gọi bộ nạp hay lệnh `--ghi` của hàng này. Cả 113, 118, lượt nạp và `--ghi` đều chạy tay, một lần;
  lần thu S16 về sau muốn lên màn thì phải chạy lại lượt nạp và `--ghi`.
- **Bộ nạp:** `pipeline/import-s16-chi-tiet.mjs` của làn thu (@e0e3c1042) đã nằm trong nhánh này, vào `main` cùng PR.
- **Ai chạy:** phiên P1 áp 113, 118, chạy thử, `--ghi` và lệnh kiểm sau. **ZCode** chạy lượt nạp thật lên máy thu theo lời GIAO triển khai riêng do điều phối liên
  làn gửi, giữa bước áp 118 và bước chạy thử; P1 chờ `tin XONG` của lượt nạp rồi mới đi tiếp.
- **Sau khi áp, GS báo mọi dãy gộp `main`:** DB chung đổi lược đồ thì nhánh chưa nhận `main` có thể đỏ test (áp 111 + 114 ngày 18/11 làm 12 ca app đỏ trên nhánh chưa nhận `main`).

## 1. Sao lưu trước

```bash
mkdir -p ~/dev/onehub-invest/state/sao-luu
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -d oneinvest -Fc \
  -t field_assertions -t ref_lookup > ~/dev/onehub-invest/state/sao-luu/truoc-113-$(date -u +%Y%m%dT%H%M%SZ).dump
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -d oneinvest -s \
  > ~/dev/onehub-invest/state/sao-luu/luoc-do-truoc-113-$(date -u +%Y%m%dT%H%M%SZ).sql
```
Ghi đường hai tệp và cỡ (không rỗng) vào mục «Nhật ký áp» dưới trước khi đi bước 2.

## 2. Lệnh áp

```bash
cd ~/dev/onehub-invest
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 < db/migrations/113_thuoc_tinh_can_s16.sql
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 < db/migrations/113_thuoc_tinh_can_s16.sql   # lần hai: chứng chạy lại an toàn
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 < db/migrations/118_v_s16_gia_cdt_loai_mo_ho.sql   # view giá loại mã mơ hồ toà; luôn áp SAU 113
# Làn thu nạp snapshot vào stg_s16_can_chi_tiet theo lời GIAO triển khai riêng: node pipeline/import-s16-chi-tiet.mjs <thư mục snapshot> --may-thu
node pipeline/scripts/thuoc-tinh-can-s16.mjs                       # chạy thử: in bảng, không ghi — so với mục 3
node pipeline/scripts/thuoc-tinh-can-s16.mjs --ghi --db-that       # ghi phát biểu + ANALYZE field_assertions
```

## 3. Số chạy thử

Đo 18/11 trên bản chép DB máy thu (tạo từ mẫu `oneinvest_suite_mau`, áp 113 rồi 118), bảng nạp lấy từ snapshot sv14
`mngt-can-chi-tiet` của làn thu (95.798 item) qua **bộ nạp thật** `pipeline/import-s16-chi-tiet.mjs` (đã tích hợp vào nhánh, nạp 95.798/95.798,
bỏ 0, nạp lại 0 dòng mới). Thước E13 trên bản chép ấy: 40/40 ô, lệch 0. **Điều kiện áp:** nếu snapshot hay bộ nạp đổi trước lúc áp, lệnh chạy
thử ở mục 2 phải ra đúng khối dưới; khác thì dừng và báo. Số thật ở bước 5 phải bằng khối này.

Tổng: phát biểu 441.183 · căn danh bạ có thuộc tính 84.820 / 111.329 · căn có giá chủ đầu tư 11.852 · tầng lệch 41 · mã hai toà
862 (nhóm `mo_ho` của `v_s16_can`) · mã có thuộc tính chưa có căn danh bạ 10.116. Diện tích thứ hai: tim tường 69.676 (cao tầng) + đất 15.144 (thấp tầng).

Thứ tự cột: nối · thông thuỷ/sàn · tim tường hoặc đất · PN · WC · hướng · loại hình · giá chủ đầu tư.

```chay-thu
grand-park | 37589 | 37589 | 37589 | 35974 | 436 | 28314 | 36971 | 1850
ocean-park | 32097 | 32097 | 32097 | 27440 | 22063 | 31808 | 30919 | 9999
ocean-park-2 | 9791 | 9791 | 9791 | 9791 | 0 | 2492 | 9791 | 3
ocean-park-3 | 2797 | 2797 | 2797 | 2797 | 0 | 2782 | 2797 | 0
smart-city | 2546 | 2546 | 2546 | 2546 | 2476 | 2497 | 2502 | 0
```

Khối số trên đo trước khi nhánh nhận PR #490 (toà S16 vào phân khu); hàng này chưa đo lại trên DB đã áp 111 + 114, nên lệnh chạy thử ở mục 2 là phép đối chiếu quyết định.

Thời gian trên bản chép: `--ghi` 16 giây; trang dự án grand-park tải khoảng 4,5 giây sau `ANALYZE` (trước `ANALYZE` hàng phút —
lệnh `--ghi` nay tự chạy `ANALYZE field_assertions`).

## 4. Cách lùi

- **Lùi dữ liệu** (giữ lược đồ; màn trở về «Chưa có thuộc tính»):
  ```sql
  UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'lui-thuoc-tinh-can-s16'
   WHERE resource_name = 'Unit' AND method = 'source_field' AND evidence->>'nguon' = 'S16' AND retracted_at IS NULL;
  ```
- **Lùi lược đồ** chỉ khi CHƯA chạy `--ghi` (bảng phát biểu chỉ thêm, dòng đã rút vẫn mang mã trường mới nên CHECK của 096 không
  dựng lại được): `psql … < _acceptance/thuoc-tinh-can-s16/lui/113-lui.sql`. Tệp tự từ chối khi còn phát biểu mang trường của 113
  (đã thử trên DB dựng từ migrations 18/11: lùi → CHECK về bản 096, áp lại 113 được; có phát biểu → từ chối).
- 118 chỉ thay thân view giá: lùi riêng 118 bằng cách áp lại khối view của 113; lùi lược đồ ở trên đã DROP view nên phủ cả 118.
- Khôi phục từ sao lưu mục 1 nếu hai đường trên không đủ (`pg_restore --clean -t field_assertions -t ref_lookup`).

## 5. Lệnh kiểm sau

```bash
TTC_DB_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh that        # bốn cột: đếm thẳng · view · chạy thử (khối mục 3) · bảng phủ ca; thoát 1 khi lệch
```
Rồi mở `/ops/registry/<id>` của grand-park, smart-city, ocean-park-3 trên Ops máy thu và đối chiếu ô phủ với khối mục 3
(grand-park 37.589 có thuộc tính, smart-city 2.546, ocean-park-3 2.797 và 792 chưa vào danh bạ). Lệch thì dừng và báo, không tự
sửa cho khớp.

## Nhật ký áp

(điền khi áp: thời điểm, sha `main`, đường + cỡ hai tệp sao lưu, đầu ra lệnh kiểm sau, số thật cạnh số chạy thử)

### Số đối chiếu mới (thay khối mục 3 cho lượt áp này)

Lời Mạnh ở phiên giám sát lúc 2026-11-19T02:39:41Z (mã câu hỏi h-20261119T004426Z-235), nguyên văn: «Nhận, theo khuyến nghị», trả lời câu «Nhận bộ số mới (+2 căn Grand Park) làm số đối chiếu cho lượt áp tối nay?». Khối đã ký ở mục 3 giữ nguyên; lượt áp này đối chiếu theo khối dưới.

Đo 2026-11-19 00:37–00:42Z trên bản chép mới của DB máy thu, code `main` 0e76e7553: áp 113 hai lần, áp 118, bộ nạp thật nạp 95.798/95.798 (bỏ 0),
chạy thử, `--ghi`, `kiem.sh that`. Bản chép đã xoá.

Tổng: phát biểu 441.193 · căn danh bạ có thuộc tính 84.822 · căn có bí danh S16 111.331 · căn có giá chủ đầu tư 11.852 · tầng lệch 41 · mã hai toà
trong snapshot 862 · mã có thuộc tính chưa có căn danh bạ 10.114. Diện tích thứ hai: tim tường 69.678 (cao tầng) + đất 15.144 (thấp tầng).

Thứ tự cột: nối · thông thuỷ/sàn · tim tường hoặc đất · PN · WC · hướng · loại hình · giá chủ đầu tư.

```chay-thu
grand-park | 37591 | 37591 | 37591 | 35976 | 436 | 28316 | 36973 | 1850
ocean-park | 32097 | 32097 | 32097 | 27440 | 22063 | 31808 | 30919 | 9999
ocean-park-2 | 9791 | 9791 | 9791 | 9791 | 0 | 2492 | 9791 | 3
ocean-park-3 | 2797 | 2797 | 2797 | 2797 | 0 | 2782 | 2797 | 0
smart-city | 2546 | 2546 | 2546 | 2546 | 2476 | 2497 | 2502 | 0
```

Khác khối đã ký đúng 6 ô, đều ở grand-park và đều +2: nối, thông thuỷ, diện tích thứ hai, PN, hướng, loại hình.

Lưu ý khi đối chiếu: `kiem.sh that` so với khối mục 3 và bảng phủ ca đã ký, nên sẽ thoát 1 và báo 6 ô lệch này. Theo lời trên, `kiem.sh that` đỏ đúng 6 ô grand-park đó thì không tính là lệch; bất kỳ ô đỏ nào khác thì dừng và báo giám sát.

### Nguyên nhân chênh

Job đêm 18/11 `zalo-import-daily`, bước dựng danh bạ chạy lần đầu trên mã của #490, đúc thêm 2 căn grand-park.
`pipeline/logs/zalo-import.log` dòng 33259: «S16: khoá mới 2, mốc 2026-11-18T17:06:39.709908Z». Hai căn có `first_seen` đúng giây đó và có thuộc tính thật trong snapshot.

### Lệnh đếm căn S16 đúc mới kể từ mốc (chạy ngay trước bước chạy thử)

```bash
docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "SELECT count(*) FROM registry_aliases a WHERE a.source='S16' AND a.kind='ma_nguon' AND a.retired_at IS NULL AND a.object_key LIKE 'unt\_%' AND a.first_seen > '2026-11-18T17:06:39.709908Z'"
```

Kết quả đo 2026-11-19: 0 căn (tổng căn có bí danh S16: 111.331).

Quy tắc khi lại chênh, theo lời trên: chênh thêm mà khớp đúng số căn S16 đúc mới ghi trong log «S16: khoá mới N» kể từ mốc 17:06:39Z ngày 18/11 thì vẫn áp và ghi rõ; chênh kiểu khác thì dừng.

### Lượt thu lỗi

Manifest snapshot ghi 6.456 lượt thu lỗi. Các lượt này không nằm trong khối số vì khối chỉ đếm 95.798 item thu được; căn tương ứng hiện «Chưa có thuộc tính» trên trang dự án.

### Chạy thay bộ nạp (chỉ điền nếu giám sát báo «chạy thay» lúc 15:00Z)

Lời Mạnh: «<nguyên văn>» (<thời điểm>, mã câu hỏi <mã>). Lệnh: `node pipeline/import-s16-chi-tiet.mjs <thư mục snapshot> --may-thu`, từ checkout chính ở `main`, sau khi áp 113 và 118.

### Kết quả áp (điền khi áp)

Thời điểm: <...> · sha `main`: <...> · hai tệp sao lưu (đường, cỡ): <...> · đầu ra lệnh kiểm sau: <...> · số thật cạnh số đối chiếu: <...>
