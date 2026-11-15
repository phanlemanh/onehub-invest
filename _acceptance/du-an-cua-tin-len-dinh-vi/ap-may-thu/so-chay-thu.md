# Số chạy thử — áp 105 + 600 trong một giao dịch lùi trên DB máy thu

Đo lúc 2026-11-15T00:45:01.914Z · tải 1 phút 6.8 · 600 của nhánh 5515 ms · lệnh
`node pipeline/scripts/offer-project-that.mjs --chay-thu` (E9). Sau ROLLBACK DB máy thu không đổi: true.

| Cửa sổ | Nguồn | Định vị nền | Định vị sau | Chờ khớp nền | Chờ khớp sau |
|---|---|---|---|---|---|
| all | S03 | 0 | 4934 | 3228 | 3228 |
| all | S05 | 0 | 0 | 1 | 1 |
| all | S06 | 0 | 11574 | 4008 | 4008 |
| 30d | S03 | 0 | 4934 | 3228 | 3228 |
| 30d | S05 | 0 | 0 | 1 | 1 |
| 30d | S06 | 0 | 10611 | 3447 | 3447 |
| 7d | S03 | 0 | 754 | 507 | 507 |
| 7d | S05 | 0 | 0 | 0 | 0 |
| 7d | S06 | 0 | 2414 | 765 | 765 |

Đếm độc lập S03 `mot_du_an`: all 4934, 7d 754. `s06_offer_project`: 11574 dòng.
Tin có dự án và đủ năm trường lõi, mọi nguồn (B2 dự kiến, `b2_ky_vong`, số dòng «len» lượt đầu): 13065.
