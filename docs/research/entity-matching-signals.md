# Domain truth: 6 tín hiệu nhận diện trùng căn (user chỉ định 22/10)

> User phán: "Người dùng so trùng thường dựa trên điều này, càng nhiều
> evidence trùng thì càng tự tin, còn nhìn vào đây thì gần như là không chắc."

## 6 tín hiệu (thứ tự ưu tiên user nêu)

| # | Tín hiệu | Trạng thái data | Hành động |
|---|---|---|---|
| 1 | **Địa chỉ, số nhà, mã căn** | P2 có `street_name` (91%), `block` (5.5%), `floornumber` (7.5%) — CHƯA đưa vào sale_offers. P1 parse từ text (regex địa chỉ VN). | Thêm cột `street_raw` + `block_raw` + `floor_raw` vào sale_offers; parser extract từ text P1 |
| 2 | **Loại nhà** | ✅ `property_type` đã có (G-1) — nhưng P1 = unknown (chưa extract) | A4 extract-text sẽ phân loại từ text |
| 3 | **Diện tích** | ✅ `area_m2` — nhưng chỉ 3/12 cặp DT gần đúng (<1m²) | Đã có, đủ |
| 4 | **Số PN + vệ sinh** | `bedrooms` có (1/12 cặp trùng); `toilets` chỉ ở stg_chotot_ads (49%) — CHƯA vào sale_offers | Thêm cột `bathrooms`; P1 extract "2WC/2vs" từ text |
| 5 | **Ảnh trùng** | P2 có 9.911/9.926 images (99%); P1 có URL zdn.vn trong text (0/12 cặp hiện tại) | pHash G-2.5; tạm thời: URL matching |
| 6 | **Người đăng/chủ nhà** | `seller_name` có nhưng 0/12 cặp trùng tên (vì Zalo dùng tên cá nhân, Chợ Tốt dùng tên shop); `seller_phone_hash` không match (P2 không có phone) | Cần phone-reveal S06 (N4) hoặc so account_id |

## Phân tích độ phủ trên 12 cặp HIỆN TẠI

| Tín hiệu | Cặp có dữ liệu | Cặp trùng | Ghi chú |
|---|---|---|---|
| Loại nhà | 0 (P1 toàn unknown) | 0 | Cần A4 extract |
| DT gần đúng | 12 | 3 | Đã có |
| PN trùng | 1 có data | 1 | P1 thiếu bedrooms |
| Ảnh | 0 P1 có URL | — | Zalo text hiện tại không có ảnh URL |
| Seller trùng | 0 | 0 | Tên khác nhau giữa nền tảng |

**Kết luận user đúng**: "nhìn vào đây gần như không chắc" vì 4/6 tín hiệu
THEN CHỐT (địa chỉ, loại, ảnh, người bán) không có dữ liệu để so.

## Kế hoạch hành động — "Matching Signal Enhancement"

### Ngay (không cần migration):
1. **/ops/review evidence thêm**: street_name, block, floor, toilets,
   images đầu tiên (URL) — hiển thị side-by-side ngay cả khi P1 không có
   (thấy "—" cũng là thông tin: thiếu tín hiệu = không chắc)
2. **Stage B scoring thêm trọng số**: mỗi tín hiệu trùng +điểm, thiếu = 0
   (không trừ); score cuối = tổng weighted → chính xác hơn price/m² riêng

### Buổi tới (A4 + migration):
3. **Migration**: `sale_offers` thêm `street_raw`, `block_raw`, `floor_raw`,
   `bathrooms` — backfill từ stg_chotot_ads (payload có sẵn)
4. **Parser P1 extract thêm**: địa chỉ (regex VN: "đường X", "phố Y",
   "số N"), "2WC/2vs", loại nhà từ keywords ("chung cư"→apartment,
   "nhà mặt tiền"→house, "đất"→land)
5. **Image matching**: đưa URL ảnh đầu tiên của P2 vào evidence; P1 zdn.vn
   URL extract từ text (đã có handler) → transform đưa vào sale_offers

### Khi có đủ tín hiệu (G-2.5 + N4):
6. **pHash** ảnh → so chéo nguồn
7. **Phone reveal** Chợ Tốt → join seller → tín hiệu mạnh nhất
