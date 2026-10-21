# Kế hoạch mở rộng độ phủ thu thập AirDNA + Airbnb

Ngày: 2026-10-21 · Nguồn số liệu: DB local 5433 (truy vấn trực tiếp), log
`pipeline/logs/airdna-daily.log`, code `collector/src/collectors/*`,
ADR-0007/0009. Bổ sung cho `airdna-integration-plan.md`.

## 1. Hiện trạng độ phủ (đo 2026-10-21)

| Hạng | Số liệu | Đánh giá |
|---|---|---|
| AirDNA market có capture tươi (≤2 ngày) | **9/43** (21%) | rotation mới chạy 1 đêm |
| AirDNA metrics theo tháng | 36 tháng × 9 market (2023-10→2026-09) | đủ sâu, thiếu rộng |
| AirDNA universe listings | 49.504 rows / 9 market (map_listings, cap 15k/market) | bị cap ở HN/HCMC |
| AirDNA active toàn quốc (9 market đo được) | 38.473 | 34 market còn chưa biết |
| S01 Airbnb tự thu | **506 listings** (HN 265, HCMC 241) | quá ít |
| S01 nights (calendar 12 tháng) | 179.215 rows / 491 listing | chất lượng tốt |
| Coverage trung thực quốc gia | **506/38.473 ≈ 1,3%** (HN 2,03%, HCMC 1,60%, 41 tỉnh = 0%) | ----------
| Ảnh listing AirDNA | 881/49.504 (chỉ top-50/submarket) | chấp nhận theo thiết kế |

Phân bố active 9 market đã đo: HCMC 15.066 · HN 13.052 · Đà Nẵng 8.156 ·
An Giang 1.783 · Cần Thơ 198 · còn lại <100 mỗi tỉnh. **3 market lớn =
94,3% toàn quốc** → trọng tâm mọi kế hoạch.

## 2. Chẩn đoán — 3 nút thắt

1. **Discovery Airbnb bị trần kiến trúc**: 1 query = tên thành phố, Airbnb
   cap ~15 trang × ~18 card ≈ 270 unique/query. Chạy thêm cũng không hơn
   (code đã có stop 2-trang-không-mới). Cron tuần hiện chỉ chạy `hanoi`;
   HCMC 241 là từ pilot thủ công.
2. **Rotation AirDNA mới khởi động**: 6 market/đêm × 43 market cần ~7 đêm
   cho vòng đầu. Ngân sách đêm 20/10 chỉ dùng ~100 req — far dưới cap
   500 req/ngày của ADR-0009.
3. **PDP Airbnb quá chậm**: 25 listing/lần chạy, chạy 1 lần/tuần → tối đa
   ~500 listing/tuần, trong khi cần backfill ~20-25 nghìn.

Lưu ý phụ: bảng `areas` đang bẩn (vd `vn-hanoi-tinh-cao-bang`,
`vn-hanoi-o-cho-dua` nằm dưới parent hanoi) — phải dọn trước khi dùng làm
nguồn sinh query sharding. DQ `truthful-coverage` insert trùng mỗi lần chạy
(cùng entity nhiều row) — cần dedup.

## 2b. Phát hiện then chốt (2026-10-21): AirDNA giữ sẵn Airbnb ID từng thị trường

Kiểm chứng bằng JOIN trực tiếp trong DB (không suy đoán):

- `airdna_listings.id` và `listings.id` **cùng không gian ID** (`abnb_<id>`).
  268/506 listing tự thu (53%) khớp chính xác với universe AirDNA; 260/268
  match đến từ `map_listings` → lo ngại "id mờ" trong survey chỉ đúng thiểu
  số, đa số id map_listings là Airbnb ID thật (hai tập ID thu độc lập từ hai
  hệ khớp 260 lần — trùng ngẫu nhiên 19 chữ số là bất khả thi).
