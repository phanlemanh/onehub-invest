# Bảng phủ ca — thuoc-tinh-can-s16 (DA40), đếm 18/11/2026

Nguồn số: tệp thu thuộc tính căn S16 sáng 18/11 trên máy thu (181.937 dòng, 95.798 khoá dự án × mã căn; tên tệp và thư mục
mang tên nguồn thật nên không ghi) và DB máy thu `:5433/oneinvest` đọc ở phiên chỉ-đọc (`v_s16_can`, `registry_aliases`
`source='S16' kind='ma_nguon'`, `units`). Không fixture viết tay. Script đếm ở thư mục nháp của phiên (không vào kho):
`phu.mjs`, `phu2.mjs`, `lech.mjs`, `lech2.mjs`. Dự án ghi bằng tên ngắn (bỏ tiền tố thương hiệu của slug nguồn).

Khi bảng `stg_s16_can_chi_tiet` có dữ liệu (bộ nạp của làn thu), lệnh `node pipeline/scripts/thuoc-tinh-can-s16.mjs` (chạy
thử) phải in lại đúng các số này từ DB — đó là AC-5/AC-11.

## 1. Dự án × trạng thái nối × trường (căn đã nối danh bạ)

«View» = cặp (dự án, mã căn) trong `v_s16_can`; «Danh bạ» = căn `units` có bí danh `ma_nguon` S16; «Có TT» = khoá có thuộc
tính trong tệp thu; «Nối» = có TT và có căn danh bạ; «Chưa căn» = có TT nhưng mã chưa có căn danh bạ. Các cột trường đếm trên
«Nối». Hướng: toà cao tầng lấy hướng ban công, thấp tầng lấy hướng cửa (Hỏi-2).

| Dự án | View | Danh bạ | Có TT | Nối | Chưa căn | Thông thuỷ | Tim tường | PN | WC | Hướng | Loại hình | Giá CĐT | Tầng lệch |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| grand-park | 38.063 | 37.997 | 37.591 | 37.589 | 2 | 37.589 | 37.589 | 35.974 | 436 | 28.314 | 36.971 | 1.850 | 14 |
| ocean-park | 35.022 | 34.201 | 32.914 | 32.097 | 817 | 32.097 | 32.097 | 27.440 | 22.063 | 31.808 | 30.919 | 9.999 | 27 |
| smart-city | 22.120 | 22.119 | 2.546 | 2.546 | 0 | 2.546 | 2.546 | 2.546 | 2.476 | 2.497 | 2.502 | 0 | 0 |
| ocean-park-2 | 12.600 | 12.413 | 9.799 | 9.791 | 8 | 9.791 | 9.791 | 9.791 | 0 | 2.492 | 9.791 | 3 | 0 |
| ocean-park-3 | 6.053 | 4.599 | 3.617 | 2.797 | 820 | 2.797 | 2.797 | 2.797 | 0 | 2.782 | 2.797 | 0 | 0 |
| royal-island | 7.305 | 0 | 4.412 | 0 | 4.412 | — | — | — | — | — | — | — | — |
| global-gate | 3.722 | 0 | 2.681 | 0 | 2.681 | — | — | — | — | — | — | — | — |
| hai-van-bay | 2.345 | 0 | 1.534 | 0 | 1.534 | — | — | — | — | — | — | — | — |
| happy-home-trang-cat | 2.576 | 0 | 704 | 0 | 704 | — | — | — | — | — | — | — | — |
| star-city | 5.346 | 0 | 0 | 0 | 0 | — | — | — | — | — | — | — | — |
| sai-gon-park | 5.070 | 0 | 0 | 0 | 0 | — | — | — | — | — | — | — | — |
| global-gate-ha-long | 4.343 | 0 | 0 | 0 | 0 | — | — | — | — | — | — | — | — |
| green-paradise-can-gio | 2.502 | 0 | 0 | 0 | 0 | — | — | — | — | — | — | — | — |
| the-gallery-giang-vo | 199 | 0 | 0 | 0 | 0 | — | — | — | — | — | — | — | — |
| **Tổng** | **147.266** | **111.329** | **95.798** | **84.820** | **10.978** | **84.820** | **84.820** | **78.548** | **24.975** | **67.893** | **82.980** | **11.852** | **41** |

Sau Cổng 1 (d-20261118T025028Z-17): cột «Tim tường» chỉ còn căn hộ cao tầng (69.676); nhà thấp tầng ghi diện tích đất
(15.144) — đo bằng lệnh chạy thử trên bản chép máy thu `oneinvest_p1_ttc` 18/11. Ô «chưa vào danh bạ» không tính mã hai toà:
ocean-park-3 792 (+ 28 hai toà = 820 ở cột «Chưa căn» trên).

Tổng phần trăm trên căn danh bạ: 84.820 / 111.329 = 76,2% có thuộc tính; 11.852 / 111.329 = 10,6% có giá chủ đầu tư.
Trên toàn tệp thu: 95.798 khoá, 14.911 có giá — 3.059 giá nằm ở căn chưa có căn danh bạ.

## 2. Các chiều khác

