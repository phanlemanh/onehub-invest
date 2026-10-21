# Khảo sát Chợ Tốt + Batdongsan → kiến trúc thu thập hợp nhất

Ngày: 2026-10-20 · Người thực hiện: agent (verify live bằng curl, tổng hợp từ nguồn mở)

## 1. Kết quả khảo sát Chợ Tốt ✅ (khả thi cao, khuyến nghị P1)

### Cách thức: public JSON API — không browser, không tài khoản

```
GET https://gateway.chotot.com/v1/public/ad-listing
    ?region_v2={mã_tỉnh}      # 12000=Hà Nội, 13000=HCMC (verify live)
    &area_v2={mã_quận}        # tuỳ chọn; bỏ trống = toàn tỉnh
    &cg=1000                  # category bất động sản
    &st=s,k                   # bán (+khác)
    &page={n}&o={offset}&limit=200
    &key_param_included=true
```

- **Không cần auth**, không cần cookie, không cần tài khoản cá nhân.
- Đây là endpoint chính web/app Chợ Tốt dùng; không có tài liệu chính thức
  (internal API — không SLA, có thể đổi bất cứ lúc nào → adapter phải isolated).
- Verify live 2026-10-20: HN 4.065 tin, HCMC 10.000 tin (bị cap hiển thị ~10k).
- Tài liệu tham khảo: repo [Quocc1/OpenStack](https://github.com/Quocc1/OpenStack)
  (Dagster + Iceberg + DBT, crawl.py + constants.py) — pattern sleep
  `random.uniform(0.3, 1.1)`s/page + xoay 5 User-Agent.

### Dữ liệu trả về: ~70 trường/tin, cấu trúc sẵn (không cần parse text!)

Nhóm trường quan trọng (verify live, tin mẫu Gò Vấp 4,65 tỷ / 35 m²):

| Nhóm | Trường | Ghi chú |
|---|---|---|
| Định danh | `list_id`, `ad_id`, `account_id` | dedup key = list_id |
| Nội dung | `subject`, `body` | body = mô tả đầy đủ |
| Giá | `price` (VND number), `price_string`, **`price_million_per_m2`** | giá/m² tính SẴN |
| Diện tích | `size` (m²), `size_unit_string` | |
| Thông số | `rooms`, `toilets`, `house_type`, `pty_characteristics`, `params[]` | ví dụ "Nhà ngõ, hẻm" |
| Vị trí | `area_name` (quận), `ward_name`, **`ward_name_v3`**, `street_name`, `latitude/longitude` | ward_name_v3 = phường MỚI sau sáp nhập 2025 — khớp crosswalk ALIAS đã xây ở transform-airdna |
| Thời gian | `list_time` (epoch ms), `orig_list_time`, `date` | |
| Ảnh | `images[]`, `image_thumbnails[]`, `webp_image` | nhiều ảnh/tin |
| Người bán | `seller_info{full_name, avatar, live_ads, sold_ads}`, `full_name`, `company_ad` (môi giới?), `is_shop_verified` | ⚠️ `phone_number` = **null** ở list API |

### Hạn chế & rủi ro

1. **Số điện thoại không có trong list API** (`phone_number: null`).
   Muốn SĐT phải gọi endpoint reveal-phone riêng per-ad (tốn request) hoặc
   mở trang detail. → P1 chỉ lấy `seller_info` + `account_id`; SĐT làm phase sau
   và chỉ reveal cho top-deals (Deals page cần liên hệ) để giữ volume thấp.
2. **Internal API không SLA** — có thể đổi schema / chặn IP. Adapter viết
   tách biệt, fail-soft (DQO sẽ bắt schema drift).
3. **Cap ~10.000 tin/tỉnh** ở list API — đủ cho pilot (đối chiếu với mục
   tiêu market-level, không cần từng tin lẻ toàn quốc).

### CCP đề xuất cho Chợ Tốt

- 1 snapshot/ngày/tỉnh (HN + HCMC), quét theo quận: ~50–100 requests/snapshot.
- Jitter 0.5–2s giữa requests, xoay User-Agent, retry tối đa 2 lần/area.
- Không reveal-phone hàng loạt — chỉ per-ad theo nhu cầu Deals (cap 50 ad/ngày).

## 2. Kết quả khảo sát Batdongsan ⚠️ (khó hơn — khuyến nghị P2 qua Apify)

### Cách thức: KHÔNG có public API; client-side render

- Site chạy stack PropertyGuru; listing render bằng JS → cần Playwright đọc
  `__NEXT_DATA__` (embedded JSON) thay vì CSS selector (class `re__card`,
  `pr-item` **đổi định kỳ**).
- Tham khảo: [VinhQuocTran/Batdongsan-Scrapping-ETL-Pipeline](https://github.com/VinhQuocTran/Batdongsan-Scrapping-ETL-Pipeline)
  (Python + Selenium, 50 trang ~30 phút — chậm, dễ vướng anti-bot).
- **Apify có actor sẵn**: [batdongsan-vietnam-property-scraper](https://apify.com/jungle_synthesizer/batdongsan-vietnam-property-scraper)
  — **$1,60 / 1.000 records**, không cần account Batdongsan.

### Dữ liệu Apify actor trả (25 trường, cấu trúc sẵn)

`price` (VND), `price_per_sqm`, `address`, `district`, `city`, `latitude/longitude`,
`bedrooms`, `bathrooms`, `area_sqm`, `facade_width`, `direction`, `legal_status`,
`agent_name`, **`agent_phone` (masked kiểu "0973 034 \*\*\*")**, `image_urls[]`,
`listing_date` (ISO), `title`, `description`, `listing_id`, `listing_url`,
`transaction_type`, `property_type`.

### Nhận định

- Chất lượng dữ liệu tốt (legal_status, direction là trường Chợ Tốt không có),
  nhưng **SĐT bị che** → cùng "bất lợi contact" như Chợ Tốt, mà tốn tiền.
- Tự build Playwright = rủi ro anti-bot + bảo trì selector; mua Apify = rẻ
  nhưng phụ thuộc actor bên thứ 3.
- → **P2: pilot 2.000 tin HCMC (~$3,2) một lần** để so chất lượng/độ phủ với
  Chợ Tốt; chỉ build adapter riêng nếu Chợ Tốt thiếu độ phủ đáng kể.

## 3. Bảng tổng hợp 6 nguồn theo cùng tiêu chí

| Tiêu chí | S01 Airbnb | S02 AirDNA | S03 Zalo | S05 Facebook | **S06 Chợ Tốt** | **S07 Batdongsan** |
|---|---|---|---|---|---|---|
| Cách thu | API (đã mua) | Playwright headful | OpenClaw — **ĐANG TẮT** | Apify actor | **gateway API thô** | Apify / Playwright |
| Tài khoản cá nhân | n/a | không | **CÓ (nguy hiểm)** | không | **không** | không |
| Dữ liệu cấu trúc | sẵn | sẵn | free text + LLM | free text + LLM | **sẵn, 70 trường** | sẵn, 25 trường |
| Vị trí chuẩn | market/submarket | lat/lng | parse từ text | parse từ text | **quan+phường+lat/lng, v3 2025** | address+lat/lng |
| Giá/m² | ADR | giá đêm | parse | parse | **cột sẵn** | cột sẵn |
| Contact người bán | — | host profile | SĐT trong text | hiếm | tên+avatar (SĐT reveal sau) | masked |
| Volume pilot | 6 market/đêm | theo listing | thấp | 5 nhóm | ~14k tin (HN+HCMC) | theo thuê |
| Chi phí | đã trả | 0 | 0 | ~$5–10/tháng | **0** | $1,6/1k |
| Rủi ro khẩn cấp | hợp đồng | thấp | **CAO (vừa gây sự cố)** | thấp | thấp | trung bình |

## 4. Kiến trúc thu thập hợp nhất — "Collector Contract"

Bài học từ sự cố OpenClaw: mỗi nguồn tự chế một kiến trúc riêng (agent + hook +
gateway) vừa phức tạp vừa nguy hiểm. Giải pháp: **mọi nguồn phải cắm vào cùng
một contract đã được chứng minh** (collector :9210 + stg_* + transform-*),
adapter mỗi nguồn chỉ là 1 script vô trạng thái.

```
┌────────────────────────────────────────────────────────────────┐
│                  UNIFIED COLLECTOR CONTRACT                     │
│                                                                 │
│  Adapter (mỗi nguồn 1 script vô trạng thái, không agent):      │
│    1. discover(params)  → danh sách ad chưa có (list API)      │
│    2. (tuỳ chọn) enrich → field phụ per-ad (SĐT reveal…)       │
│    3. push each item → POST :9210/ingest                        │
│         {source:"chotot", sourceId:list_id, payload:{…gốc}}     │
│                                                                 │
│  Tầng chung ĐÃ CÓ — tái sử dụng, không viết lại:               │
│    • collector :9210 (auth AGENT_API_KEYS, idempotent)          │
│    • source_registry (SPL tầng B) + migration mỗi nguồn mới     │
│    • stg_<nguồn>_* : 1 bảng staging/nguồn, payload JSON gốc     │
│    • transform-<nguồn>.mjs → normalize về sale_offers chung    │
│    • CCP: jitter + daily cap + activity window (per source)     │
│    • DQO: freshness/volume/schema/distribution (per source)     │
│    • launchd/cron: lịch mỗi adapter                             │
│    • /ops/collections + /ops/quality: quan sát như nguồn cũ     │
└────────────────────────────────────────────────────────────────┘

Luồng sale_offers hợp nhất (đích chung của S03/S05/S06/S07):

  stg_zalo_posts ─┐                                                     ┌→ Deals page
  stg_fb_posts ───┤                                                     │  (liên hệ
  stg_chotot_ads ─┼─► transform → sale_offers (lược đồ chung:           │   người bán)
  stg_bds_ads ────┘     price_vnd, area_m2, price_per_m2, rooms,        │
                        district, ward(+osm crosswalk), lat/lng,        │
                        images[], seller_name, seller_phone?,           │
                        source_code, first_seen, last_seen) ────────────┘
```

### Vì sao kiến trúc này hóa giải bài toán Zalo

Deals page cần 2 thứ: (a) tin giá tốt, (b) liên hệ người bán. Chợ Tốt +
Facebook + (P2) Batdongsan cung cấp (a) với cấu trúc tốt hơn hẳn text Zalo;
(b) có seller_info/agent_phone ở mức tương đương (SĐT đều phải thêm bước
reveal). → **giá trị biên của việc khởi động lại Zalo pipe giảm mạnh**;
phương án B lockdown không còn là mắt xích nghẽn của sản phẩm.

## 5. Lộ trình đề xuất

| Phase | Việc | Kết quả nhận được |
|---|---|---|
| **P1** | `pipeline/collect-chotot.mjs` (adapter contract) + migration S06 + `stg_chotot_ads` + `transform-chotot.mjs` → sale_offers + launchd 05:30 HN+HCMC | Deals page có feed cấu trúc ~14k tin, ảnh, vị trí chuẩn; /ops thấy nguồn mới như nguồn cũ |
| **P2** | Pilot Apify Batdongsan 2k tin HCMC (~$3,2) → so độ phủ/chất lượng vs Chợ Tốt | Quyết định: thêm S07 chính thức hay bỏ |
| **P3** | SĐT reveal Chợ Tốt per-ad (cap 50/ngây, chỉ top-deals) + transform FB posts → sale_offers | Deals page "liên hệ ngay" thật sự |
| **P4** | Quyết định Zalo: giữ tắt, hoặc phương án B lockdown nếu vẫn muốn tin môi giới ngầm | Chốt vòng đời S03 trong source_registry |

## 6. Nguồn tham khảo

- [Quocc1/OpenStack](https://github.com/Quocc1/OpenStack) — Chợ Tốt crawler + medallion pipeline
- [VinhQuocTran/Batdongsan-Scrapping-ETL-Pipeline](https://github.com/VinhQuocTran/Batdongsan-Scrapping-ETL-Pipeline) — Selenium Batdongsan
- [Apify batdongsan-vietnam-property-scraper](https://apify.com/jungle_synthesizer/batdongsan-vietnam-property-scraper/input-schema) — actor thương mại $1,6/1k
- Verify live 2026-10-20: 4 requests curl gateway.chotot.com (limit ≤3, kết quả trong file này)
