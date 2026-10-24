# Thiết kế — deals-loai-tin-phi-ly (ON11)

Căn cứ: `docs/plan/lo-trinh.json` ON11 · `docs/plan/pham-vi-ops-noi-that-2410.md` OPS-12 · báo cáo audit Ops prod 24/10
(máy local của Mạnh) mục OPS-12.

## Vấn đề

`/ops/deals` («Căn giá tốt») lấy 30 tin P1 rẻ hơn thước phường 5–50%, sắp `discount DESC`. Trên DB local hôm nay
(24/10): 30/30 thẻ giảm 40–50%, gần như toàn S03; có thẻ 36 m² 3PN, 41 m² 3PN, 37 m² 2PN; một thẻ không có diện
tích mà vẫn có giá/m²; thẻ đăng một lần ghi «mới» dù thấy từ 6 ngày trước. Nguyên nhân:

- `app/src/lib/deals.ts` tự tính `discount_pct` trong câu truy vấn (lặp lại công thức `bait_gap_pct` của pipeline) và
  không lọc tin có diện tích/số phòng phi lý — parser S03 bắt sai, «độ tin cao» không chặn được.
- Guard `≤ 50` chỉ cắt ngọn, sắp giảm dần nên tin ngoại lai sát trần dồn lên đầu. Thước còn theo phường, chưa theo loại
  hình (PL26 — hàng khác), nên tin giảm rất sâu thường là so lệch loại hình hơn là căn rẻ thật.
- `property_type` của 653/653 tin S03 là `unknown` → không phân biệt được chung cư với nhà đất nhiều tầng.

## Cách làm

1. **Luật loại tin phi lý — luật xác định ở pipeline, có audit** (luật 7 + 10 của AGENTS.md; ghi_chu hàng ON11).
   Hàm thuần mới `pipeline/lib/deal-plausibility.mjs`:
   `implausibleReason({ areaM2, bedrooms }) → null | "thieu-dien-tich" | "dien-tich-ngoai-khoang" | "phong-ngu-ngoai-khoang" | "phong-qua-nho"`
   (xét theo thứ tự đó). Ngưỡng là hằng export (`PLAUSIBILITY`): diện tích 10–1000 m², số phòng ngủ ≤ 10, diện tích /
   phòng ngủ ≥ 20 m² (Hỏi-1).
2. **`refreshBaitGap` (pipeline/refresh-bait-gap.mjs) áp luật SAU bước tổng hợp người bán** (bước 3), để registry
   người bán (median gap, số deal tốt — tín hiệu rao mồi) giữ y như hôm nay: luật này chỉ đổi danh sách căn giá tốt.
   Hàm mới `loaiTinPhiLy(c, rows)` trong cùng tệp nhận danh sách `{offer_id, area_m2, bedrooms}` (bước đêm đưa mọi
   offer P1 sale có gap), chấm bằng `implausibleReason`, đặt `bait_gap_pct = NULL` cho tin trượt và ghi MỘT dòng
   `ops_audit` (`actor 'refresh-bait-gap'`, `action 'bait-gap:loai-phi-ly'`, `detail {total, by_reason, offer_ids}`)
   khi có tin bị loại; tập không tin nào trượt thì không ghi. Không migration: cột đã có, `bait_gap_pct` nằm trong
   `CLOUD_ALLOW.sale_offers` của sync.
3. **`getDeals` đọc số đã tính sẵn**: thay công thức nội tuyến bằng `o.bait_gap_pct` (luật 10 — React/app chỉ đọc).
   Câu SQL tách thành hàm export `dealsSql()` để test chạy ĐÚNG câu ấy trên Postgres trong giao dịch. Bản cloud
   (`noContact`) vẫn sinh bằng cùng các phép thay; test chứng bản cloud không còn `stg_zalo_posts` hay cột liên hệ.
4. **Không dồn ở trần** (Hỏi-2): tin giảm hơn `NGHI_NGO_PCT = 35` vẫn hiện nhưng đứng SAU mọi tin ≤ 35%, mang cờ
   `suspect: true` và nhãn «cần xác minh» trên thẻ. Thứ tự `ORDER BY (bait_gap_pct > 35), bait_gap_pct DESC` nằm
   TRONG SQL trước `LIMIT` (sắp sau khi cắt thì 30 thẻ vẫn toàn tin sát trần). Guard ≤ 50 giữ nguyên.
5. **Nhãn thẻ**: `n_reposts = 1` → «đăng 1 lần»; `n > 1` → «đăng n lần» (thay «mới»). Thẻ tách thành component
   `app/src/components/ops/deal-card.tsx` (nhận `DealRow` + `showContact`) để test vẽ thẻ trong jsdom. Thêm thuật ngữ «Tin cần xác minh» vào `CONTEXT.md` cùng commit với nhãn.

## Phép đo

- Pipeline `node --test`: ma trận viết trước cho `implausibleReason`; `refreshBaitGap` trên fixture trong
  BEGIN…ROLLBACK (khuôn `bait-gap-sellers.test.mjs`, khoá advisory 33033).
- App `npm test`: `dealsSql()` chạy trên fixture trong giao dịch (đúng câu app gửi), có ca nhiều dòng hơn LIMIT; bản
  cloud chạy trên lược đồ đã xoá `stg_zalo_posts` và các cột `PII_EXCLUDE.sale_offers` của `pipeline/sync-cloud.mjs`
  (trong giao dịch, ROLLBACK); vẽ `DealCard` trong jsdom.
- Đo trên dữ liệu thật (đường đo của ngưỡng hàng): script `scripts/deals-phi-ly-do.mjs` chạy `refreshBaitGap` +
  `dealsSql()` trên DB local trong BEGIN…ROLLBACK, in số tin bị loại theo lý do, và kiểm danh sách không còn tin thiếu
  diện tích / phòng quá nhỏ, đầu danh sách không phải tin > 35% khi còn tin ≤ 35%.

## Không làm

- Thước theo phường × loại hình (PL26); khung trang, lọc, phân trang `/ops/deals` (UI10 / OPS-16).
- Sửa parser S03 cho diện tích/số phòng (làn trích xuất; luật này chặn hậu quả ở chỗ dùng).
- Đưa «Căn giá tốt» lên cổng Invest.

## Giới hạn đã biết

- Loại hình `unknown` nên nhà đất nhiều tầng diện tích nhỏ nhiều phòng (vd 36 m² 4 tầng 3PN — hợp lý) cũng bị loại
  theo ngưỡng m²/phòng. Đổi lại: thước phường hiện chưa theo loại hình nên so tin ấy với thước cũng chưa có nghĩa.
- Luật chạy trong lượt `refresh-bait-gap` đêm; dữ liệu cũ trên DB/cloud đổi sau lượt kế tiếp.
