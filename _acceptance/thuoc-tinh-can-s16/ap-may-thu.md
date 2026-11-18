# Áp lên DB máy thu — thuoc-tinh-can-s16 (DA40)

Áp SAU khi PR gộp, từ checkout chính ở `main`. Chữ ký Cổng Bằng chứng phủ đúng những bước dưới đây (AGENTS «Ai quyết gì»).
Điều kiện trước: bộ nạp của làn thu đã nạp snapshot `mngt-can-chi-tiet` vào `stg_s16_can_chi_tiet` (DATA-CONTRACT v14) —
bộ nạp cần bảng của 113, nên thứ tự là: (1) áp 113 → (2) làn thu nạp → (3) chạy thử → (4) `--ghi` → (5) kiểm sau.

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
# (làn thu nạp snapshot vào stg_s16_can_chi_tiet)
node pipeline/scripts/thuoc-tinh-can-s16.mjs                       # chạy thử: in bảng, không ghi — so với mục 3
node pipeline/scripts/thuoc-tinh-can-s16.mjs --ghi --db-that       # ghi phát biểu + ANALYZE field_assertions
```

## 3. Số chạy thử

Đo 18/11 trên bản chép DB máy thu `oneinvest_p1_ttc` (tạo từ mẫu `oneinvest_suite_mau`, áp 113), bảng nạp lấy từ snapshot sv14
`mngt-can-chi-tiet` của làn thu (95.798 item, băm 96/96 tệp khớp manifest) qua bộ nạp THỬ của phiên. **Điều kiện áp:** bộ nạp thật
của làn thu (tin claudedp-1811-8) phải gộp trước, và lệnh chạy thử chạy lại trên bản chép bằng bộ nạp ấy phải ra đúng khối dưới;
khác thì dừng và báo. Số thật ở bước 5 phải bằng khối này.

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
node pipeline/tests/thuoc-tinh-can-s16-that.mjs        # bốn cột: đếm thẳng · view · chạy thử (khối mục 3) · bảng phủ ca; thoát 1 khi lệch
```
Rồi mở `/ops/registry/<id>` của grand-park, smart-city, ocean-park-3 trên Ops máy thu và đối chiếu ô phủ với khối mục 3
(grand-park 37.589 có thuộc tính, smart-city 2.546, ocean-park-3 2.797 và 792 chưa vào danh bạ). Lệch thì dừng và báo, không tự
sửa cho khớp.

## Nhật ký áp

(điền khi áp: thời điểm, sha `main`, đường + cỡ hai tệp sao lưu, đầu ra lệnh kiểm sau, số thật cạnh số chạy thử)
