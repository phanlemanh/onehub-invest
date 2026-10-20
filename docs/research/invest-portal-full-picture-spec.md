# Invest Portal — Full Investment Picture: spec chỉ số & tính năng (LTR + Mua bán)

Ngày đề xuất: 2026-10-20 · Trạng thái: draft chờ duyệt · Gắn ADR-0010 ·
Nền điều tra: `biggerpockets-markets-architecture.md` (REA evidence trong
`research-local/bp-markets-evidence-2026-10-20.json`)

## 1. Mục tiêu

Nhà đầu tư mở một trang thị trường và trả lời được 4 câu hỏi trong 30 giây,
cho cả 3 lớp tài sản:

1. **Mua ở đây giá bao nhiêu, đắt hay rẻ, đang tăng hay giảm?**
2. **Cho thuê dài hạn được bao nhiêu/tháng, ổn định không?**
3. **Làm homestay/STR hơn thuê dài hạn bao nhiêu?** (đã có từ ADR-0002/E2)
4. **Số này tin được không?** (n mẫu, độ phủ, tuần cập nhật)

Nguyên tắc: số liệu serving 100% từ rollup pipeline (quy tắc 4 AGENTS.md);
mọi khối số kèm mẫu + nguồn (badge SPL tầng C) + freshness — học BP hiển thị
"Updated: June, 2026" nhưng của ta là động.

## 2. Khung 3 lớp trên một market

```
Market Insight /vn/[market]  (ADR-0002 mở rộng)
├─ Mua bán (sale)        — giá trung vị, giá/m², phân vị, khối lượng tin
├─ Cho thuê dài hạn (rent_lt) — rent trung vị, rent/m², khối lượng
├─ STR (hiện có, S02)    — ADR, Occupancy, RevPAR (airdna_sub_monthly)
└─ Bức tranh đầu tư      — yield LTR vs STR, tăng trưởng giá, điểm tin cậy
```

Đơn vị phân tích giữ nguyên cây `areas`: market = tỉnh/thành (crosswalk
ALIAS 2025), submarket = quận/phường. Tương tự BP dùng MSA làm market, ta
dùng tỉnh; khác biệt: VN không có MSA, dữ liệu môi giới gắn phường nên
submarket giàu hơn BP (BP không có drill-down dưới MSA).

## 3. Catalog chỉ số

### 3.1 Mua bán (sale) — nguồn S03 `sale_offers`

| Chỉ số | Công thức | Đơn vị | Ghi chú |
|---|---|---|---|
| Giá trung vị | `percentile_cont(0.5)` trên `price_vnd` | tr.đ/m² & tr.₫ | đã có `market_asset_stats.median_price` |
| Giá/m² trung vị | median `price_perm2` | tr.₫/m² | **chỉ số gốc VN**; đã có `median_perm2` |
| Phân vị p25/p75 | percentile 25/75 `price_perm2` | tr.₫/m² | đã có; dùng cho box-plot phân bố |
| Số tin | count offers active tuần | tin/tuần | liquidity proxy |
| Tăng trưởng giá YoY | median tuần này vs cùng tuần năm trước | % | cần time-series (L1) |
| Tỷ lệ repost | `n_reposts` trung vị | lần | đã có sẵn — tin đăng lại nhiều = chậm bán (hoặc spam → DQ lọc) |

### 3.2 Cho thuê dài hạn (rent_lt) — nguồn S03

| Chỉ số | Công thức | Đơn vị | Ghi chú |
|---|---|---|---|
| Rent trung vị | median `price_vnd` (kind=rent_lt) | ₫/tháng | đã có `median_rent` |
| Rent/m² | median rent / diện tích | ₫/m²/tháng | cho căn hộ |
| Rent theo PN | median rent GROUP BY `bedrooms` (≥5 mẫu/PN) | ₫/tháng | studio/1PN/2PN/3PN+ |
| Số tin, tăng trưởng rent YoY | như sale | — | time-series L1 |

### 3.3 Cầu nối — yield & so sánh (tương đương RTP của BP, đổi sang năm %)

| Chỉ số | Công thức | Ghi chú |
|---|---|---|
| **Gross yield LTR** | `median_rent × 12 / median_price_sale` cùng area (+PN khi đủ mẫu) | %/năm — "1% rule" VN = yield ≥12%/năm thô; hiển thị kèm 2 input |
| **Gross yield STR** | `RevPAR × 365 / median_price_sale` | %/năm; RevPAR từ S02 cùng market |
| **Premium STR** | yield STR − yield LTR | điểm quyết định "làm homestay đáng không" |
| GRM | `median_price / (median_rent × 12)` | năm đòi hồi; quen thuộc nhà đầu tư lâu năm |

Lưu ý phương pháp (ghi hiện sidebar `/phương-phap`): giá sale và rent lấy từ
**hai tập tin đăng khác nhau** cùng area — yield là ước lượng cặp giả định
(căn cùng phân vị), không phải cặp giao dịch thật.

### 3.4 Demographics (phase sau — nguồn công khai GSO/Census)

