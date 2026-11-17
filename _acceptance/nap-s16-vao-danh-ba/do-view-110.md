# Đo view `v_s16_can`: bản 103 so bản 110 — bằng chứng tương đương và thời gian

Ngày 17/11/2026. Dữ liệu: 186.108 dòng `stg_s16_can` thật (ba bản thu S16 13–14/11, nạp qua `napS16(dongS16(…))`), chép từ DB thử
của lượt đo `danh-ba-s16-that.mjs` sang DB thử riêng `oneinvest_dbv_s16view_<pid>` (đã xoá). Không ghi gì lên DB máy thu.

## Vì sao có 110

Kế hoạch (`EXPLAIN`) của câu đếm E10 trên dữ liệu thật: tổng chi phí **33,9 triệu**, gần trọn nằm ở view `v_s16_can` của 103. Hai
cột `toa_id`, `tang` tính bằng subquery tương quan quét lại TOÀN BỘ CTE `d` (không chỉ mục — `d` dùng hai lần nên bị vật chất hoá)
cho từng dòng ra. Bước dựng danh bạ đọc view này (`pipeline/lib/s16-dung.mjs` dòng 53 và 114), nên áp trên máy thu cũng treo.

110 giữ nguyên `d`, `g`, `c` và luật chọn toà của 103; thay hai subquery bằng một CTE `t` gom `min(toa_id)`, `max(tang)` theo
`(du_an, ma, toa_ten)` một lượt rồi `LEFT JOIN`. Cùng tên, kiểu, thứ tự cột. Không thêm chỉ mục. GS chọn đường migration mới
(không sửa 103) và cấp số 110 ngày 17/11.

## Tương đương — từng dòng

| Phép so | Kết quả |
|---|---|
| Số dòng bản 103 · bản 110 | 147.266 · 147.266 |
| Dòng bản 103 không có trong bản 110 (`EXCEPT ALL`) | **0** |
| Dòng bản 110 không có trong bản 103 (`EXCEPT ALL`) | **0** |

`EXCEPT ALL` so cả tám cột kể cả mảng `toa_ds`, và giữ bội số — hai chiều cùng 0 nghĩa là hai view ra cùng một đa tập dòng.

## Thời gian

| Câu | Bản 103 | Bản 110 |
|---|---|---|
| Quét trọn view (`CREATE TABLE … AS SELECT * FROM v_s16_can`) | **35 phút 37 giây** | **0,68 giây** |
| Bước dựng, `s16-dung.mjs:53` (quét trọn, gom theo dự án) | ≈ một lần quét trọn (≈ 35 phút) | 0,28 giây |
| Bước dựng, `s16-dung.mjs:114` (một lần mỗi dự án, 14 dự án) | không đo riêng — xem dưới | 1,6 giây tổng, chậm nhất 0,17 giây |
| Lượt đo thật E2 + E10 (`danh-ba-s16-that.mjs`, trọn từ đầu tới cuối) | **~89 phút** (00:52Z → 02:21Z) | **14 giây** (02:22:41Z → 02:22:55Z) |

Dòng 114 ở bản 103 không đo riêng: mỗi lời gọi vật chất hoá trọn `d` rồi chạy hai subquery quét trọn `d` cho mọi dòng của dự án ấy,
nên 14 lời gọi cộng lại cỡ một lần quét trọn nữa. Đó là số suy, không phải số đo; lượt đo thật 89 phút là số đo bao trọn cả hai.

## E10 — cùng số trên hai bản

Mười dòng tổng của E10 khớp từng chữ giữa lượt bản 103 và lượt bản 110: Grand Park 1294 = bí danh 1292 + lệch toà 2 + mơ hồ 0 +
toà ra thẻ 0 (S16 đúc căn mới 1); Ocean Park 1 153 = 117 + 0 + 0 + 36 (căn mới 10); mã hai đối tượng 0, UPI hai toà 0; thẻ S16 42,
mang token S16 0; sync chạy thử 0 token; dựng lần hai 0 khoá mới, băm căn bằng; toà 198 → 320, căn 1.748 → 113.729; `OK`. Số căn mỗi
toà khớp ở mọi toà mà bản lưu của lượt 103 còn giữ (số thứ tự `toa#` đổi theo lượt vì khoá toà là ULID sinh mới, nên so theo khu).