- Endpoint `POST /submarket/{sid}/listings` còn trả `airbnb_property_id` +
  `listing_url` rõ ràng (881 rows hiện có) — nguồn xác nhận thứ hai.
- Mỗi dòng universe kèm sẵn **LTM 12 tháng** (revenue, occupancy, adr,
  rating) — lớp dữ liệu booking quá khứ không thể tự thu.

Worklist PDP thực đo (id AirDNA có mà ta chưa có): **HCMC 14.506 · HN
14.139 · Đà Nẵng 13.131** · 6 market khác ~5.7k → tổng **~47,5k listing**
với tọa độ + doanh thu để xếp ưu tiên. Lưu ý HN/HCMC universe bị cap 15.000
rows sort theo revenue → phần bị cắt là listing doanh thu thấp (segment
này discovery sharding sẽ phụ).

**Hệ quả chiến lược**: universe AirDNA = worklist PDP chính. Không cần
discovery sharding để xây vũ trụ nữa — chỉ cần nó để bắt listing mới/sách
bỏ qua cap. Mọi PDP fetch giờ có mục tiêu exact + mang theo LTM để join.

## 3. Kế hoạch

### Giai đoạn 0 — AirDNA quét đủ 43/43 (đêm 2026-10-21 → 23, 0 dòng code)

Tăng `AIRDNA_DAILY_MARKETS` 6 → **12**/đêm (~150-250 req/đêm, vẫn <50% cap
ADR-0009). 34 market còn lại xong trong 3 đêm. Xong thì hạ về **7/đêm** để
chu kỳ quay vòng đúng 1 tuần/market.

### Giai đoạn 1 — PDP theo worklist AirDNA (tuần 2026-10-21 → 27, code nhỏ)

- Thêm chế độ **worklist** cho collector `airbnb-listing`: lấy id từ
  `airdna_listings` WHERE `id LIKE 'abnb_%'` AND chưa có trong `listings`,
  xếp theo `revenue_ltm DESC`, ưu tiên market HN → HCMC → ĐN. Checkpoint theo
  id (không theo discovery snapshot như hiện nay).
- PDP **800-1.000 listing/đêm** (batch 25 ≈ 4 phút, cửa sổ 19-23h, giữ rate
  0,35 req/s). Listing PDP trả "không còn đăng" → đánh dấu `delisted` trong
  worklist (không phải lỗi; AirDNA universe chứa cả listing đã rút).
- Đổi cron Chủ nhật 1-city thành **nightly-collect** chạy worklist.

### Giai đoạn 1b — Discovery sharding (bổ sung, tuần 3 → 5)

Chỉ để bắt phần AirDNA không có: listing mới chưa kịp ingest + segment
doanh thu thấp bị cap 15k cắt. 65 query quận (env `AIRBNB_DISCOVERY_QUERY`
collector hỗ trợ sẵn), 4-6 query/đêm sau khi PDP worklist chính xong.
Diff id mới phát hiện → nạp tiếp vào queue PDP.

### Giai đoạn 2 — Backfill đến mục tiêu (tuần 2 → 6)

- Worklist 3 market lớn = 41.776 listing. Tại 1.000/đêm: **60% (~25k) sau
  ~3,5 tuần; ~95% phần còn sống sau ~6 tuần** (tuần hoàn PDP sẽ gặp một tỉ
  lệ delisted — ước 10-30%, đo được trên tuần đầu).
- Đồng thời join listing-level: mỗi listing fetch xong có sẵn LTM
  revenue/occupancy/adr từ `airdna_listings` → bảng phong phú
  `listings × airdna_listings` cho hiệu chuẩn metric cấp listing (ADR-0005
  coalesce nâng từ market-level lên listing-level) và Deals dùng được
  "doanh thu thật 12 tháng" cho từng căn.

### Giai đoạn 3 — Steady state (từ tuần 5)

