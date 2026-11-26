# E7 — căn cứ đổi cách bắt chiều đỏ của MATERIALIZED: từ thời gian sang kế hoạch truy vấn (GS phán 27/11)

Lời AC-7 không đổi. Ngưỡng thời gian của bản thật giữ nguyên (count(*) offer_building dưới 10 giây, offer_unit dưới 15 giây).
Chỉ chiều đột biến «bỏ MATERIALIZED ở toa_vung» đổi cách bắt: ca `offer-building-ke-hoach-giu-buoc-vat-the-hoa-toa-vung`
đòi kế hoạch của `SELECT count(*) FROM offer_building` có bước «CTE toa_vung».

## Vì sao thời gian không bắt được

| Máy · DB | Bản thật | Bỏ MATERIALIZED ở toa_vung | Lệnh |
|---|---|---|---|
| Mac mini · DB máy thu `oneinvest`, phiên chỉ đọc, 27/11 | 1,0–1,3 giây | 40,4–43,4 giây | `bash _acceptance/ghep-tin-vao-truc-can/probes/ke-hoach-toa-vung.sh oneinvest --thoi-gian` |
| M5 · DB lượt `oneinvest_suite_pl36_e7` (131 đã áp, đã ANALYZE), 26–27/11 | 0,37 giây | không vượt trần (đột biến không đỏ) | `bash _acceptance/ghep-tin-vao-truc-can/probes/offer-building-nhanh.sh` (evidence/m5-probe-6f8fd86af.txt) |

Kế hoạch chậm chỉ hiện trên DB máy thu; DB lượt vừa khôi phục chọn kế hoạch khác kể cả sau ANALYZE. Bước vật thể hoá thì xác định.

## Bước «CTE toa_vung» trong kế hoạch — bốn kết quả

| Máy · DB | Bản thật | Bản đột biến |
|---|---|---|
| Mac mini · DB máy thu `oneinvest` (chỉ đọc) | có | KHÔNG có |
| M5 · DB lượt | _chờ M5_ | _chờ M5_ |

Lệnh: `bash _acceptance/ghep-tin-vao-truc-can/probes/ke-hoach-toa-vung.sh <tên DB>` (thoát 0 khi bản thật có bước ấy và bản đột biến không).
Trên DB lượt: `bash db/db-thu.sh oneinvest_suite_pl36_kh --chay bash _acceptance/ghep-tin-vao-truc-can/probes/ke-hoach-toa-vung.sh oneinvest_suite_pl36_kh`.
