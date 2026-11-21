# Chạy thử hồ sơ áp — 21/11 14:17Z, bản chép DB máy thu (`db/db-thu.sh oneinvest_suite_nkap --chay`, xoá sau lượt)

Tệp tên ở bước 3 là tệp GIẢ trong thư mục tạm của phiên (`NK_TAM`), không dùng tệp thật của làn thu. Sao lưu ghi vào thư mục tạm
(`SAO_LUU_DIR`).

| Bước | Lệnh | Kết quả |
|---|---|---|
| 1 sao lưu | `sao-luu.sh` (DB_AP = bản chép) | 15 dòng |
| 2 áp 122 hai lần | `psql < 122` ×2 | dưới 1 giây; 17 dòng, 17 có `family`, 10 có `cadence_hours` |
| 3 điền | `tra-s09-s17.mjs` | S09 1 dòng (2 tên miền), S17 1 dòng (1 tên miền), `match_whole = true` |
| 3b điền lần hai | `tra-s09-s17.mjs` | dừng, thoát 1: «S09: số dòng đổi 0 ≠ 1 … lùi cả hai» |
| 5 kiểm | `probes/may-thu.mjs` | app và CLI 12 hàng, lệch 0; S16 có hàng; S01 chỉ hanoi; S11 không hàng; S09 có hàng; tầng A S09 3 mục, S17 2 mục; `MAY THU OK` |
| lùi | `lui-122.sql` + `kiem-lui.sh` | `LUI OK: bảng trùng bản sao lưu (15 dòng)` |

Số hàng ở bước 5 (mốc 21/11 14:17Z): S01/hanoi tươi 145 giờ (nhịp 192), S16/vn tươi 85 giờ (192), S09/vn **quá hạn** 194 giờ (192 —
lần thu duy nhất 13/11 12:09Z). Trước khi điền tên (bản chép chưa có tên), cùng máy đo in «THIẾU bộ soát tầng A: S09 0 mục,
S17 0 mục» và `MAY THU DO` — chiều đỏ của dòng tầng A.