Dân số & tăng trưởng tỉnh, thu nhập bình quân, lao động. Tương đương
Population/Median Income của BP. Chưa có collector → placeholder "chưa dữ
liệu", không hiển thị số bù. Không làm Community Score A–F (không nguồn VN).

### 3.5 Data Confidence (mọi khối số)

`n mẫu` + badge (≥30 tin & coverage ≥X% = "Đáng tin"; 10–30 = "Tham khảo";
<10 = ẩn metric, chỉ hiện đếm) + "Cập nhật: tuần YYYY-WW". Tận dụng
`dq_check_results` + `dq-truthful-coverage` sẵn có.

## 4. Tính năng theo bề mặt (Invest Portal)

### `/vn` Finder (list + map)
- Thêm cột/sort: giá/m², rent trung vị, **gross yield LTR**, số tin (3 lớp).
- Map choropleth cấp tỉnh theo metric toggle (học BP 5 nút, ta: Giá/m² ·
  Rent · Yield LTR · Số tin · Market Score STR hiện có) — không paywall
  (chưa monetize; ghi pattern BP để sau).
- Giữ Recommended Markets? → thay bằng "Thị trường nổi bật tuần này" tính
  từ dữ liệu (Δ yield/Δ volume), KHÔNG copy model curated tay 25 market của
  BP ở giai đoạn 1 người.

### `/vn/[market]` Insight — thêm 2 khối
- Khối **Mua bán**: median + p25/p75 giá/m², phân bố theo PN, top phường
  (submarket bảng có sẵn pattern), Δ tuần/và YoY.
- Khối **Cho thuê dài hạn**: rent theo PN, rent/m², số tin, Δ.
- Khối **Bức tranh đầu tư** (đặt trên cùng dưới KPI hero): 3 thẻ yield
  (LTR/STR/premium) + giá tăng trưởng + confidence tổng.
- Narrative tự sinh (học BP): 1 đoạn template "Tuần này giá/m² trung vị X
  (±Y% tuần trước), rent studio–2PN Z–W, yield LTR V% so với STR U%" —
  sinh server-side từ rollup, cache theo tuần.

### `/yield` (G1→G4 nâng cấp)
- Bảng so sánh nhiều market × 3 lớp, sort theo yield/premium; cột input
  giá/rent/RevPAR đều hiện nguồn. ĐÂY là trang "bức tranh" góc so sánh.

### `/listing/[id]`
- Tin Zalo sale/rent_lt (đã vào `sale_offers`): trang chi tiết tin + danh
  sách tin cùng phường ("comp"), không chỉ listing STR.

### API `/api/v1` (OpenAPI đã có skeleton)
- `GET /api/v1/markets` — bảng Finder (mirror `markets.json` của BP: trường
  tối giản, chuỗi định dạng server-side).
- `GET /api/v1/markets/{slug}` — rollup đủ 3 lớp + confidence.

## 5. Lộ trình

| Phase | Việc | Phụ thuộc |
|---|---|---|
| **L1 — Nền time-series** | Migration PK `market_asset_stats` + `as_of`; transform-zalo rollup toàn quốc (43 tỉnh có data) chạy hằng tuần trong scheduler; DQ gate volume/distribution | C1 scheduler sẵn; chỉ cần migration + mở rộng transform |
| **L2 — Insight mở rộng** | 2 khối sale/rent_lt + confidence badge + narrative template trên `/vn/[market]`; listing detail cho tin Zalo | L1 |
| **L3 — Bức tranh & Finder** | Khối bức tranh đầu tư + `/yield` 3 lớp + Finder sort/map toggle + API v1 markets | L2; AirDNA S02 đã có |
| **L4 — Nguồn & demographics** | Facebook groups qua `parsePost` (S03); collector GSO demographics; Recommended tự tính | C2 agent bridge; L3 |

Ước lượng: L1 ~1–2 ngày làm việc; L2 ~2–3; L3 ~2–3; L4 mở.

## 6. Rủi ro & mitigation

| Rủi ro | Mitigation |
|---|---|
| Giá niêm yết ≠ giá giao dịch (VN chênh lớn) | Ghi rõ "giá niêm yết" mọi nơi; yield gọi là ước lượng; lâu dài đối chiếu khi có nguồn giao dịch |
| Spam/repost bóp méo median | dedup `n_reposts` đã có + DQ gate phân phối (450_dq pattern) + lọc outlier theo IQR trong rollup |
| Thiếu mẫu ở tỉnh nhỏ | Luôn hiện n + badge; <10 mẫu không hiện metric |
| Sáp nhập tỉnh 2025 gây lệch chuỗi | rollup theo cây ALIAS mới ngay từ L1 (đã có crosswalk 43/43) |
| Nhầm yield vì sale/rent khác tập tin | chú thích phương pháp cố định (mục 3.3) |

## 7. Câu hỏi mở (chờ user)

1. Phase nào bật hiển thị công khai trước — bắt đầu L2 ở HN (data dày nhất)
   hay chờ đủ toàn quốc ở L1?
2. Có muốn giữ "Recommended Markets" dạng curated tay như BP (cần người
   chọn tuần) hay chỉ thuật toán?
3. Rent theo PN: ngưỡng mẫu ≥5/PN có phù hợp, hay gộp 3PN+?