| Dòng dữ liệu | Chu kỳ refresh | Lý do | Ngân sách req/đêm |
|---|---|---|---|
| AirDNA market + metrics + future rates | 7 ngày (43 market × ~15 req) | nguồn chỉ đổi theo tháng; STALE_DAYS 45 là lưới an toàn; **refresh đồng thời sinh worklist mới** (diff id vs `listings`) | ~90-120 |
| Airbnb discovery (65 query quận) | 14 ngày | bắt listing mới/churn | ~80 |
| Airbnb PDP (chi tiết + calendar 12 tháng) | 28 ngày/listing | metric chính dùng cấp tháng | ~2.500 (≈900 listing × 3 req) |
| DQ truthful-coverage | mỗi đêm sau transform | đã có | — |

Tổng steady ≈ 2.700-3.000 req/đêm cho Airbnb (nguồn tự thu, trong rate
0,35-0,5 req/s + cửa sổ 4h) và ~100 req/đêm AirDNA (cap ADR-0009 500 —
không vi phạm).

## 4. Định nghĩa "dữ liệu ổn định" + giám sát

- Coverage quốc gia (ours/airdna_active) ≥ **60%** sau tuần 4; 3 market lớn
  ≥ 60% từng market. Bổ sung DQ **listing-level** chính xác:
  `matched/airdna_universe` mỗi market (đếm JOIN trực tiếp, không còn ước
  lượng theo tỷ lệ count).
- `captured_age` S02 ≤ 7 ngày · discovery age ≤ 14 ngày · PDP age ≤ 28 ngày.
- Cảnh báo lên /ops/quality khi: coverage sụt >5 điểm %, đêm nào miss
  snapshot 2 đêm liên tiếp, captured_age > 10 ngày.
- Fix nhỏ: dedup DQ results; ghi chú universe=15.000 là bị cap (HN/HCMC)
  để không đọc nhầm coverage tuyệt đối.

## 5. Dòng thời gian tóm tắt

| Mốc | Ngày (ước tính) | Kết quả |
|---|---|---|
| Đêm 3 | 2026-10-23 | AirDNA 43/43 market tươi, 36 tháng lịch sử mỗi market |
| Tuần 1 | ~10-27 | collector worklist mode live; PDP 1k/đêm chạy; +4-5k listing |
| Tuần 3,5 | ~11-11 | 60% 3 market lớn (~25k listing) + join LTM listing-level |
| Tuần 5-6 | ~11-25 | ~95% phần còn sống của worklist; discovery sharding gom segment cap + listing mới |
| Tuần 7+ | | chu kỳ 7/14/28 ngày ổn định, DQ listing-level xanh mỗi đêm |

## 6. Rủi ro & việc cần làm kèm

1. **Anti-bot Airbnb khi tăng volume**: smoke 20:00 hằng ngày đã có — nếu
   smoke fail 2 đêm liên tiếp, giảm nửa tốc độ PDP (công tắc env batch).
2. **Volume nights bùng nổ** (179k → ~6-9M rows): đo thời gian
   `finalize` + sync cloud 15′ trước tuần 2; cần index/batch upsert nếu chậm.
3. **Areas bẩn**: dọn `vn-hanoi-tinh-*`… trước khi sinh query sharding.
4. **Tài khoản AirDNA khóa** = mất hiệu chuẩn (ADR-0009 đã chấp nhận);
   S01 vẫn sống nhờ view coalesce ADR-0005.
5. **Delisted trong worklist**: AirDNA universe chứa listing đã rút khỏi
   Airbnb → PDP sẽ gặp một tỉ lệ trang "không còn đăng" (ước 10-30%). Phải
   đánh dấu `delisted` (không đếm lỗi, không retry vô hạn) và đo tỉ lệ này
   ngay tuần đầu để hiệu chỉnh dự báo timeline.
6. **Checkpoint**: worklist mode checkpoint theo id; discovery sharding
   checkpoint theo query — tránh quét lại cái đã xong.