| Chiều | Giá trị | Số đếm | Xử lý | Ai đọc đầu ra này phía sau |
|---|---|---:|---|---|
| Số dòng mỗi khoá | 1 dòng | 64.548 | phát biểu | lệnh `--ghi` → `field_assertions` (Unit) → `v_unit_thuoc_tinh` → màn Danh bạ (AC-9, AC-10); DA41 so giá |
| | 2–8 dòng cùng toà, giống hệt | 30.390 | gộp một, phát biểu | như trên |
| | 2+ dòng ở hai toà (mã trùng hai toà) | 860 | không phát biểu, đếm «mã nhiều toà» | lệnh in số; 860/860 là nhóm `mo_ho` của `v_s16_can`, 0/860 có căn danh bạ |
| Lệch giá trị trong khoá | lệch diện tích | 362 | — | 362/362 thuộc nhóm hai toà ở trên → không tới danh bạ |
| | lệch loại hình | 382 | — | 382/382 thuộc nhóm hai toà |
| | lệch hướng | 136 | — | thuộc nhóm hai toà |
| | lệch giá, PN, tầng | 0 | — | — |
| Trường rỗng ↔ cho chủ căn sửa | `editableFields` chứa trường ⇔ trường rỗng (đúng ở mọi dòng của PN, WC, hướng, hướng ban công, giá, kiểu căn) | 181.937 dòng | giá trị có mặt là của chủ đầu tư → lớp `fact`, phương pháp `source_field` | AC-3 ghim ma trận |
| PN, WC = 0 | nghĩa «chưa có» (trường đang mở cho chủ căn sửa) | PN 15.352 dòng, WC 155.260 dòng | không phát biểu | AC-3 |
| Loại hình nguồn | APARTMENT 68.775 · ROW_HOUSE 11.538 · SHOP_HOUSE 5.726 · SEMI_DETACHED_VILLA 3.880 · DETACHED_VILLA 2.081 · UNDEF 1.916 · ROW_SHOP_HOUSE 972 · QUADRUPLE_VILLA 412 · COMMERCIAL_SERVICE 334 · PENT_HOUSE 85 · SEMI_DETACHED_SHOP 45 · DETACHED_SHOP 34 (theo khoá) | 95.798 | 12 mã → `apartment`/`house`/`commercial`; UNDEF không phát biểu | AC-3 ma trận 12 + 1 ô |
| Hướng nguồn | 8 hướng (NE, NW, SE, SW · NORTH, SOUTH, EAST, WEST) · dạng N_E, S_W · hai hướng nối gạch (NE_NW…) · OTHER · rỗng | xem §3 | 8 mã `direction_faces`; hai hướng → hai phát biểu; OTHER, rỗng → không | AC-3 |
| Cao/thấp tầng (`heightType`) | HIGH_RISE: ban công có 113.451 dòng, cửa có 3.887 · LOW_RISE: ban công 274, cửa 24.022 | 181.937 dòng | cao tầng lấy ban công, thấp tầng lấy cửa (Hỏi-2) | AC-3 |
| Tầng | `floorNumber` khác `units.floor` | 41 căn | không phát biểu tầng (tầng của căn đã có từ DA33); lệnh in số lệch | lệnh in số |
| Mã căn có TT không có trong `v_s16_can` | — | 0 | — | — |
| Tài chính cá nhân chủ căn (`purchasePrice`, `purchaseDate`, `initialInvestmentCost`, `investmentCapital`, `loanAmount`) | có giá trị | 0 dòng | **ngoài phạm vi, vì** là dữ liệu chủ căn tự nhập trong ứng dụng nguồn; không có cột trong stg, không phát biểu (AC-2) | — |
| `juridicalStatus`, `deliveryStatus`, `furnitureStatus`, `houseStatus` | có giá trị | 0–1 dòng | **ngoài phạm vi, vì** gần như rỗng và là trường chủ căn sửa; giữ ở raw snapshot | — |
| `houseStyle` (kiểu căn, vd TWO_BEDROOMS_1_2_TOILET) | suy PN/WC khi thiếu | 93.387 khoá có | **ngoài phạm vi, vì** chữ mơ hồ (1_2_TOILET), suy là lớp `inferred` — hàng sau nếu cần; giữ ở stg | — |

## 3. Hướng — giá trị nguồn (theo khoá)

Hướng ban công: SW 11.319 · NE 11.521 · NW 10.361 · SE 10.556 · NE_NW 4.136 · NW_SW 4.092 · SE_SW 4.070 · NE_SE 3.926 · OTHER 299
· SOUTH 255 · NORTH 251 · NW_NE 216 · SE_NE 187 · SW_NW 172 · SW_SE 166 · NE_SW 90 · S_W 43 · N_E 42 · S_E 22 · N_W 21 · NW_SE 3 ·
rỗng 34.050.

Hướng cửa: NW 4.520 · SE 4.147 · SW 3.740 · NE 3.169 · OTHER 781 · SOUTH 386 · NORTH 361 · NE_NW 278 · S_E 255 · SE_SW 226 ·
NW_SW 215 · NE_SE 215 · NE_SW 190 · EAST 111 · N_E 88 · WEST 68 · SW_NW 39 · NW_NE 29 · SE_NE 21 · NW_SE 20 · NE_NE 16 · SW_SE 16 ·
NW_NW 8 · SE_SE 7 · SW_SW 2 · rỗng 76.890.

Luật: `N_E` = `NE` (cùng nghĩa, dạng khác); `XX_YY` hai mã khác nhau = căn hai hướng → hai phát biểu; `XX_XX` = một hướng;
`NE_SW`, `NW_SE` (hai hướng đối nhau) vẫn hai phát biểu — nguồn ghi vậy, máy không sửa.
