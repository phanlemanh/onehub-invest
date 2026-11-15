# Số chạy thử — áp 105 + 600 trong một giao dịch lùi trên DB máy thu

Đo lúc 2026-11-15T12:45:29.751Z · tải 1 phút 6.3 · 600 của nhánh 5378 ms · lệnh
`node pipeline/scripts/offer-project-that.mjs --chay-thu` (E9). Sau ROLLBACK DB máy thu không đổi: true.

| Cửa sổ | Nguồn | Định vị nền | Định vị sau | Chờ khớp nền | Chờ khớp sau |
|---|---|---|---|---|---|
| all | S03 | 0 | 4934 | 3328 | 3328 |
| all | S05 | 0 | 0 | 1 | 1 |
| all | S06 | 0 | 11660 | 4040 | 4040 |
| 30d | S03 | 0 | 4934 | 3328 | 3328 |
| 30d | S05 | 0 | 0 | 1 | 1 |
| 30d | S06 | 0 | 10697 | 3479 | 3479 |
| 7d | S03 | 0 | 754 | 607 | 607 |
| 7d | S05 | 0 | 0 | 0 | 0 |
| 7d | S06 | 0 | 2500 | 797 | 797 |

Đếm độc lập S03 `mot_du_an`: all 4934, 7d 754. `s06_offer_project`: 11660 dòng.
Tin có dự án và đủ năm trường lõi, mọi nguồn (B2 dự kiến, `b2_ky_vong`, số dòng «len» lượt đầu): 13152.
